"""Admin - Riwayat Diagnosis (Diagnosis History)"""
from flask import Blueprint, jsonify, request, render_template, session, redirect, url_for, make_response
from datetime import datetime, timedelta
from app import db
from app.models.history import DiagnosisHistory
from app.models.user import User
from app.models.disease import Disease
from app.models.symptom import Symptom
from sqlalchemy import func, or_
import csv
import io

bp = Blueprint('admin_history', __name__)


@bp.route('/', methods=['GET'])
def history_page():
    """Render history page - session based"""
    # Check if admin is logged in
    if 'admin_id' not in session:
        return redirect(url_for('admin.admin_auth.login_page'))
    return render_template('admin/riwayat_diagnosis.html')


@bp.route('/list', methods=['GET'])
def get_all_history():
    """Get all diagnosis history with pagination - session based"""
    # Check if admin is logged in
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    disease_id = request.args.get('disease_id', '').strip()
    method = request.args.get('method', '').strip()
    user_search = request.args.get('user_search', '').strip()
    start_date = request.args.get('start_date', '').strip()
    end_date = request.args.get('end_date', '').strip()

    # Build query
    query = DiagnosisHistory.query

    # Apply disease filter
    if disease_id:
        try:
            disease_id_int = int(disease_id)
            query = query.filter_by(disease_id=disease_id_int)
        except ValueError:
            pass

    # Apply method filter
    if method:
        query = query.filter_by(diagnosis_method=method)

    # Apply date filters
    if start_date:
        try:
            from_date = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(DiagnosisHistory.diagnosis_date >= from_date)
        except ValueError:
            pass

    if end_date:
        try:
            to_date = datetime.strptime(end_date, '%Y-%m-%d')
            to_date = to_date.replace(hour=23, minute=59, second=59)
            query = query.filter(DiagnosisHistory.diagnosis_date <= to_date)
        except ValueError:
            pass

    # Apply user search filter
    if user_search:
        # Join with User table to search by email
        query = query.join(User, DiagnosisHistory.user_id == User.id, isouter=True)
        query = query.filter(User.email.ilike(f'%{user_search}%'))

    # Paginate
    pagination = query.order_by(DiagnosisHistory.diagnosis_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'success': True,
        'data': [h.to_dict(include_solution=False) for h in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })


@bp.route('/<int:history_id>', methods=['GET'])
def get_history_detail(history_id):
    """Get single history detail with full solution - session based"""
    # Check if admin is logged in
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    history = DiagnosisHistory.query.get_or_404(history_id)
    return jsonify({'success': True, 'data': history.to_dict(include_solution=True)})


@bp.route('/export', methods=['GET'])
def export_to_csv():
    """Export diagnosis history to CSV - session based"""
    # Check if admin is logged in
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    # Get filters from query params
    disease_id = request.args.get('disease_id', '').strip()
    method = request.args.get('method', '').strip()
    user_search = request.args.get('user_search', '').strip()
    start_date = request.args.get('start_date', '').strip()
    end_date = request.args.get('end_date', '').strip()

    # Build query (same filters as list)
    query = DiagnosisHistory.query

    if disease_id:
        try:
            disease_id_int = int(disease_id)
            query = query.filter_by(disease_id=disease_id_int)
        except ValueError:
            pass

    if method:
        query = query.filter_by(diagnosis_method=method)

    if start_date:
        try:
            from_date = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(DiagnosisHistory.diagnosis_date >= from_date)
        except ValueError:
            pass

    if end_date:
        try:
            to_date = datetime.strptime(end_date, '%Y-%m-%d')
            to_date = to_date.replace(hour=23, minute=59, second=59)
            query = query.filter(DiagnosisHistory.diagnosis_date <= to_date)
        except ValueError:
            pass

    if user_search:
        query = query.join(User, DiagnosisHistory.user_id == User.id, isouter=True)
        query = query.filter(User.email.ilike(f'%{user_search}%'))

    # Get all results (no pagination for export)
    histories = query.order_by(DiagnosisHistory.diagnosis_date.desc()).limit(1000).all()

    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        'ID',
        'Tanggal',
        'User Email',
        'Penyakit',
        'Confidence (%)',
        'Certainty Level',
        'Metode',
        'Jumlah Gejala',
        'IP Address'
    ])

    # Write data rows
    for h in histories:
        # Get user email
        user_email = 'Anonymous'
        if h.user_id:
            user = User.query.get(h.user_id)
            if user:
                user_email = user.email

        # Get disease name
        disease_name = 'Unknown'
        if h.disease:
            disease_name = h.disease.name

        # Calculate confidence percentage
        confidence = (h.final_cf_value * 100) if h.final_cf_value else 0

        # Get method text
        method_text = h.diagnosis_method or 'Hybrid'
        if method_text == 'forward_chaining':
            method_text = 'Forward Chaining'
        elif method_text == 'certainty_factor':
            method_text = 'Certainty Factor'

        # Count symptoms
        symptom_count = len(h.selected_symptoms) if h.selected_symptoms else 0

        # Format date
        date_str = h.diagnosis_date.strftime('%Y-%m-%d %H:%M:%S') if h.diagnosis_date else ''

        writer.writerow([
            h.id,
            date_str,
            user_email,
            disease_name,
            f'{confidence:.1f}',
            h.certainty_level or '-',
            method_text,
            symptom_count,
            h.ip_address or '-'
        ])

    # Prepare response
    output.seek(0)
    response = make_response(output.getvalue())
    response.headers['Content-Type'] = 'text/csv; charset=utf-8'
    response.headers['Content-Disposition'] = f'attachment; filename=riwayat_diagnosis_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'

    return response


@bp.route('/stats', methods=['GET'])
def get_history_stats():
    """Get diagnosis history statistics - session based"""
    # Check if admin is logged in
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    total_diagnoses = DiagnosisHistory.query.count()
    fc_diagnoses = DiagnosisHistory.query.filter_by(diagnosis_method='forward_chaining').count()
    cf_diagnoses = DiagnosisHistory.query.filter_by(diagnosis_method='certainty_factor').count()
    hybrid_diagnoses = total_diagnoses - fc_diagnoses - cf_diagnoses

    # Diagnoses in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_diagnoses = DiagnosisHistory.query.filter(
        DiagnosisHistory.diagnosis_date >= thirty_days_ago
    ).count()

    # Most common diseases (top 5)
    common_diseases = db.session.query(
        Disease.name,
        func.count(DiagnosisHistory.id).label('count')
    ).join(
        DiagnosisHistory, Disease.id == DiagnosisHistory.disease_id
    ).group_by(
        Disease.name
    ).order_by(
        func.count(DiagnosisHistory.id).desc()
    ).limit(5).all()

    # Average confidence
    avg_confidence = db.session.query(
        func.avg(DiagnosisHistory.final_cf_value)
    ).scalar()
    avg_confidence = float(avg_confidence * 100) if avg_confidence else 0

    return jsonify({
        'success': True,
        'data': {
            'total_diagnoses': total_diagnoses,
            'forward_chaining_count': fc_diagnoses,
            'certainty_factor_count': cf_diagnoses,
            'hybrid_count': hybrid_diagnoses,
            'recent_30days': recent_diagnoses,
            'average_confidence': round(avg_confidence, 2),
            'common_diseases': [{'disease': d[0], 'count': d[1]} for d in common_diseases]
        }
    })

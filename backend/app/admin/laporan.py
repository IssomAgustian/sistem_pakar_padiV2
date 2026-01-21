"""
Admin - Laporan (Reports & Statistics)
Session-based authentication
"""
from flask import Blueprint, jsonify, request, render_template, session, send_file
from datetime import datetime, timedelta
from sqlalchemy import func, extract
from app import db
from app.models.history import DiagnosisHistory
from app.models.disease import Disease
from app.models.user import User
import io
import json

bp = Blueprint('admin_reports', __name__)


def check_admin_session():
    """Check if admin is logged in"""
    if 'admin_id' not in session:
        return False
    return True


@bp.route('/', methods=['GET'])
def reports_page():
    """Render reports page"""
    if not check_admin_session():
        return render_template('admin/auth_required.html'), 401
    return render_template('admin/laporan.html')


@bp.route('/statistics', methods=['GET'])
def get_statistics():
    """Get summary statistics for the date range"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        # Get date range from query params
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        # Default to last 30 days
        if not start_date_str or not end_date_str:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            end_date = end_date.replace(hour=23, minute=59, second=59)

        # Total diagnosis in period
        total_diagnoses = DiagnosisHistory.query.filter(
            DiagnosisHistory.diagnosis_date >= start_date,
            DiagnosisHistory.diagnosis_date <= end_date
        ).count()

        # Most common disease in period
        most_common_disease = db.session.query(
            Disease.name,
            func.count(DiagnosisHistory.id).label('count')
        ).join(DiagnosisHistory).filter(
            DiagnosisHistory.diagnosis_date >= start_date,
            DiagnosisHistory.diagnosis_date <= end_date
        ).group_by(Disease.id, Disease.name).order_by(
            func.count(DiagnosisHistory.id).desc()
        ).first()

        # Most active user in period
        most_active_user = db.session.query(
            User.email,
            func.count(DiagnosisHistory.id).label('count')
        ).join(DiagnosisHistory).filter(
            DiagnosisHistory.diagnosis_date >= start_date,
            DiagnosisHistory.diagnosis_date <= end_date,
            DiagnosisHistory.user_id.isnot(None)
        ).group_by(User.id, User.email).order_by(
            func.count(DiagnosisHistory.id).desc()
        ).first()

        # Average confidence score
        avg_confidence = db.session.query(
            func.avg(DiagnosisHistory.final_cf_value)
        ).filter(
            DiagnosisHistory.diagnosis_date >= start_date,
            DiagnosisHistory.diagnosis_date <= end_date,
            DiagnosisHistory.final_cf_value.isnot(None)
        ).scalar()

        return jsonify({
            'success': True,
            'data': {
                'total_diagnoses': total_diagnoses,
                'most_common_disease': {
                    'name': most_common_disease[0] if most_common_disease else 'N/A',
                    'count': most_common_disease[1] if most_common_disease else 0
                },
                'most_active_user': {
                    'email': most_active_user[0] if most_active_user else 'N/A',
                    'count': most_active_user[1] if most_active_user else 0
                },
                'avg_confidence': round(float(avg_confidence), 4) if avg_confidence else 0
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/chart-diagnosis-daily', methods=['GET'])
def get_daily_diagnosis_chart():
    """Get daily diagnosis data for line chart (last 30 days or custom range)"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        if not start_date_str or not end_date_str:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            end_date = end_date.replace(hour=23, minute=59, second=59)

        # Query diagnosis grouped by date
        daily_data = db.session.query(
            func.date(DiagnosisHistory.diagnosis_date).label('date'),
            func.count(DiagnosisHistory.id).label('count')
        ).filter(
            DiagnosisHistory.diagnosis_date >= start_date,
            DiagnosisHistory.diagnosis_date <= end_date
        ).group_by(func.date(DiagnosisHistory.diagnosis_date)).order_by('date').all()

        # Create complete date range (fill missing dates with 0)
        current_date = start_date
        date_map = {str(d[0]): d[1] for d in daily_data}
        labels = []
        values = []

        while current_date <= end_date:
            date_str = current_date.strftime('%Y-%m-%d')
            labels.append(current_date.strftime('%d %b'))
            values.append(date_map.get(date_str, 0))
            current_date += timedelta(days=1)

        return jsonify({
            'success': True,
            'data': {
                'labels': labels,
                'values': values
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/chart-disease-distribution', methods=['GET'])
def get_disease_distribution_chart():
    """Get top 5 disease distribution for pie chart"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        if not start_date_str or not end_date_str:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            end_date = end_date.replace(hour=23, minute=59, second=59)

        # Get top 5 diseases
        disease_data = db.session.query(
            Disease.name,
            func.count(DiagnosisHistory.id).label('count')
        ).join(DiagnosisHistory).filter(
            DiagnosisHistory.diagnosis_date >= start_date,
            DiagnosisHistory.diagnosis_date <= end_date
        ).group_by(Disease.id, Disease.name).order_by(
            func.count(DiagnosisHistory.id).desc()
        ).limit(5).all()

        labels = [d[0] for d in disease_data]
        values = [d[1] for d in disease_data]

        return jsonify({
            'success': True,
            'data': {
                'labels': labels,
                'values': values
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/chart-method-distribution', methods=['GET'])
def get_method_distribution_chart():
    """Get diagnosis method distribution for bar chart"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        if not start_date_str or not end_date_str:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            end_date = end_date.replace(hour=23, minute=59, second=59)

        # Get method distribution
        method_data = db.session.query(
            DiagnosisHistory.diagnosis_method,
            func.count(DiagnosisHistory.id).label('count')
        ).filter(
            DiagnosisHistory.diagnosis_date >= start_date,
            DiagnosisHistory.diagnosis_date <= end_date,
            DiagnosisHistory.diagnosis_method.isnot(None)
        ).group_by(DiagnosisHistory.diagnosis_method).all()

        # Map method names to readable labels
        method_labels = {
            'forward_chaining': 'Forward Chaining',
            'certainty_factor': 'Certainty Factor',
            'hybrid': 'Hybrid'
        }

        labels = [method_labels.get(m[0], m[0]) for m in method_data]
        values = [m[1] for m in method_data]

        return jsonify({
            'success': True,
            'data': {
                'labels': labels,
                'values': values
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/export-pdf', methods=['GET'])
def export_pdf():
    """Export report to PDF (placeholder - frontend will generate using jsPDF)"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    # This endpoint is a placeholder
    # Actual PDF generation will be done on frontend using jsPDF
    return jsonify({
        'success': True,
        'message': 'PDF export should be handled by frontend using jsPDF'
    })


@bp.route('/export-excel', methods=['GET'])
def export_excel():
    """Export report to Excel (placeholder - frontend will generate using xlsx.js)"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    # This endpoint is a placeholder
    # Actual Excel generation will be done on frontend using xlsx.js
    return jsonify({
        'success': True,
        'message': 'Excel export should be handled by frontend using xlsx.js'
    })

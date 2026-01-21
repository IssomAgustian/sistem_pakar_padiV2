'''History Routes'''
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models.history import DiagnosisHistory

bp = Blueprint('history', __name__)

@bp.route('', methods=['GET'], strict_slashes=False)
@bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_history():
    # Get user ID from JWT (stored as string, convert to int for DB)
    user_id_str = get_jwt_identity()
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Invalid user session'}), 401

    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    query = DiagnosisHistory.query.filter(
        DiagnosisHistory.user_id == user_id,
        DiagnosisHistory.expires_at > datetime.utcnow()
    ).order_by(DiagnosisHistory.diagnosis_date.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({'success': True, 'data': [h.to_dict(include_solution=False) for h in pagination.items],
                   'pagination': {'page': page, 'per_page': per_page, 'total': pagination.total, 'pages': pagination.pages}})

@bp.route('/<int:history_id>', methods=['GET'])
@jwt_required()
def get_history_detail(history_id):
    # Get user ID from JWT (stored as string, convert to int for DB)
    user_id_str = get_jwt_identity()
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Invalid user session'}), 401

    history = DiagnosisHistory.query.get_or_404(history_id)

    if history.user_id != user_id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    return jsonify({'success': True, 'data': history.to_dict(include_solution=True)})

@bp.route('/<int:history_id>/pdf', methods=['GET'])
@jwt_required()
def export_history_pdf(history_id):
    """Export diagnosis history to PDF (returns printable HTML)"""
    from flask import render_template

    # Get user ID from JWT
    user_id_str = get_jwt_identity()
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Invalid user session'}), 401

    # Get history record
    history = DiagnosisHistory.query.get_or_404(history_id)

    # Check ownership
    if history.user_id != user_id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    # Render HTML template for PDF printing
    # This returns an HTML page that can be printed to PDF by the browser
    try:
        return render_template(
            'pdf/diagnosis_report.html',
            history=history,
            disease=history.disease,
            ai_solution=history.ai_solution_json,
            diagnosis_date=history.diagnosis_date.strftime('%d %B %Y') if history.diagnosis_date else 'N/A'
        )
    except Exception as e:
        print(f"PDF template error: {e}")
        return jsonify({'success': False, 'message': 'Gagal membuat laporan PDF'}), 500

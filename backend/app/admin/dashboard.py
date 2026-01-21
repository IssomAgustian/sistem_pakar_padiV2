"""Admin Dashboard"""
from flask import Blueprint, jsonify, render_template, session, redirect, url_for
from flask_jwt_extended import jwt_required
from app.utils.decorators import admin_required
from app.models.user import User
from app.models.disease import Disease
from app.models.symptom import Symptom
from app.models.history import DiagnosisHistory

bp = Blueprint('admin_dashboard', __name__)

@bp.route('/', methods=['GET'])
def dashboard_page():
    """Render dashboard HTML page"""
    # Check if admin is logged in
    if 'admin_id' not in session:
        return redirect(url_for('admin.admin_auth.login_page'))
    return render_template('admin/dashboard.html')

@bp.route('/stats', methods=['GET'])
def get_dashboard_stats():
    """API endpoint for dashboard statistics - session based"""
    # Check if admin is logged in
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    total_users = User.query.count()
    total_diseases = Disease.query.count()
    total_symptoms = Symptom.query.count()
    total_diagnoses = DiagnosisHistory.query.count()

    return jsonify({
        'success': True,
        'data': {
            'total_users': total_users,
            'total_diseases': total_diseases,
            'total_symptoms': total_symptoms,
            'total_diagnoses': total_diagnoses
        }
    })

@bp.route('/recent-diagnoses', methods=['GET'])
def get_recent_diagnoses():
    """Get recent diagnoses for dashboard - session based"""
    # Check if admin is logged in
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    recent = DiagnosisHistory.query.order_by(
        DiagnosisHistory.diagnosis_date.desc()
    ).limit(5).all()

    diagnoses_data = []
    for d in recent:
        diagnoses_data.append({
            'id': d.id,
            'diagnosis_date': d.diagnosis_date.strftime('%Y-%m-%d %H:%M') if d.diagnosis_date else '',
            'user_email': d.user.email if d.user else 'Guest',
            'disease_name': d.disease.name if d.disease else 'Unknown',
            'final_cf_value': round(d.final_cf_value * 100, 1) if d.final_cf_value else 0,
            'diagnosis_method': d.diagnosis_method or 'Hybrid'
        })

    return jsonify({
        'success': True,
        'data': diagnoses_data
    })

@bp.route('/chart-data', methods=['GET'])
def get_chart_data():
    """Get chart data for dashboard - session based"""
    from datetime import datetime, timedelta
    from sqlalchemy import func

    # Check if admin is logged in
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    # Get data for last 7 days
    today = datetime.now().date()
    labels = []
    values = []

    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        # Count diagnoses for this date
        count = DiagnosisHistory.query.filter(
            func.date(DiagnosisHistory.diagnosis_date) == date
        ).count()

        # Indonesian day names
        day_names = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
        labels.append(day_names[date.weekday()])
        values.append(count)

    return jsonify({
        'success': True,
        'data': {
            'labels': labels,
            'values': values
        }
    })

'''Diagnosis Routes - Main Feature'''
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app import db
from app.models.history import DiagnosisHistory
from app.models.disease import Disease
from app.models.system_settings import SystemSettings
from app.services.certainty_factor_service import CertaintyFactorService
from app.services.ai_solution_service import AISolutionService

bp = Blueprint('diagnosis', __name__)


@bp.route('/start', methods=['POST', 'OPTIONS'])
def start_diagnosis():
    # Handle OPTIONS preflight request for CORS
    if request.method == 'OPTIONS':
        from flask import make_response, current_app
        response = make_response()
        origin = request.headers.get('Origin')
        allowed_origins = current_app.config.get('CORS_ALLOWED_ORIGINS_LIST', [])

        if origin and origin in allowed_origins:
            response.headers.add('Access-Control-Allow-Origin', origin)
            response.headers.add('Vary', 'Origin')

        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200

    # For POST request, require JWT
    from flask_jwt_extended import verify_jwt_in_request
    verify_jwt_in_request()

    data = request.get_json() or {}
    symptom_ids = data.get('symptom_ids', [])
    certainty_values = data.get('certainty_values', {})

    if not symptom_ids:
        return jsonify({'success': False, 'message': 'Pilih minimal satu gejala'}), 400
    if len(symptom_ids) < 3:
        return jsonify({'success': False, 'message': 'Minimal 3 gejala harus dipilih untuk diagnosis yang akurat'}), 400

    # Get user ID from JWT (stored as string, convert to int for DB)
    user_id_str = get_jwt_identity()
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Invalid user session'}), 401

    # Check for duplicate submission (within last 10 seconds)
    from datetime import datetime, timedelta
    recent_time = datetime.now() - timedelta(seconds=10)
    recent_diagnoses = DiagnosisHistory.query.filter(
        DiagnosisHistory.user_id == user_id,
        DiagnosisHistory.diagnosis_date >= recent_time
    ).order_by(DiagnosisHistory.diagnosis_date.desc()).all()

    for recent in recent_diagnoses:
        if recent.selected_symptoms == symptom_ids and recent.cf_values == certainty_values:
            return jsonify({
                'success': True,
                'status': 'diagnosed',
                'method': recent.diagnosis_method,
                'duplicate': True,
                'message': 'Diagnosis sudah ada, menampilkan hasil sebelumnya',
                'data': {
                    'history_id': recent.id,
                    'disease': recent.disease.to_dict() if recent.disease else None,
                    'confidence': round(float(recent.final_cf_value), 3) if recent.final_cf_value else 0,
                    'cf_value': round(float(recent.final_cf_value), 4) if recent.final_cf_value else 0,
                    'certainty_level': recent.certainty_level,
                    'results': recent.diagnosis_results or [],
                    'ai_solution': recent.ai_solution_json,
                    'saved_to_history': True
                }
            })

    # Check diagnosis limit per day
    limit_setting = SystemSettings.query.filter_by(setting_key='max_diagnoses_per_day').first()
    if limit_setting and limit_setting.setting_value:
        try:
            max_diagnoses = int(limit_setting.setting_value)
            today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            today_count = DiagnosisHistory.query.filter(
                DiagnosisHistory.user_id == user_id,
                DiagnosisHistory.diagnosis_date >= today_start
            ).count()

            if today_count >= max_diagnoses:
                return jsonify({
                    'success': False,
                    'message': f'Anda telah mencapai batas diagnosis hari ini ({max_diagnoses} diagnosis). Silakan coba lagi besok.',
                    'limit_reached': True
                }), 429
        except ValueError:
            pass

    # Always request certainty first when not provided
    if not certainty_values:
        from app.models.symptom import Symptom
        symptoms = Symptom.query.filter(Symptom.id.in_(symptom_ids)).all()
        return jsonify({
            'success': True,
            'status': 'needs_certainty',
            'data': {
                'symptoms': [s.to_dict() for s in symptoms],
                'certainty_options': {
                    'pasti': 1.0,
                    'hampir_pasti': 0.8,
                    'kemungkinan_besar': 0.6,
                    'mungkin': 0.4
                }
            }
        })

    # Calculate with CF (parallel matching)
    cf_service = CertaintyFactorService()
    cf_result = cf_service.diagnose(symptom_ids, certainty_values)

    if cf_result['status'] == 'no_diagnosis':
        return jsonify({'success': False, 'message': cf_result['message']}), 400

    results = cf_result['results']
    primary = results[0]
    disease = Disease.query.get(primary['disease_id'])
    min_match_required = primary.get('min_symptom_match') or 3

    if primary.get('symptoms_matched', 0) < min_match_required:
        alert_message = (
            'Hasil diagnosa gejala yang anda masukkan tidak merujuk secara spesifik '
            'pada satu penyakit tertentu silahkan periksa kembali gejala pada tanaman padi anda'
        )
        return jsonify({
            'success': True,
            'status': 'insufficient_match',
            'method': 'certainty_factor',
            'message': alert_message,
            'data': {
                'results': results,
                'primary': primary,
                'disease': disease.to_dict() if disease else None,
                'confidence': round(primary['cf_final'], 4),
                'cf_value': round(primary['cf_final'], 4),
                'certainty_level': primary['interpretation'],
                'warning': cf_result.get('warning'),
                'recommendations': cf_result.get('recommendations', []),
                'alert_message': alert_message,
                'saved_to_history': False
            }
        })

    ai_solution = None
    if disease:
        secondary_diseases = [
            {'code': r['disease_code'], 'name': r['disease_name'], 'cf_final': r['cf_final']}
            for r in results[1:]
        ]
        ai_service = AISolutionService()
        ai_solution = ai_service.generate_solution(
            disease,
            primary['cf_final'],
            'certainty_factor',
            secondary_diseases=secondary_diseases
        )
        if isinstance(ai_solution.get('structured'), dict):
            ai_solution['structured'].setdefault('pencegahan_penyakit_lain', [])

    history = DiagnosisHistory(
        user_id=user_id,
        disease_id=disease.id if disease else None,
        selected_symptoms=symptom_ids,
        cf_values=certainty_values,
        final_cf_value=primary['cf_final'],
        certainty_level=primary['interpretation'],
        diagnosis_method='certainty_factor',
        diagnosis_results=results,
        ai_solution=ai_solution['raw_text'] if ai_solution else None,
        ai_solution_json=ai_solution['structured'] if ai_solution else None,
        ip_address=request.remote_addr
    )
    db.session.add(history)
    db.session.commit()

    return jsonify({
        'success': True,
        'status': 'diagnosed',
        'method': 'certainty_factor',
        'data': {
            'history_id': history.id,
            'results': results,
            'primary': primary,
            'disease': disease.to_dict() if disease else None,
            'confidence': round(primary['cf_final'], 4),
            'cf_value': round(primary['cf_final'], 4),
            'certainty_level': primary['interpretation'],
            'warning': cf_result.get('warning'),
            'recommendations': cf_result.get('recommendations', []),
            'ai_solution': ai_solution['structured'] if ai_solution else None,
            'saved_to_history': True
        }
    })

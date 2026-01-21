#!/usr/bin/env python3
"""
Generate all route files automatically
"""

import os

# Make sure routes directory exists
os.makedirs('app/routes', exist_ok=True)

# List of route files to generate with their complete content
routes_content = {
    'auth_routes.py': """'''Authentication Routes'''
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.auth_service import AuthService

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email dan password harus diisi'}), 400

    user, result = AuthService.register_user(email, password, full_name)

    if not user:
        return jsonify({'success': False, 'message': result}), 400

    return jsonify({'success': True, 'message': 'Registrasi berhasil', 'data': {'user': user.to_dict(), 'token': result}})

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email dan password harus diisi'}), 400

    user, result = AuthService.login_user(email, password)

    if not user:
        return jsonify({'success': False, 'message': result}), 401

    return jsonify({'success': True, 'message': 'Login berhasil', 'data': {'user': user.to_dict(), 'token': result}})

@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = AuthService.get_user_by_id(user_id)

    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    return jsonify({'success': True, 'data': user.to_dict()})
""",

    'diagnosis_routes.py': """'''Diagnosis Routes - Main Feature'''
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.history import DiagnosisHistory
from app.services.forward_chaining_service import ForwardChainingService
from app.services.certainty_factor_service import CertaintyFactorService
from app.services.ai_solution_service import AISolutionService

bp = Blueprint('diagnosis', __name__)

@bp.route('/start', methods=['POST'])
@jwt_required()
def start_diagnosis():
    data = request.get_json()
    symptom_ids = data.get('symptom_ids', [])
    certainty_values = data.get('certainty_values', {})

    if not symptom_ids:
        return jsonify({'success': False, 'message': 'Pilih minimal satu gejala'}), 400

    user_id = get_jwt_identity()

    # Try Forward Chaining
    fc_service = ForwardChainingService()
    fc_result = fc_service.diagnose(symptom_ids)

    if fc_result['status'] == 'matched':
        disease = fc_result['disease']
        ai_service = AISolutionService()
        ai_solution = ai_service.generate_solution(disease, fc_result['confidence'], 'forward_chaining')

        history = DiagnosisHistory(
            user_id=user_id, disease_id=disease.id, selected_symptoms=symptom_ids,
            final_cf_value=fc_result['confidence'], certainty_level='Pasti',
            matched_rule_id=fc_result['matched_rule'].id,
            ai_solution=ai_solution['raw_text'], ai_solution_json=ai_solution['structured'],
            diagnosis_method='forward_chaining', ip_address=request.remote_addr
        )
        db.session.add(history)
        db.session.commit()

        return jsonify({'success': True, 'status': 'diagnosed', 'method': 'forward_chaining',
                       'data': {'history_id': history.id, 'disease': disease.to_dict(),
                               'confidence': round(fc_result['confidence'], 3), 'ai_solution': ai_solution['structured']}})

    # No match - request certainty
    if not certainty_values:
        from app.models.symptom import Symptom
        symptoms = Symptom.query.filter(Symptom.id.in_(symptom_ids)).all()
        return jsonify({'success': True, 'status': 'needs_certainty',
                       'data': {'symptoms': [s.to_dict() for s in symptoms],
                               'certainty_options': {'pasti': 1.0, 'hampir_pasti': 0.8, 'mungkin': 0.4}}})

    # Calculate with CF
    cf_service = CertaintyFactorService()
    cf_result = cf_service.diagnose(symptom_ids, certainty_values)

    if cf_result['status'] == 'no_diagnosis':
        return jsonify({'success': False, 'message': cf_result['message']}), 400

    disease = cf_result['disease']
    ai_service = AISolutionService()
    ai_solution = ai_service.generate_solution(disease, cf_result['cf_value'], 'certainty_factor')

    history = DiagnosisHistory(
        user_id=user_id, disease_id=disease.id, selected_symptoms=symptom_ids,
        cf_values=certainty_values, final_cf_value=cf_result['cf_value'],
        certainty_level=cf_result['certainty_level'], ai_solution=ai_solution['raw_text'],
        ai_solution_json=ai_solution['structured'], diagnosis_method='certainty_factor'
    )
    db.session.add(history)
    db.session.commit()

    return jsonify({'success': True, 'status': 'diagnosed', 'method': 'certainty_factor',
                   'data': {'history_id': history.id, 'disease': disease.to_dict(),
                           'cf_value': round(cf_result['cf_value'], 4), 'ai_solution': ai_solution['structured']}})
""",

    'history_routes.py': """'''History Routes'''
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models.history import DiagnosisHistory

bp = Blueprint('history', __name__)

@bp.route('/', methods=['GET'])
@jwt_required()
def get_history():
    user_id = get_jwt_identity()
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
    user_id = get_jwt_identity()
    history = DiagnosisHistory.query.get_or_404(history_id)

    if history.user_id != user_id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    return jsonify({'success': True, 'data': history.to_dict(include_solution=True)})
""",

    'disease_routes.py': """'''Disease Routes'''
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.disease import Disease
from app.utils.decorators import admin_required

bp = Blueprint('diseases', __name__)

@bp.route('/', methods=['GET'])
def get_diseases():
    diseases = Disease.query.order_by(Disease.code).all()
    return jsonify({'success': True, 'data': [d.to_dict() for d in diseases]})

@bp.route('/<int:disease_id>', methods=['GET'])
def get_disease(disease_id):
    disease = Disease.query.get_or_404(disease_id)
    return jsonify({'success': True, 'data': disease.to_dict()})

@bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def create_disease():
    data = request.get_json()
    if not data.get('code') or not data.get('name'):
        return jsonify({'success': False, 'message': 'Kode dan nama harus diisi'}), 400

    disease = Disease(code=data['code'], name=data['name'], description=data.get('description'))
    db.session.add(disease)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Penyakit berhasil ditambahkan', 'data': disease.to_dict()})
""",

    'user_routes.py': """'''User Routes'''
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models.user import User
from app.utils.decorators import admin_required

bp = Blueprint('users', __name__)

@bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({'success': True, 'data': [u.to_dict() for u in users]})

@bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({'success': True, 'data': user.to_dict()})
"""
}

# Write all files
for filename, content in routes_content.items():
    filepath = os.path.join('app', 'routes', filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'[OK] Created: {filepath}')

print(f'\n[SUCCESS] Generated {len(routes_content)} route files!')
print('\nGenerated routes:')
for filename in routes_content.keys():
    print(f'  - {filename}')

#!/usr/bin/env python3
"""
Generate all admin module files
"""

import os

# Ensure admin directory exists
os.makedirs('app/admin', exist_ok=True)

# Admin modules content
modules = {
    'kelola_penyakit.py': '''"""Admin - Kelola Penyakit (Manage Diseases)"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.disease import Disease
from app.models.admin_log import AdminLog
from app.utils.decorators import admin_required

bp = Blueprint('admin_diseases', __name__)

@bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_all_diseases():
    """Get all diseases with pagination"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    search = request.args.get('search', '')

    query = Disease.query
    if search:
        query = query.filter(
            db.or_(
                Disease.code.ilike(f'%{search}%'),
                Disease.name.ilike(f'%{search}%')
            )
        )

    pagination = query.order_by(Disease.code).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'success': True,
        'data': [d.to_dict() for d in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })

@bp.route('/<int:disease_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_disease(disease_id):
    """Get single disease detail"""
    disease = Disease.query.get_or_404(disease_id)
    return jsonify({'success': True, 'data': disease.to_dict()})

@bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def create_disease():
    """Create new disease"""
    data = request.get_json()
    admin_id = get_jwt_identity()

    if not data.get('code') or not data.get('name'):
        return jsonify({'success': False, 'message': 'Kode dan nama penyakit harus diisi'}), 400

    if Disease.query.filter_by(code=data['code']).first():
        return jsonify({'success': False, 'message': 'Kode penyakit sudah digunakan'}), 400

    disease = Disease(
        code=data['code'],
        name=data['name'],
        description=data.get('description', ''),
        causes=data.get('causes', ''),
        prevention=data.get('prevention', '')
    )

    db.session.add(disease)

    log = AdminLog(
        admin_id=admin_id,
        action='create_disease',
        description=f"Menambahkan penyakit baru: {disease.code} - {disease.name}",
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Penyakit berhasil ditambahkan',
        'data': disease.to_dict()
    }), 201

@bp.route('/<int:disease_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_disease(disease_id):
    """Update disease"""
    disease = Disease.query.get_or_404(disease_id)
    data = request.get_json()
    admin_id = get_jwt_identity()

    if not data.get('code') or not data.get('name'):
        return jsonify({'success': False, 'message': 'Kode dan nama penyakit harus diisi'}), 400

    existing = Disease.query.filter(
        Disease.code == data['code'],
        Disease.id != disease_id
    ).first()
    if existing:
        return jsonify({'success': False, 'message': 'Kode penyakit sudah digunakan'}), 400

    old_data = f"{disease.code} - {disease.name}"

    disease.code = data['code']
    disease.name = data['name']
    disease.description = data.get('description', '')
    disease.causes = data.get('causes', '')
    disease.prevention = data.get('prevention', '')

    log = AdminLog(
        admin_id=admin_id,
        action='update_disease',
        description=f"Mengupdate penyakit dari '{old_data}' menjadi '{disease.code} - {disease.name}'",
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Penyakit berhasil diupdate',
        'data': disease.to_dict()
    })

@bp.route('/<int:disease_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_disease(disease_id):
    """Delete disease"""
    disease = Disease.query.get_or_404(disease_id)
    admin_id = get_jwt_identity()

    from app.models.rule import Rule
    rules_count = Rule.query.filter_by(disease_id=disease_id).count()
    if rules_count > 0:
        return jsonify({
            'success': False,
            'message': f'Tidak dapat menghapus penyakit. Masih digunakan di {rules_count} rule'
        }), 400

    disease_name = f"{disease.code} - {disease.name}"

    db.session.delete(disease)

    log = AdminLog(
        admin_id=admin_id,
        action='delete_disease',
        description=f"Menghapus penyakit: {disease_name}",
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Penyakit berhasil dihapus'
    })
''',

    'kelola_gejala.py': '''"""Admin - Kelola Gejala (Manage Symptoms)"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.symptom import Symptom
from app.models.admin_log import AdminLog
from app.utils.decorators import admin_required

bp = Blueprint('admin_symptoms', __name__)

@bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_all_symptoms():
    """Get all symptoms with pagination"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    search = request.args.get('search', '')
    category = request.args.get('category', '')

    query = Symptom.query

    if search:
        query = query.filter(
            db.or_(
                Symptom.code.ilike(f'%{search}%'),
                Symptom.name.ilike(f'%{search}%')
            )
        )

    if category:
        query = query.filter_by(category=category)

    pagination = query.order_by(Symptom.code).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'success': True,
        'data': [s.to_dict() for s in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })

@bp.route('/<int:symptom_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_symptom(symptom_id):
    """Get single symptom detail"""
    symptom = Symptom.query.get_or_404(symptom_id)
    return jsonify({'success': True, 'data': symptom.to_dict()})

@bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def create_symptom():
    """Create new symptom"""
    data = request.get_json()
    admin_id = get_jwt_identity()

    if not data.get('code') or not data.get('name'):
        return jsonify({'success': False, 'message': 'Kode dan nama gejala harus diisi'}), 400

    if Symptom.query.filter_by(code=data['code']).first():
        return jsonify({'success': False, 'message': 'Kode gejala sudah digunakan'}), 400

    mb_value = float(data.get('mb_value', 0.5))
    md_value = float(data.get('md_value', 0.5))

    if not (0 <= mb_value <= 1) or not (0 <= md_value <= 1):
        return jsonify({'success': False, 'message': 'Nilai MB dan MD harus antara 0 dan 1'}), 400

    symptom = Symptom(
        code=data['code'],
        name=data['name'],
        category=data.get('category', 'umum'),
        description=data.get('description', ''),
        mb_value=mb_value,
        md_value=md_value
    )

    db.session.add(symptom)

    log = AdminLog(
        admin_id=admin_id,
        action='create_symptom',
        description=f"Menambahkan gejala baru: {symptom.code} - {symptom.name}",
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Gejala berhasil ditambahkan',
        'data': symptom.to_dict()
    }), 201

@bp.route('/<int:symptom_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_symptom(symptom_id):
    """Update symptom"""
    symptom = Symptom.query.get_or_404(symptom_id)
    data = request.get_json()
    admin_id = get_jwt_identity()

    if not data.get('code') or not data.get('name'):
        return jsonify({'success': False, 'message': 'Kode dan nama gejala harus diisi'}), 400

    existing = Symptom.query.filter(
        Symptom.code == data['code'],
        Symptom.id != symptom_id
    ).first()
    if existing:
        return jsonify({'success': False, 'message': 'Kode gejala sudah digunakan'}), 400

    mb_value = float(data.get('mb_value', symptom.mb_value))
    md_value = float(data.get('md_value', symptom.md_value))

    if not (0 <= mb_value <= 1) or not (0 <= md_value <= 1):
        return jsonify({'success': False, 'message': 'Nilai MB dan MD harus antara 0 dan 1'}), 400

    old_data = f"{symptom.code} - {symptom.name}"

    symptom.code = data['code']
    symptom.name = data['name']
    symptom.category = data.get('category', symptom.category)
    symptom.description = data.get('description', symptom.description)
    symptom.mb_value = mb_value
    symptom.md_value = md_value

    log = AdminLog(
        admin_id=admin_id,
        action='update_symptom',
        description=f"Mengupdate gejala dari '{old_data}' menjadi '{symptom.code} - {symptom.name}'",
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Gejala berhasil diupdate',
        'data': symptom.to_dict()
    })

@bp.route('/<int:symptom_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_symptom(symptom_id):
    """Delete symptom"""
    symptom = Symptom.query.get_or_404(symptom_id)
    admin_id = get_jwt_identity()

    symptom_name = f"{symptom.code} - {symptom.name}"

    db.session.delete(symptom)

    log = AdminLog(
        admin_id=admin_id,
        action='delete_symptom',
        description=f"Menghapus gejala: {symptom_name}",
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Gejala berhasil dihapus'
    })

@bp.route('/categories', methods=['GET'])
@jwt_required()
@admin_required
def get_categories():
    """Get all symptom categories"""
    categories = db.session.query(Symptom.category).distinct().all()
    return jsonify({
        'success': True,
        'data': [c[0] for c in categories if c[0]]
    })
''',

    'kelola_rule.py': '''"""Admin - Kelola Rule (Manage Forward Chaining Rules)"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.rule import Rule
from app.models.disease import Disease
from app.models.symptom import Symptom
from app.models.admin_log import AdminLog
from app.utils.decorators import admin_required

bp = Blueprint('admin_rules', __name__)

@bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_all_rules():
    """Get all rules with pagination"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    disease_id = request.args.get('disease_id', type=int)
    is_active = request.args.get('is_active')

    query = Rule.query

    if disease_id:
        query = query.filter_by(disease_id=disease_id)

    if is_active is not None:
        query = query.filter_by(is_active=is_active.lower() == 'true')

    pagination = query.order_by(Rule.rule_code).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'success': True,
        'data': [r.to_dict() for r in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })

@bp.route('/<int:rule_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_rule(rule_id):
    """Get single rule detail"""
    rule = Rule.query.get_or_404(rule_id)
    return jsonify({'success': True, 'data': rule.to_dict()})

@bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def create_rule():
    """Create new rule"""
    data = request.get_json()
    admin_id = get_jwt_identity()

    if not data.get('rule_code') or not data.get('disease_id') or not data.get('symptom_ids'):
        return jsonify({'success': False, 'message': 'Kode rule, penyakit, dan gejala harus diisi'}), 400

    if Rule.query.filter_by(rule_code=data['rule_code']).first():
        return jsonify({'success': False, 'message': 'Kode rule sudah digunakan'}), 400

    disease = Disease.query.get(data['disease_id'])
    if not disease:
        return jsonify({'success': False, 'message': 'Penyakit tidak ditemukan'}), 404

    symptom_ids = data['symptom_ids']
    if not isinstance(symptom_ids, list) or len(symptom_ids) == 0:
        return jsonify({'success': False, 'message': 'Gejala harus berupa array dan tidak boleh kosong'}), 400

    symptoms = Symptom.query.filter(Symptom.id.in_(symptom_ids)).all()
    if len(symptoms) != len(symptom_ids):
        return jsonify({'success': False, 'message': 'Beberapa gejala tidak ditemukan'}), 404

    confidence_level = float(data.get('confidence_level', 1.0))
    if not (0 < confidence_level <= 1):
        return jsonify({'success': False, 'message': 'Confidence level harus antara 0 dan 1'}), 400

    min_symptom_match = int(data.get('min_symptom_match', len(symptom_ids)))
    if min_symptom_match > len(symptom_ids):
        return jsonify({'success': False, 'message': 'Min symptom match tidak boleh lebih besar dari jumlah gejala'}), 400

    rule = Rule(
        rule_code=data['rule_code'],
        disease_id=data['disease_id'],
        symptom_ids=symptom_ids,
        confidence_level=confidence_level,
        min_symptom_match=min_symptom_match,
        description=data.get('description', ''),
        is_active=data.get('is_active', True)
    )

    db.session.add(rule)

    log = AdminLog(
        admin_id=admin_id,
        action='create_rule',
        description=f"Menambahkan rule baru: {rule.rule_code} untuk penyakit {disease.name}",
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Rule berhasil ditambahkan',
        'data': rule.to_dict()
    }), 201

@bp.route('/<int:rule_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_rule(rule_id):
    """Update rule"""
    rule = Rule.query.get_or_404(rule_id)
    data = request.get_json()
    admin_id = get_jwt_identity()

    if not data.get('rule_code') or not data.get('disease_id') or not data.get('symptom_ids'):
        return jsonify({'success': False, 'message': 'Kode rule, penyakit, dan gejala harus diisi'}), 400

    existing = Rule.query.filter(
        Rule.rule_code == data['rule_code'],
        Rule.id != rule_id
    ).first()
    if existing:
        return jsonify({'success': False, 'message': 'Kode rule sudah digunakan'}), 400

    disease = Disease.query.get(data['disease_id'])
    if not disease:
        return jsonify({'success': False, 'message': 'Penyakit tidak ditemukan'}), 404

    symptom_ids = data['symptom_ids']
    symptoms = Symptom.query.filter(Symptom.id.in_(symptom_ids)).all()
    if len(symptoms) != len(symptom_ids):
        return jsonify({'success': False, 'message': 'Beberapa gejala tidak ditemukan'}), 404

    old_data = f"{rule.rule_code}"

    rule.rule_code = data['rule_code']
    rule.disease_id = data['disease_id']
    rule.symptom_ids = symptom_ids
    rule.confidence_level = float(data.get('confidence_level', rule.confidence_level))
    rule.min_symptom_match = int(data.get('min_symptom_match', rule.min_symptom_match))
    rule.description = data.get('description', rule.description)
    rule.is_active = data.get('is_active', rule.is_active)

    log = AdminLog(
        admin_id=admin_id,
        action='update_rule',
        description=f"Mengupdate rule {old_data} untuk penyakit {disease.name}",
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Rule berhasil diupdate',
        'data': rule.to_dict()
    })

@bp.route('/<int:rule_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_rule(rule_id):
    """Delete rule"""
    rule = Rule.query.get_or_404(rule_id)
    admin_id = get_jwt_identity()

    rule_code = rule.rule_code

    db.session.delete(rule)

    log = AdminLog(
        admin_id=admin_id,
        action='delete_rule',
        description=f"Menghapus rule: {rule_code}",
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Rule berhasil dihapus'
    })

@bp.route('/<int:rule_id>/toggle', methods=['PATCH'])
@jwt_required()
@admin_required
def toggle_rule(rule_id):
    """Toggle rule active status"""
    rule = Rule.query.get_or_404(rule_id)
    admin_id = get_jwt_identity()

    rule.is_active = not rule.is_active

    log = AdminLog(
        admin_id=admin_id,
        action='toggle_rule',
        description=f"{'Mengaktifkan' if rule.is_active else 'Menonaktifkan'} rule: {rule.rule_code}",
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f"Rule berhasil {'diaktifkan' if rule.is_active else 'dinonaktifkan'}",
        'data': rule.to_dict()
    })
''',

    'data_pengguna.py': '''"""Admin - Data Pengguna (User Management)"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from app import db
from app.models.user import User
from app.models.admin_log import AdminLog
from app.utils.decorators import admin_required

bp = Blueprint('admin_users', __name__)

@bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    """Get all users with pagination and filters"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    search = request.args.get('search', '')
    role = request.args.get('role', '')
    is_active = request.args.get('is_active')

    query = User.query

    if search:
        query = query.filter(
            db.or_(
                User.email.ilike(f'%{search}%'),
                User.full_name.ilike(f'%{search}%')
            )
        )

    if role:
        query = query.filter_by(role=role)

    if is_active is not None:
        query = query.filter_by(is_active=is_active.lower() == 'true')

    pagination = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'success': True,
        'data': [u.to_dict() for u in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })

@bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_user(user_id):
    """Get single user detail with diagnosis history count"""
    user = User.query.get_or_404(user_id)

    user_data = user.to_dict()
    user_data['diagnosis_count'] = user.diagnosis_history.count()

    return jsonify({'success': True, 'data': user_data})

@bp.route('/<int:user_id>/toggle-active', methods=['PATCH'])
@jwt_required()
@admin_required
def toggle_user_active(user_id):
    """Toggle user active status"""
    user = User.query.get_or_404(user_id)
    admin_id = get_jwt_identity()

    if user.id == admin_id:
        return jsonify({'success': False, 'message': 'Tidak dapat menonaktifkan akun sendiri'}), 400

    user.is_active = not user.is_active

    log = AdminLog(
        admin_id=admin_id,
        action='toggle_user_active',
        description=f"{'Mengaktifkan' if user.is_active else 'Menonaktifkan'} user: {user.email}",
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f"User berhasil {'diaktifkan' if user.is_active else 'dinonaktifkan'}",
        'data': user.to_dict()
    })

@bp.route('/<int:user_id>/change-role', methods=['PATCH'])
@jwt_required()
@admin_required
def change_user_role(user_id):
    """Change user role"""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    admin_id = get_jwt_identity()

    new_role = data.get('role')
    if new_role not in ['user', 'admin']:
        return jsonify({'success': False, 'message': 'Role harus "user" atau "admin"'}), 400

    if user.id == admin_id:
        return jsonify({'success': False, 'message': 'Tidak dapat mengubah role akun sendiri'}), 400

    old_role = user.role
    user.role = new_role

    log = AdminLog(
        admin_id=admin_id,
        action='change_user_role',
        description=f"Mengubah role user {user.email} dari '{old_role}' menjadi '{new_role}'",
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Role user berhasil diubah',
        'data': user.to_dict()
    })

@bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    """Delete user"""
    user = User.query.get_or_404(user_id)
    admin_id = get_jwt_identity()

    if user.id == admin_id:
        return jsonify({'success': False, 'message': 'Tidak dapat menghapus akun sendiri'}), 400

    diagnosis_count = user.diagnosis_history.count()
    if diagnosis_count > 0:
        return jsonify({
            'success': False,
            'message': f'Tidak dapat menghapus user. Memiliki {diagnosis_count} riwayat diagnosis'
        }), 400

    user_email = user.email

    db.session.delete(user)

    log = AdminLog(
        admin_id=admin_id,
        action='delete_user',
        description=f"Menghapus user: {user_email}",
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'User berhasil dihapus'
    })

@bp.route('/stats', methods=['GET'])
@jwt_required()
@admin_required
def get_user_stats():
    """Get user statistics"""
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    admin_users = User.query.filter_by(role='admin').count()
    google_users = User.query.filter(User.google_id.isnot(None)).count()

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_users = User.query.filter(User.created_at >= thirty_days_ago).count()

    return jsonify({
        'success': True,
        'data': {
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': total_users - active_users,
            'admin_users': admin_users,
            'regular_users': total_users - admin_users,
            'google_users': google_users,
            'new_users_30days': new_users
        }
    })
''',

    'riwayat_diagnosis.py': '''"""Admin - Riwayat Diagnosis (Diagnosis History)"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
from app.models.history import DiagnosisHistory
from app.models.user import User
from app.models.disease import Disease
from app.utils.decorators import admin_required

bp = Blueprint('admin_history', __name__)

@bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_all_history():
    """Get all diagnosis history with pagination"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    user_id = request.args.get('user_id', type=int)
    disease_id = request.args.get('disease_id', type=int)
    method = request.args.get('method', '')
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')

    query = DiagnosisHistory.query

    if user_id:
        query = query.filter_by(user_id=user_id)

    if disease_id:
        query = query.filter_by(disease_id=disease_id)

    if method:
        query = query.filter_by(diagnosis_method=method)

    if date_from:
        try:
            from_date = datetime.strptime(date_from, '%Y-%m-%d')
            query = query.filter(DiagnosisHistory.diagnosis_date >= from_date)
        except ValueError:
            pass

    if date_to:
        try:
            to_date = datetime.strptime(date_to, '%Y-%m-%d')
            to_date = to_date.replace(hour=23, minute=59, second=59)
            query = query.filter(DiagnosisHistory.diagnosis_date <= to_date)
        except ValueError:
            pass

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
@jwt_required()
@admin_required
def get_history_detail(history_id):
    """Get single history detail with full solution"""
    history = DiagnosisHistory.query.get_or_404(history_id)
    return jsonify({'success': True, 'data': history.to_dict(include_solution=True)})

@bp.route('/stats', methods=['GET'])
@jwt_required()
@admin_required
def get_history_stats():
    """Get diagnosis history statistics"""
    total_diagnoses = DiagnosisHistory.query.count()
    fc_diagnoses = DiagnosisHistory.query.filter_by(diagnosis_method='forward_chaining').count()
    cf_diagnoses = DiagnosisHistory.query.filter_by(diagnosis_method='certainty_factor').count()

    # Diagnoses in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_diagnoses = DiagnosisHistory.query.filter(
        DiagnosisHistory.diagnosis_date >= thirty_days_ago
    ).count()

    # Most common diseases
    from sqlalchemy import func
    common_diseases = DiagnosisHistory.query.join(Disease).with_entities(
        Disease.name,
        func.count(DiagnosisHistory.id).label('count')
    ).group_by(Disease.name).order_by(func.count(DiagnosisHistory.id).desc()).limit(5).all()

    return jsonify({
        'success': True,
        'data': {
            'total_diagnoses': total_diagnoses,
            'forward_chaining_count': fc_diagnoses,
            'certainty_factor_count': cf_diagnoses,
            'recent_30days': recent_diagnoses,
            'common_diseases': [{'disease': d[0], 'count': d[1]} for d in common_diseases]
        }
    })
''',

    'laporan.py': '''"""Admin - Laporan (Reports & Analytics)"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
from sqlalchemy import func, extract
from app import db
from app.models.history import DiagnosisHistory
from app.models.disease import Disease
from app.models.user import User
from app.utils.decorators import admin_required

bp = Blueprint('admin_reports', __name__)

@bp.route('/overview', methods=['GET'])
@jwt_required()
@admin_required
def get_overview():
    """Get system overview statistics"""
    from app.models.symptom import Symptom
    from app.models.rule import Rule

    total_users = User.query.count()
    total_diseases = Disease.query.count()
    total_symptoms = Symptom.query.count()
    total_rules = Rule.query.count()
    total_diagnoses = DiagnosisHistory.query.count()

    # Active today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    diagnoses_today = DiagnosisHistory.query.filter(
        DiagnosisHistory.diagnosis_date >= today_start
    ).count()

    # This week
    week_start = datetime.utcnow() - timedelta(days=7)
    diagnoses_week = DiagnosisHistory.query.filter(
        DiagnosisHistory.diagnosis_date >= week_start
    ).count()

    # This month
    month_start = datetime.utcnow() - timedelta(days=30)
    diagnoses_month = DiagnosisHistory.query.filter(
        DiagnosisHistory.diagnosis_date >= month_start
    ).count()

    return jsonify({
        'success': True,
        'data': {
            'total_users': total_users,
            'total_diseases': total_diseases,
            'total_symptoms': total_symptoms,
            'total_rules': total_rules,
            'total_diagnoses': total_diagnoses,
            'diagnoses_today': diagnoses_today,
            'diagnoses_week': diagnoses_week,
            'diagnoses_month': diagnoses_month
        }
    })

@bp.route('/disease-distribution', methods=['GET'])
@jwt_required()
@admin_required
def get_disease_distribution():
    """Get disease distribution statistics"""
    period = request.args.get('period', '30')  # days
    days = int(period)
    start_date = datetime.utcnow() - timedelta(days=days)

    distribution = DiagnosisHistory.query.join(Disease).filter(
        DiagnosisHistory.diagnosis_date >= start_date
    ).with_entities(
        Disease.code,
        Disease.name,
        func.count(DiagnosisHistory.id).label('count'),
        func.avg(DiagnosisHistory.final_cf_value).label('avg_confidence')
    ).group_by(Disease.code, Disease.name).order_by(
        func.count(DiagnosisHistory.id).desc()
    ).all()

    return jsonify({
        'success': True,
        'data': [{
            'disease_code': d[0],
            'disease_name': d[1],
            'count': d[2],
            'avg_confidence': round(float(d[3]), 4) if d[3] else 0
        } for d in distribution]
    })

@bp.route('/method-distribution', methods=['GET'])
@jwt_required()
@admin_required
def get_method_distribution():
    """Get diagnosis method distribution"""
    period = request.args.get('period', '30')
    days = int(period)
    start_date = datetime.utcnow() - timedelta(days=days)

    distribution = DiagnosisHistory.query.filter(
        DiagnosisHistory.diagnosis_date >= start_date
    ).with_entities(
        DiagnosisHistory.diagnosis_method,
        func.count(DiagnosisHistory.id).label('count')
    ).group_by(DiagnosisHistory.diagnosis_method).all()

    return jsonify({
        'success': True,
        'data': [{
            'method': d[0],
            'count': d[1]
        } for d in distribution]
    })

@bp.route('/monthly-trend', methods=['GET'])
@jwt_required()
@admin_required
def get_monthly_trend():
    """Get monthly diagnosis trend for the last 12 months"""
    twelve_months_ago = datetime.utcnow() - timedelta(days=365)

    trend = DiagnosisHistory.query.filter(
        DiagnosisHistory.diagnosis_date >= twelve_months_ago
    ).with_entities(
        extract('year', DiagnosisHistory.diagnosis_date).label('year'),
        extract('month', DiagnosisHistory.diagnosis_date).label('month'),
        func.count(DiagnosisHistory.id).label('count')
    ).group_by('year', 'month').order_by('year', 'month').all()

    return jsonify({
        'success': True,
        'data': [{
            'year': int(t[0]),
            'month': int(t[1]),
            'count': t[2]
        } for t in trend]
    })

@bp.route('/user-activity', methods=['GET'])
@jwt_required()
@admin_required
def get_user_activity():
    """Get user activity statistics"""
    period = request.args.get('period', '30')
    days = int(period)
    start_date = datetime.utcnow() - timedelta(days=days)

    # Most active users
    active_users = DiagnosisHistory.query.join(User).filter(
        DiagnosisHistory.diagnosis_date >= start_date
    ).with_entities(
        User.email,
        User.full_name,
        func.count(DiagnosisHistory.id).label('diagnosis_count')
    ).group_by(User.email, User.full_name).order_by(
        func.count(DiagnosisHistory.id).desc()
    ).limit(10).all()

    return jsonify({
        'success': True,
        'data': [{
            'email': u[0],
            'full_name': u[1],
            'diagnosis_count': u[2]
        } for u in active_users]
    })

@bp.route('/confidence-analysis', methods=['GET'])
@jwt_required()
@admin_required
def get_confidence_analysis():
    """Get confidence level analysis"""
    period = request.args.get('period', '30')
    days = int(period)
    start_date = datetime.utcnow() - timedelta(days=days)

    # Average confidence by disease
    confidence_by_disease = DiagnosisHistory.query.join(Disease).filter(
        DiagnosisHistory.diagnosis_date >= start_date
    ).with_entities(
        Disease.name,
        func.avg(DiagnosisHistory.final_cf_value).label('avg_confidence'),
        func.min(DiagnosisHistory.final_cf_value).label('min_confidence'),
        func.max(DiagnosisHistory.final_cf_value).label('max_confidence'),
        func.count(DiagnosisHistory.id).label('count')
    ).group_by(Disease.name).all()

    return jsonify({
        'success': True,
        'data': [{
            'disease': c[0],
            'avg_confidence': round(float(c[1]), 4) if c[1] else 0,
            'min_confidence': round(float(c[2]), 4) if c[2] else 0,
            'max_confidence': round(float(c[3]), 4) if c[3] else 0,
            'count': c[4]
        } for c in confidence_by_disease]
    })
''',

    'pengaturan_sistem.py': '''"""Admin - Pengaturan Sistem (System Settings)"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.system_settings import SystemSettings
from app.models.admin_log import AdminLog
from app.utils.decorators import admin_required

bp = Blueprint('admin_settings', __name__)

@bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_all_settings():
    """Get all system settings"""
    settings = SystemSettings.query.order_by(SystemSettings.category, SystemSettings.key).all()

    # Group by category
    grouped = {}
    for setting in settings:
        if setting.category not in grouped:
            grouped[setting.category] = []
        grouped[setting.category].append(setting.to_dict())

    return jsonify({
        'success': True,
        'data': grouped
    })

@bp.route('/<string:key>', methods=['GET'])
@jwt_required()
@admin_required
def get_setting(key):
    """Get single setting"""
    setting = SystemSettings.query.filter_by(key=key).first_or_404()
    return jsonify({'success': True, 'data': setting.to_dict()})

@bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def create_setting():
    """Create new setting"""
    data = request.get_json()
    admin_id = get_jwt_identity()

    if not data.get('key') or not data.get('value'):
        return jsonify({'success': False, 'message': 'Key dan value harus diisi'}), 400

    if SystemSettings.query.filter_by(key=data['key']).first():
        return jsonify({'success': False, 'message': 'Key sudah digunakan'}), 400

    setting = SystemSettings(
        key=data['key'],
        value=data['value'],
        description=data.get('description', ''),
        category=data.get('category', 'general'),
        data_type=data.get('data_type', 'string')
    )

    db.session.add(setting)

    log = AdminLog(
        admin_id=admin_id,
        action='create_setting',
        description=f"Menambahkan setting baru: {setting.key}",
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Setting berhasil ditambahkan',
        'data': setting.to_dict()
    }), 201

@bp.route('/<int:setting_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_setting(setting_id):
    """Update setting"""
    setting = SystemSettings.query.get_or_404(setting_id)
    data = request.get_json()
    admin_id = get_jwt_identity()

    old_value = setting.value

    setting.value = data.get('value', setting.value)
    setting.description = data.get('description', setting.description)
    setting.category = data.get('category', setting.category)
    setting.data_type = data.get('data_type', setting.data_type)

    log = AdminLog(
        admin_id=admin_id,
        action='update_setting',
        description=f"Mengupdate setting {setting.key} dari '{old_value}' menjadi '{setting.value}'",
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Setting berhasil diupdate',
        'data': setting.to_dict()
    })

@bp.route('/<int:setting_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_setting(setting_id):
    """Delete setting"""
    setting = SystemSettings.query.get_or_404(setting_id)
    admin_id = get_jwt_identity()

    setting_key = setting.key

    db.session.delete(setting)

    log = AdminLog(
        admin_id=admin_id,
        action='delete_setting',
        description=f"Menghapus setting: {setting_key}",
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Setting berhasil dihapus'
    })

@bp.route('/bulk-update', methods=['PUT'])
@jwt_required()
@admin_required
def bulk_update_settings():
    """Bulk update settings"""
    data = request.get_json()
    admin_id = get_jwt_identity()

    if not isinstance(data, dict):
        return jsonify({'success': False, 'message': 'Data harus berupa object'}), 400

    updated = []
    for key, value in data.items():
        setting = SystemSettings.query.filter_by(key=key).first()
        if setting:
            old_value = setting.value
            setting.value = value
            updated.append(key)

            log = AdminLog(
                admin_id=admin_id,
                action='bulk_update_setting',
                description=f"Bulk update setting {key} dari '{old_value}' menjadi '{value}'",
                ip_address=request.remote_addr
            )
            db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'{len(updated)} setting berhasil diupdate',
        'updated_keys': updated
    })
''',

    'logs.py': '''"""Admin - Activity Logs"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
from app.models.admin_log import AdminLog
from app.models.user import User
from app.utils.decorators import admin_required

bp = Blueprint('admin_logs', __name__)

@bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_all_logs():
    """Get all admin activity logs with pagination"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    admin_id = request.args.get('admin_id', type=int)
    action = request.args.get('action', '')
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')

    query = AdminLog.query

    if admin_id:
        query = query.filter_by(admin_id=admin_id)

    if action:
        query = query.filter_by(action=action)

    if date_from:
        try:
            from_date = datetime.strptime(date_from, '%Y-%m-%d')
            query = query.filter(AdminLog.created_at >= from_date)
        except ValueError:
            pass

    if date_to:
        try:
            to_date = datetime.strptime(date_to, '%Y-%m-%d')
            to_date = to_date.replace(hour=23, minute=59, second=59)
            query = query.filter(AdminLog.created_at <= to_date)
        except ValueError:
            pass

    pagination = query.order_by(AdminLog.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'success': True,
        'data': [log.to_dict() for log in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })

@bp.route('/stats', methods=['GET'])
@jwt_required()
@admin_required
def get_log_stats():
    """Get activity log statistics"""
    from sqlalchemy import func

    # Total logs
    total_logs = AdminLog.query.count()

    # Logs today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    logs_today = AdminLog.query.filter(AdminLog.created_at >= today_start).count()

    # Logs this week
    week_start = datetime.utcnow() - timedelta(days=7)
    logs_week = AdminLog.query.filter(AdminLog.created_at >= week_start).count()

    # Most common actions
    common_actions = AdminLog.query.with_entities(
        AdminLog.action,
        func.count(AdminLog.id).label('count')
    ).group_by(AdminLog.action).order_by(
        func.count(AdminLog.id).desc()
    ).limit(10).all()

    # Most active admins
    active_admins = AdminLog.query.join(User).with_entities(
        User.email,
        User.full_name,
        func.count(AdminLog.id).label('activity_count')
    ).group_by(User.email, User.full_name).order_by(
        func.count(AdminLog.id).desc()
    ).limit(5).all()

    return jsonify({
        'success': True,
        'data': {
            'total_logs': total_logs,
            'logs_today': logs_today,
            'logs_week': logs_week,
            'common_actions': [{'action': a[0], 'count': a[1]} for a in common_actions],
            'active_admins': [{'email': a[0], 'full_name': a[1], 'count': a[2]} for a in active_admins]
        }
    })

@bp.route('/actions', methods=['GET'])
@jwt_required()
@admin_required
def get_action_types():
    """Get all distinct action types"""
    from sqlalchemy import distinct

    actions = AdminLog.query.with_entities(
        distinct(AdminLog.action)
    ).order_by(AdminLog.action).all()

    return jsonify({
        'success': True,
        'data': [a[0] for a in actions]
    })
''',

    'pengaturan_admin.py': '''"""Admin - Pengaturan Admin (Admin User Management)"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.admin_log import AdminLog
from app.utils.decorators import admin_required

bp = Blueprint('admin_management', __name__)

@bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_all_admins():
    """Get all admin users"""
    admins = User.query.filter_by(role='admin').order_by(User.created_at.desc()).all()

    return jsonify({
        'success': True,
        'data': [a.to_dict() for a in admins]
    })

@bp.route('/<int:admin_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_admin(admin_id):
    """Get single admin detail with activity log count"""
    admin = User.query.filter_by(id=admin_id, role='admin').first_or_404()

    admin_data = admin.to_dict()

    # Get activity count
    from app.models.admin_log import AdminLog
    admin_data['activity_count'] = AdminLog.query.filter_by(admin_id=admin_id).count()

    return jsonify({'success': True, 'data': admin_data})

@bp.route('/promote/<int:user_id>', methods=['POST'])
@jwt_required()
@admin_required
def promote_to_admin(user_id):
    """Promote user to admin"""
    user = User.query.get_or_404(user_id)
    current_admin_id = get_jwt_identity()

    if user.role == 'admin':
        return jsonify({'success': False, 'message': 'User sudah menjadi admin'}), 400

    user.role = 'admin'

    log = AdminLog(
        admin_id=current_admin_id,
        action='promote_admin',
        description=f"Mempromosikan user {user.email} menjadi admin",
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'User berhasil dipromosikan menjadi admin',
        'data': user.to_dict()
    })

@bp.route('/demote/<int:admin_id>', methods=['POST'])
@jwt_required()
@admin_required
def demote_from_admin(admin_id):
    """Demote admin to regular user"""
    admin = User.query.get_or_404(admin_id)
    current_admin_id = get_jwt_identity()

    if admin.id == current_admin_id:
        return jsonify({'success': False, 'message': 'Tidak dapat menurunkan role akun sendiri'}), 400

    if admin.role != 'admin':
        return jsonify({'success': False, 'message': 'User bukan admin'}), 400

    admin.role = 'user'

    log = AdminLog(
        admin_id=current_admin_id,
        action='demote_admin',
        description=f"Menurunkan admin {admin.email} menjadi user biasa",
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Admin berhasil diturunkan menjadi user biasa',
        'data': admin.to_dict()
    })

@bp.route('/<int:admin_id>/activity', methods=['GET'])
@jwt_required()
@admin_required
def get_admin_activity(admin_id):
    """Get admin activity logs"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    from app.models.admin_log import AdminLog

    pagination = AdminLog.query.filter_by(admin_id=admin_id).order_by(
        AdminLog.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'success': True,
        'data': [log.to_dict() for log in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })
'''
}

# Write all module files
for filename, content in modules.items():
    filepath = os.path.join('app', 'admin', filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'[OK] Created: {filepath}')

print(f'\n[SUCCESS] Generated {len(modules)} admin module files!')
print('\nGenerated modules:')
for filename in modules.keys():
    print(f'  - {filename}')

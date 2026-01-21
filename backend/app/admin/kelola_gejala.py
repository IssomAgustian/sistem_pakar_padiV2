"""Admin - Kelola Gejala (Manage Symptoms)"""
from flask import Blueprint, jsonify, request, render_template, session, redirect, url_for
from app import db
from app.models.symptom import Symptom
from app.models.admin_log import AdminLog

bp = Blueprint('admin_symptoms', __name__)

@bp.route('/', methods=['GET'])
def symptoms_page():
    """Render symptoms management page - session based"""
    if 'admin_id' not in session:
        return redirect(url_for('admin.admin_auth.login_page'))
    return render_template('admin/kelola_gejala.html')

@bp.route('/list', methods=['GET'])
def get_all_symptoms():
    """Get all symptoms with pagination - session based"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
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

    # Add usage count
    from app.models.rule import Rule
    symptoms_data = []
    for symptom in pagination.items:
        symptom_dict = symptom.to_dict()
        usage_count = Rule.query.filter_by(symptom_id=symptom.id).count()
        symptom_dict['usage_count'] = usage_count
        symptoms_data.append(symptom_dict)

    return jsonify({
        'success': True,
        'data': symptoms_data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })

@bp.route('/<int:symptom_id>', methods=['GET'])
def get_symptom(symptom_id):
    """Get single symptom detail - session based"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    symptom = Symptom.query.get_or_404(symptom_id)
    return jsonify({'success': True, 'data': symptom.to_dict()})

@bp.route('/create', methods=['POST'])
def create_symptom():
    """Create new symptom - session based"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data = request.get_json()
    admin_id = session.get('admin_id')

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
        category=data.get('category', ''),
        description=data.get('description', ''),
        mb_value=mb_value,
        md_value=md_value
    )

    db.session.add(symptom)

    log = AdminLog(
        admin_id=admin_id,
        action='CREATE',
        description=f"Menambahkan gejala: {symptom.code} - {symptom.name}",
        table_name='symptoms',
        record_id=None,
        ip_address=request.remote_addr
    )
    db.session.add(log)
    db.session.commit()

    log.record_id = symptom.id
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Gejala berhasil ditambahkan',
        'data': symptom.to_dict()
    }), 201

@bp.route('/<int:symptom_id>', methods=['PUT'])
def update_symptom(symptom_id):
    """Update symptom - session based"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    symptom = Symptom.query.get_or_404(symptom_id)
    data = request.get_json()
    admin_id = session.get('admin_id')

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
        action='UPDATE',
        description=f"Update gejala dari '{old_data}' menjadi '{symptom.code} - {symptom.name}'",
        table_name='symptoms',
        record_id=symptom_id,
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
def delete_symptom(symptom_id):
    """Delete symptom - session based"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    symptom = Symptom.query.get_or_404(symptom_id)
    admin_id = session.get('admin_id')

    # Check usage in rules
    from app.models.rule import Rule
    rules_using_symptom = Rule.query.filter_by(symptom_id=symptom_id).count()

    if rules_using_symptom > 0:
        return jsonify({
            'success': False,
            'message': f'Tidak dapat menghapus gejala. Masih digunakan di {rules_using_symptom} rule(s)'
        }), 400

    symptom_name = f"{symptom.code} - {symptom.name}"
    db.session.delete(symptom)

    log = AdminLog(
        admin_id=admin_id,
        action='DELETE',
        description=f"Menghapus gejala: {symptom_name}",
        table_name='symptoms',
        record_id=symptom_id,
        ip_address=request.remote_addr
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Gejala berhasil dihapus'
    })

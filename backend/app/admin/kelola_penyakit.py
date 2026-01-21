"""Admin - Kelola Penyakit (Manage Diseases)"""
from flask import Blueprint, jsonify, request, render_template, session, redirect, url_for
from app import db
from app.models.disease import Disease
from app.models.rule import Rule
from app.models.admin_log import AdminLog

bp = Blueprint('admin_diseases', __name__)

@bp.route('/', methods=['GET'])
def diseases_page():
    """Render diseases management page - session based"""
    if 'admin_id' not in session:
        return redirect(url_for('admin.admin_auth.login_page'))
    return render_template('admin/kelola_penyakit.html')

@bp.route('/list', methods=['GET'])
def get_all_diseases():
    """Get all diseases with pagination - session based"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
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

    # Add rule count to each disease
    diseases_data = []
    for disease in pagination.items:
        disease_dict = disease.to_dict()
        disease_dict['rule_count'] = Rule.query.filter_by(disease_id=disease.id).count()
        diseases_data.append(disease_dict)

    return jsonify({
        'success': True,
        'data': diseases_data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })

@bp.route('/<int:disease_id>', methods=['GET'])
def get_disease(disease_id):
    """Get single disease detail - session based"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    disease = Disease.query.get_or_404(disease_id)
    disease_dict = disease.to_dict()
    disease_dict['rule_count'] = Rule.query.filter_by(disease_id=disease.id).count()
    return jsonify({'success': True, 'data': disease_dict})

@bp.route('/create', methods=['POST'])
def create_disease():
    """Create new disease - session based"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data = request.get_json()
    admin_id = session.get('admin_id')

    if not data.get('code') or not data.get('name'):
        return jsonify({'success': False, 'message': 'Kode dan nama penyakit harus diisi'}), 400

    if Disease.query.filter_by(code=data['code']).first():
        return jsonify({'success': False, 'message': 'Kode penyakit sudah digunakan'}), 400

    disease = Disease(
        code=data['code'],
        name=data['name'],
        description=data.get('description', '')
    )

    db.session.add(disease)

    log = AdminLog(
        admin_id=admin_id,
        action='CREATE',
        description=f"Menambahkan penyakit: {disease.code} - {disease.name}",
        table_name='diseases',
        record_id=None,
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    # Update log with record_id
    log.record_id = disease.id
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Penyakit berhasil ditambahkan',
        'data': disease.to_dict()
    }), 201

@bp.route('/<int:disease_id>', methods=['PUT'])
def update_disease(disease_id):
    """Update disease - session based"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    disease = Disease.query.get_or_404(disease_id)
    data = request.get_json()
    admin_id = session.get('admin_id')

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

    log = AdminLog(
        admin_id=admin_id,
        action='UPDATE',
        description=f"Update penyakit dari '{old_data}' menjadi '{disease.code} - {disease.name}'",
        table_name='diseases',
        record_id=disease_id,
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
def delete_disease(disease_id):
    """Delete disease - session based"""
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    disease = Disease.query.get_or_404(disease_id)
    admin_id = session.get('admin_id')

    rules_count = Rule.query.filter_by(disease_id=disease_id).count()
    if rules_count > 0:
        return jsonify({
            'success': False,
            'message': f'Tidak dapat menghapus penyakit. Masih terhubung dengan {rules_count} rule(s)'
        }), 400

    disease_name = f"{disease.code} - {disease.name}"

    db.session.delete(disease)

    log = AdminLog(
        admin_id=admin_id,
        action='DELETE',
        description=f"Menghapus penyakit: {disease_name}",
        table_name='diseases',
        record_id=disease_id,
        ip_address=request.remote_addr
    )
    db.session.add(log)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Penyakit berhasil dihapus'
    })

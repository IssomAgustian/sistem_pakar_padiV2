"""Admin - Kelola Rule (Manage Disease/Symptom Rules)"""
from flask import Blueprint, jsonify, request, render_template, session, redirect, url_for
from app import db
from app.models.rule import Rule
from app.models.disease import Disease
from app.models.symptom import Symptom
from app.models.admin_log import AdminLog

bp = Blueprint('admin_rules', __name__)


def _get_next_rule_number():
    last_rule = Rule.query.order_by(Rule.id.desc()).first()
    if last_rule and last_rule.rule_code and last_rule.rule_code[1:].isdigit():
        return int(last_rule.rule_code[1:]) + 1
    return 1


def _build_rules_for_disease(disease_id, symptoms, cf_value, min_match, is_active, start_num):
    rules = []
    next_num = start_num

    for symptom in symptoms:
        base_mb = float(symptom.mb_value) if symptom.mb_value is not None else 0.5
        base_md = float(symptom.md_value) if symptom.md_value is not None else 0.5
        mb = max(0.0, min(1.0, base_mb * cf_value))
        md = max(0.0, min(1.0, base_md * cf_value))

        rule = Rule(
            rule_code=f'R{str(next_num).zfill(3)}',
            disease_id=disease_id,
            symptom_id=symptom.id,
            symptom_ids=[symptom.id],
            confidence_level=cf_value,
            mb=mb,
            md=md,
            min_symptom_match=min_match,
            is_active=is_active
        )
        rules.append(rule)
        next_num += 1

    return rules


def check_admin_session():
    """Check if admin is logged in"""
    if 'admin_id' not in session:
        return False
    return True


@bp.route('/', methods=['GET'])
def rules_page():
    """Render rules management page"""
    if not check_admin_session():
        return redirect(url_for('admin.admin_auth.login_page'))
    return render_template('admin/kelola_rule.html')


@bp.route('/list', methods=['GET'])
def get_all_rules():
    """Get all rules with pagination"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    disease_id = request.args.get('disease_id', type=int)
    status = request.args.get('status', '')

    query = Rule.query

    if disease_id:
        query = query.filter_by(disease_id=disease_id)
    if status == 'active':
        query = query.filter_by(is_active=True)
    elif status == 'inactive':
        query = query.filter_by(is_active=False)

    query = query.order_by(Rule.rule_code)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    data = []
    for rule in pagination.items:
        disease = Disease.query.get(rule.disease_id)
        symptom = Symptom.query.get(rule.symptom_id)

        data.append({
            'id': rule.id,
            'rule_code': rule.rule_code,
            'disease_id': rule.disease_id,
            'disease_name': disease.name if disease else 'Unknown',
            'disease_code': disease.code if disease else 'N/A',
            'symptom_id': rule.symptom_id,
            'symptom_code': symptom.code if symptom else 'N/A',
            'symptom_name': symptom.name if symptom else 'Unknown',
            'confidence_level': float(rule.confidence_level) if rule.confidence_level is not None else None,
            'mb': float(rule.mb) if rule.mb is not None else 0.0,
            'md': float(rule.md) if rule.md is not None else 0.0,
            'min_symptom_match': rule.min_symptom_match,
            'is_active': rule.is_active,
            'created_at': rule.created_at.strftime('%Y-%m-%d %H:%M:%S') if rule.created_at else None,
            'updated_at': rule.updated_at.strftime('%Y-%m-%d %H:%M:%S') if rule.updated_at else None
        })

    return jsonify({
        'success': True,
        'data': data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })


@bp.route('/<int:rule_id>', methods=['GET'])
def get_rule(rule_id):
    """Get single rule detail"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    rule = Rule.query.get_or_404(rule_id)
    disease = Disease.query.get(rule.disease_id)
    symptom = Symptom.query.get(rule.symptom_id)

    data = {
        'id': rule.id,
        'rule_code': rule.rule_code,
        'disease_id': rule.disease_id,
        'disease_name': disease.name if disease else 'Unknown',
        'disease_code': disease.code if disease else 'N/A',
        'symptom_id': rule.symptom_id,
        'symptom_code': symptom.code if symptom else 'N/A',
        'symptom_name': symptom.name if symptom else 'Unknown',
        'symptom_category': symptom.category if symptom else '',
        'confidence_level': float(rule.confidence_level) if rule.confidence_level is not None else None,
        'mb': float(rule.mb) if rule.mb is not None else 0.0,
        'md': float(rule.md) if rule.md is not None else 0.0,
        'min_symptom_match': rule.min_symptom_match,
        'is_active': rule.is_active,
        'created_at': rule.created_at.strftime('%Y-%m-%d %H:%M:%S') if rule.created_at else None,
        'updated_at': rule.updated_at.strftime('%Y-%m-%d %H:%M:%S') if rule.updated_at else None
    }

    return jsonify({'success': True, 'data': data})


@bp.route('/create', methods=['POST'])
def create_rule():
    """Create new rule"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data = request.get_json() or {}
    admin_id = session.get('admin_id')

    if not data.get('disease_id'):
        return jsonify({'success': False, 'message': 'Penyakit harus dipilih'}), 400

    try:
        disease_id = int(data.get('disease_id'))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Penyakit tidak valid'}), 400

    disease = Disease.query.get(disease_id)
    if not disease:
        return jsonify({'success': False, 'message': 'Penyakit tidak ditemukan'}), 404

    symptom_ids = data.get('symptom_ids')
    if isinstance(symptom_ids, list) and symptom_ids:
        try:
            symptom_ids = list({int(sid) for sid in symptom_ids})
        except (ValueError, TypeError):
            return jsonify({'success': False, 'message': 'Gejala tidak valid'}), 400

        existing = Rule.query.filter_by(disease_id=disease_id).first()
        if existing:
            return jsonify({'success': False, 'message': 'Rule untuk penyakit ini sudah ada'}), 400

        symptoms = Symptom.query.filter(Symptom.id.in_(symptom_ids)).all()
        if len(symptoms) != len(symptom_ids):
            return jsonify({'success': False, 'message': 'Sebagian gejala tidak ditemukan'}), 404

        try:
            cf_value = float(data.get('cf_value', 1.0))
        except (ValueError, TypeError):
            return jsonify({'success': False, 'message': 'CF Value harus berupa angka'}), 400
        if not (0 <= cf_value <= 1):
            return jsonify({'success': False, 'message': 'CF Value harus antara 0 dan 1'}), 400

        try:
            min_match = int(data.get('min_symptom_match', len(symptom_ids)))
        except (ValueError, TypeError):
            return jsonify({'success': False, 'message': 'Min match harus berupa angka'}), 400
        if min_match < 1 or min_match > len(symptom_ids):
            return jsonify({'success': False, 'message': 'Min match tidak valid'}), 400

        start_num = _get_next_rule_number()
        rules = _build_rules_for_disease(
            disease_id=disease_id,
            symptoms=symptoms,
            cf_value=cf_value,
            min_match=min_match,
            is_active=data.get('is_active', True),
            start_num=start_num
        )
        for rule in rules:
            db.session.add(rule)

        log = AdminLog(
            admin_id=admin_id,
            action='create_rule',
            description=f"Menambahkan rule untuk penyakit {disease.name}",
            ip_address=request.remote_addr
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Rule berhasil ditambahkan',
            'data': {
                'disease_id': disease_id,
                'symptom_count': len(symptom_ids)
            }
        }), 201

    if not data.get('symptom_id'):
        return jsonify({'success': False, 'message': 'Gejala harus dipilih'}), 400

    try:
        symptom_id = int(data.get('symptom_id'))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Gejala tidak valid'}), 400

    symptom = Symptom.query.get(symptom_id)
    if not symptom:
        return jsonify({'success': False, 'message': 'Gejala tidak ditemukan'}), 404

    existing = Rule.query.filter_by(
        disease_id=disease_id,
        symptom_id=symptom_id
    ).first()
    if existing:
        return jsonify({'success': False, 'message': 'Rule untuk penyakit dan gejala ini sudah ada'}), 400

    try:
        cf_value = float(data.get('cf_value', 1.0))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'CF Value harus berupa angka'}), 400
    if not (0 <= cf_value <= 1):
        return jsonify({'success': False, 'message': 'CF Value harus antara 0 dan 1'}), 400

    mb = float(data.get('mb', 0.0))
    md = float(data.get('md', 0.0))
    if not (0 <= mb <= 1) or not (0 <= md <= 1):
        return jsonify({'success': False, 'message': 'Nilai MB dan MD harus antara 0 dan 1'}), 400
    try:
        min_match = int(data.get('min_symptom_match', 3))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Min match harus berupa angka'}), 400
    if min_match < 1:
        return jsonify({'success': False, 'message': 'Min match minimal 1'}), 400

    # Generate rule_code automatically
    next_num = _get_next_rule_number()
    rule_code = f'R{str(next_num).zfill(3)}'

    rule = Rule(
        rule_code=rule_code,
        disease_id=disease_id,
        symptom_id=symptom_id,
        symptom_ids=[symptom_id],
        confidence_level=cf_value,
        mb=mb,
        md=md,
        min_symptom_match=min_match,
        is_active=data.get('is_active', True)
    )

    db.session.add(rule)
    db.session.flush()
    Rule.query.filter_by(disease_id=disease_id).update({'min_symptom_match': min_match})

    log = AdminLog(
        admin_id=admin_id,
        action='create_rule',
        description=f"Menambahkan rule {rule_code} untuk penyakit {disease.name}",
        ip_address=request.remote_addr
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Rule berhasil ditambahkan',
        'data': {
            'id': rule.id,
            'rule_code': rule.rule_code
        }
    }), 201


@bp.route('/<int:rule_id>', methods=['PUT'])
def update_rule(rule_id):
    """Update rule"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    rule = Rule.query.get_or_404(rule_id)
    data = request.get_json() or {}
    admin_id = session.get('admin_id')

    if not data.get('disease_id'):
        return jsonify({'success': False, 'message': 'Penyakit harus dipilih'}), 400

    try:
        disease_id = int(data.get('disease_id'))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Penyakit tidak valid'}), 400

    disease = Disease.query.get(disease_id)
    if not disease:
        return jsonify({'success': False, 'message': 'Penyakit tidak ditemukan'}), 404

    symptom_ids = data.get('symptom_ids')
    if isinstance(symptom_ids, list):
        try:
            symptom_ids = list({int(sid) for sid in symptom_ids})
        except (ValueError, TypeError):
            return jsonify({'success': False, 'message': 'Gejala tidak valid'}), 400
        if not symptom_ids:
            return jsonify({'success': False, 'message': 'Pilih minimal satu gejala'}), 400

        symptoms = Symptom.query.filter(Symptom.id.in_(symptom_ids)).all()
        if len(symptoms) != len(symptom_ids):
            return jsonify({'success': False, 'message': 'Sebagian gejala tidak ditemukan'}), 404

        try:
            cf_value = float(data.get('cf_value', 1.0))
        except (ValueError, TypeError):
            return jsonify({'success': False, 'message': 'CF Value harus berupa angka'}), 400
        if not (0 <= cf_value <= 1):
            return jsonify({'success': False, 'message': 'CF Value harus antara 0 dan 1'}), 400

        try:
            min_match = int(data.get('min_symptom_match', len(symptom_ids)))
        except (ValueError, TypeError):
            return jsonify({'success': False, 'message': 'Min match harus berupa angka'}), 400
        if min_match < 1 or min_match > len(symptom_ids):
            return jsonify({'success': False, 'message': 'Min match tidak valid'}), 400

        old_disease = Disease.query.get(rule.disease_id)
        if disease_id != rule.disease_id:
            existing = Rule.query.filter(
                Rule.disease_id == disease_id,
                Rule.id != rule_id
            ).first()
            if existing:
                return jsonify({'success': False, 'message': 'Rule untuk penyakit ini sudah ada'}), 400

        Rule.query.filter_by(disease_id=rule.disease_id).delete(synchronize_session=False)

        start_num = _get_next_rule_number()
        rules = _build_rules_for_disease(
            disease_id=disease_id,
            symptoms=symptoms,
            cf_value=cf_value,
            min_match=min_match,
            is_active=data.get('is_active', True),
            start_num=start_num
        )
        for new_rule in rules:
            db.session.add(new_rule)

        log = AdminLog(
            admin_id=admin_id,
            action='update_rule',
            description=(
                f"Mengupdate rule penyakit {old_disease.name if old_disease else 'Unknown'} "
                f"ke {disease.name}"
            ),
            ip_address=request.remote_addr
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Rule berhasil diupdate'
        })

    if not data.get('symptom_id'):
        return jsonify({'success': False, 'message': 'Gejala harus dipilih'}), 400

    try:
        symptom_id = int(data.get('symptom_id'))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Gejala tidak valid'}), 400

    symptom = Symptom.query.get(symptom_id)
    if not symptom:
        return jsonify({'success': False, 'message': 'Gejala tidak ditemukan'}), 404

    existing = Rule.query.filter(
        Rule.disease_id == disease_id,
        Rule.symptom_id == symptom_id,
        Rule.id != rule_id
    ).first()
    if existing:
        return jsonify({'success': False, 'message': 'Rule untuk penyakit dan gejala ini sudah ada'}), 400

    try:
        cf_value = float(data.get('cf_value', rule.confidence_level or 1.0))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'CF Value harus berupa angka'}), 400
    if not (0 <= cf_value <= 1):
        return jsonify({'success': False, 'message': 'CF Value harus antara 0 dan 1'}), 400

    mb = float(data.get('mb', rule.mb))
    md = float(data.get('md', rule.md))
    if not (0 <= mb <= 1) or not (0 <= md <= 1):
        return jsonify({'success': False, 'message': 'Nilai MB dan MD harus antara 0 dan 1'}), 400
    try:
        min_match = int(data.get('min_symptom_match', rule.min_symptom_match or 3))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Min match harus berupa angka'}), 400
    if min_match < 1:
        return jsonify({'success': False, 'message': 'Min match minimal 1'}), 400

    old_disease = Disease.query.get(rule.disease_id)

    rule.disease_id = disease_id
    rule.symptom_id = symptom_id
    rule.symptom_ids = [symptom_id]
    rule.confidence_level = cf_value
    rule.mb = mb
    rule.md = md
    rule.min_symptom_match = min_match
    rule.is_active = data.get('is_active', rule.is_active)
    Rule.query.filter_by(disease_id=disease_id).update({'min_symptom_match': min_match})

    log = AdminLog(
        admin_id=admin_id,
        action='update_rule',
        description=(
            f"Mengupdate rule {rule.rule_code} dari "
            f"{old_disease.name if old_disease else 'Unknown'} ke {disease.name}"
        ),
        ip_address=request.remote_addr
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Rule berhasil diupdate'
    })


@bp.route('/<int:rule_id>', methods=['DELETE'])
def delete_rule(rule_id):
    """Delete rule"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    disease_id = request.args.get('disease_id', type=int)
    if disease_id:
        rules = Rule.query.filter_by(disease_id=disease_id).all()
        if not rules:
            return jsonify({'success': False, 'message': 'Rule tidak ditemukan'}), 404

        disease = Disease.query.get(disease_id)
        admin_id = session.get('admin_id')

        for item in rules:
            db.session.delete(item)

        log = AdminLog(
            admin_id=admin_id,
            action='delete_rule',
            description=f"Menghapus semua rule untuk penyakit {disease.name if disease else 'Unknown'}",
            ip_address=request.remote_addr
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Rule berhasil dihapus'
        })

    rule = Rule.query.get_or_404(rule_id)
    admin_id = session.get('admin_id')

    rule_code = rule.rule_code
    disease = Disease.query.get(rule.disease_id)

    db.session.delete(rule)

    log = AdminLog(
        admin_id=admin_id,
        action='delete_rule',
        description=f"Menghapus rule {rule_code} untuk penyakit {disease.name if disease else 'Unknown'}",
        ip_address=request.remote_addr
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Rule berhasil dihapus'
    })


@bp.route('/<int:rule_id>/toggle-status', methods=['PUT'])
def toggle_rule_status(rule_id):
    """Toggle rule active status"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    data = request.get_json(silent=True) or {}
    disease_id = data.get('disease_id')
    if disease_id is not None:
        try:
            disease_id = int(disease_id)
        except (ValueError, TypeError):
            return jsonify({'success': False, 'message': 'Penyakit tidak valid'}), 400

        rules = Rule.query.filter_by(disease_id=disease_id).all()
        if not rules:
            return jsonify({'success': False, 'message': 'Rule tidak ditemukan'}), 404

        admin_id = session.get('admin_id')
        all_active = all(r.is_active for r in rules)
        new_status = not all_active
        status_text = 'diaktifkan' if new_status else 'dinonaktifkan'

        for item in rules:
            item.is_active = new_status

        log = AdminLog(
            admin_id=admin_id,
            action='toggle_rule_status',
            description=f"Rule penyakit {disease_id} {status_text}",
            ip_address=request.remote_addr
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Rule berhasil {status_text}',
            'is_active': new_status
        })

    rule = Rule.query.get_or_404(rule_id)
    admin_id = session.get('admin_id')

    rule.is_active = not rule.is_active
    status_text = 'diaktifkan' if rule.is_active else 'dinonaktifkan'

    log = AdminLog(
        admin_id=admin_id,
        action='toggle_rule_status',
        description=f"Rule {rule.rule_code} {status_text}",
        ip_address=request.remote_addr
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Rule berhasil {status_text}',
        'is_active': rule.is_active
    })

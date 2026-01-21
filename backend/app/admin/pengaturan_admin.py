"""Admin - Pengaturan Admin (Admin User Management)"""
from flask import Blueprint, jsonify, request, render_template, session
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
from app import db
from app.models.user import User
from app.models.admin_log import AdminLog
from app.utils.decorators import admin_required
import re

bp = Blueprint('admin_management', __name__)

def validate_password(password):
    """Validate password requirements: min 8 chars, uppercase, lowercase, digit, no spaces"""
    if ' ' in password:
        return False, 'Password tidak boleh mengandung spasi'
    if len(password) < 8:
        return False, 'Password minimal 8 karakter'
    if not re.search(r'[A-Z]', password):
        return False, 'Password harus mengandung huruf besar'
    if not re.search(r'[a-z]', password):
        return False, 'Password harus mengandung huruf kecil'
    if not re.search(r'[0-9]', password):
        return False, 'Password harus mengandung angka'
    return True, 'Valid'

@bp.route('/', methods=['GET'])
def admin_settings_page():
    """Render admin settings page"""
    return render_template('admin/pengaturan.html')

@bp.route('/api/profile', methods=['GET'])
def get_current_admin_profile():
    """Get current admin profile"""
    admin_id = session.get('admin_id')
    if not admin_id:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    admin = User.query.filter_by(id=admin_id, role='admin').first()
    if not admin:
        return jsonify({'success': False, 'message': 'Admin not found'}), 404

    return jsonify({
        'success': True,
        'full_name': admin.full_name,
        'email': admin.email
    })

@bp.route('/api/profile', methods=['PUT'])
def update_admin_profile():
    """Update current admin profile"""
    admin_id = session.get('admin_id')
    if not admin_id:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    admin = User.query.filter_by(id=admin_id, role='admin').first()
    if not admin:
        return jsonify({'success': False, 'message': 'Admin not found'}), 404

    data = request.get_json()
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip()

    if not full_name:
        return jsonify({'success': False, 'message': 'Nama lengkap tidak boleh kosong'}), 400

    if not email:
        return jsonify({'success': False, 'message': 'Email tidak boleh kosong'}), 400

    # Validate email format
    import re
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_regex, email):
        return jsonify({'success': False, 'message': 'Format email tidak valid'}), 400

    # Check if email already exists (for other users)
    existing_user = User.query.filter(User.email == email, User.id != admin_id).first()
    if existing_user:
        return jsonify({'success': False, 'message': 'Email sudah digunakan oleh user lain'}), 400

    old_name = admin.full_name
    old_email = admin.email
    admin.full_name = full_name
    admin.email = email

    # Update session
    session['admin_name'] = full_name

    # Log activity
    changes = []
    if old_name != full_name:
        changes.append(f'name: {old_name} -> {full_name}')
    if old_email != email:
        changes.append(f'email: {old_email} -> {email}')

    log = AdminLog(
        admin_id=admin_id,
        action='UPDATE',
        table_name='admin',
        description=f'Update profile: {", ".join(changes)}' if changes else 'No changes',
        ip_address=request.remote_addr
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Profil berhasil diupdate',
        'data': {
            'full_name': admin.full_name,
            'email': admin.email
        }
    })

@bp.route('/api/change-password', methods=['PUT'])
def change_admin_password():
    """Change current admin password"""
    admin_id = session.get('admin_id')
    if not admin_id:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    admin = User.query.filter_by(id=admin_id, role='admin').first()
    if not admin:
        return jsonify({'success': False, 'message': 'Admin not found'}), 404

    data = request.get_json()
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')

    if not current_password or not new_password:
        return jsonify({'success': False, 'message': 'Password tidak boleh kosong'}), 400

    # Verify current password
    if not admin.check_password(current_password):
        return jsonify({'success': False, 'message': 'Password lama salah'}), 400

    # Validate new password requirements
    is_valid, message = validate_password(new_password)
    if not is_valid:
        return jsonify({'success': False, 'message': message}), 400

    # Update password
    admin.set_password(new_password)

    # Log activity
    log = AdminLog(
        admin_id=admin_id,
        action='UPDATE',
        table_name='admin',
        description=f'Changed password for {admin.email}',
        ip_address=request.remote_addr
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Password berhasil diubah'
    })

@bp.route('/list', methods=['GET'])
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

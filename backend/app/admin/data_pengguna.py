"""Admin - Data Pengguna (User Management)"""
from flask import Blueprint, jsonify, request, render_template, session, redirect, url_for
from datetime import datetime, timedelta
from app import db
from app.models.user import User
from app.models.history import DiagnosisHistory
from app.models.admin_log import AdminLog
from sqlalchemy import func, or_

bp = Blueprint('admin_users', __name__)


@bp.route('/', methods=['GET'])
def users_page():
    """Render users management page - session based"""
    # Check if admin is logged in
    if 'admin_id' not in session:
        return redirect(url_for('admin.admin_auth.login_page'))
    return render_template('admin/data_pengguna.html')


@bp.route('/list', methods=['GET'])
def get_all_users():
    """Get all users with pagination and filters - session based"""
    # Check if admin is logged in
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    search = request.args.get('search', '').strip()
    role = request.args.get('role', '').strip()
    is_active = request.args.get('is_active', '').strip()

    # Build query
    query = User.query

    # Apply search filter
    if search:
        query = query.filter(
            or_(
                User.email.ilike(f'%{search}%'),
                User.full_name.ilike(f'%{search}%')
            )
        )

    # Apply role filter
    if role:
        query = query.filter_by(role=role)

    # Apply status filter
    if is_active:
        is_active_bool = is_active.lower() == 'true'
        query = query.filter_by(is_active=is_active_bool)

    # Paginate
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
def get_user(user_id):
    """Get single user detail with diagnosis history count - session based"""
    # Check if admin is logged in
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    user = User.query.get_or_404(user_id)

    user_data = user.to_dict()
    # Count diagnosis history
    user_data['diagnosis_count'] = DiagnosisHistory.query.filter_by(user_id=user_id).count()

    return jsonify({'success': True, 'data': user_data})


@bp.route('/create', methods=['POST'])
def create_user():
    """Create new user - session based"""
    # Check if admin is logged in
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        data = request.get_json()

        # Validation
        if not data.get('email'):
            return jsonify({'success': False, 'message': 'Email harus diisi'}), 400

        if not data.get('password'):
            return jsonify({'success': False, 'message': 'Password harus diisi'}), 400

        # Check if email already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'success': False, 'message': 'Email sudah terdaftar'}), 400

        # Create new user
        new_user = User(
            email=data['email'],
            full_name=data.get('full_name', ''),
            role=data.get('role', 'user'),
            is_active=data.get('is_active', True)
        )
        new_user.set_password(data['password'])

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'User berhasil ditambahkan',
            'data': new_user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500


@bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user data - session based"""
    # Check if admin is logged in
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()

        # Update fields
        if 'full_name' in data:
            user.full_name = data['full_name']

        if 'email' in data and data['email'] != user.email:
            # Check if new email already exists
            existing = User.query.filter_by(email=data['email']).first()
            if existing and existing.id != user_id:
                return jsonify({'success': False, 'message': 'Email sudah digunakan'}), 400
            user.email = data['email']

        if 'role' in data:
            user.role = data['role']

        if 'is_active' in data:
            user.is_active = data['is_active']

        if 'password' in data and data['password']:
            user.set_password(data['password'])

        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'User berhasil diupdate',
            'data': user.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@bp.route('/<int:user_id>/toggle-status', methods=['PUT'])
def toggle_user_status(user_id):
    """Toggle user active status - session based"""
    # Check if admin is logged in
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    admin_id = session.get('admin_id')
    user = User.query.get_or_404(user_id)

    # Prevent admin from disabling their own account
    if user.id == admin_id:
        return jsonify({
            'success': False,
            'message': 'Tidak dapat menonaktifkan akun sendiri'
        }), 400

    # Toggle status
    user.is_active = not user.is_active
    user.updated_at = datetime.utcnow()

    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f"User berhasil {'diaktifkan' if user.is_active else 'dinonaktifkan'}",
            'data': user.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500


@bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete user - session based"""
    # Check if admin is logged in
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    admin_id = session.get('admin_id')
    user = User.query.get_or_404(user_id)

    # Prevent admin from deleting their own account
    if user.id == admin_id:
        return jsonify({
            'success': False,
            'message': 'Tidak dapat menghapus akun sendiri'
        }), 400

    try:
        # Store user info for logging
        user_email = user.email
        user_name = user.full_name or user.email

        # Delete associated diagnosis history
        DiagnosisHistory.query.filter_by(user_id=user_id).delete()

        # Delete the user
        db.session.delete(user)

        # Log the activity
        log = AdminLog(
            admin_id=admin_id,
            action='DELETE',
            table_name='users',
            description=f'Menghapus user: {user_name} ({user_email})',
            ip_address=request.remote_addr
        )
        db.session.add(log)

        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'User {user_name} berhasil dihapus'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500


@bp.route('/stats', methods=['GET'])
def get_user_stats():
    """Get user statistics - session based"""
    # Check if admin is logged in
    if 'admin_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    admin_users = User.query.filter_by(role='admin').count()
    google_users = User.query.filter(User.google_id.isnot(None)).count()

    # New users in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_users = User.query.filter(User.created_at >= thirty_days_ago).count()

    # Users with diagnosis
    users_with_diagnosis = db.session.query(func.count(func.distinct(DiagnosisHistory.user_id))).scalar()

    return jsonify({
        'success': True,
        'data': {
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': total_users - active_users,
            'admin_users': admin_users,
            'regular_users': total_users - admin_users,
            'google_users': google_users,
            'new_users_30days': new_users,
            'users_with_diagnosis': users_with_diagnosis or 0
        }
    })

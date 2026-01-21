"""Admin Authentication"""
from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from flask_jwt_extended import jwt_required
from app import db
from app.models.user import User
from app.models.admin_log import AdminLog
from app.utils.decorators import admin_required
from functools import wraps
import re

bp = Blueprint('admin_auth', __name__)

def login_required(f):
    """Decorator to check if admin is logged in via session"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_id' not in session:
            flash('Silakan login terlebih dahulu', 'warning')
            return redirect(url_for('admin.admin_auth.login_page'))
        return f(*args, **kwargs)
    return decorated_function

@bp.route('/login', methods=['GET'])
def login_page():
    """Render admin login page"""
    # If already logged in, redirect to dashboard
    if 'admin_id' in session:
        return redirect(url_for('admin.admin_dashboard.dashboard_page'))
    return render_template('auth/login.html')

@bp.route('/login', methods=['POST'])
def admin_login():
    """Handle admin login form submission"""
    email = request.form.get('email', '').strip()
    password = request.form.get('password', '')

    if not email or not password:
        flash('Email dan password harus diisi', 'danger')
        return redirect(url_for('admin.admin_auth.login_page'))

    # Validate email format
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_regex, email):
        flash('Format email tidak valid', 'danger')
        return redirect(url_for('admin.admin_auth.login_page'))

    # Validate password requirements
    if not validate_password(password):
        flash('Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka, tanpa spasi', 'danger')
        return redirect(url_for('admin.admin_auth.login_page'))

    # Check if login request is from admin path (backend only)
    referer = request.headers.get('Referer', '')
    if '/admin/login' not in referer and referer != '':
        flash('Login admin hanya dapat dilakukan dari halaman admin', 'danger')
        return redirect(url_for('admin.admin_auth.login_page'))

    # Find user
    user = User.query.filter_by(email=email).first()

    # Validate credentials and role
    if not user or not user.check_password(password):
        flash('Email atau password salah', 'danger')
        return redirect(url_for('admin.admin_auth.login_page'))

    if user.role != 'admin':
        flash('Akses ditolak. Hanya admin yang dapat login dari halaman ini', 'danger')
        return redirect(url_for('admin.admin_auth.login_page'))

    if not user.is_active:
        flash('Akun Anda tidak aktif', 'danger')
        return redirect(url_for('admin.admin_auth.login_page'))

    # Login success - create session (NOT permanent - expires when browser closes)
    from datetime import datetime
    session.clear()  # Clear any existing session data
    session['admin_id'] = user.id
    session['admin_email'] = user.email
    session['admin_name'] = user.full_name or user.email
    session['last_activity'] = datetime.utcnow().isoformat()  # Set initial activity timestamp
    session.permanent = False  # Session expires when browser closes
    session.modified = True  # Mark session as modified

    # Update last login
    user.last_login = datetime.utcnow()

    # Log admin login
    log = AdminLog(
        admin_id=user.id,
        action='LOGIN',
        table_name='admin',
        description=f'Admin login: {user.email}',
        ip_address=request.remote_addr
    )
    db.session.add(log)
    db.session.commit()

    flash(f'Selamat datang, {user.full_name or user.email}!', 'success')
    return redirect(url_for('admin.admin_dashboard.dashboard_page'))

def validate_password(password):
    """Validate password requirements"""
    # No spaces
    if ' ' in password:
        return False
    # Minimum 8 characters
    if len(password) < 8:
        return False
    # Has uppercase
    if not re.search(r'[A-Z]', password):
        return False
    # Has lowercase
    if not re.search(r'[a-z]', password):
        return False
    # Has digit
    if not re.search(r'[0-9]', password):
        return False
    return True

@bp.route('/logout')
def logout():
    """Logout admin"""
    session.clear()
    flash('Anda telah logout', 'info')
    return redirect(url_for('admin.admin_auth.login_page'))

@bp.route('/check', methods=['GET'])
@jwt_required()
@admin_required
def check_admin():
    return {'success': True, 'message': 'Admin access granted'}

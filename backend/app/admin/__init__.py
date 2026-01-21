"""
Admin Panel Package
11 Admin Menu Modules
"""

from flask import Blueprint, redirect, url_for

# Create main admin blueprint
admin_bp = Blueprint('admin', __name__)

# Import all admin modules
from app.admin import (
    auth,
    dashboard,
    kelola_penyakit,
    kelola_gejala,
    kelola_rule,
    data_pengguna,
    riwayat_diagnosis,
    laporan,
    pengaturan_sistem,
    logs,
    pengaturan_admin
)

# Register sub-blueprints
admin_bp.register_blueprint(auth.bp)  # No prefix, routes akan langsung di /admin/login, /admin/logout
admin_bp.register_blueprint(dashboard.bp, url_prefix='/dashboard')
admin_bp.register_blueprint(kelola_penyakit.bp, url_prefix='/penyakit')
admin_bp.register_blueprint(kelola_gejala.bp, url_prefix='/gejala')
admin_bp.register_blueprint(kelola_rule.bp, url_prefix='/rule')
admin_bp.register_blueprint(data_pengguna.bp, url_prefix='/pengguna')
admin_bp.register_blueprint(riwayat_diagnosis.bp, url_prefix='/riwayat')
admin_bp.register_blueprint(laporan.bp, url_prefix='/laporan')
admin_bp.register_blueprint(pengaturan_sistem.bp, url_prefix='/pengaturan-sistem')
admin_bp.register_blueprint(logs.bp, url_prefix='/logs')
admin_bp.register_blueprint(pengaturan_admin.bp, url_prefix='/pengaturan')

# Root admin route - redirect to login
@admin_bp.route('/')
def index():
    """Redirect /admin to /admin/login"""
    from flask import session
    if 'admin_id' in session:
        return redirect(url_for('admin.admin_dashboard.dashboard_page'))
    return redirect(url_for('admin.admin_auth.login_page'))

# API Routes for admin (accessible from frontend)
@admin_bp.route('/api/logs', methods=['GET'])
def get_logs_api():
    """Proxy to logs API"""
    from app.admin.logs import get_logs_api as logs_api
    return logs_api()

@admin_bp.route('/api/logs/export', methods=['POST'])
def export_logs_api():
    """Proxy to logs export API"""
    from app.admin.logs import export_logs
    return export_logs()

@admin_bp.route('/api/profile', methods=['GET'])
def get_profile_api():
    """Proxy to profile API"""
    from app.admin.pengaturan_admin import get_current_admin_profile
    return get_current_admin_profile()

@admin_bp.route('/api/profile', methods=['PUT'])
def update_profile_api():
    """Proxy to profile update API"""
    from app.admin.pengaturan_admin import update_admin_profile
    return update_admin_profile()

@admin_bp.route('/api/change-password', methods=['PUT'])
def change_password_api():
    """Proxy to change password API"""
    from app.admin.pengaturan_admin import change_admin_password
    return change_admin_password()

__all__ = ['admin_bp']

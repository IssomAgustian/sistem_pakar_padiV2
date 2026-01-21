"""
Maintenance Mode Middleware
Checks if system is in maintenance mode and returns appropriate response
"""
from flask import jsonify, request, render_template
from functools import wraps


def maintenance_check(f):
    """
    Decorator to check if system is in maintenance mode
    Applies to all API endpoints except admin and health check
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Skip maintenance check for admin routes and health check
        if request.path.startswith('/admin') or request.path == '/health':
            return f(*args, **kwargs)

        # Import here to avoid circular imports
        from app.models.system_settings import SystemSettings

        # Get maintenance mode setting
        maintenance_setting = SystemSettings.query.filter_by(setting_key='maintenance_mode').first()

        if maintenance_setting and maintenance_setting.setting_value.lower() == 'true':
            # Get maintenance message
            message_setting = SystemSettings.query.filter_by(setting_key='maintenance_message').first()
            maintenance_message = message_setting.setting_value if message_setting else 'Sistem sedang dalam pemeliharaan. Silakan coba lagi nanti.'

            # Return JSON for API requests
            if request.path.startswith('/api'):
                return jsonify({
                    'success': False,
                    'message': maintenance_message,
                    'maintenance_mode': True
                }), 503

            # Return HTML for web requests
            return render_template('maintenance.html', message=maintenance_message), 503

        return f(*args, **kwargs)

    return decorated_function


def is_maintenance_mode():
    """
    Check if system is currently in maintenance mode
    Returns: bool
    """
    from app.models.system_settings import SystemSettings

    maintenance_setting = SystemSettings.query.filter_by(setting_key='maintenance_mode').first()
    return maintenance_setting and maintenance_setting.setting_value.lower() == 'true'


def get_maintenance_message():
    """
    Get the current maintenance message
    Returns: str
    """
    from app.models.system_settings import SystemSettings

    message_setting = SystemSettings.query.filter_by(setting_key='maintenance_message').first()
    return message_setting.setting_value if message_setting else 'Sistem sedang dalam pemeliharaan.'

"""
Flask Application Factory
Sistem Pakar Diagnosis Penyakit Tanaman Padi
"""

from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.config import config

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(config_name='development'):
    """Create Flask application"""
    import os

    # Get the base directory (backend folder, one level up from app)
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    template_dir = os.path.join(base_dir, 'templates')
    static_dir = os.path.join(base_dir, 'static')

    app = Flask(__name__,
                template_folder=template_dir,
                static_folder=static_dir)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Configure CORS - allow multiple frontend URLs
    allowed_origins = [
        app.config['FRONTEND_URL'],
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
    ]

    CORS(app,
         resources={r"/api/*": {
             "origins": allowed_origins,
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "expose_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True,
             "max_age": 3600
         }},
         supports_credentials=True)

    # Import models here to avoid circular imports
    with app.app_context():
        from app.models import user, disease, symptom, rule, history, admin_log, system_settings

    # Register middleware
    from app.middleware.maintenance import is_maintenance_mode, get_maintenance_message

    @app.before_request
    def check_maintenance():
        """Check maintenance mode before each request"""
        from flask import request, jsonify, render_template

        # Skip maintenance check for admin routes, health check, and static files
        if (request.path.startswith('/admin') or
            request.path == '/health' or
            request.path.startswith('/static')):
            return None

        if is_maintenance_mode():
            maintenance_message = get_maintenance_message()

            # Return JSON for API requests
            if request.path.startswith('/api'):
                return jsonify({
                    'success': False,
                    'message': maintenance_message,
                    'maintenance_mode': True
                }), 503

            # Return HTML for web requests
            return render_template('maintenance.html', message=maintenance_message), 503

        return None

    @app.before_request
    def check_admin_session():
        """Check admin session validity with timeout"""
        from flask import request, session, redirect, url_for, flash
        from datetime import datetime, timedelta

        # Only check for admin routes (except login and static)
        if not request.path.startswith('/admin'):
            return None

        # Skip check for login page and static files
        if (request.path in ['/admin/login', '/admin/'] or
            request.path.startswith('/admin/login') or
            request.path.startswith('/static')):
            return None

        # Check if admin session exists
        if 'admin_id' not in session:
            flash('Sesi Anda telah berakhir. Silakan login kembali.', 'warning')
            return redirect(url_for('admin.admin_auth.login_page'))

        # Check session timeout (30 minutes of inactivity)
        if 'last_activity' in session:
            last_activity = datetime.fromisoformat(session['last_activity'])
            if datetime.utcnow() - last_activity > timedelta(minutes=30):
                session.clear()
                flash('Sesi Anda telah berakhir karena tidak aktif selama 30 menit. Silakan login kembali.', 'warning')
                return redirect(url_for('admin.admin_auth.login_page'))

        # Update last activity time
        session['last_activity'] = datetime.utcnow().isoformat()
        session.modified = True

        return None

    # Register blueprints
    from app.routes import api_bp
    from app.admin import admin_bp

    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/admin')

    # Root route - redirect to admin login
    @app.route('/')
    def index():
        from flask import redirect
        return redirect('/admin/login')

    # Health check
    @app.route('/health')
    def health():
        return {'status': 'ok', 'message': 'Sistem Pakar Padi API is running'}

    return app

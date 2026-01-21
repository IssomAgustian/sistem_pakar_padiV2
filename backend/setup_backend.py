#!/usr/bin/env python3
"""
Script to setup minimal backend files
"""

import os

# Create app/__init__.py
app_init = '''"""
Flask Application Factory
Sistem Pakar Diagnosis Penyakit Tanaman Padi
"""

from flask import Flask
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
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Configure CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config['FRONTEND_URL'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Import models here to avoid circular imports
    with app.app_context():
        from app.models import user, disease, symptom, rule, history

    # Register blueprints
    from app.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    # Health check
    @app.route('/')
    @app.route('/health')
    def health():
        return {'status': 'ok', 'message': 'Sistem Pakar Padi API is running'}

    return app
'''

# Create routes/__init__.py
routes_init = '''"""
API Routes
"""

from flask import Blueprint

api_bp = Blueprint('api', __name__)

from app.routes import health, symptoms

__all__ = ['api_bp']
'''

# Create routes/health.py
routes_health = '''"""
Health Check Routes
"""

from flask import jsonify
from app.routes import api_bp


@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'API is running'
    })
'''

# Create routes/symptoms.py
routes_symptoms = '''"""
Symptom Routes
"""

from flask import jsonify
from app.routes import api_bp
from app import db
from app.models.symptom import Symptom


@api_bp.route('/symptoms', methods=['GET'])
def get_symptoms():
    """Get all symptoms"""
    try:
        symptoms = Symptom.query.order_by(Symptom.code).all()
        return jsonify({
            'success': True,
            'data': [s.to_dict() for s in symptoms]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
'''

# Write files
files = {
    'app/__init__.py': app_init,
    'app/routes/__init__.py': routes_init,
    'app/routes/health.py': routes_health,
    'app/routes/symptoms.py': routes_symptoms
}

for filepath, content in files.items():
    fullpath = os.path.join(os.path.dirname(__file__), filepath)
    with open(fullpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Created: {filepath}')

print('\\nBackend setup complete!')
print('\\nNext steps:')
print('1. cd backend')
print('2. python -m venv venv')
print('3. venv\\Scripts\\activate')
print('4. pip install -r requirements.txt')
print('5. flask db init')
print('6. flask db migrate -m "Initial migration"')
print('7. flask db upgrade')
print('8. python seed_data.py')
print('9. python run.py')

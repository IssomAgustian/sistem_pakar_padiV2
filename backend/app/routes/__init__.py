"""
API Routes
All route blueprints are registered here
"""

from flask import Blueprint

# Create main API blueprint
api_bp = Blueprint('api', __name__)

# Import all route modules
from app.routes import auth_routes, diagnosis_routes, history_routes, disease_routes, user_routes, symptoms, health

# Register sub-blueprints
api_bp.register_blueprint(auth_routes.bp, url_prefix='/auth')
api_bp.register_blueprint(diagnosis_routes.bp, url_prefix='/diagnosis')
api_bp.register_blueprint(history_routes.bp, url_prefix='/history')
api_bp.register_blueprint(disease_routes.bp, url_prefix='/diseases')
api_bp.register_blueprint(user_routes.bp, url_prefix='/users')

__all__ = ['api_bp']

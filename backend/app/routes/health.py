"""
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

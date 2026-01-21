"""
Custom Decorators
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import User


def admin_required(fn):
    """Decorator to require admin role"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403

        return fn(*args, **kwargs)

    return wrapper


def user_required(fn):
    """Decorator to require authenticated user"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401

        return fn(*args, **kwargs)

    return wrapper

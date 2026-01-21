'''User Routes'''
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models.user import User
from app.utils.decorators import admin_required

bp = Blueprint('users', __name__)

@bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({'success': True, 'data': [u.to_dict() for u in users]})

@bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({'success': True, 'data': user.to_dict()})

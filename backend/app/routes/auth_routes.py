'''Authentication Routes'''
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.auth_service import AuthService

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email dan password harus diisi'}), 400

    user, result = AuthService.register_user(email, password, full_name)

    if not user:
        return jsonify({'success': False, 'message': result}), 400

    return jsonify({'success': True, 'message': 'Registrasi berhasil', 'data': {'user': user.to_dict(), 'token': result}})

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email dan password harus diisi'}), 400

    user, result = AuthService.login_user(email, password)

    if not user:
        return jsonify({'success': False, 'message': result}), 401

    return jsonify({'success': True, 'message': 'Login berhasil', 'data': {'user': user.to_dict(), 'token': result}})

@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = AuthService.get_user_by_id(user_id)

    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    return jsonify({'success': True, 'data': user.to_dict()})

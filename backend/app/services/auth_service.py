"""
Auth Service
Sistem Pakar Diagnosis Penyakit Tanaman Padi
"""

from datetime import datetime
from flask_jwt_extended import create_access_token, create_refresh_token
from app import db
from app.models.user import User
import re


class AuthService:
    """Authentication and Authorization Service"""

    @staticmethod
    def validate_password(password):
        """Validate password requirements: 8-20 chars, uppercase, lowercase, digit, no spaces"""
        if ' ' in password:
            return False, 'Password tidak boleh mengandung spasi'
        if len(password) < 8:
            return False, 'Password minimal 8 karakter'
        if len(password) > 20:
            return False, 'Password maksimal 20 karakter'
        if not re.search(r'[A-Z]', password):
            return False, 'Password harus mengandung huruf besar'
        if not re.search(r'[a-z]', password):
            return False, 'Password harus mengandung huruf kecil'
        if not re.search(r'[0-9]', password):
            return False, 'Password harus mengandung angka'
        return True, 'Valid'

    @staticmethod
    def register_user(email, password, full_name=None):
        """
        Register new user

        Args:
            email: User email
            password: Plain password
            full_name: User's full name

        Returns:
            tuple: (user, token) or (None, error_message)
        """
        # Validate email format - only @gmail.com allowed
        email_regex = r'^[a-zA-Z0-9._%+-]+@gmail\.com$'
        if not re.match(email_regex, email.lower()):
            return None, 'Hanya email @gmail.com yang diperbolehkan'

        # Validate password requirements
        is_valid, message = AuthService.validate_password(password)
        if not is_valid:
            return None, message

        # Check if email already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return None, 'Email sudah terdaftar'

        # Create new user
        user = User(
            email=email,
            full_name=full_name,
            role='user',
            is_active=True
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        # Generate token with string identity
        access_token = create_access_token(identity=str(user.id))

        return user, access_token

    @staticmethod
    def login_user(email, password):
        """
        Login user (NOT for admin - admin uses separate backend login)

        Args:
            email: User email
            password: Plain password

        Returns:
            tuple: (user, token) or (None, error_message)
        """
        user = User.query.filter_by(email=email).first()

        if not user:
            return None, 'Email atau password salah'

        if not user.check_password(password):
            return None, 'Email atau password salah'

        # Block admin from logging in via user/frontend route
        if user.role == 'admin':
            return None, 'Akun admin hanya dapat login melalui halaman admin'

        if not user.is_active:
            return None, 'Akun tidak aktif'

        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()

        # Generate token with string identity
        access_token = create_access_token(identity=str(user.id))

        return user, access_token

    @staticmethod
    def google_auth(google_id, email, full_name):
        """
        Authenticate with Google OAuth

        Args:
            google_id: Google user ID
            email: Google email
            full_name: User's full name

        Returns:
            tuple: (user, token)
        """
        # Check if user exists with this google_id
        user = User.query.filter_by(google_id=google_id).first()

        if not user:
            # Check if user exists with this email
            user = User.query.filter_by(email=email).first()

            if user:
                # Link Google account to existing user
                user.google_id = google_id
                user.full_name = full_name or user.full_name
            else:
                # Create new user
                user = User(
                    email=email,
                    google_id=google_id,
                    full_name=full_name,
                    role='user',
                    is_active=True
                )
                db.session.add(user)

        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()

        # Generate token with string identity
        access_token = create_access_token(identity=str(user.id))

        return user, access_token

    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID"""
        # Convert string ID to integer for database query
        try:
            user_id_int = int(user_id)
            return User.query.get(user_id_int)
        except (ValueError, TypeError):
            return None

    @staticmethod
    def is_admin(user):
        """Check if user is admin"""
        return user and user.role == 'admin'

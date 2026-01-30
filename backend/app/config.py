"""
Configuration
Sistem Pakar Diagnosis Penyakit Tanaman Padi
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration"""

    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    FLASK_APP = os.getenv('FLASK_APP', 'run.py')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')

    # Session - Non-permanent session expires when browser closes
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
    SESSION_COOKIE_NAME = 'admin_session'
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=30)  # Only applies if session.permanent = True

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'sqlite:///pakar_padi.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False

    # JWT - Token persists until user logout (365 days expiry for practical purposes)
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=365)  # Persistent session until logout
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=365)

    # CORS
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '')

    # AI Configuration
    AI_PROVIDER = os.getenv('AI_PROVIDER', 'openai')  # 'openai' or 'gemini'
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

    # Google OAuth
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')

    # File Upload
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '../static/uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

    # System Settings
    HISTORY_RETENTION_DAYS = int(os.getenv('HISTORY_RETENTION_DAYS', 30))
    MAX_DIAGNOSES_PER_DAY = int(os.getenv('MAX_DIAGNOSES_PER_DAY', 20))


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_ECHO = True


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_ECHO = False
    SESSION_COOKIE_SECURE = True


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

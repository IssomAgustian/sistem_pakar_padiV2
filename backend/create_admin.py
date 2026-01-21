#!/usr/bin/env python3
"""
Create Admin User
Script untuk membuat user admin default
"""

from app import create_app, db
from app.models.user import User

def create_admin():
    """Create default admin user"""
    app = create_app()

    with app.app_context():
        # Check if admin already exists
        admin = User.query.filter_by(email='admin@pakar-padi.com').first()

        if admin:
            print(f"Admin sudah ada: {admin.email}")
            print(f"Untuk login gunakan:")
            print(f"  Email: admin@pakar-padi.com")
            print(f"  Password: admin123")
            return

        # Create admin user
        admin = User(
            email='admin@pakar-padi.com',
            full_name='Administrator',
            role='admin',
            is_active=True
        )
        admin.set_password('admin123')

        db.session.add(admin)
        db.session.commit()

        print("✅ Admin user berhasil dibuat!")
        print(f"Email: admin@pakar-padi.com")
        print(f"Password: admin123")
        print(f"\nSilakan login di: http://127.0.0.1:5001/admin/login")

if __name__ == '__main__':
    create_admin()

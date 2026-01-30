#!/usr/bin/env python3
"""
Create Admin User
Script untuk membuat user admin
"""

import os
from app import create_app, db
from app.models.user import User


def create_admin():
    """Create admin user"""
    app = create_app()

    with app.app_context():
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@pakar-padi.com')
        admin_password = os.getenv('ADMIN_PASSWORD')

        admin = User.query.filter_by(email=admin_email).first()

        if admin:
            print(f"Admin sudah ada: {admin.email}")
            return

        if not admin_password:
            raise RuntimeError("ADMIN_PASSWORD belum diset. Set dulu di environment.")

        admin = User(
            email=admin_email,
            full_name='Administrator',
            role='admin',
            is_active=True
        )
        admin.set_password(admin_password)

        db.session.add(admin)
        db.session.commit()

        print("Admin user berhasil dibuat!")
        print(f"Email: {admin_email}")
        print("\nSilakan login di: http://127.0.0.1:5001/admin/login")


if __name__ == '__main__':
    create_admin()

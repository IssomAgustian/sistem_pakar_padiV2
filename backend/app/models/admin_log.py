"""
Admin Log Model
Sistem Pakar Diagnosis Penyakit Tanaman Padi
"""

from datetime import datetime
from app import db


class AdminLog(db.Model):
    """Admin Log model - Track admin activities"""

    __tablename__ = 'admin_logs'

    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.String(50))  # 'CREATE', 'UPDATE', 'DELETE'
    description = db.Column(db.Text)  # Description of action
    table_name = db.Column(db.String(50))  # 'diseases', 'symptoms', etc
    record_id = db.Column(db.Integer)
    ip_address = db.Column(db.String(45))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'admin_id': self.admin_id,
            'action': self.action,
            'description': self.description,
            'table_name': self.table_name,
            'record_id': self.record_id,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<AdminLog {self.action} on {self.table_name}>'

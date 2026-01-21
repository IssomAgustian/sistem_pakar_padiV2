"""
Disease Model
Sistem Pakar Diagnosis Penyakit Tanaman Padi
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from app import db


class Disease(db.Model):
    """Disease model - Penyakit tanaman padi"""

    __tablename__ = 'diseases'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(10), unique=True, nullable=False, index=True)  # P01, P02, etc
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    rules = db.relationship('Rule', back_populates='disease', lazy='dynamic', cascade='all, delete-orphan')
    diagnosis_history = db.relationship('DiagnosisHistory', back_populates='disease', lazy='dynamic')

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Disease {self.code}: {self.name}>'

"""
Rule Model
Sistem Pakar Diagnosis Penyakit Tanaman Padi
"""

from datetime import datetime
from sqlalchemy import PickleType
from app import db


class Rule(db.Model):
    """Rule model - Disease/Symptom relation with MB/MD values"""

    __tablename__ = 'rules'

    id = db.Column(db.Integer, primary_key=True)
    rule_code = db.Column(db.String(20), unique=True, nullable=False)  # R001, R002, etc
    disease_id = db.Column(db.Integer, db.ForeignKey('diseases.id', ondelete='CASCADE'), nullable=False)
    # Legacy column kept for DB compatibility (stores list of symptom IDs)
    symptom_ids = db.Column(PickleType)
    symptom_id = db.Column(db.Integer, db.ForeignKey('symptoms.id', ondelete='CASCADE'), nullable=False)
    confidence_level = db.Column(db.Numeric(3, 2))  # UI CF value scale
    mb = db.Column(db.Numeric(3, 2), nullable=False)  # Measure of Belief
    md = db.Column(db.Numeric(3, 2), nullable=False)  # Measure of Disbelief
    min_symptom_match = db.Column(db.Integer)  # Minimum matched symptoms for AI generation
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    disease = db.relationship('Disease', back_populates='rules')
    symptom = db.relationship('Symptom', back_populates='rules')

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'rule_code': self.rule_code,
            'disease_id': self.disease_id,
            'disease_name': self.disease.name if self.disease else None,
            'disease_code': self.disease.code if self.disease else None,
            'symptom_id': self.symptom_id,
            'symptom_code': self.symptom.code if self.symptom else None,
            'symptom_name': self.symptom.name if self.symptom else None,
            'confidence_level': float(self.confidence_level) if self.confidence_level is not None else None,
            'mb': float(self.mb) if self.mb is not None else 0.0,
            'md': float(self.md) if self.md is not None else 0.0,
            'min_symptom_match': self.min_symptom_match,
            'is_active': self.is_active
        }

    def __repr__(self):
        return f'<Rule {self.rule_code}>'

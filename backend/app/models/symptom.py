"""
Symptom Model
Sistem Pakar Diagnosis Penyakit Tanaman Padi
"""

from datetime import datetime
from app import db


class Symptom(db.Model):
    """Symptom model - Gejala penyakit dengan MB/MD values"""

    __tablename__ = 'symptoms'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(10), unique=True, nullable=False, index=True)  # G01, G02, etc
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), index=True)  # daun, batang, akar, bulir, malai, pertumbuhan
    description = db.Column(db.Text)
    mb_value = db.Column(db.Numeric(3, 2), default=0.50)  # Measure of Belief
    md_value = db.Column(db.Numeric(3, 2), default=0.50)  # Measure of Disbelief
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    rules = db.relationship('Rule', back_populates='symptom', lazy='dynamic')

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'mb_value': float(self.mb_value) if self.mb_value else 0.5,
            'md_value': float(self.md_value) if self.md_value else 0.5
        }

    def get_cf_base(self):
        """Get CF base (MB - MD)"""
        return float(self.mb_value - self.md_value)

    def __repr__(self):
        return f'<Symptom {self.code}: {self.name}>'

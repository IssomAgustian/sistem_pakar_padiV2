"""
Diagnosis History Model
Sistem Pakar Diagnosis Penyakit Tanaman Padi
"""

from datetime import datetime, timedelta
from sqlalchemy import PickleType
from app import db


class DiagnosisHistory(db.Model):
    """Diagnosis History model - Menyimpan hasil diagnosis dan AI solution"""

    __tablename__ = 'diagnosis_history'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    disease_id = db.Column(db.Integer, db.ForeignKey('diseases.id'))

    # Gejala yang dipilih user
    selected_symptoms = db.Column(PickleType)  # List [1,2,7] - SQLite compatible

    # Certainty Factor data
    cf_values = db.Column(PickleType)  # {'1': 1.0, '2': 0.8, '7': 0.4} - SQLite compatible
    final_cf_value = db.Column(db.Numeric(5, 4))  # 0.9440
    certainty_level = db.Column(db.String(30))  # 'Pasti', 'Hampir Pasti', etc

    # Forward Chaining result
    matched_rule_id = db.Column(db.Integer, db.ForeignKey('rules.id'))
    forward_chaining_result = db.Column(PickleType)  # SQLite compatible

    # Diagnosis results (parallel CF output)
    diagnosis_results = db.Column(PickleType)  # List of results per disease

    # AI Generated Solution (PENTING!)
    ai_solution = db.Column(db.Text)  # Raw text from AI
    ai_solution_json = db.Column(PickleType)  # Structured JSON - SQLite compatible

    # Metadata
    diagnosis_method = db.Column(db.String(20))  # 'forward_chaining' atau 'certainty_factor'
    diagnosis_date = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    expires_at = db.Column(db.DateTime, index=True)  # Auto-delete after 30 days (user view)
    is_saved = db.Column(db.Boolean, default=True)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)

    # Relationships
    user = db.relationship('User', back_populates='diagnosis_history')
    disease = db.relationship('Disease', back_populates='diagnosis_history')

    def __init__(self, **kwargs):
        super(DiagnosisHistory, self).__init__(**kwargs)
        # Set expiration (30 days from now)
        if not self.expires_at:
            self.expires_at = datetime.utcnow() + timedelta(days=30)

    def to_dict(self, include_solution=True):
        """Convert to dictionary"""
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'disease': self.disease.to_dict() if self.disease else None,
            'selected_symptoms': self.selected_symptoms,
            'final_cf_value': float(self.final_cf_value) if self.final_cf_value else None,
            'certainty_level': self.certainty_level,
            'diagnosis_method': self.diagnosis_method,
            'diagnosis_date': self.diagnosis_date.isoformat() if self.diagnosis_date else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'diagnosis_results': self.diagnosis_results
        }

        if include_solution:
            result['ai_solution'] = self.ai_solution
            result['ai_solution_json'] = self.ai_solution_json

        return result

    def is_expired(self):
        """Check if diagnosis has expired"""
        return datetime.utcnow() > self.expires_at if self.expires_at else False

    def __repr__(self):
        return f'<DiagnosisHistory {self.id}: {self.disease.name if self.disease else "Unknown"}>'

#!/usr/bin/env python3
"""
Run Flask Application
Sistem Pakar Diagnosis Penyakit Tanaman Padi
"""

from app import create_app, db
from app.models.user import User
from app.models.disease import Disease
from app.models.symptom import Symptom
from app.models.rule import Rule
from app.models.history import DiagnosisHistory
from app.models.admin_log import AdminLog
from app.models.system_settings import SystemSettings

# Create Flask app instance
app = create_app()

# Shell context for Flask CLI
@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'User': User,
        'Disease': Disease,
        'Symptom': Symptom,
        'Rule': Rule,
        'DiagnosisHistory': DiagnosisHistory,
        'AdminLog': AdminLog,
        'SystemSettings': SystemSettings
    }

if __name__ == '__main__':
    # Port 5000 might be blocked by Windows, using 5001 instead
    app.run(debug=True, host='0.0.0.0', port=5001)

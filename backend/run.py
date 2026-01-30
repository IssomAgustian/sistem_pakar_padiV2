#!/usr/bin/env python3
"""
Run Flask Application
Sistem Pakar Diagnosis Penyakit Tanaman Padi
"""

import os
from app import create_app, db
from app.models.user import User
from app.models.disease import Disease
from app.models.symptom import Symptom
from app.models.rule import Rule
from app.models.history import DiagnosisHistory
from app.models.admin_log import AdminLog
from app.models.system_settings import SystemSettings

# Create Flask app instance
config_name = os.getenv('FLASK_ENV', 'development')
app = create_app(config_name)

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
    port = int(os.getenv('PORT', 5001))
    app.run(debug=app.config.get('DEBUG', False), host='0.0.0.0', port=port)

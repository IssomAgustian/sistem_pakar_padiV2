#!/usr/bin/env python3
"""
Script to fix all model imports
Add "from app import db" to all model files
"""

import os
import re

models_dir = 'app/models'
model_files = {
    'disease.py': 'from sqlalchemy import Column, Integer, String, Text, DateTime\nfrom sqlalchemy.orm import relationship',
    'symptom.py': 'from datetime import datetime',
    'rule.py': 'from datetime import datetime\nfrom sqlalchemy.dialects.postgresql import ARRAY',
    'history.py': 'from datetime import datetime, timedelta\nfrom sqlalchemy.dialects.postgresql import ARRAY, JSONB',
    'admin_log.py': 'from datetime import datetime\nfrom sqlalchemy.dialects.postgresql import JSONB',
    'system_settings.py': 'from datetime import datetime'
}

for filename, imports_after_docstring in model_files.items():
    filepath = os.path.join(models_dir, filename)

    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if already has "from app import db"
        if 'from app import db' not in content:
            # Add "from app import db" after the existing imports
            content = content.replace(
                imports_after_docstring,
                imports_after_docstring + '\nfrom app import db'
            )

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

            print('[OK] Fixed: ' + filename)
        else:
            print('[SKIP] Already OK: ' + filename)
    else:
        print('[ERROR] Not found: ' + filename)

print('\nAll model files have been fixed!')
print('\nNext step: Run the backend server:')
print('  cd backend')
print('  python run.py')

"""
Symptom Routes
"""

from flask import jsonify
from app.routes import api_bp
from app import db
from app.models.symptom import Symptom


@api_bp.route('/symptoms', methods=['GET'])
def get_symptoms():
    """Get all symptoms"""
    try:
        symptoms = Symptom.query.order_by(Symptom.code).all()
        return jsonify({
            'success': True,
            'data': [s.to_dict() for s in symptoms]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

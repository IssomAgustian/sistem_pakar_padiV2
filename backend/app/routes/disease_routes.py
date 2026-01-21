'''Disease Routes'''
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.disease import Disease
from app.utils.decorators import admin_required

bp = Blueprint('diseases', __name__)

@bp.route('/', methods=['GET'])
def get_diseases():
    diseases = Disease.query.order_by(Disease.code).all()
    return jsonify({'success': True, 'data': [d.to_dict() for d in diseases]})

@bp.route('/<int:disease_id>', methods=['GET'])
def get_disease(disease_id):
    disease = Disease.query.get_or_404(disease_id)
    return jsonify({'success': True, 'data': disease.to_dict()})

@bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def create_disease():
    data = request.get_json()
    if not data.get('code') or not data.get('name'):
        return jsonify({'success': False, 'message': 'Kode dan nama harus diisi'}), 400

    disease = Disease(code=data['code'], name=data['name'], description=data.get('description'))
    db.session.add(disease)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Penyakit berhasil ditambahkan', 'data': disease.to_dict()})

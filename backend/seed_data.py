#!/usr/bin/env python3
"""
Seed Database with Initial Data
Sistem Pakar Diagnosis Penyakit Tanaman Padi
"""

from app import create_app, db
from app.models.user import User
from app.models.disease import Disease
from app.models.symptom import Symptom
from app.models.rule import Rule

def seed_database():
    """Populate database with initial data from blueprint"""
    app = create_app()

    with app.app_context():
        # Clear existing data (optional - comment out if you want to preserve data)
        print("Clearing existing data...")
        Rule.query.delete()
        Symptom.query.delete()
        Disease.query.delete()

        # Create admin user
        print("Creating admin user...")
        admin = User(
            email='admin@pakar-padi.com',
            full_name='Administrator',
            role='admin',
            is_active=True
        )
        admin.set_password('admin123')
        db.session.add(admin)

        # Seed Diseases
        print("Seeding diseases...")
        diseases_data = [
            {'code': 'P01', 'name': 'Blas', 'description': 'Penyakit jamur Pyricularia oryzae yang menyerang daun dan malai'},
            {'code': 'P02', 'name': 'Hawar Daun Bakteri', 'description': 'Penyakit bakteri Xanthomonas oryzae'},
            {'code': 'P03', 'name': 'Hawar Pelepah', 'description': 'Penyakit jamur Rhizoctonia solani pada pelepah'},
            {'code': 'P04', 'name': 'Bercak Cokelat', 'description': 'Penyakit jamur Bipolaris oryzae'},
            {'code': 'P05', 'name': 'Tungro', 'description': 'Penyakit virus yang ditularkan wereng hijau'},
            {'code': 'P06', 'name': 'Busuk Batang', 'description': 'Penyakit jamur Sclerotium oryzae'}
        ]

        for disease_data in diseases_data:
            disease = Disease(**disease_data)
            db.session.add(disease)

        db.session.commit()
        print(f"Created {len(diseases_data)} diseases")

        # Seed Symptoms
        print("Seeding symptoms...")
        symptoms_data = [
            {'code': 'G01', 'name': 'Daun berwarna kuning pucat (klorosis)', 'category': 'daun', 'mb_value': 0.80, 'md_value': 0.20},
            {'code': 'G02', 'name': 'Bercak cokelat memanjang di daun', 'category': 'daun', 'mb_value': 0.70, 'md_value': 0.30},
            {'code': 'G03', 'name': 'Daun melipat dan mengeluarkan lendir', 'category': 'daun', 'mb_value': 0.80, 'md_value': 0.20},
            {'code': 'G04', 'name': 'Pelepah membusuk dan berwarna kehitaman', 'category': 'batang', 'mb_value': 0.80, 'md_value': 0.20},
            {'code': 'G05', 'name': 'Tanaman tumbuh kerdil, berdaun sempit, pucat', 'category': 'pertumbuhan', 'mb_value': 0.80, 'md_value': 0.20},
            {'code': 'G06', 'name': 'Stomata berbentuk belah ketupat berwarna abu-abu', 'category': 'daun', 'mb_value': 0.70, 'md_value': 0.30},
            {'code': 'G07', 'name': 'Daun terdapat bercak bulat kehitaman', 'category': 'daun', 'mb_value': 0.90, 'md_value': 0.10},
            {'code': 'G08', 'name': 'Batang atau akar membusuk', 'category': 'batang', 'mb_value': 0.85, 'md_value': 0.15},
            {'code': 'G09', 'name': 'Malai tidak keluar atau keluar terlambat', 'category': 'malai', 'mb_value': 0.75, 'md_value': 0.25},
            {'code': 'G010', 'name': 'Daun tampak belang dengan garis kuning terang', 'category': 'daun', 'mb_value': 0.75, 'md_value': 0.25},
            {'code': 'G011', 'name': 'Daun menggulung dan kaku', 'category': 'daun', 'mb_value': 0.85, 'md_value': 0.15},
            {'code': 'G012', 'name': 'Daun bagian atas kering seperti terbakar', 'category': 'daun', 'mb_value': 0.85, 'md_value': 0.15},
            {'code': 'G013', 'name': 'Anakan mati mendadak', 'category': 'pertumbuhan', 'mb_value': 0.85, 'md_value': 0.10},
            {'code': 'G014', 'name': 'Pertumbuhan lambat dan berwarna keunguan', 'category': 'pertumbuhan', 'mb_value': 0.80, 'md_value': 0.20},
            {'code': 'G015', 'name': 'Terdapat bercak putih kecil di permukaan batang', 'category': 'batang', 'mb_value': 0.80, 'md_value': 0.20},
            {'code': 'G016', 'name': 'Daun terdapat bercak konsentris berwarna cokelat terang', 'category': 'daun', 'mb_value': 0.70, 'md_value': 0.30},
            {'code': 'G017', 'name': 'Bagian bawah batang busuk basah', 'category': 'batang', 'mb_value': 0.85, 'md_value': 0.15},
            {'code': 'G018', 'name': 'Daun dan pelepah layu saat siang dan pulih saat malam', 'category': 'daun', 'mb_value': 0.70, 'md_value': 0.30}
        ]

        for symptom_data in symptoms_data:
            symptom = Symptom(**symptom_data)
            db.session.add(symptom)

        db.session.commit()
        print(f"Created {len(symptoms_data)} symptoms")

        # Seed Rules
        print("Seeding rules...")
        # Get disease and symptom objects
        diseases = {d.code: d.id for d in Disease.query.all()}
        symptom_map = {s.code: s for s in Symptom.query.all()}

        rules_data = [
            {'disease_code': 'P01', 'symptom_codes': ['G01', 'G02', 'G07', 'G012']},
            {'disease_code': 'P02', 'symptom_codes': ['G01', 'G013', 'G014', 'G011']},
            {'disease_code': 'P03', 'symptom_codes': ['G04', 'G017', 'G018']},
            {'disease_code': 'P04', 'symptom_codes': ['G02', 'G015', 'G016']},
            {'disease_code': 'P05', 'symptom_codes': ['G01', 'G05', 'G010', 'G011']},
            {'disease_code': 'P06', 'symptom_codes': ['G03', 'G06', 'G08', 'G017']}
        ]

        rule_counter = 1
        for rule_data in rules_data:
            disease_id = diseases.get(rule_data['disease_code'])
            if not disease_id:
                continue

            for symptom_code in rule_data['symptom_codes']:
                symptom = symptom_map.get(symptom_code)
                if not symptom:
                    continue

                rule = Rule(
                    rule_code=f'R{str(rule_counter).zfill(3)}',
                    disease_id=disease_id,
                    symptom_id=symptom.id,
                    symptom_ids=[symptom.id],
                    confidence_level=1.0,
                    mb=symptom.mb_value or 0.5,
                    md=symptom.md_value or 0.5,
                    min_symptom_match=3,
                    is_active=True
                )
                db.session.add(rule)
                rule_counter += 1

        db.session.commit()
        print(f"Created {rule_counter - 1} rules")

        print("\n Database seeded successfully!")
        print(f"   - {len(diseases_data)} diseases")
        print(f"   - {len(symptoms_data)} symptoms")
        print(f"   - {rule_counter - 1} rules")
        print(f"   - 1 admin user (email: admin@pakar-padi.com, password: admin123)")

if __name__ == '__main__':
    seed_database()

"""
Certainty Factor Service
Sistem Pakar Diagnosis Penyakit Tanaman Padi
Metode: Parallel Forward Chaining + Certainty Factor
"""

from app.models.symptom import Symptom
from app.models.disease import Disease
from app.models.rule import Rule


class CertaintyFactorService:
    """
    Engine perhitungan Certainty Factor (CF) untuk multi penyakit secara paralel.
    """

    CERTAINTY_LEVELS = {
        'pasti': 1.0,
        'hampir_pasti': 0.8,
        'kemungkinan_besar': 0.6,
        'mungkin': 0.4,
        'tidak_tahu': 0.2
    }

    def interpret_cf(self, cf_value):
        if cf_value >= 0.80:
            return 'PASTI'
        if cf_value >= 0.60:
            return 'HAMPIR PASTI'
        if cf_value >= 0.40:
            return 'KEMUNGKINAN BESAR'
        if cf_value >= 0.20:
            return 'MUNGKIN'
        return 'TIDAK PASTI'

    def combine_cf(self, cf1, cf2):
        if cf1 > 0 and cf2 > 0:
            return cf1 + cf2 * (1 - cf1)
        if cf1 < 0 and cf2 < 0:
            return cf1 + cf2 * (1 + cf1)
        return (cf1 + cf2) / (1 - min(abs(cf1), abs(cf2)))

    def diagnose(self, symptom_ids, certainty_values):
        if not symptom_ids or not certainty_values:
            return {
                'status': 'no_diagnosis',
                'message': 'Data gejala atau keyakinan tidak lengkap'
            }

        if len(symptom_ids) < 3:
            return {
                'status': 'no_diagnosis',
                'message': 'Minimal 3 gejala harus dipilih untuk diagnosis yang akurat'
            }

        certainty_map = self.normalize_certainty_values(certainty_values)
        symptoms_input = [
            {'symptom_id': symptom_id, 'certainty': certainty_map.get(symptom_id, 0.5)}
            for symptom_id in symptom_ids
            if symptom_id in certainty_map
        ]

        if len(symptoms_input) < 3:
            return {
                'status': 'no_diagnosis',
                'message': 'Nilai keyakinan tidak lengkap untuk semua gejala'
            }

        disease_matches = self.group_rules_by_disease(symptom_ids)
        if not disease_matches:
            return {
                'status': 'no_diagnosis',
                'message': 'Tidak ada penyakit yang cocok dengan gejala yang dipilih'
            }

        results = self.calculate_certainty_factor(disease_matches, symptoms_input)
        results = self.apply_penalty_and_filter(results)

        if not results:
            return {
                'status': 'no_diagnosis',
                'message': 'Tidak ada diagnosis dengan tingkat keyakinan memadai'
            }

        recommendations = self.generate_symptom_recommendations(results)
        warning = self.check_multi_infection(results)

        return {
            'status': 'diagnosed',
            'results': results,
            'recommendations': recommendations,
            'warning': warning
        }

    def normalize_certainty_values(self, certainty_values):
        normalized = {}
        for key, value in certainty_values.items():
            try:
                symptom_id = int(key)
            except (ValueError, TypeError):
                continue

            if isinstance(value, str):
                user_cf = self.CERTAINTY_LEVELS.get(value.lower(), 0.5)
            elif isinstance(value, (int, float)):
                user_cf = float(value)
            else:
                user_cf = 0.5

            normalized[symptom_id] = max(0.0, min(1.0, user_cf))

        return normalized

    def group_rules_by_disease(self, symptom_ids):
        matching_rules = Rule.query.filter(
            Rule.is_active.is_(True),
            Rule.symptom_id.in_(symptom_ids)
        ).all()

        disease_matches = {}
        for rule in matching_rules:
            disease_matches.setdefault(rule.disease_id, []).append(rule)

        return disease_matches

    def calculate_certainty_factor(self, disease_matches, symptoms_input):
        results = []
        user_certainty_map = {s['symptom_id']: s['certainty'] for s in symptoms_input}

        symptom_map = {
            s.id: s for s in Symptom.query.filter(
                Symptom.id.in_(user_certainty_map.keys())
            ).all()
        }

        for disease_id, rules in disease_matches.items():
            disease = Disease.query.get(disease_id)
            min_match_values = [r.min_symptom_match for r in rules if r.min_symptom_match]
            min_match_required = max(min_match_values) if min_match_values else 3
            total_symptoms = Rule.query.filter_by(
                disease_id=disease_id,
                is_active=True
            ).count()

            cf_values = []
            matched_symptoms = []
            matched_symptom_codes = []
            matched_symptom_names = []

            for rule in rules:
                user_certainty = user_certainty_map.get(rule.symptom_id)
                if user_certainty is None:
                    continue

                mb_value = float(rule.mb) if rule.mb is not None else 0.0
                md_value = float(rule.md) if rule.md is not None else 0.0
                cf_pakar = mb_value - md_value
                cf_gejala = cf_pakar * user_certainty

                cf_values.append(cf_gejala)
                matched_symptoms.append(rule.symptom_id)

                symptom = symptom_map.get(rule.symptom_id)
                if symptom:
                    matched_symptom_codes.append(symptom.code)
                    matched_symptom_names.append(symptom.name)

            if not cf_values or total_symptoms == 0:
                continue

            cf_combined = cf_values[0]
            for i in range(1, len(cf_values)):
                cf_combined = self.combine_cf(cf_combined, cf_values[i])

            match_percentage = len(matched_symptoms) / total_symptoms

            results.append({
                'disease_id': disease_id,
                'disease_code': disease.code if disease else None,
                'disease_name': disease.name if disease else None,
                'cf_raw': cf_combined,
                'symptoms_matched': len(matched_symptoms),
                'total_symptoms': total_symptoms,
                'match_percentage': match_percentage,
                'min_symptom_match': min_match_required,
                'meets_min_match': len(matched_symptoms) >= min_match_required,
                'matched_symptom_ids': matched_symptoms,
                'matched_symptom_codes': matched_symptom_codes,
                'matched_symptom_names': matched_symptom_names
            })

        return results

    def apply_penalty_and_filter(self, results):
        for result in results:
            num_symptoms = result['symptoms_matched']
            cf_raw = result['cf_raw']

            if num_symptoms == 1:
                penalty = 0.5
                status = 'TIDAK PASTI'
            elif num_symptoms == 2:
                penalty = 0.8
                status = 'CUKUP VALID'
            else:
                penalty = 1.0
                status = 'VALID'

            cf_final = cf_raw * penalty
            result['cf_final'] = cf_final
            result['penalty'] = penalty
            result['status'] = status
            result['interpretation'] = self.interpret_cf(cf_final)

        filtered_results = [r for r in results if r['cf_final'] >= 0.20]
        filtered_results.sort(key=lambda x: x['cf_final'], reverse=True)

        return filtered_results[:3]

    def generate_symptom_recommendations(self, results):
        recommendations = []

        for result in results:
            cf_final = result['cf_final']
            if not (0.40 <= cf_final < 0.80):
                continue

            disease_id = result['disease_id']
            matched_symptoms = set(result['matched_symptom_ids'])

            all_rules = Rule.query.filter_by(disease_id=disease_id, is_active=True).all()
            unmatched_rules = [r for r in all_rules if r.symptom_id not in matched_symptoms]

            if not unmatched_rules:
                continue

            symptom_ids = [r.symptom_id for r in unmatched_rules]
            symptoms = Symptom.query.filter(Symptom.id.in_(symptom_ids)).all()

            recommendations.append({
                'disease_code': result['disease_code'],
                'disease_name': result['disease_name'],
                'current_cf': cf_final,
                'suggested_symptoms': [
                    {'code': s.code, 'name': s.name}
                    for s in symptoms[:4]
                ],
                'message': (
                    f'Untuk memastikan diagnosis {result["disease_name"]}, '
                    'periksa apakah tanaman juga menunjukkan gejala berikut:'
                )
            })

        return recommendations

    def check_multi_infection(self, results):
        high_confidence = [r for r in results if r['cf_final'] >= 0.80]
        if len(high_confidence) >= 2:
            return 'INFEKSI MULTIPEL TERDETEKSI'
        return None

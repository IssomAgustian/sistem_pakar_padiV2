"""
Forward Chaining Service
Sistem Pakar Diagnosis Penyakit Tanaman Padi
"""

from app.models.rule import Rule
from app.models.disease import Disease


class ForwardChainingService:
    """
    Forward Chaining inference engine
    Matches user-selected symptoms with rule base
    """

    def __init__(self):
        self.rules = None
        self.load_rules()

    def load_rules(self):
        """Load all active rules from database"""
        self.rules = Rule.query.filter_by(is_active=True).all()
        return self.rules

    def diagnose(self, selected_symptom_ids):
        """
        Main diagnosis method using Forward Chaining

        Args:
            selected_symptom_ids: List of symptom IDs selected by user

        Returns:
            dict: Result with status, disease, confidence, etc
        """
        if not selected_symptom_ids:
            return {
                'status': 'no_match',
                'message': 'No symptoms selected'
            }

        # Group rules by disease
        disease_map = {}
        for rule in self.rules:
            disease_map.setdefault(rule.disease_id, []).append(rule)

        best_match = None
        best_match_percentage = 0.0

        for disease_id, rules in disease_map.items():
            total_symptoms = len(rules)
            if total_symptoms == 0:
                continue

            matched_rules = [r for r in rules if r.symptom_id in selected_symptom_ids]
            match_percentage = (len(matched_rules) / total_symptoms) * 100

            # Exact match only (all symptoms for disease)
            if match_percentage == 100 and match_percentage > best_match_percentage:
                best_match = {
                    'disease_id': disease_id,
                    'rules': rules,
                    'matched_rules': matched_rules,
                    'match_percentage': match_percentage
                }
                best_match_percentage = match_percentage

        if best_match:
            disease = Disease.query.get(best_match['disease_id'])
            matched_symptom_ids = [r.symptom_id for r in best_match['matched_rules']]
            total_symptoms = len(best_match['rules'])

            return {
                'status': 'matched',
                'disease': disease,
                'confidence': 1.0,
                'matched_rule': None,
                'match_percentage': best_match['match_percentage'],
                'matched_symptoms': matched_symptom_ids,
                'total_rule_symptoms': total_symptoms,
                'matched_count': len(matched_symptom_ids)
            }

        # No match found
        return {
            'status': 'no_match',
            'message': 'No exact rule match found. Please provide certainty values.',
            'selected_symptoms': selected_symptom_ids
        }

    def get_possible_diseases(self, selected_symptom_ids):
        """Get all possible diseases with partial matches"""
        possible_matches = []

        disease_map = {}
        for rule in self.rules:
            disease_map.setdefault(rule.disease_id, []).append(rule)

        for disease_id, rules in disease_map.items():
            total_symptoms = len(rules)
            if total_symptoms == 0:
                continue

            matched_rules = [r for r in rules if r.symptom_id in selected_symptom_ids]
            if not matched_rules:
                continue

            match_percentage = (len(matched_rules) / total_symptoms) * 100
            disease = Disease.query.get(disease_id)

            possible_matches.append({
                'disease': disease,
                'rule': None,
                'match_percentage': match_percentage,
                'matched_symptoms': len(matched_rules),
                'total_symptoms': total_symptoms
            })

        possible_matches.sort(key=lambda x: x['match_percentage'], reverse=True)
        return possible_matches

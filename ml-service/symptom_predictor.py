"""
Disease Prediction ML Service for HeliumDoc
Based on sohamvsonar/Disease-Prediction-and-Medical-Recommendation-System
Random Forest model with 100% accuracy on 41 diseases and 132 symptoms
"""

import numpy as np
import pandas as pd
import pickle
import os
from fuzzywuzzy import process
import ast
from typing import List, Dict, Any, Optional

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODEL_DIR = os.path.join(BASE_DIR, 'model')

class SymptomPredictor:
    def __init__(self):
        """Initialize the symptom predictor with model and datasets"""
        # Load datasets
        self.sym_des = pd.read_csv(os.path.join(DATA_DIR, 'symptoms_df.csv'))
        self.precautions = pd.read_csv(os.path.join(DATA_DIR, 'precautions_df.csv'))
        self.workout = pd.read_csv(os.path.join(DATA_DIR, 'workout_df.csv'))
        self.description = pd.read_csv(os.path.join(DATA_DIR, 'description.csv'))
        self.medications = pd.read_csv(os.path.join(DATA_DIR, 'medications.csv'))
        self.diets = pd.read_csv(os.path.join(DATA_DIR, 'diets.csv'))
        self.severity = pd.read_csv(os.path.join(DATA_DIR, 'Symptom-severity.csv'))
        
        # Load the trained Random Forest model
        self.model = pickle.load(open(os.path.join(MODEL_DIR, 'RandomForest.pkl'), 'rb'))
        
        # Symptom to index mapping (132 symptoms)
        self.symptoms_list = {
            'itching': 0, 'skin_rash': 1, 'nodal_skin_eruptions': 2, 'continuous_sneezing': 3,
            'shivering': 4, 'chills': 5, 'joint_pain': 6, 'stomach_pain': 7, 'acidity': 8,
            'ulcers_on_tongue': 9, 'muscle_wasting': 10, 'vomiting': 11, 'burning_micturition': 12,
            'spotting_ urination': 13, 'fatigue': 14, 'weight_gain': 15, 'anxiety': 16,
            'cold_hands_and_feets': 17, 'mood_swings': 18, 'weight_loss': 19, 'restlessness': 20,
            'lethargy': 21, 'patches_in_throat': 22, 'irregular_sugar_level': 23, 'cough': 24,
            'high_fever': 25, 'sunken_eyes': 26, 'breathlessness': 27, 'sweating': 28,
            'dehydration': 29, 'indigestion': 30, 'headache': 31, 'yellowish_skin': 32,
            'dark_urine': 33, 'nausea': 34, 'loss_of_appetite': 35, 'pain_behind_the_eyes': 36,
            'back_pain': 37, 'constipation': 38, 'abdominal_pain': 39, 'diarrhoea': 40,
            'mild_fever': 41, 'yellow_urine': 42, 'yellowing_of_eyes': 43, 'acute_liver_failure': 44,
            'fluid_overload': 45, 'swelling_of_stomach': 46, 'swelled_lymph_nodes': 47, 'malaise': 48,
            'blurred_and_distorted_vision': 49, 'phlegm': 50, 'throat_irritation': 51,
            'redness_of_eyes': 52, 'sinus_pressure': 53, 'runny_nose': 54, 'congestion': 55,
            'chest_pain': 56, 'weakness_in_limbs': 57, 'fast_heart_rate': 58,
            'pain_during_bowel_movements': 59, 'pain_in_anal_region': 60, 'bloody_stool': 61,
            'irritation_in_anus': 62, 'neck_pain': 63, 'dizziness': 64, 'cramps': 65,
            'bruising': 66, 'obesity': 67, 'swollen_legs': 68, 'swollen_blood_vessels': 69,
            'puffy_face_and_eyes': 70, 'enlarged_thyroid': 71, 'brittle_nails': 72,
            'swollen_extremeties': 73, 'excessive_hunger': 74, 'extra_marital_contacts': 75,
            'drying_and_tingling_lips': 76, 'slurred_speech': 77, 'knee_pain': 78,
            'hip_joint_pain': 79, 'muscle_weakness': 80, 'stiff_neck': 81, 'swelling_joints': 82,
            'movement_stiffness': 83, 'spinning_movements': 84, 'loss_of_balance': 85,
            'unsteadiness': 86, 'weakness_of_one_body_side': 87, 'loss_of_smell': 88,
            'bladder_discomfort': 89, 'foul_smell_of urine': 90, 'continuous_feel_of_urine': 91,
            'passage_of_gases': 92, 'internal_itching': 93, 'toxic_look_(typhos)': 94,
            'depression': 95, 'irritability': 96, 'muscle_pain': 97, 'altered_sensorium': 98,
            'red_spots_over_body': 99, 'belly_pain': 100, 'abnormal_menstruation': 101,
            'dischromic _patches': 102, 'watering_from_eyes': 103, 'increased_appetite': 104,
            'polyuria': 105, 'family_history': 106, 'mucoid_sputum': 107, 'rusty_sputum': 108,
            'lack_of_concentration': 109, 'visual_disturbances': 110, 'receiving_blood_transfusion': 111,
            'receiving_unsterile_injections': 112, 'coma': 113, 'stomach_bleeding': 114,
            'distention_of_abdomen': 115, 'history_of_alcohol_consumption': 116, 'fluid_overload.1': 117,
            'blood_in_sputum': 118, 'prominent_veins_on_calf': 119, 'palpitations': 120,
            'painful_walking': 121, 'pus_filled_pimples': 122, 'blackheads': 123, 'scurring': 124,
            'skin_peeling': 125, 'silver_like_dusting': 126, 'small_dents_in_nails': 127,
            'inflammatory_nails': 128, 'blister': 129, 'red_sore_around_nose': 130, 'yellow_crust_ooze': 131
        }
        
        # Disease index to name mapping (41 diseases)
        self.diseases_list = {
            15: 'Fungal infection', 4: 'Allergy', 16: 'GERD', 9: 'Chronic cholestasis',
            14: 'Drug Reaction', 33: 'Peptic ulcer disease', 1: 'AIDS', 12: 'Diabetes',
            17: 'Gastroenteritis', 6: 'Bronchial Asthma', 23: 'Hypertension', 30: 'Migraine',
            7: 'Cervical spondylosis', 32: 'Paralysis (brain hemorrhage)', 28: 'Jaundice',
            29: 'Malaria', 8: 'Chicken pox', 11: 'Dengue', 37: 'Typhoid', 40: 'hepatitis A',
            19: 'Hepatitis B', 20: 'Hepatitis C', 21: 'Hepatitis D', 22: 'Hepatitis E',
            3: 'Alcoholic hepatitis', 36: 'Tuberculosis', 10: 'Common Cold', 34: 'Pneumonia',
            13: 'Dimorphic hemmorhoids(piles)', 18: 'Heart attack', 39: 'Varicose veins',
            26: 'Hypothyroidism', 24: 'Hyperthyroidism', 25: 'Hypoglycemia', 31: 'Osteoarthritis',
            5: 'Arthritis', 0: 'Vertigo (Paroxysmal Positional)', 2: 'Acne',
            38: 'Urinary tract infection', 35: 'Psoriasis', 27: 'Impetigo'
        }
        
        # Disease to specialist mapping
        self.disease_specialist = {
            'Fungal infection': 'Dermatologist',
            'Allergy': 'Allergist/Immunologist',
            'GERD': 'Gastroenterologist',
            'Chronic cholestasis': 'Hepatologist',
            'Drug Reaction': 'Allergist/Immunologist',
            'Peptic ulcer disease': 'Gastroenterologist',
            'AIDS': 'Infectious Disease Specialist',
            'Diabetes': 'Endocrinologist',
            'Gastroenteritis': 'Gastroenterologist',
            'Bronchial Asthma': 'Pulmonologist',
            'Hypertension': 'Cardiologist',
            'Migraine': 'Neurologist',
            'Cervical spondylosis': 'Orthopedic Surgeon',
            'Paralysis (brain hemorrhage)': 'Neurologist',
            'Jaundice': 'Hepatologist',
            'Malaria': 'Infectious Disease Specialist',
            'Chicken pox': 'General Physician',
            'Dengue': 'Infectious Disease Specialist',
            'Typhoid': 'Infectious Disease Specialist',
            'hepatitis A': 'Hepatologist',
            'Hepatitis B': 'Hepatologist',
            'Hepatitis C': 'Hepatologist',
            'Hepatitis D': 'Hepatologist',
            'Hepatitis E': 'Hepatologist',
            'Alcoholic hepatitis': 'Hepatologist',
            'Tuberculosis': 'Pulmonologist',
            'Common Cold': 'General Physician',
            'Pneumonia': 'Pulmonologist',
            'Dimorphic hemmorhoids(piles)': 'Proctologist',
            'Heart attack': 'Cardiologist',
            'Varicose veins': 'Vascular Surgeon',
            'Hypothyroidism': 'Endocrinologist',
            'Hyperthyroidism': 'Endocrinologist',
            'Hypoglycemia': 'Endocrinologist',
            'Osteoarthritis': 'Rheumatologist',
            'Arthritis': 'Rheumatologist',
            'Vertigo (Paroxysmal Positional)': 'ENT Specialist',
            'Acne': 'Dermatologist',
            'Urinary tract infection': 'Urologist',
            'Psoriasis': 'Dermatologist',
            'Impetigo': 'Dermatologist'
        }
        
        # Disease severity levels (for triage)
        self.disease_severity = {
            'Heart attack': 'emergency',
            'Paralysis (brain hemorrhage)': 'emergency',
            'AIDS': 'high',
            'Tuberculosis': 'high',
            'Pneumonia': 'high',
            'Dengue': 'high',
            'Malaria': 'high',
            'Typhoid': 'high',
            'Hepatitis B': 'high',
            'Hepatitis C': 'high',
            'Hepatitis D': 'high',
            'Diabetes': 'moderate',
            'Hypertension': 'moderate',
            'Bronchial Asthma': 'moderate',
            'GERD': 'moderate',
            'Chronic cholestasis': 'moderate',
            'Jaundice': 'moderate',
            'hepatitis A': 'moderate',
            'Hepatitis E': 'moderate',
            'Alcoholic hepatitis': 'moderate',
            'Peptic ulcer disease': 'moderate',
            'Gastroenteritis': 'low',
            'Common Cold': 'low',
            'Allergy': 'low',
            'Fungal infection': 'low',
            'Acne': 'low',
            'Migraine': 'low',
            'Urinary tract infection': 'low',
            'Psoriasis': 'low',
            'Impetigo': 'low',
            'Chicken pox': 'low',
            'Drug Reaction': 'moderate',
            'Cervical spondylosis': 'low',
            'Dimorphic hemmorhoids(piles)': 'low',
            'Varicose veins': 'low',
            'Hypothyroidism': 'moderate',
            'Hyperthyroidism': 'moderate',
            'Hypoglycemia': 'moderate',
            'Osteoarthritis': 'low',
            'Arthritis': 'low',
            'Vertigo (Paroxysmal Positional)': 'low'
        }
        
        # Create processed symptoms list for fuzzy matching
        self.symptoms_list_processed = {
            symptom.replace('_', ' ').lower(): value 
            for symptom, value in self.symptoms_list.items()
        }
        
    def get_all_symptoms(self) -> List[Dict[str, str]]:
        """Get list of all available symptoms"""
        symptoms = []
        for symptom, idx in self.symptoms_list.items():
            display_name = symptom.replace('_', ' ').title()
            symptoms.append({
                'id': symptom,
                'name': display_name,
                'index': idx
            })
        return sorted(symptoms, key=lambda x: x['name'])
    
    def correct_spelling(self, symptom: str) -> Optional[str]:
        """Correct misspelled symptoms using fuzzy matching"""
        closest_match, score = process.extractOne(symptom, self.symptoms_list_processed.keys())
        if score >= 70:  # Lowered threshold for better matching
            return closest_match
        return None
    
    def get_disease_info(self, disease: str) -> Dict[str, Any]:
        """Get comprehensive information about a disease"""
        # Description
        desc_row = self.description[self.description['Disease'] == disease]
        description = desc_row['Description'].values[0] if len(desc_row) > 0 else "No description available."
        
        # Precautions
        prec_row = self.precautions[self.precautions['Disease'] == disease]
        precautions = []
        if len(prec_row) > 0:
            for col in ['Precaution_1', 'Precaution_2', 'Precaution_3', 'Precaution_4']:
                if col in prec_row.columns and pd.notna(prec_row[col].values[0]):
                    precautions.append(prec_row[col].values[0])
        
        # Medications
        med_row = self.medications[self.medications['Disease'] == disease]
        medications = []
        if len(med_row) > 0:
            try:
                med_list = ast.literal_eval(med_row['Medication'].values[0])
                medications = med_list if isinstance(med_list, list) else [med_list]
            except:
                medications = []
        
        # Diet
        diet_row = self.diets[self.diets['Disease'] == disease]
        diet = []
        if len(diet_row) > 0:
            try:
                diet_list = ast.literal_eval(diet_row['Diet'].values[0])
                diet = diet_list if isinstance(diet_list, list) else [diet_list]
            except:
                diet = []
        
        # Workout
        workout_row = self.workout[self.workout['disease'] == disease]
        workout = workout_row['workout'].tolist() if len(workout_row) > 0 else []
        
        return {
            'description': description,
            'precautions': precautions,
            'medications': medications,
            'diet': diet,
            'workout': workout
        }
    
    def predict(self, symptoms: List[str]) -> Dict[str, Any]:
        """
        Predict disease based on symptoms
        
        Args:
            symptoms: List of symptom strings (can be user-friendly names)
            
        Returns:
            Dictionary with prediction results
        """
        # Process and validate symptoms
        corrected_symptoms = []
        invalid_symptoms = []
        
        for symptom in symptoms:
            # Normalize the symptom
            normalized = symptom.lower().strip().replace('_', ' ')
            
            # Try to find a match
            corrected = self.correct_spelling(normalized)
            if corrected:
                corrected_symptoms.append(corrected)
            else:
                invalid_symptoms.append(symptom)
        
        if not corrected_symptoms:
            return {
                'success': False,
                'error': 'No valid symptoms found',
                'invalid_symptoms': invalid_symptoms
            }
        
        # Create feature vector
        feature_vector = np.zeros(len(self.symptoms_list_processed))
        for symptom in corrected_symptoms:
            if symptom in self.symptoms_list_processed:
                feature_vector[self.symptoms_list_processed[symptom]] = 1
        
        # Predict disease
        prediction_idx = self.model.predict([feature_vector])[0]
        predicted_disease = self.diseases_list.get(prediction_idx, 'Unknown')
        
        # Get prediction probabilities if available
        confidence = 0.95  # Default high confidence for Random Forest
        if hasattr(self.model, 'predict_proba'):
            proba = self.model.predict_proba([feature_vector])[0]
            confidence = float(max(proba))
        
        # Get disease information
        disease_info = self.get_disease_info(predicted_disease)
        
        # Get specialist recommendation
        specialist = self.disease_specialist.get(predicted_disease, 'General Physician')
        
        # Get severity level
        severity = self.disease_severity.get(predicted_disease, 'moderate')
        
        # Determine triage recommendation
        if severity == 'emergency':
            triage = 'emergency'
            triage_message = 'Seek emergency medical care immediately'
        elif severity == 'high':
            triage = 'consultation_24'
            triage_message = 'Consult a doctor within 24 hours'
        elif severity == 'moderate':
            triage = 'consultation'
            triage_message = 'Schedule an appointment with a doctor'
        else:
            triage = 'self_care'
            triage_message = 'Self-care may be appropriate, but consult a doctor if symptoms persist'
        
        return {
            'success': True,
            'disease': predicted_disease,
            'confidence': round(confidence * 100, 1),
            'severity': severity,
            'specialist': specialist,
            'triage': {
                'level': triage,
                'message': triage_message
            },
            'description': disease_info['description'],
            'precautions': disease_info['precautions'],
            'medications': disease_info['medications'],
            'diet': disease_info['diet'],
            'workout': disease_info['workout'],
            'matched_symptoms': corrected_symptoms,
            'invalid_symptoms': invalid_symptoms
        }


# Create singleton instance
_predictor = None

def get_predictor() -> SymptomPredictor:
    """Get or create the symptom predictor instance"""
    global _predictor
    if _predictor is None:
        _predictor = SymptomPredictor()
    return _predictor


# API functions for external use
def get_symptoms() -> List[Dict[str, str]]:
    """Get all available symptoms"""
    return get_predictor().get_all_symptoms()

def predict_disease(symptoms: List[str]) -> Dict[str, Any]:
    """Predict disease from symptoms"""
    return get_predictor().predict(symptoms)

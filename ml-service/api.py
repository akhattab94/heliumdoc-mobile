"""
FastAPI wrapper for the Disease Prediction ML Service
Runs as a separate microservice on port 5001
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

from symptom_predictor import get_symptoms, predict_disease, get_predictor

app = FastAPI(
    title="HeliumDoc Symptom Checker API",
    description="AI-powered disease prediction based on symptoms using Random Forest ML model",
    version="1.0.0"
)

# Enable CORS for the mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    symptoms: List[str]
    age: Optional[int] = None
    gender: Optional[str] = None


class SymptomResponse(BaseModel):
    id: str
    name: str
    index: int


@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "HeliumDoc Symptom Checker ML API",
        "model": "Random Forest",
        "diseases_supported": 41,
        "symptoms_supported": 132
    }


@app.get("/symptoms", response_model=List[SymptomResponse])
def list_symptoms():
    """Get all available symptoms that the model can recognize"""
    return get_symptoms()


@app.get("/symptoms/search")
def search_symptoms(q: str):
    """Search symptoms by partial name match"""
    all_symptoms = get_symptoms()
    query = q.lower()
    matches = [s for s in all_symptoms if query in s['name'].lower()]
    return matches[:20]  # Limit to 20 results


@app.post("/predict")
def predict(request: PredictRequest):
    """
    Predict disease based on symptoms
    
    - **symptoms**: List of symptom names (e.g., ["headache", "fever", "cough"])
    - **age**: Optional patient age for context
    - **gender**: Optional patient gender for context
    
    Returns predicted disease with confidence, severity, specialist recommendation,
    and comprehensive health information including medications, diet, and precautions.
    """
    if not request.symptoms:
        raise HTTPException(status_code=400, detail="At least one symptom is required")
    
    if len(request.symptoms) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 symptoms allowed")
    
    result = predict_disease(request.symptoms)
    
    if not result['success']:
        raise HTTPException(status_code=400, detail=result.get('error', 'Prediction failed'))
    
    # Add age/gender context to response if provided
    result['patient_info'] = {
        'age': request.age,
        'gender': request.gender
    }
    
    return result


@app.get("/diseases")
def list_diseases():
    """Get all diseases that the model can predict"""
    predictor = get_predictor()
    diseases = []
    for idx, name in predictor.diseases_list.items():
        severity = predictor.disease_severity.get(name, 'moderate')
        specialist = predictor.disease_specialist.get(name, 'General Physician')
        diseases.append({
            'id': idx,
            'name': name,
            'severity': severity,
            'specialist': specialist
        })
    return sorted(diseases, key=lambda x: x['name'])


@app.get("/disease/{disease_name}")
def get_disease_info(disease_name: str):
    """Get detailed information about a specific disease"""
    predictor = get_predictor()
    
    # Find the disease (case-insensitive)
    found_disease = None
    for name in predictor.diseases_list.values():
        if name.lower() == disease_name.lower():
            found_disease = name
            break
    
    if not found_disease:
        raise HTTPException(status_code=404, detail=f"Disease '{disease_name}' not found")
    
    info = predictor.get_disease_info(found_disease)
    info['name'] = found_disease
    info['severity'] = predictor.disease_severity.get(found_disease, 'moderate')
    info['specialist'] = predictor.disease_specialist.get(found_disease, 'General Physician')
    
    return info


if __name__ == "__main__":
    print("Starting HeliumDoc Symptom Checker ML API...")
    print("Loading Random Forest model...")
    # Pre-load the model
    get_predictor()
    print("Model loaded successfully!")
    print("API running on http://0.0.0.0:5001")
    uvicorn.run(app, host="0.0.0.0", port=5001)

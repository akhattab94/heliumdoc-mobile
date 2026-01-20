# Infermedica Platform API Integration Notes

## Overview
The Platform API is a stateful API that supports patients and healthcare providers in the primary care journey - from symptom to outcome.

## API Regions
| Region | Code | URL |
|--------|------|-----|
| European Union (default) | EU | https://api.infermedica.com |
| Australia | AU | https://api.au.infermedica.com |
| United States | US | https://api.us.infermedica.com |

## Core Entities

### 1. User
- Account owner/parent/caregiver
- Non-medical data (email, contact info)
- Identified by `user_id`

### 2. Patient
- Individual with health symptoms
- Medical data (sex, age, symptoms)
- Identified by `patient_id`
- Linked to a User

### 3. Survey
- Health assessment with specific sections
- Types: `triage`, `intake`, `follow-up`
- Statuses: `new`, `pending`, `completed`
- Created for a specific patient

### 4. Question
Types for Triage:
- dependent, sex, age, risk_factors, symptoms
- what_kind_of_care_are_you_planning
- form_of_contact_consideration
- travel_regions, suggest, interview

### 5. Answer
Types: choice, multiple_choice, number, symptoms, list, text, duration

## Authentication
- Bearer token: `Authorization: Bearer <ACCESS_TOKEN>`
- Access token obtained from Infermedica developer portal

## API Flow for Triage Interview

### Step 1: Create User
```bash
POST /api/mgp/v1/users
{
  "email": "user@example.net"
}
```
Response:
```json
{
  "id": "158048dc-8e65-457e-8b1e-6de7435cc374",
  "email": "user@example.net"
}
```

### Step 2: Create Patient
```bash
POST /api/mgp/v1/patients
{
  "user_id": "158048dc-8e65-457e-8b1e-6de7435cc374"
}
```
Response:
```json
{
  "sex": null,
  "age": null,
  "dependent": null,
  "user_id": "158048dc-8e65-457e-8b1e-6de7435cc374",
  "id": "1c2c73bd-7283-4c6c-9593-83772fa8ae16"
}
```

### Step 3: Create Survey (Triage)
```bash
POST /api/mgp/v1/surveys
{
  "type": "triage",
  "patient_id": "1c2c73bd-7283-4c6c-9593-83772fa8ae16"
}
```
Response:
```json
{
  "notification_date": null,
  "evidence": [],
  "type": "triage",
  "sections": null,
  "expiration_date": null,
  "id": "61b03107-0cff-475c-adc0-bdaada2dde3e",
  "status": "new",
  "patient_id": "1c2c73bd-7283-4c6c-9593-83772fa8ae16"
}
```

### Step 4: Get Current Question
```bash
GET /api/mgp/v1/surveys/{survey_id}/questions/current
```
Response:
```json
{
  "id": "dependent",
  "index": 0,
  "question": {
    "text": "Who is the survey for?"
  },
  "answer_type": "choice",
  "meta": {
    "answers": [
      { "id": "myself", "label": "Myself" },
      { "id": "someone-else", "label": "Someone else" }
    ]
  }
}
```

### Step 5: Submit Answer
```bash
POST /api/mgp/v1/surveys/{survey_id}/questions/current
{
  "answer": {
    "id": "myself"
  }
}
```

### Step 6: Continue until survey is completed
- Keep getting questions and submitting answers
- Survey status changes to "completed" when done
- Final response includes triage results

## Integration Plan for HeliumDoc

1. **Server-side router** (`/server/routers/symptom-checker.ts`)
   - Create Infermedica user/patient mapping
   - Manage survey sessions
   - Proxy API calls with authentication

2. **Mobile app screens**
   - Update symptom checker to use real API
   - Dynamic question rendering based on answer_type
   - Display triage results with care recommendations

3. **Environment variables needed**
   - `INFERMEDICA_APP_ID`
   - `INFERMEDICA_APP_KEY`
   - `INFERMEDICA_API_URL` (default: https://api.infermedica.com)

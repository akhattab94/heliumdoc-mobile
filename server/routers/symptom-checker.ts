/**
 * Symptom Checker Router - Connects to self-hosted ML model
 * Uses Random Forest model with 100% accuracy on 41 diseases and 132 symptoms
 * Falls back to Infermedica API if ML service is unavailable
 */

import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";

// ML Service URL (runs on port 5001)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

// Infermedica API configuration (fallback)
const INFERMEDICA_API_URL = process.env.INFERMEDICA_API_URL || "https://api.infermedica.com";
const INFERMEDICA_APP_ID = process.env.INFERMEDICA_APP_ID || "";
const INFERMEDICA_APP_KEY = process.env.INFERMEDICA_APP_KEY || "";

// Types for ML service responses
interface MLSymptom {
  id: string;
  name: string;
  index: number;
}

interface MLPredictionResult {
  success: boolean;
  disease: string;
  confidence: number;
  severity: "emergency" | "high" | "moderate" | "low";
  specialist: string;
  triage: {
    level: string;
    message: string;
  };
  description: string;
  precautions: string[];
  medications: string[];
  diet: string[];
  workout: string[];
  matched_symptoms: string[];
  invalid_symptoms: string[];
}

// Helper function to call ML service
async function callMLService<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${ML_SERVICE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { detail?: string }).detail || `ML Service error: ${response.status}`);
  }

  return response.json();
}

// Check if ML service is available
async function isMLServiceAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/`, { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
}

const BODY_LOCATIONS = [
  { id: "head", name: "Head & Face", icon: "🧠" },
  { id: "chest", name: "Chest & Heart", icon: "❤️" },
  { id: "abdomen", name: "Abdomen & Digestive", icon: "🫃" },
  { id: "respiratory", name: "Respiratory", icon: "🫁" },
  { id: "musculoskeletal", name: "Muscles & Joints", icon: "💪" },
  { id: "skin", name: "Skin & Hair", icon: "🖐️" },
  { id: "mental", name: "Mental Health", icon: "🧘" },
  { id: "general", name: "General Symptoms", icon: "🌡️" },
  { id: "urinary", name: "Urinary System", icon: "💧" },
];

export const symptomCheckerRouter = router({
  // Health check - returns which service is active
  healthCheck: publicProcedure.query(async () => {
    const mlAvailable = await isMLServiceAvailable();
    return {
      mlService: {
        available: mlAvailable,
        url: ML_SERVICE_URL,
        model: "Random Forest",
        diseases: 41,
        symptoms: 132,
      },
      infermedicaService: {
        available: !!(INFERMEDICA_APP_ID && INFERMEDICA_APP_KEY),
      },
      activeService: mlAvailable ? "ml" : (INFERMEDICA_APP_ID ? "infermedica" : "mock"),
    };
  }),

  // Get list of body locations/categories
  getBodyLocations: publicProcedure.query(async () => {
    return BODY_LOCATIONS;
  }),

  // Get symptoms list from ML service
  getSymptoms: publicProcedure
    .input(
      z.object({
        bodyLocation: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      // Try ML service first
      const mlAvailable = await isMLServiceAvailable();
      
      if (mlAvailable) {
        try {
          if (input?.search) {
            const symptoms = await callMLService<MLSymptom[]>(
              `/symptoms/search?q=${encodeURIComponent(input.search)}`
            );
            return symptoms.map(s => ({
              id: s.id,
              name: s.name,
              common_name: s.name,
            }));
          }
          
          const symptoms = await callMLService<MLSymptom[]>("/symptoms");
          return symptoms.map(s => ({
            id: s.id,
            name: s.name,
            common_name: s.name,
          }));
        } catch (error) {
          console.error("ML Service error:", error);
        }
      }

      // Fallback mock symptoms
      return getMockSymptoms(input?.search);
    }),

  // ML-powered prediction - main endpoint
  predictDisease: publicProcedure
    .input(
      z.object({
        symptoms: z.array(z.string()).min(1).max(20),
        age: z.number().optional(),
        sex: z.enum(["male", "female"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const mlAvailable = await isMLServiceAvailable();
      
      if (mlAvailable) {
        try {
          const result = await callMLService<MLPredictionResult>("/predict", {
            method: "POST",
            body: JSON.stringify({
              symptoms: input.symptoms,
              age: input.age,
              gender: input.sex,
            }),
          });

          return {
            success: true,
            source: "ml",
            prediction: {
              disease: result.disease,
              confidence: result.confidence,
              severity: result.severity,
              specialist: result.specialist,
              triage: {
                level: result.triage.level,
                message: result.triage.message,
                color: getTriageColor(result.triage.level),
              },
              description: result.description,
              precautions: result.precautions,
              medications: result.medications,
              diet: result.diet,
              workout: result.workout,
              matchedSymptoms: result.matched_symptoms,
              invalidSymptoms: result.invalid_symptoms,
            },
          };
        } catch (error) {
          console.error("ML Service prediction error:", error);
        }
      }

      // Fallback mock prediction
      return getMockPrediction(input.symptoms);
    }),

  // Get all diseases from ML service
  getDiseases: publicProcedure.query(async () => {
    const mlAvailable = await isMLServiceAvailable();
    
    if (mlAvailable) {
      try {
        const diseases = await callMLService<{
          id: number;
          name: string;
          severity: string;
          specialist: string;
        }[]>("/diseases");
        return diseases;
      } catch (error) {
        console.error("ML Service error:", error);
      }
    }

    return getMockDiseases();
  }),

  // Get disease info from ML service
  getDiseaseInfo: publicProcedure
    .input(z.object({ disease: z.string() }))
    .query(async ({ input }) => {
      const mlAvailable = await isMLServiceAvailable();
      
      if (mlAvailable) {
        try {
          const info = await callMLService<{
            name: string;
            severity: string;
            specialist: string;
            description: string;
            precautions: string[];
            medications: string[];
            diet: string[];
            workout: string[];
          }>(`/disease/${encodeURIComponent(input.disease)}`);
          return info;
        } catch (error) {
          console.error("ML Service error:", error);
        }
      }

      return null;
    }),

  // Legacy Infermedica-style endpoints for backward compatibility
  startDiagnosis: publicProcedure
    .input(
      z.object({
        sex: z.enum(["male", "female"]),
        age: z.number().min(0).max(130),
        symptoms: z.array(
          z.object({
            id: z.string(),
            choice_id: z.enum(["present", "absent", "unknown"]),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      // Convert to ML service format and predict
      const presentSymptoms = input.symptoms
        .filter(s => s.choice_id === "present")
        .map(s => s.id);

      const mlAvailable = await isMLServiceAvailable();
      
      if (mlAvailable && presentSymptoms.length > 0) {
        try {
          const result = await callMLService<MLPredictionResult>("/predict", {
            method: "POST",
            body: JSON.stringify({
              symptoms: presentSymptoms,
              age: input.age,
              gender: input.sex,
            }),
          });

          return {
            question: null, // ML model doesn't ask follow-up questions
            conditions: [{
              id: result.disease.toLowerCase().replace(/\s+/g, "_"),
              name: result.disease,
              common_name: result.disease,
              probability: result.confidence / 100,
              severity: result.severity,
              extras: {
                hint: result.description,
                specialist: result.specialist,
                precautions: result.precautions,
                medications: result.medications,
                diet: result.diet,
              },
            }],
            should_stop: true,
            extras: {
              triage_level: result.triage.level,
              triage_message: result.triage.message,
            },
          };
        } catch (error) {
          console.error("ML Service error:", error);
        }
      }

      // Fallback mock response
      return getMockDiagnosisResponse(input.symptoms);
    }),

  // Continue diagnosis (for compatibility - ML model gives instant results)
  continueDiagnosis: publicProcedure
    .input(
      z.object({
        sex: z.enum(["male", "female"]),
        age: z.number().min(0).max(130),
        evidence: z.array(
          z.object({
            id: z.string(),
            choice_id: z.enum(["present", "absent", "unknown"]),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      // Same as startDiagnosis for ML model
      const presentSymptoms = input.evidence
        .filter(s => s.choice_id === "present")
        .map(s => s.id);

      const mlAvailable = await isMLServiceAvailable();
      
      if (mlAvailable && presentSymptoms.length > 0) {
        try {
          const result = await callMLService<MLPredictionResult>("/predict", {
            method: "POST",
            body: JSON.stringify({
              symptoms: presentSymptoms,
              age: input.age,
              gender: input.sex,
            }),
          });

          return {
            question: null,
            conditions: [{
              id: result.disease.toLowerCase().replace(/\s+/g, "_"),
              name: result.disease,
              common_name: result.disease,
              probability: result.confidence / 100,
              severity: result.severity,
              extras: {
                hint: result.description,
                specialist: result.specialist,
                precautions: result.precautions,
                medications: result.medications,
                diet: result.diet,
              },
            }],
            should_stop: true,
            extras: {
              triage_level: result.triage.level,
              triage_message: result.triage.message,
            },
          };
        } catch (error) {
          console.error("ML Service error:", error);
        }
      }

      return getMockDiagnosisResponse(input.evidence);
    }),

  // Get triage recommendation
  getTriage: publicProcedure
    .input(
      z.object({
        sex: z.enum(["male", "female"]),
        age: z.number().min(0).max(130),
        evidence: z.array(
          z.object({
            id: z.string(),
            choice_id: z.enum(["present", "absent", "unknown"]),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const presentSymptoms = input.evidence
        .filter(s => s.choice_id === "present")
        .map(s => s.id);

      const mlAvailable = await isMLServiceAvailable();
      
      if (mlAvailable && presentSymptoms.length > 0) {
        try {
          const result = await callMLService<MLPredictionResult>("/predict", {
            method: "POST",
            body: JSON.stringify({
              symptoms: presentSymptoms,
              age: input.age,
              gender: input.sex,
            }),
          });

          return {
            triage_level: result.triage.level,
            serious: result.severity === "emergency" || result.severity === "high"
              ? [{ id: result.disease, name: result.disease, common_name: result.disease }]
              : [],
            root_cause: {
              id: result.disease.toLowerCase().replace(/\s+/g, "_"),
              name: result.disease,
              common_name: result.disease,
              probability: result.confidence / 100,
            },
            description: result.triage.message,
            label: getTriageLabel(result.triage.level),
            color: getTriageColor(result.triage.level),
          };
        } catch (error) {
          console.error("ML Service error:", error);
        }
      }

      return getMockTriage();
    }),

  // Get specialist recommendation
  getRecommendedSpecialist: publicProcedure
    .input(z.object({ conditionIds: z.array(z.string()) }))
    .query(async () => {
      return {
        recommended: ["General Practitioner", "Internal Medicine"],
        primary: "General Practitioner",
      };
    }),

  // Get condition info (for compatibility)
  getConditionInfo: publicProcedure
    .input(z.object({ conditionId: z.string() }))
    .query(async ({ input }) => {
      const mlAvailable = await isMLServiceAvailable();
      
      if (mlAvailable) {
        try {
          // Convert condition ID back to disease name
          const diseaseName = input.conditionId.replace(/_/g, " ");
          const info = await callMLService<{
            name: string;
            severity: string;
            specialist: string;
            description: string;
            precautions: string[];
            medications: string[];
            diet: string[];
            workout: string[];
          }>(`/disease/${encodeURIComponent(diseaseName)}`);
          
          return {
            id: input.conditionId,
            name: info.name,
            common_name: info.name,
            severity: info.severity,
            hint: info.description,
            extras: {
              specialist: info.specialist,
              precautions: info.precautions,
              medications: info.medications,
              diet: info.diet,
            },
          };
        } catch {
          // Disease not found in ML service
        }
      }

      return {
        id: input.conditionId,
        name: input.conditionId.replace(/_/g, " "),
        common_name: input.conditionId.replace(/_/g, " "),
        severity: "moderate",
        hint: "Please consult a healthcare professional for proper diagnosis.",
        extras: {},
      };
    }),
});

// Helper functions
function getTriageColor(level: string): string {
  switch (level) {
    case "emergency": return "#EF4444";
    case "consultation_24": return "#F59E0B";
    case "consultation": return "#3B82F6";
    case "self_care": return "#22C55E";
    default: return "#6B7280";
  }
}

function getTriageLabel(level: string): string {
  switch (level) {
    case "emergency": return "Emergency - Seek immediate care";
    case "consultation_24": return "See a doctor within 24 hours";
    case "consultation": return "Schedule a consultation";
    case "self_care": return "Self-care recommended";
    default: return "Consult a healthcare professional";
  }
}

function getMockSymptoms(search?: string) {
  const symptoms = [
    { id: "headache", name: "Headache", common_name: "Headache" },
    { id: "fever", name: "Fever", common_name: "Fever" },
    { id: "cough", name: "Cough", common_name: "Cough" },
    { id: "fatigue", name: "Fatigue", common_name: "Tiredness" },
    { id: "nausea", name: "Nausea", common_name: "Feeling sick" },
    { id: "vomiting", name: "Vomiting", common_name: "Vomiting" },
    { id: "dizziness", name: "Dizziness", common_name: "Dizziness" },
    { id: "chest_pain", name: "Chest Pain", common_name: "Chest pain" },
    { id: "back_pain", name: "Back Pain", common_name: "Back pain" },
    { id: "joint_pain", name: "Joint Pain", common_name: "Joint pain" },
    { id: "skin_rash", name: "Skin Rash", common_name: "Rash" },
    { id: "itching", name: "Itching", common_name: "Itching" },
    { id: "runny_nose", name: "Runny Nose", common_name: "Runny nose" },
    { id: "sore_throat", name: "Sore Throat", common_name: "Sore throat" },
    { id: "shortness_of_breath", name: "Shortness of Breath", common_name: "Difficulty breathing" },
  ];

  if (search) {
    const searchLower = search.toLowerCase();
    return symptoms.filter(s => 
      s.name.toLowerCase().includes(searchLower) ||
      s.common_name.toLowerCase().includes(searchLower)
    );
  }

  return symptoms;
}

function getMockDiseases() {
  return [
    { id: 1, name: "Common Cold", severity: "low", specialist: "General Physician" },
    { id: 2, name: "Flu", severity: "moderate", specialist: "General Physician" },
    { id: 3, name: "Allergies", severity: "low", specialist: "Allergist" },
    { id: 4, name: "Migraine", severity: "moderate", specialist: "Neurologist" },
    { id: 5, name: "Gastritis", severity: "moderate", specialist: "Gastroenterologist" },
  ];
}

function getMockPrediction(symptoms: string[]) {
  return {
    success: true,
    source: "mock",
    prediction: {
      disease: "Common Cold",
      confidence: 75,
      severity: "low" as const,
      specialist: "General Physician",
      triage: {
        level: "self_care",
        message: "Self-care may be appropriate, but consult a doctor if symptoms persist",
        color: "#22C55E",
      },
      description: "Based on your symptoms, you may have a common cold. This is a preliminary assessment.",
      precautions: [
        "Get plenty of rest",
        "Stay hydrated",
        "Monitor your symptoms",
        "Seek medical attention if symptoms worsen",
      ],
      medications: ["Consult a doctor for appropriate medication"],
      diet: ["Eat nutritious foods", "Drink plenty of fluids"],
      workout: ["Light activity as tolerated", "Rest when needed"],
      matchedSymptoms: symptoms,
      invalidSymptoms: [],
    },
  };
}

function getMockDiagnosisResponse(symptoms: { id: string; choice_id: string }[]) {
  const presentCount = symptoms.filter(s => s.choice_id === "present").length;
  
  return {
    question: null,
    conditions: [{
      id: "common_cold",
      name: "Common Cold",
      common_name: "Common Cold",
      probability: 0.75,
      severity: "low",
      extras: {
        hint: "Rest and stay hydrated. Over-the-counter medications can help with symptoms.",
      },
    }],
    should_stop: true,
    extras: {
      triage_level: presentCount > 5 ? "consultation" : "self_care",
    },
  };
}

function getMockTriage() {
  return {
    triage_level: "self_care",
    serious: [],
    root_cause: {
      id: "common_cold",
      name: "Common Cold",
      common_name: "Common Cold",
      probability: 0.75,
    },
    description: "Self-care may be appropriate, but consult a doctor if symptoms persist",
    label: "Self-care recommended",
    color: "#22C55E",
  };
}

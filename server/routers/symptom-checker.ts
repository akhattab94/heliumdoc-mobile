/**
 * Symptom Checker Router - Integrates multiple symptom checking services
 * 
 * Priority order:
 * 1. Infermedica API (clinical-grade, 2000+ conditions)
 * 2. Self-hosted ML model (Random Forest, 41 diseases)
 * 3. Mock data (fallback)
 */

import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";

// Infermedica API configuration
const INFERMEDICA_API_URL = "https://api.infermedica.com/v3";
const INFERMEDICA_APP_ID = process.env.INFERMEDICA_APP_ID || "";
const INFERMEDICA_APP_KEY = process.env.INFERMEDICA_APP_KEY || "";

// ML Service URL (runs on port 5001)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

// Helper function for Infermedica API calls
async function infermedicaFetch(endpoint: string, options: RequestInit = {}) {
  if (!INFERMEDICA_APP_ID || !INFERMEDICA_APP_KEY) {
    throw new Error("Infermedica API credentials not configured");
  }

  const response = await fetch(`${INFERMEDICA_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "App-Id": INFERMEDICA_APP_ID,
      "App-Key": INFERMEDICA_APP_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Infermedica API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Check if Infermedica API is available
async function isInfermedicaAvailable(): Promise<boolean> {
  if (!INFERMEDICA_APP_ID || !INFERMEDICA_APP_KEY) return false;
  try {
    const response = await fetch(`${INFERMEDICA_API_URL}/info`, {
      headers: {
        "App-Id": INFERMEDICA_APP_ID,
        "App-Key": INFERMEDICA_APP_KEY,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
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

// Helper function to call ML service
async function callMLService<T>(endpoint: string, options?: RequestInit): Promise<T> {
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

// Types
interface MLPredictionResult {
  success: boolean;
  disease: string;
  confidence: number;
  severity: "emergency" | "high" | "moderate" | "low";
  specialist: string;
  triage: { level: string; message: string };
  description: string;
  precautions: string[];
  medications: string[];
  diet: string[];
  workout: string[];
  matched_symptoms: string[];
  invalid_symptoms: string[];
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
  // Health check - returns which services are active
  healthCheck: publicProcedure.query(async () => {
    const [infermedicaAvailable, mlAvailable] = await Promise.all([
      isInfermedicaAvailable(),
      isMLServiceAvailable(),
    ]);

    return {
      infermedica: {
        available: infermedicaAvailable,
        conditions: "2000+",
        symptoms: "1500+",
      },
      mlService: {
        available: mlAvailable,
        url: ML_SERVICE_URL,
        model: "Random Forest",
        diseases: 41,
        symptoms: 132,
      },
      activeService: infermedicaAvailable ? "infermedica" : (mlAvailable ? "ml" : "mock"),
    };
  }),

  // Get API info from Infermedica
  getApiInfo: publicProcedure.query(async () => {
    try {
      return await infermedicaFetch("/info");
    } catch {
      return {
        updated_at: new Date().toISOString(),
        conditions_count: 41,
        symptoms_count: 132,
        source: "ml_fallback",
      };
    }
  }),

  // Get list of body locations/categories
  getBodyLocations: publicProcedure.query(async () => {
    return BODY_LOCATIONS;
  }),

  // Get symptoms list - Infermedica primary, ML fallback
  getSymptoms: publicProcedure
    .input(z.object({
      age: z.number().optional().default(30),
      sex: z.enum(["male", "female"]).optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const age = input?.age || 30;
      const sex = input?.sex;
      const search = input?.search;

      // Try Infermedica first
      const infermedicaAvailable = await isInfermedicaAvailable();
      if (infermedicaAvailable) {
        try {
          const params = new URLSearchParams();
          params.append("age.value", age.toString());
          if (sex) params.append("sex", sex);

          const symptoms = await infermedicaFetch(`/symptoms?${params.toString()}`);
          
          let filteredSymptoms = symptoms;
          if (search) {
            const searchLower = search.toLowerCase();
            filteredSymptoms = symptoms.filter((s: any) =>
              s.name.toLowerCase().includes(searchLower) ||
              (s.common_name && s.common_name.toLowerCase().includes(searchLower))
            );
          }

          return {
            source: "infermedica",
            symptoms: filteredSymptoms.map((s: any) => ({
              id: s.id,
              name: s.name,
              common_name: s.common_name || s.name,
              category: s.category,
            })),
            total: filteredSymptoms.length,
          };
        } catch (error) {
          console.error("Infermedica symptoms error:", error);
        }
      }

      // Fallback to ML service
      const mlAvailable = await isMLServiceAvailable();
      if (mlAvailable) {
        try {
          const endpoint = search 
            ? `/symptoms/search?q=${encodeURIComponent(search)}`
            : "/symptoms";
          const symptoms = await callMLService<any[]>(endpoint);
          return {
            source: "ml",
            symptoms: symptoms.map(s => ({
              id: s.id,
              name: s.name,
              common_name: s.name,
            })),
            total: symptoms.length,
          };
        } catch (error) {
          console.error("ML service symptoms error:", error);
        }
      }

      // Mock fallback
      return {
        source: "mock",
        symptoms: getMockSymptoms(search),
        total: getMockSymptoms(search).length,
      };
    }),

  // Search symptoms by text using Infermedica's NLP
  searchSymptoms: publicProcedure
    .input(z.object({
      phrase: z.string().min(2),
      age: z.number().optional().default(30),
      sex: z.enum(["male", "female"]).optional(),
      maxResults: z.number().optional().default(10),
    }))
    .query(async ({ input }) => {
      const infermedicaAvailable = await isInfermedicaAvailable();
      if (infermedicaAvailable) {
        try {
          const params = new URLSearchParams();
          params.append("phrase", input.phrase);
          params.append("age.value", input.age.toString());
          if (input.sex) params.append("sex", input.sex);
          params.append("max_results", input.maxResults.toString());

          const results = await infermedicaFetch(`/search?${params.toString()}`);
          return {
            source: "infermedica",
            results,
          };
        } catch (error) {
          console.error("Infermedica search error:", error);
        }
      }

      // Fallback
      const mockSymptoms = getMockSymptoms(input.phrase);
      return {
        source: "mock",
        results: mockSymptoms.slice(0, input.maxResults),
      };
    }),

  // Parse natural language text to extract symptoms (Infermedica NLP)
  parseText: publicProcedure
    .input(z.object({
      text: z.string().min(3),
      age: z.number(),
      sex: z.enum(["male", "female"]),
    }))
    .mutation(async ({ input }) => {
      const infermedicaAvailable = await isInfermedicaAvailable();
      if (infermedicaAvailable) {
        try {
          const result = await infermedicaFetch("/parse", {
            method: "POST",
            body: JSON.stringify({
              text: input.text,
              age: { value: input.age },
              sex: input.sex,
            }),
          });
          return {
            source: "infermedica",
            mentions: result.mentions || [],
            obvious: result.obvious || false,
          };
        } catch (error) {
          console.error("Infermedica parse error:", error);
        }
      }

      // Basic keyword matching fallback
      const keywords = input.text.toLowerCase().split(/\s+/);
      const mockSymptoms = getMockSymptoms();
      const matches = mockSymptoms.filter(s =>
        keywords.some(k => s.name.toLowerCase().includes(k))
      );

      return {
        source: "mock",
        mentions: matches.map(m => ({
          id: m.id,
          name: m.name,
          choice_id: "present",
        })),
        obvious: false,
      };
    }),

  // Get diagnosis - Infermedica primary with ML fallback
  getDiagnosis: publicProcedure
    .input(z.object({
      sex: z.enum(["male", "female"]),
      age: z.number().min(0).max(130),
      evidence: z.array(z.object({
        id: z.string(),
        choice_id: z.enum(["present", "absent", "unknown"]),
        source: z.enum(["initial", "suggest", "predefined"]).optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const infermedicaAvailable = await isInfermedicaAvailable();
      
      if (infermedicaAvailable) {
        try {
          const response = await infermedicaFetch("/diagnosis", {
            method: "POST",
            body: JSON.stringify({
              sex: input.sex,
              age: { value: input.age },
              evidence: input.evidence,
              extras: { disable_groups: true },
            }),
          });

          return {
            source: "infermedica",
            question: response.question,
            conditions: response.conditions.map((c: any) => ({
              id: c.id,
              name: c.name,
              common_name: c.common_name,
              probability: Math.round(c.probability * 100),
            })),
            should_stop: response.should_stop,
            extras: response.extras,
          };
        } catch (error) {
          console.error("Infermedica diagnosis error:", error);
        }
      }

      // ML service fallback
      const presentSymptoms = input.evidence
        .filter(e => e.choice_id === "present")
        .map(e => e.id);

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
            source: "ml",
            question: null,
            conditions: [{
              id: result.disease.toLowerCase().replace(/\s+/g, "_"),
              name: result.disease,
              common_name: result.disease,
              probability: result.confidence,
            }],
            should_stop: true,
            extras: {
              triage_level: result.triage.level,
              specialist: result.specialist,
              precautions: result.precautions,
            },
          };
        } catch (error) {
          console.error("ML service diagnosis error:", error);
        }
      }

      // Mock fallback
      return getMockDiagnosisResponse(input.evidence);
    }),

  // Get triage recommendation
  getTriage: publicProcedure
    .input(z.object({
      sex: z.enum(["male", "female"]),
      age: z.number().min(0).max(130),
      evidence: z.array(z.object({
        id: z.string(),
        choice_id: z.enum(["present", "absent", "unknown"]),
      })),
    }))
    .mutation(async ({ input }) => {
      const infermedicaAvailable = await isInfermedicaAvailable();
      
      if (infermedicaAvailable) {
        try {
          const response = await infermedicaFetch("/triage", {
            method: "POST",
            body: JSON.stringify({
              sex: input.sex,
              age: { value: input.age },
              evidence: input.evidence,
            }),
          });

          const triageMap: Record<string, { level: string; color: string; urgency: number }> = {
            emergency: { level: "Emergency", color: "#DC2626", urgency: 5 },
            emergency_ambulance: { level: "Emergency", color: "#DC2626", urgency: 5 },
            consultation_24: { level: "High", color: "#EA580C", urgency: 4 },
            consultation: { level: "Medium", color: "#CA8A04", urgency: 3 },
            self_care: { level: "Low", color: "#16A34A", urgency: 2 },
          };

          const triageInfo = triageMap[response.triage_level] || { level: "Unknown", color: "#6B7280", urgency: 1 };

          return {
            source: "infermedica",
            triage_level: response.triage_level,
            serious: response.serious || [],
            root_cause: response.root_cause,
            teleconsultation_applicable: response.teleconsultation_applicable,
            display: {
              level: triageInfo.level,
              color: triageInfo.color,
              urgency: triageInfo.urgency,
              recommendation: getTriageRecommendation(response.triage_level),
            },
          };
        } catch (error) {
          console.error("Infermedica triage error:", error);
        }
      }

      // ML service fallback
      const presentSymptoms = input.evidence
        .filter(e => e.choice_id === "present")
        .map(e => e.id);

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
            source: "ml",
            triage_level: result.triage.level,
            serious: result.severity === "emergency" || result.severity === "high"
              ? [{ id: result.disease, name: result.disease }]
              : [],
            root_cause: { id: result.disease, name: result.disease, probability: result.confidence / 100 },
            display: {
              level: result.triage.level,
              color: getTriageColor(result.triage.level),
              urgency: getTriageUrgency(result.triage.level),
              recommendation: result.triage.message,
            },
          };
        } catch (error) {
          console.error("ML service triage error:", error);
        }
      }

      return getMockTriage();
    }),

  // Get condition details
  getConditionDetails: publicProcedure
    .input(z.object({
      conditionId: z.string(),
      age: z.number().optional().default(30),
      sex: z.enum(["male", "female"]).optional(),
    }))
    .query(async ({ input }) => {
      const infermedicaAvailable = await isInfermedicaAvailable();
      
      if (infermedicaAvailable) {
        try {
          const params = new URLSearchParams();
          params.append("age.value", input.age.toString());
          if (input.sex) params.append("sex", input.sex);

          const condition = await infermedicaFetch(`/conditions/${input.conditionId}?${params.toString()}`);
          return {
            source: "infermedica",
            ...condition,
          };
        } catch (error) {
          console.error("Infermedica condition details error:", error);
        }
      }

      // ML service fallback
      const mlAvailable = await isMLServiceAvailable();
      if (mlAvailable) {
        try {
          const diseaseName = input.conditionId.replace(/_/g, " ");
          const info = await callMLService<any>(`/disease/${encodeURIComponent(diseaseName)}`);
          return {
            source: "ml",
            id: input.conditionId,
            name: info.name,
            common_name: info.name,
            severity: info.severity,
            extras: {
              hint: info.description,
              specialist: info.specialist,
              precautions: info.precautions,
              medications: info.medications,
              diet: info.diet,
            },
          };
        } catch {
          // Not found
        }
      }

      return {
        source: "mock",
        id: input.conditionId,
        name: input.conditionId.replace(/_/g, " "),
        common_name: input.conditionId.replace(/_/g, " "),
        severity: "moderate",
        extras: { hint: "Please consult a healthcare professional." },
      };
    }),

  // Get suggested symptoms based on current evidence
  getSuggestedSymptoms: publicProcedure
    .input(z.object({
      sex: z.enum(["male", "female"]),
      age: z.number(),
      evidence: z.array(z.object({
        id: z.string(),
        choice_id: z.enum(["present", "absent", "unknown"]),
      })),
    }))
    .mutation(async ({ input }) => {
      const infermedicaAvailable = await isInfermedicaAvailable();
      
      if (infermedicaAvailable) {
        try {
          const result = await infermedicaFetch("/suggest", {
            method: "POST",
            body: JSON.stringify({
              sex: input.sex,
              age: { value: input.age },
              evidence: input.evidence,
            }),
          });
          return {
            source: "infermedica",
            suggestions: result,
          };
        } catch (error) {
          console.error("Infermedica suggest error:", error);
        }
      }

      return {
        source: "mock",
        suggestions: [],
      };
    }),

  // Explain why a condition was suggested
  explainCondition: publicProcedure
    .input(z.object({
      sex: z.enum(["male", "female"]),
      age: z.number(),
      evidence: z.array(z.object({
        id: z.string(),
        choice_id: z.enum(["present", "absent", "unknown"]),
      })),
      target: z.string(),
    }))
    .mutation(async ({ input }) => {
      const infermedicaAvailable = await isInfermedicaAvailable();
      
      if (infermedicaAvailable) {
        try {
          const result = await infermedicaFetch("/explain", {
            method: "POST",
            body: JSON.stringify({
              sex: input.sex,
              age: { value: input.age },
              evidence: input.evidence,
              target: input.target,
            }),
          });
          return {
            source: "infermedica",
            ...result,
          };
        } catch (error) {
          console.error("Infermedica explain error:", error);
        }
      }

      return {
        source: "mock",
        supporting_evidence: [],
        conflicting_evidence: [],
        unconfirmed_evidence: [],
      };
    }),

  // Combined analysis - full symptom check flow
  analyzeSymptoms: publicProcedure
    .input(z.object({
      sex: z.enum(["male", "female"]),
      age: z.number(),
      symptoms: z.array(z.object({
        id: z.string(),
        present: z.boolean(),
      })),
    }))
    .mutation(async ({ input }) => {
      const evidence = input.symptoms.map(s => ({
        id: s.id,
        choice_id: s.present ? "present" as const : "absent" as const,
        source: "initial" as const,
      }));

      const diagnosisRequest = {
        sex: input.sex,
        age: { value: input.age },
        evidence,
        extras: { disable_groups: true },
      };

      const infermedicaAvailable = await isInfermedicaAvailable();
      
      if (infermedicaAvailable) {
        try {
          const [diagnosis, triage] = await Promise.all([
            infermedicaFetch("/diagnosis", {
              method: "POST",
              body: JSON.stringify(diagnosisRequest),
            }),
            infermedicaFetch("/triage", {
              method: "POST",
              body: JSON.stringify({
                sex: input.sex,
                age: { value: input.age },
                evidence,
              }),
            }),
          ]);

          const triageMap: Record<string, { level: string; color: string; urgency: number }> = {
            emergency: { level: "Emergency", color: "#DC2626", urgency: 5 },
            emergency_ambulance: { level: "Emergency", color: "#DC2626", urgency: 5 },
            consultation_24: { level: "High", color: "#EA580C", urgency: 4 },
            consultation: { level: "Medium", color: "#CA8A04", urgency: 3 },
            self_care: { level: "Low", color: "#16A34A", urgency: 2 },
          };

          const triageInfo = triageMap[triage.triage_level] || { level: "Very Low", color: "#6B7280", urgency: 1 };

          return {
            source: "infermedica",
            conditions: diagnosis.conditions.map((c: any) => ({
              id: c.id,
              name: c.name,
              common_name: c.common_name,
              probability: Math.round(c.probability * 100),
            })),
            question: diagnosis.question,
            should_stop: diagnosis.should_stop,
            triage: {
              level: triageInfo.level,
              color: triageInfo.color,
              urgency: triageInfo.urgency,
              serious: triage.serious || [],
              teleconsultation_applicable: triage.teleconsultation_applicable,
              recommendation: getTriageRecommendation(triage.triage_level),
            },
          };
        } catch (error) {
          console.error("Infermedica analyze error:", error);
        }
      }

      // ML service fallback
      const presentSymptoms = input.symptoms.filter(s => s.present).map(s => s.id);
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
            source: "ml",
            conditions: [{
              id: result.disease.toLowerCase().replace(/\s+/g, "_"),
              name: result.disease,
              common_name: result.disease,
              probability: result.confidence,
            }],
            question: null,
            should_stop: true,
            triage: {
              level: result.triage.level,
              color: getTriageColor(result.triage.level),
              urgency: getTriageUrgency(result.triage.level),
              serious: [],
              teleconsultation_applicable: true,
              recommendation: result.triage.message,
            },
          };
        } catch (error) {
          console.error("ML service analyze error:", error);
        }
      }

      // Mock fallback
      return {
        source: "mock",
        conditions: [{
          id: "common_cold",
          name: "Common Cold",
          common_name: "Common Cold",
          probability: 75,
        }],
        question: null,
        should_stop: true,
        triage: {
          level: "Low",
          color: "#16A34A",
          urgency: 2,
          serious: [],
          teleconsultation_applicable: true,
          recommendation: "Self-care may be appropriate. Monitor symptoms and consult a doctor if they worsen.",
        },
      };
    }),

  // Get risk factors
  getRiskFactors: publicProcedure
    .input(z.object({
      age: z.number().optional().default(30),
      sex: z.enum(["male", "female"]).optional(),
    }))
    .query(async ({ input }) => {
      const infermedicaAvailable = await isInfermedicaAvailable();
      
      if (infermedicaAvailable) {
        try {
          const params = new URLSearchParams();
          params.append("age.value", input.age.toString());
          if (input.sex) params.append("sex", input.sex);

          return await infermedicaFetch(`/risk_factors?${params.toString()}`);
        } catch (error) {
          console.error("Infermedica risk factors error:", error);
        }
      }

      return [];
    }),

  // ML-specific prediction endpoint
  predictDisease: publicProcedure
    .input(z.object({
      symptoms: z.array(z.string()).min(1).max(20),
      age: z.number().optional(),
      sex: z.enum(["male", "female"]).optional(),
    }))
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

      return getMockPrediction(input.symptoms);
    }),

  // Get all diseases from ML service
  getDiseases: publicProcedure.query(async () => {
    const mlAvailable = await isMLServiceAvailable();
    
    if (mlAvailable) {
      try {
        return await callMLService<any[]>("/diseases");
      } catch (error) {
        console.error("ML Service diseases error:", error);
      }
    }

    return getMockDiseases();
  }),
});

// Helper functions
function getTriageRecommendation(level: string): string {
  const recommendations: Record<string, string> = {
    emergency: "Call emergency services (999) immediately. This may be a life-threatening condition.",
    emergency_ambulance: "Call an ambulance immediately. Do not drive yourself to the hospital.",
    consultation_24: "See a doctor within 24 hours. Your symptoms require prompt medical attention.",
    consultation: "Schedule an appointment with a doctor. Your symptoms should be evaluated by a healthcare professional.",
    self_care: "Your symptoms suggest a minor condition. Rest, stay hydrated, and monitor your symptoms. See a doctor if symptoms worsen.",
  };
  return recommendations[level] || "Please consult with a healthcare professional for proper evaluation.";
}

function getTriageColor(level: string): string {
  const colors: Record<string, string> = {
    emergency: "#DC2626",
    consultation_24: "#EA580C",
    consultation: "#CA8A04",
    self_care: "#16A34A",
  };
  return colors[level] || "#6B7280";
}

function getTriageUrgency(level: string): number {
  const urgency: Record<string, number> = {
    emergency: 5,
    consultation_24: 4,
    consultation: 3,
    self_care: 2,
  };
  return urgency[level] || 1;
}

function getMockSymptoms(search?: string) {
  const symptoms = [
    { id: "s_21", name: "Headache", common_name: "Headache" },
    { id: "s_98", name: "Fever", common_name: "Fever" },
    { id: "s_50", name: "Cough", common_name: "Cough" },
    { id: "s_13", name: "Fatigue", common_name: "Tiredness" },
    { id: "s_156", name: "Nausea", common_name: "Feeling sick" },
    { id: "s_305", name: "Vomiting", common_name: "Vomiting" },
    { id: "s_207", name: "Dizziness", common_name: "Dizziness" },
    { id: "s_50", name: "Chest Pain", common_name: "Chest pain" },
    { id: "s_88", name: "Back Pain", common_name: "Back pain" },
    { id: "s_44", name: "Joint Pain", common_name: "Joint pain" },
    { id: "s_1190", name: "Skin Rash", common_name: "Rash" },
    { id: "s_241", name: "Itching", common_name: "Itching" },
    { id: "s_8", name: "Runny Nose", common_name: "Runny nose" },
    { id: "s_102", name: "Sore Throat", common_name: "Sore throat" },
    { id: "s_2", name: "Shortness of Breath", common_name: "Difficulty breathing" },
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
        message: "Self-care may be appropriate. Monitor symptoms and consult a doctor if they worsen.",
        color: "#16A34A",
      },
      description: "Based on your symptoms, you may have a common cold. This is a preliminary assessment.",
      precautions: ["Get plenty of rest", "Stay hydrated", "Monitor symptoms", "Seek medical attention if symptoms worsen"],
      medications: ["Consult a doctor for appropriate medication"],
      diet: ["Eat nutritious foods", "Drink plenty of fluids"],
      workout: ["Light activity as tolerated", "Rest when needed"],
      matchedSymptoms: symptoms,
      invalidSymptoms: [],
    },
  };
}

function getMockDiagnosisResponse(symptoms: { id: string; choice_id: string }[]) {
  return {
    source: "mock",
    question: null,
    conditions: [{
      id: "common_cold",
      name: "Common Cold",
      common_name: "Common Cold",
      probability: 75,
    }],
    should_stop: true,
    extras: {
      triage_level: symptoms.filter(s => s.choice_id === "present").length > 5 ? "consultation" : "self_care",
    },
  };
}

function getMockTriage() {
  return {
    source: "mock",
    triage_level: "self_care",
    serious: [],
    root_cause: { id: "common_cold", name: "Common Cold", probability: 0.75 },
    display: {
      level: "Low",
      color: "#16A34A",
      urgency: 2,
      recommendation: "Self-care may be appropriate. Monitor symptoms and consult a doctor if they worsen.",
    },
  };
}

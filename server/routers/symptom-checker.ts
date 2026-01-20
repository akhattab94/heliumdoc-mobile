import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";

// Infermedica API configuration
const INFERMEDICA_API_URL = process.env.INFERMEDICA_API_URL || "https://api.infermedica.com";
const INFERMEDICA_APP_ID = process.env.INFERMEDICA_APP_ID || "";
const INFERMEDICA_APP_KEY = process.env.INFERMEDICA_APP_KEY || "";

// Helper function to make Infermedica API calls
async function infermedicaRequest(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: Record<string, unknown>
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "App-Id": INFERMEDICA_APP_ID,
    "App-Key": INFERMEDICA_APP_KEY,
  };

  const response = await fetch(`${INFERMEDICA_API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Infermedica API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Fallback mock data when API credentials are not configured
const MOCK_SYMPTOMS = [
  { id: "s_21", name: "Headache", common_name: "Headache" },
  { id: "s_98", name: "Fever", common_name: "Fever" },
  { id: "s_13", name: "Abdominal pain", common_name: "Stomach pain" },
  { id: "s_156", name: "Nausea", common_name: "Feeling sick" },
  { id: "s_305", name: "Cough", common_name: "Cough" },
  { id: "s_102", name: "Sore throat", common_name: "Sore throat" },
  { id: "s_88", name: "Shortness of breath", common_name: "Difficulty breathing" },
  { id: "s_50", name: "Chest pain", common_name: "Chest pain" },
  { id: "s_1193", name: "Fatigue", common_name: "Tiredness" },
  { id: "s_241", name: "Dizziness", common_name: "Dizziness" },
  { id: "s_8", name: "Back pain", common_name: "Back pain" },
  { id: "s_44", name: "Joint pain", common_name: "Joint pain" },
  { id: "s_1782", name: "Runny nose", common_name: "Runny nose" },
  { id: "s_107", name: "Sneezing", common_name: "Sneezing" },
  { id: "s_2100", name: "Loss of taste", common_name: "Can't taste food" },
  { id: "s_2101", name: "Loss of smell", common_name: "Can't smell" },
];

const MOCK_CONDITIONS = [
  {
    id: "c_87",
    name: "Common cold",
    common_name: "Common cold",
    probability: 0.85,
    severity: "mild",
    acuteness: "acute",
    extras: {
      hint: "Rest, stay hydrated, and take over-the-counter medications for symptom relief.",
    },
  },
  {
    id: "c_10",
    name: "Influenza",
    common_name: "Flu",
    probability: 0.65,
    severity: "moderate",
    acuteness: "acute",
    extras: {
      hint: "Rest, fluids, and antiviral medications if prescribed within 48 hours of symptom onset.",
    },
  },
  {
    id: "c_55",
    name: "Migraine",
    common_name: "Migraine headache",
    probability: 0.45,
    severity: "moderate",
    acuteness: "chronic_with_exacerbations",
    extras: {
      hint: "Rest in a dark, quiet room. Over-the-counter pain relievers may help.",
    },
  },
];

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
  // Get list of body locations/categories
  getBodyLocations: publicProcedure.query(async () => {
    return BODY_LOCATIONS;
  }),

  // Get symptoms list (optionally filtered by body location)
  getSymptoms: publicProcedure
    .input(
      z.object({
        bodyLocation: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      // If API credentials are configured, use real API
      if (INFERMEDICA_APP_ID && INFERMEDICA_APP_KEY) {
        try {
          const symptoms = await infermedicaRequest("/v3/symptoms");
          
          let filtered = symptoms;
          if (input?.search) {
            const searchLower = input.search.toLowerCase();
            filtered = symptoms.filter((s: { name: string; common_name: string }) =>
              s.name.toLowerCase().includes(searchLower) ||
              s.common_name.toLowerCase().includes(searchLower)
            );
          }
          
          return filtered.slice(0, 50); // Limit results
        } catch (error) {
          console.error("Infermedica API error:", error);
          // Fall back to mock data
        }
      }

      // Return mock data
      let filtered = MOCK_SYMPTOMS;
      if (input?.search) {
        const searchLower = input.search.toLowerCase();
        filtered = MOCK_SYMPTOMS.filter(
          (s) =>
            s.name.toLowerCase().includes(searchLower) ||
            s.common_name.toLowerCase().includes(searchLower)
        );
      }
      return filtered;
    }),

  // Start a new diagnosis session
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
      // If API credentials are configured, use real API
      if (INFERMEDICA_APP_ID && INFERMEDICA_APP_KEY) {
        try {
          const response = await infermedicaRequest("/v3/diagnosis", "POST", {
            sex: input.sex,
            age: { value: input.age },
            evidence: input.symptoms.map((s) => ({
              id: s.id,
              choice_id: s.choice_id,
            })),
          });

          return {
            question: response.question,
            conditions: response.conditions,
            should_stop: response.should_stop,
            extras: response.extras,
          };
        } catch (error) {
          console.error("Infermedica API error:", error);
          // Fall back to mock response
        }
      }

      // Return mock diagnosis
      return {
        question: {
          type: "single",
          text: "Do you have a runny nose?",
          items: [
            { id: "s_1782", name: "Runny nose", choices: [
              { id: "present", label: "Yes" },
              { id: "absent", label: "No" },
              { id: "unknown", label: "Don't know" },
            ]},
          ],
        },
        conditions: MOCK_CONDITIONS.map((c) => ({
          ...c,
          probability: Math.random() * 0.5 + 0.3,
        })),
        should_stop: false,
        extras: {},
      };
    }),

  // Continue diagnosis with additional evidence
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
      // If API credentials are configured, use real API
      if (INFERMEDICA_APP_ID && INFERMEDICA_APP_KEY) {
        try {
          const response = await infermedicaRequest("/v3/diagnosis", "POST", {
            sex: input.sex,
            age: { value: input.age },
            evidence: input.evidence,
          });

          return {
            question: response.question,
            conditions: response.conditions,
            should_stop: response.should_stop,
            extras: response.extras,
          };
        } catch (error) {
          console.error("Infermedica API error:", error);
        }
      }

      // Return mock final diagnosis after a few questions
      if (input.evidence.length >= 5) {
        return {
          question: null,
          conditions: MOCK_CONDITIONS,
          should_stop: true,
          extras: {
            triage_level: "consultation_24",
            serious: [],
          },
        };
      }

      // Return another question
      const mockQuestions = [
        { id: "s_107", text: "Are you sneezing frequently?" },
        { id: "s_102", text: "Do you have a sore throat?" },
        { id: "s_1193", text: "Are you feeling unusually tired?" },
        { id: "s_241", text: "Do you feel dizzy?" },
      ];

      const questionIndex = Math.min(input.evidence.length - 1, mockQuestions.length - 1);
      const q = mockQuestions[questionIndex];

      return {
        question: {
          type: "single",
          text: q.text,
          items: [
            {
              id: q.id,
              name: q.text,
              choices: [
                { id: "present", label: "Yes" },
                { id: "absent", label: "No" },
                { id: "unknown", label: "Don't know" },
              ],
            },
          ],
        },
        conditions: MOCK_CONDITIONS.map((c) => ({
          ...c,
          probability: Math.min(0.95, c.probability + Math.random() * 0.1),
        })),
        should_stop: false,
        extras: {},
      };
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
      // If API credentials are configured, use real API
      if (INFERMEDICA_APP_ID && INFERMEDICA_APP_KEY) {
        try {
          const response = await infermedicaRequest("/v3/triage", "POST", {
            sex: input.sex,
            age: { value: input.age },
            evidence: input.evidence,
          });

          return response;
        } catch (error) {
          console.error("Infermedica API error:", error);
        }
      }

      // Return mock triage
      const triageLevels = [
        {
          level: "emergency",
          label: "Emergency",
          description: "Seek emergency care immediately",
          color: "#EF4444",
        },
        {
          level: "consultation_24",
          label: "See a doctor within 24 hours",
          description: "Schedule an appointment as soon as possible",
          color: "#F59E0B",
        },
        {
          level: "consultation",
          label: "See a doctor",
          description: "Schedule a consultation at your convenience",
          color: "#3B82F6",
        },
        {
          level: "self_care",
          label: "Self-care",
          description: "You can manage this at home with self-care",
          color: "#22C55E",
        },
      ];

      // Determine triage level based on symptoms
      const hasSerious = input.evidence.some((e) =>
        ["s_50", "s_88"].includes(e.id) && e.choice_id === "present"
      );

      const triageIndex = hasSerious ? 0 : input.evidence.length > 5 ? 1 : 2;

      return {
        triage_level: triageLevels[triageIndex].level,
        serious: hasSerious
          ? [{ id: "c_emergency", name: "Possible serious condition", common_name: "Requires immediate attention" }]
          : [],
        root_cause: {
          id: "c_87",
          name: "Common cold",
          common_name: "Common cold",
          probability: 0.75,
        },
        description: triageLevels[triageIndex].description,
        label: triageLevels[triageIndex].label,
        color: triageLevels[triageIndex].color,
      };
    }),

  // Get condition details
  getConditionInfo: publicProcedure
    .input(z.object({ conditionId: z.string() }))
    .query(async ({ input }) => {
      // If API credentials are configured, use real API
      if (INFERMEDICA_APP_ID && INFERMEDICA_APP_KEY) {
        try {
          const response = await infermedicaRequest(`/v3/conditions/${input.conditionId}`);
          return response;
        } catch (error) {
          console.error("Infermedica API error:", error);
        }
      }

      // Return mock condition info
      const condition = MOCK_CONDITIONS.find((c) => c.id === input.conditionId);
      return {
        id: condition?.id || input.conditionId,
        name: condition?.name || "Unknown Condition",
        common_name: condition?.common_name || "Unknown",
        severity: condition?.severity || "moderate",
        acuteness: condition?.acuteness || "acute",
        prevalence: "common",
        hint: condition?.extras?.hint || "Please consult a healthcare professional for proper diagnosis.",
        icd10_code: "J00",
        categories: ["respiratory"],
        extras: {
          hint: condition?.extras?.hint || "Consult a doctor for proper diagnosis and treatment.",
        },
      };
    }),

  // Get specialist recommendation based on conditions
  getRecommendedSpecialist: publicProcedure
    .input(
      z.object({
        conditionIds: z.array(z.string()),
      })
    )
    .query(async ({ input }) => {
      // Map conditions to specialists
      const conditionSpecialistMap: Record<string, string[]> = {
        c_87: ["General Practitioner", "Internal Medicine"],
        c_10: ["General Practitioner", "Internal Medicine"],
        c_55: ["Neurologist", "General Practitioner"],
        c_49: ["Cardiologist", "Emergency Medicine"],
        c_234: ["Gastroenterologist", "General Practitioner"],
        c_123: ["Pulmonologist", "General Practitioner"],
      };

      const specialists = new Set<string>();
      for (const conditionId of input.conditionIds) {
        const specialistList = conditionSpecialistMap[conditionId] || ["General Practitioner"];
        specialistList.forEach((s) => specialists.add(s));
      }

      return {
        recommended: Array.from(specialists),
        primary: Array.from(specialists)[0] || "General Practitioner",
      };
    }),
});

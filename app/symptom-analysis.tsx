import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

interface Condition {
  name: string;
  likelihood: number;
  description: string;
  severity: "low" | "medium" | "high";
  specialist: string;
}

interface AnalysisResult {
  conditions: Condition[];
  recommendedSpecialist: string;
  selfCareTips: string[];
}

// Simulated AI analysis based on symptoms
const analyzeSymptoms = (symptoms: string[], age: string, gender: string): AnalysisResult => {
  const symptomList = symptoms.map((s) => s.toLowerCase());
  const conditions: Condition[] = [];

  // Respiratory conditions
  if (symptomList.some((s) => ["cough", "shortness of breath", "wheezing", "chest tightness"].includes(s))) {
    conditions.push({
      name: "Respiratory Infection",
      likelihood: 72,
      description: "A common infection affecting the respiratory tract, often caused by viruses or bacteria.",
      severity: "medium",
      specialist: "Pulmonologist",
    });
  }

  // Cardiac conditions
  if (symptomList.some((s) => ["chest pain", "palpitations", "rapid heartbeat", "irregular heartbeat"].includes(s))) {
    conditions.push({
      name: "Cardiac Arrhythmia",
      likelihood: 45,
      description: "An irregular heartbeat that may cause the heart to beat too fast, too slow, or irregularly.",
      severity: "high",
      specialist: "Cardiologist",
    });
  }

  // Digestive conditions
  if (symptomList.some((s) => ["nausea", "vomiting", "abdominal pain", "diarrhea", "bloating"].includes(s))) {
    conditions.push({
      name: "Gastroenteritis",
      likelihood: 68,
      description: "Inflammation of the stomach and intestines, typically resulting from bacterial or viral infection.",
      severity: "low",
      specialist: "Gastroenterologist",
    });
  }

  // Neurological conditions
  if (symptomList.some((s) => ["headache", "dizziness", "migraine", "confusion"].includes(s))) {
    conditions.push({
      name: "Tension Headache / Migraine",
      likelihood: 78,
      description: "A common type of headache characterized by mild to moderate pain, often described as a tight band around the head.",
      severity: "low",
      specialist: "Neurologist",
    });
  }

  // Mental health
  if (symptomList.some((s) => ["anxiety", "depression", "insomnia", "stress", "panic attacks"].includes(s))) {
    conditions.push({
      name: "Anxiety Disorder",
      likelihood: 65,
      description: "A mental health condition characterized by excessive worry, fear, or nervousness that interferes with daily activities.",
      severity: "medium",
      specialist: "Psychiatrist",
    });
  }

  // General conditions
  if (symptomList.some((s) => ["fatigue", "fever", "weakness", "weight loss"].includes(s))) {
    conditions.push({
      name: "Viral Infection",
      likelihood: 58,
      description: "A common illness caused by viruses, often presenting with flu-like symptoms.",
      severity: "low",
      specialist: "General Physician",
    });
  }

  // Musculoskeletal
  if (symptomList.some((s) => ["joint pain", "back pain", "muscle aches", "stiffness"].includes(s))) {
    conditions.push({
      name: "Musculoskeletal Strain",
      likelihood: 70,
      description: "Injury to muscles, tendons, or ligaments caused by overuse, improper use, or trauma.",
      severity: "low",
      specialist: "Orthopedic Surgeon",
    });
  }

  // Skin conditions
  if (symptomList.some((s) => ["rash", "itching", "dry skin", "hives"].includes(s))) {
    conditions.push({
      name: "Dermatitis",
      likelihood: 62,
      description: "Inflammation of the skin causing itchy, red, and swollen skin.",
      severity: "low",
      specialist: "Dermatologist",
    });
  }

  // Default condition if none match
  if (conditions.length === 0) {
    conditions.push({
      name: "General Health Concern",
      likelihood: 50,
      description: "Your symptoms may indicate a minor health issue. A general check-up is recommended.",
      severity: "low",
      specialist: "General Physician",
    });
  }

  // Sort by likelihood
  conditions.sort((a, b) => b.likelihood - a.likelihood);

  const selfCareTips = [
    "Get adequate rest and sleep (7-9 hours per night)",
    "Stay well hydrated by drinking plenty of water",
    "Maintain a balanced diet rich in fruits and vegetables",
    "Avoid strenuous physical activity until symptoms improve",
    "Monitor your symptoms and seek medical attention if they worsen",
    "Practice stress-reduction techniques like deep breathing",
  ];

  return {
    conditions: conditions.slice(0, 4),
    recommendedSpecialist: conditions[0]?.specialist || "General Physician",
    selfCareTips,
  };
};

export default function SymptomAnalysisScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ symptoms: string; age: string; gender: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const symptoms = params.symptoms?.split(",") || [];

  useEffect(() => {
    // Simulate AI analysis delay
    const timer = setTimeout(() => {
      const analysisResult = analyzeSymptoms(symptoms, params.age || "", params.gender || "");
      setResult(analysisResult);
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return colors.error;
      case "medium":
        return colors.warning;
      default:
        return colors.success;
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: "Analyzing...", headerTintColor: "#fff", headerStyle: { backgroundColor: colors.primary } }} />
        <ScreenContainer className="items-center justify-center">
          <View className="items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-lg font-semibold text-foreground mt-4">Analyzing your symptoms...</Text>
            <Text className="text-sm text-muted mt-2">This may take a moment</Text>
          </View>
        </ScreenContainer>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Analysis Results", headerTintColor: "#fff", headerStyle: { backgroundColor: colors.primary } }} />
      <ScreenContainer edges={["left", "right"]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="bg-primary px-6 pt-6 pb-8" style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
            <View className="flex-row items-center gap-3 mb-2">
              <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                <Ionicons name="checkmark-circle" size={28} color="#fff" />
              </View>
              <View>
                <Text className="text-xl font-bold text-white">Analysis Complete</Text>
                <Text className="text-sm text-white/80">{symptoms.length} symptoms analyzed</Text>
              </View>
            </View>
          </View>

          {/* Possible Conditions */}
          <View className="px-6 pt-6">
            <Text className="text-lg font-bold text-foreground mb-4">Possible Conditions</Text>
            
            {result?.conditions.map((condition, index) => (
              <View 
                key={index} 
                className="bg-surface rounded-2xl p-4 mb-3 shadow-sm"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">{condition.name}</Text>
                    <View className="flex-row items-center mt-1 gap-2">
                      <View className={`px-2 py-0.5 rounded`} style={{ backgroundColor: `${getSeverityColor(condition.severity)}20` }}>
                        <Text className="text-xs font-medium" style={{ color: getSeverityColor(condition.severity) }}>
                          {condition.severity.toUpperCase()} SEVERITY
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-2xl font-bold text-primary">{condition.likelihood}%</Text>
                    <Text className="text-xs text-muted">likelihood</Text>
                  </View>
                </View>
                <Text className="text-sm text-muted leading-5 mt-2">{condition.description}</Text>
                <View className="flex-row items-center mt-3 pt-3 border-t border-border">
                  <Ionicons name="medical" size={16} color={colors.primary} />
                  <Text className="text-sm text-primary ml-2">Recommended: {condition.specialist}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Recommended Specialist */}
          <View className="px-6 pt-4">
            <Text className="text-lg font-bold text-foreground mb-3">Recommended Action</Text>
            <Pressable
              className="bg-primary rounded-2xl p-4 flex-row items-center"
              onPress={() => router.push({ pathname: "/doctor-search", params: { specialty: result?.recommendedSpecialist } })}
              style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
            >
              <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                <Ionicons name="person" size={24} color="#fff" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-base font-semibold text-white">Find a {result?.recommendedSpecialist}</Text>
                <Text className="text-sm text-white/80">Book an appointment today</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Self-Care Tips */}
          <View className="px-6 pt-6 pb-8">
            <Text className="text-lg font-bold text-foreground mb-3">Self-Care Tips</Text>
            <View className="bg-surface rounded-2xl p-4 shadow-sm" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
              {result?.selfCareTips.map((tip, index) => (
                <View key={index} className={`flex-row items-start ${index > 0 ? "mt-3" : ""}`}>
                  <View className="w-6 h-6 rounded-full bg-success/20 items-center justify-center mt-0.5">
                    <Ionicons name="checkmark" size={14} color={colors.success} />
                  </View>
                  <Text className="flex-1 ml-3 text-sm text-foreground leading-5">{tip}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Disclaimer */}
          <View className="px-6 pb-8">
            <View className="flex-row items-start bg-warning/10 rounded-xl p-4">
              <Ionicons name="warning" size={20} color={colors.warning} />
              <Text className="flex-1 ml-2 text-xs text-muted leading-5">
                This analysis is based on AI and should not replace professional medical advice. 
                If you experience severe symptoms, please seek immediate medical attention.
              </Text>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    </>
  );
}

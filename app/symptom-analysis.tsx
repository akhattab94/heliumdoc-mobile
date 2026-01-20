import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

interface Condition {
  id: string;
  name: string;
  common_name: string;
  probability: number;
  severity?: string;
  acuteness?: string;
  extras?: {
    hint?: string;
  };
}

interface DiagnosisQuestion {
  type: string;
  text: string;
  items: Array<{
    id: string;
    name: string;
    choices: Array<{
      id: string;
      label: string;
    }>;
  }>;
}

export default function SymptomAnalysisScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{
    symptomIds: string;
    symptoms: string;
    age: string;
    gender: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<DiagnosisQuestion | null>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [evidence, setEvidence] = useState<Array<{ id: string; choice_id: "present" | "absent" | "unknown" }>>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [triageResult, setTriageResult] = useState<{
    level: string;
    label: string;
    description: string;
    color: string;
  } | null>(null);

  const symptomIds = params.symptomIds?.split(",") || [];
  const symptomNames = params.symptoms?.split(",") || [];
  const age = parseInt(params.age || "30", 10);
  const sex = (params.gender as "male" | "female") || "male";

  // Start diagnosis mutation
  const startDiagnosis = trpc.symptomChecker.startDiagnosis.useMutation();
  const continueDiagnosis = trpc.symptomChecker.continueDiagnosis.useMutation();
  const getTriage = trpc.symptomChecker.getTriage.useMutation();
  const { data: recommendedSpecialist } = trpc.symptomChecker.getRecommendedSpecialist.useQuery(
    { conditionIds: conditions.slice(0, 3).map((c) => c.id) },
    { enabled: conditions.length > 0 && isComplete }
  );

  // Initialize diagnosis on mount
  useEffect(() => {
    const initDiagnosis = async () => {
      try {
        // Convert symptom IDs to evidence format
        const initialEvidence = symptomIds.map((id) => ({
          id,
          choice_id: "present" as const,
        }));

        setEvidence(initialEvidence);

        const result = await startDiagnosis.mutateAsync({
          sex,
          age,
          symptoms: initialEvidence,
        });

        if (result.should_stop || !result.question) {
          // Analysis complete
          setConditions(result.conditions || []);
          setIsComplete(true);
          await fetchTriage(initialEvidence);
        } else {
          // More questions needed
          setCurrentQuestion(result.question);
          setConditions(result.conditions || []);
        }
      } catch (error) {
        console.error("Diagnosis error:", error);
        // Fall back to showing conditions without questions
        setIsComplete(true);
      } finally {
        setIsLoading(false);
      }
    };

    initDiagnosis();
  }, []);

  const fetchTriage = async (currentEvidence: Array<{ id: string; choice_id: "present" | "absent" | "unknown" }>) => {
    try {
      const result = await getTriage.mutateAsync({
        sex,
        age,
        evidence: currentEvidence,
      });

      setTriageResult({
        level: result.triage_level,
        label: result.label || getTriageLabel(result.triage_level),
        description: result.description || getTriageDescription(result.triage_level),
        color: result.color || getTriageColor(result.triage_level),
      });
    } catch (error) {
      console.error("Triage error:", error);
    }
  };

  const getTriageLabel = (level: string): string => {
    const labels: Record<string, string> = {
      emergency: "Emergency",
      emergency_ambulance: "Call Emergency Services",
      consultation_24: "See a doctor within 24 hours",
      consultation: "See a doctor",
      self_care: "Self-care at home",
    };
    return labels[level] || "Consult a doctor";
  };

  const getTriageDescription = (level: string): string => {
    const descriptions: Record<string, string> = {
      emergency: "Seek emergency care immediately",
      emergency_ambulance: "Call emergency services (999) immediately",
      consultation_24: "Schedule an appointment as soon as possible",
      consultation: "Schedule a consultation at your convenience",
      self_care: "You can manage this at home with self-care",
    };
    return descriptions[level] || "Please consult a healthcare professional";
  };

  const getTriageColor = (level: string): string => {
    const colors: Record<string, string> = {
      emergency: "#EF4444",
      emergency_ambulance: "#DC2626",
      consultation_24: "#F59E0B",
      consultation: "#3B82F6",
      self_care: "#22C55E",
    };
    return colors[level] || "#3B82F6";
  };

  const handleAnswer = async (questionId: string, choiceId: string) => {
    const newEvidence = [...evidence, { id: questionId, choice_id: choiceId as "present" | "absent" | "unknown" }];
    setEvidence(newEvidence);
    setIsLoading(true);

    try {
      const result = await continueDiagnosis.mutateAsync({
        sex,
        age,
        evidence: newEvidence,
      });

      if (result.should_stop || !result.question) {
        setConditions(result.conditions || []);
        setIsComplete(true);
        await fetchTriage(newEvidence);
      } else {
        setCurrentQuestion(result.question);
        setConditions(result.conditions || []);
      }
    } catch (error) {
      console.error("Continue diagnosis error:", error);
      setIsComplete(true);
    } finally {
      setIsLoading(false);
    }
  };

  const skipQuestion = () => {
    if (currentQuestion?.items?.[0]) {
      handleAnswer(currentQuestion.items[0].id, "unknown");
    }
  };

  const getSeverityFromProbability = (probability: number): "low" | "medium" | "high" => {
    if (probability >= 0.7) return "high";
    if (probability >= 0.4) return "medium";
    return "low";
  };

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

  // Loading state
  if (isLoading && !currentQuestion) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Analyzing...",
            headerTintColor: "#fff",
            headerStyle: { backgroundColor: colors.primary },
          }}
        />
        <ScreenContainer className="items-center justify-center">
          <View className="items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-lg font-semibold text-foreground mt-4">Analyzing your symptoms...</Text>
            <Text className="text-sm text-muted mt-2">Powered by Random Forest ML Model</Text>
          </View>
        </ScreenContainer>
      </>
    );
  }

  // Question state - ask follow-up questions
  if (!isComplete && currentQuestion) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Follow-up Questions",
            headerTintColor: "#fff",
            headerStyle: { backgroundColor: colors.primary },
          }}
        />
        <ScreenContainer edges={["left", "right"]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Progress indicator */}
            <View className="bg-primary px-6 pt-6 pb-8" style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
              <View className="flex-row items-center gap-3 mb-4">
                <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                  <Ionicons name="help-circle" size={28} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-white">Additional Questions</Text>
                  <Text className="text-sm text-white/80">Help us narrow down the diagnosis</Text>
                </View>
              </View>
              
              {/* Progress bar */}
              <View className="bg-white/20 h-2 rounded-full overflow-hidden">
                <View
                  className="bg-white h-full rounded-full"
                  style={{ width: `${Math.min(100, (evidence.length / 8) * 100)}%` }}
                />
              </View>
              <Text className="text-xs text-white/70 mt-2">
                {evidence.length} of ~8 questions answered
              </Text>
            </View>

            {/* Current Question */}
            <View className="px-6 pt-6">
              <View
                className="bg-surface rounded-2xl p-6 shadow-sm"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Text className="text-lg font-semibold text-foreground mb-6">{currentQuestion.text}</Text>

                {currentQuestion.items?.[0]?.choices?.map((choice) => (
                  <Pressable
                    key={choice.id}
                    className="bg-background border border-border rounded-xl p-4 mb-3 flex-row items-center"
                    onPress={() => handleAnswer(currentQuestion.items[0].id, choice.id)}
                    disabled={isLoading}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  >
                    <View
                      className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                        choice.id === "present" ? "border-success" : choice.id === "absent" ? "border-error" : "border-muted"
                      }`}
                    >
                      {choice.id === "present" && <View className="w-3 h-3 rounded-full bg-success" />}
                      {choice.id === "absent" && <Ionicons name="close" size={14} color={colors.error} />}
                    </View>
                    <Text className="text-base text-foreground">{choice.label}</Text>
                  </Pressable>
                ))}

                {isLoading && (
                  <View className="items-center py-4">
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                )}
              </View>

              {/* Skip button */}
              <Pressable
                className="mt-4 py-3 items-center"
                onPress={skipQuestion}
                disabled={isLoading}
              >
                <Text className="text-muted">Skip this question</Text>
              </Pressable>
            </View>

            {/* Current top conditions preview */}
            {conditions.length > 0 && (
              <View className="px-6 pt-4 pb-8">
                <Text className="text-sm font-semibold text-muted mb-2">Top possibilities so far:</Text>
                {conditions.slice(0, 2).map((condition, index) => (
                  <View key={index} className="flex-row items-center py-2">
                    <View className="w-2 h-2 rounded-full bg-primary mr-2" />
                    <Text className="text-sm text-foreground flex-1">{condition.common_name || condition.name}</Text>
                    <Text className="text-sm text-primary font-semibold">
                      {Math.round(condition.probability * 100)}%
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </ScreenContainer>
      </>
    );
  }

  // Results state - show final analysis
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Analysis Results",
          headerTintColor: "#fff",
          headerStyle: { backgroundColor: colors.primary },
        }}
      />
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
                <Text className="text-sm text-white/80">{symptomNames.length} symptoms analyzed</Text>
              </View>
            </View>
          </View>

          {/* Triage Result */}
          {triageResult && (
            <View className="px-6 pt-6">
              <View
                className="rounded-2xl p-4"
                style={{ backgroundColor: `${triageResult.color}15`, borderWidth: 2, borderColor: triageResult.color }}
              >
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name={triageResult.level.includes("emergency") ? "alert-circle" : "information-circle"}
                    size={24}
                    color={triageResult.color}
                  />
                  <Text className="text-lg font-bold ml-2" style={{ color: triageResult.color }}>
                    {triageResult.label}
                  </Text>
                </View>
                <Text className="text-sm text-foreground">{triageResult.description}</Text>
              </View>
            </View>
          )}

          {/* Possible Conditions */}
          <View className="px-6 pt-6">
            <Text className="text-lg font-bold text-foreground mb-4">Possible Conditions</Text>

            {conditions.length > 0 ? (
              conditions.slice(0, 5).map((condition, index) => {
                const probability = Math.round(condition.probability * 100);
                const severity = getSeverityFromProbability(condition.probability);

                return (
                  <View
                    key={index}
                    className="bg-surface rounded-2xl p-4 mb-3 shadow-sm"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          {condition.common_name || condition.name}
                        </Text>
                        <View className="flex-row items-center mt-1 gap-2">
                          <View
                            className="px-2 py-0.5 rounded"
                            style={{ backgroundColor: `${getSeverityColor(severity)}20` }}
                          >
                            <Text className="text-xs font-medium" style={{ color: getSeverityColor(severity) }}>
                              {severity.toUpperCase()} LIKELIHOOD
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-2xl font-bold text-primary">{probability}%</Text>
                        <Text className="text-xs text-muted">match</Text>
                      </View>
                    </View>
                    {condition.extras?.hint && (
                      <Text className="text-sm text-muted leading-5 mt-2">{condition.extras.hint}</Text>
                    )}
                  </View>
                );
              })
            ) : (
              <View className="bg-surface rounded-2xl p-6 items-center">
                <Ionicons name="medical" size={48} color={colors.muted} />
                <Text className="text-base text-muted mt-2 text-center">
                  Unable to determine specific conditions. Please consult a healthcare professional.
                </Text>
              </View>
            )}
          </View>

          {/* Recommended Specialist */}
          <View className="px-6 pt-4">
            <Text className="text-lg font-bold text-foreground mb-3">Recommended Action</Text>
            <Pressable
              className="bg-primary rounded-2xl p-4 flex-row items-center"
              onPress={() =>
                router.push({
                  pathname: "/doctor-search",
                  params: { specialty: recommendedSpecialist?.primary || "General Practitioner" },
                })
              }
              style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
            >
              <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                <Ionicons name="person" size={24} color="#fff" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-base font-semibold text-white">
                  Find a {recommendedSpecialist?.primary || "General Practitioner"}
                </Text>
                <Text className="text-sm text-white/80">Book an appointment today</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Self-Care Tips */}
          <View className="px-6 pt-6 pb-8">
            <Text className="text-lg font-bold text-foreground mb-3">Self-Care Tips</Text>
            <View
              className="bg-surface rounded-2xl p-4 shadow-sm"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              {[
                "Get adequate rest and sleep (7-9 hours per night)",
                "Stay well hydrated by drinking plenty of water",
                "Maintain a balanced diet rich in fruits and vegetables",
                "Monitor your symptoms and seek medical attention if they worsen",
                "Practice stress-reduction techniques like deep breathing",
              ].map((tip, index) => (
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
                This AI-powered analysis is for informational purposes only and should not replace professional medical
                advice. If you experience severe symptoms, please seek immediate medical attention.
              </Text>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    </>
  );
}

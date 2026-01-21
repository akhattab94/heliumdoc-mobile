import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

// Import data
import conditionsData from "@/data/medical-conditions.json";
import mappingData from "@/data/symptom-disease-mapping.json";
import symptomsData from "@/data/symptoms-database.json";

type TriageLevel = "emergency" | "high" | "medium" | "low" | "very_low";

type DiagnosisResult = {
  conditionId: string;
  name: string;
  probability: number;
  urgency: TriageLevel;
  specialist: string;
  description: string;
  symptoms: string[];
  selfCare: string[];
  warningSign: string[];
};

const URGENCY_CONFIG: Record<TriageLevel, { color: string; bgColor: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  emergency: { color: "#DC2626", bgColor: "#FEE2E2", label: "Emergency", icon: "alert-circle" },
  high: { color: "#EA580C", bgColor: "#FFEDD5", label: "High Priority", icon: "warning" },
  medium: { color: "#D97706", bgColor: "#FEF3C7", label: "Medium Priority", icon: "time" },
  low: { color: "#059669", bgColor: "#D1FAE5", label: "Low Priority", icon: "checkmark-circle" },
  very_low: { color: "#0891B2", bgColor: "#CFFAFE", label: "Self-Care", icon: "heart" },
};

export default function SymptomResultsScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{
    symptoms: string;
    age: string;
    gender: string;
    answers: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<DiagnosisResult[]>([]);
  const [overallUrgency, setOverallUrgency] = useState<TriageLevel>("low");
  const [expandedCondition, setExpandedCondition] = useState<string | null>(null);

  useEffect(() => {
    analyzeSymptoms();
  }, []);

  const analyzeSymptoms = () => {
    try {
      const symptomIds: string[] = JSON.parse(params.symptoms || "[]");
      const answers: Record<string, string> = JSON.parse(params.answers || "{}");
      
      // Calculate probabilities for each condition
      const conditionScores: Record<string, number> = {};
      const mappings = mappingData.mappings as Record<string, any>;
      
      for (const [conditionId, mapping] of Object.entries(mappings)) {
        let score = mapping.base_probability || 0.1;
        let matchedSymptoms = 0;
        
        // Check primary symptoms
        for (const symptomId of symptomIds) {
          if (mapping.weights && mapping.weights[symptomId]) {
            score += mapping.weights[symptomId];
            matchedSymptoms++;
          }
        }
        
        // Only include if minimum required symptoms are matched
        if (matchedSymptoms >= (mapping.required_count || 1)) {
          conditionScores[conditionId] = Math.min(score, 0.95);
        }
      }
      
      // Sort by score and get top results
      const sortedConditions = Object.entries(conditionScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
      
      // Build results with condition details
      const diagnosisResults: DiagnosisResult[] = sortedConditions.map(([conditionId, probability]) => {
        const condition = conditionsData.conditions.find((c) => c.id === conditionId);
        const mapping = mappings[conditionId];
        
        // Determine urgency
        let urgency: TriageLevel = "low";
        if (mapping?.urgency === "emergency") urgency = "emergency";
        else if (mapping?.urgency === "high") urgency = "high";
        else if (probability > 0.7) urgency = "medium";
        else if (probability > 0.5) urgency = "low";
        else urgency = "very_low";
        
        // Check for emergency symptoms
        const emergencySymptoms = symptomsData.symptoms.filter(
          (s) => s.emergency_flag && symptomIds.includes(s.id)
        );
        if (emergencySymptoms.length > 0) {
          urgency = "emergency";
        }
        
        return {
          conditionId,
          name: condition?.name || conditionId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          probability: Math.round(probability * 100),
          urgency,
          specialist: condition?.specialist || "General Practitioner",
          description: condition?.description || "No description available.",
          symptoms: condition?.symptoms || [],
          selfCare: condition?.self_care || [],
          warningSign: condition?.warning_signs || [],
        };
      });
      
      // Set overall urgency based on highest urgency result
      const urgencyOrder: TriageLevel[] = ["emergency", "high", "medium", "low", "very_low"];
      const highestUrgency = diagnosisResults.reduce((highest, result) => {
        const currentIndex = urgencyOrder.indexOf(result.urgency);
        const highestIndex = urgencyOrder.indexOf(highest);
        return currentIndex < highestIndex ? result.urgency : highest;
      }, "very_low" as TriageLevel);
      
      setOverallUrgency(highestUrgency);
      setResults(diagnosisResults);
      setIsLoading(false);
    } catch (error) {
      console.error("Error analyzing symptoms:", error);
      setIsLoading(false);
    }
  };

  const handleFindDoctor = (specialist: string) => {
    router.push({
      pathname: "/doctor-search",
      params: { specialty: specialist },
    });
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-foreground mt-4 text-lg">Analyzing your symptoms...</Text>
        <Text className="text-muted mt-2">This may take a moment</Text>
      </ScreenContainer>
    );
  }

  const urgencyConfig = URGENCY_CONFIG[overallUrgency];

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 py-3 border-b border-border flex-row items-center">
          <TouchableOpacity
            className="mr-3"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">Analysis Results</Text>
            <Text className="text-sm text-muted">Based on your symptoms</Text>
          </View>
        </View>

        {/* Urgency Banner */}
        <View 
          className="mx-4 mt-4 p-4 rounded-2xl flex-row items-center"
          style={{ backgroundColor: urgencyConfig.bgColor }}
        >
          <View 
            className="w-12 h-12 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: urgencyConfig.color }}
          >
            <Ionicons name={urgencyConfig.icon} size={24} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold" style={{ color: urgencyConfig.color }}>
              {urgencyConfig.label}
            </Text>
            <Text className="text-sm" style={{ color: urgencyConfig.color }}>
              {overallUrgency === "emergency" 
                ? "Seek immediate medical attention"
                : overallUrgency === "high"
                ? "See a doctor within 24 hours"
                : overallUrgency === "medium"
                ? "Schedule an appointment soon"
                : "Monitor symptoms, self-care may help"}
            </Text>
          </View>
        </View>

        {/* Possible Conditions */}
        <View className="px-4 mt-6">
          <Text className="text-lg font-bold text-foreground mb-3">Possible Conditions</Text>
          
          {results.length === 0 ? (
            <View className="bg-surface rounded-2xl p-6 items-center">
              <Ionicons name="help-circle-outline" size={48} color={colors.muted} />
              <Text className="text-foreground font-semibold mt-2">No matching conditions found</Text>
              <Text className="text-muted text-center mt-1">
                Please try adding more symptoms or consult a healthcare provider.
              </Text>
            </View>
          ) : (
            results.map((result, index) => {
              const isExpanded = expandedCondition === result.conditionId;
              const resultUrgency = URGENCY_CONFIG[result.urgency];
              
              return (
                <TouchableOpacity
                  key={result.conditionId}
                  className="bg-surface rounded-2xl mb-3 overflow-hidden"
                  onPress={() => setExpandedCondition(isExpanded ? null : result.conditionId)}
                  activeOpacity={0.8}
                >
                  {/* Condition Header */}
                  <View className="p-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-lg font-bold text-foreground">{result.name}</Text>
                          {index === 0 && (
                            <View className="ml-2 bg-primary/10 px-2 py-0.5 rounded">
                              <Text className="text-xs text-primary font-medium">Most Likely</Text>
                            </View>
                          )}
                        </View>
                        <View className="flex-row items-center mt-1">
                          <View 
                            className="px-2 py-0.5 rounded mr-2"
                            style={{ backgroundColor: resultUrgency.bgColor }}
                          >
                            <Text className="text-xs font-medium" style={{ color: resultUrgency.color }}>
                              {resultUrgency.label}
                            </Text>
                          </View>
                          <Text className="text-sm text-muted">{result.specialist}</Text>
                        </View>
                      </View>
                      <View className="items-center">
                        <Text className="text-2xl font-bold text-primary">{result.probability}%</Text>
                        <Text className="text-xs text-muted">likelihood</Text>
                      </View>
                    </View>
                    
                    {/* Progress Bar */}
                    <View className="mt-3 h-2 bg-border rounded-full overflow-hidden">
                      <View 
                        className="h-full rounded-full"
                        style={{ 
                          width: `${result.probability}%`,
                          backgroundColor: resultUrgency.color 
                        }}
                      />
                    </View>
                  </View>
                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <View className="px-4 pb-4 border-t border-border pt-4">
                      {/* Description */}
                      <Text className="text-foreground mb-4">{result.description}</Text>
                      
                      {/* Warning Signs */}
                      {result.warningSign.length > 0 && (
                        <View className="mb-4">
                          <View className="flex-row items-center mb-2">
                            <Ionicons name="warning" size={16} color={colors.error} />
                            <Text className="text-sm font-semibold text-foreground ml-1">Warning Signs</Text>
                          </View>
                          {result.warningSign.map((sign, i) => (
                            <Text key={i} className="text-sm text-muted ml-5">• {sign}</Text>
                          ))}
                        </View>
                      )}
                      
                      {/* Self Care */}
                      {result.selfCare.length > 0 && (
                        <View className="mb-4">
                          <View className="flex-row items-center mb-2">
                            <Ionicons name="heart" size={16} color={colors.success} />
                            <Text className="text-sm font-semibold text-foreground ml-1">Self-Care Tips</Text>
                          </View>
                          {result.selfCare.map((tip, i) => (
                            <Text key={i} className="text-sm text-muted ml-5">• {tip}</Text>
                          ))}
                        </View>
                      )}
                      
                      {/* Find Doctor Button */}
                      <TouchableOpacity
                        className="bg-primary py-3 rounded-xl flex-row items-center justify-center mt-2"
                        onPress={() => handleFindDoctor(result.specialist)}
                      >
                        <Ionicons name="search" size={18} color="white" />
                        <Text className="text-white font-semibold ml-2">
                          Find a {result.specialist}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Expand Indicator */}
                  <View className="items-center py-2 border-t border-border">
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={colors.muted} 
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Disclaimer */}
        <View className="px-4 py-6 mb-8">
          <View className="bg-warning/10 rounded-xl p-4 flex-row">
            <Ionicons name="information-circle" size={24} color={colors.warning} />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-semibold text-foreground mb-1">Important Notice</Text>
              <Text className="text-xs text-muted leading-5">
                This analysis is based on the symptoms you provided and is for informational purposes only. 
                It is not a medical diagnosis. Always consult with a qualified healthcare professional 
                for proper evaluation and treatment.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-4 pb-8">
          <TouchableOpacity
            className="bg-primary py-4 rounded-xl flex-row items-center justify-center mb-3"
            onPress={() => router.push("/doctor-search")}
          >
            <Ionicons name="medical" size={20} color="white" />
            <Text className="text-white font-semibold text-lg ml-2">Find a Doctor</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="bg-surface border border-border py-4 rounded-xl flex-row items-center justify-center"
            onPress={() => router.push("/(tabs)/symptoms")}
          >
            <Ionicons name="refresh" size={20} color={colors.foreground} />
            <Text className="text-foreground font-semibold text-lg ml-2">Start New Check</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

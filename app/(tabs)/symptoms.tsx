import { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function SymptomsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [showChatOption, setShowChatOption] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [selectedSymptoms, setSelectedSymptoms] = useState<{ id: string; name: string }[]>([]);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch body locations from API
  const { data: bodyLocations, isLoading: loadingLocations } = trpc.symptomChecker.getBodyLocations.useQuery();

  // Fetch symptoms from API
  const { data: symptomsData, isLoading: loadingSymptoms } = trpc.symptomChecker.getSymptoms.useQuery({
    search: searchQuery || undefined,
  });
  
  // Extract symptoms array from response
  const symptoms = symptomsData?.symptoms || [];

  const toggleSymptom = (symptom: { id: string; name: string }) => {
    setSelectedSymptoms((prev) =>
      prev.some((s) => s.id === symptom.id)
        ? prev.filter((s) => s.id !== symptom.id)
        : [...prev, symptom]
    );
  };

  const canAnalyze = selectedSymptoms.length > 0 && age && gender;

  const handleAnalyze = () => {
    // Pass symptom IDs and names to the analysis screen
    const symptomIds = selectedSymptoms.map((s) => s.id).join(",");
    const symptomNames = selectedSymptoms.map((s) => s.name).join(",");
    
    router.push({
      pathname: "/symptom-analysis",
      params: { 
        symptomIds,
        symptoms: symptomNames, 
        age, 
        gender 
      },
    });
  };

  // Map category icons
  const getCategoryIcon = (categoryId: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      head: "person",
      chest: "heart",
      abdomen: "restaurant",
      respiratory: "cloud",
      musculoskeletal: "fitness",
      skin: "hand-left",
      mental: "happy",
      general: "body",
      urinary: "water",
    };
    return iconMap[categoryId] || "body";
  };

  return (
    <ScreenContainer edges={["left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 pt-16 pb-8" style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          <View className="flex-row items-center gap-3 mb-2">
            <Ionicons name="medical" size={32} color="#fff" />
            <Text className="text-2xl font-bold text-white">AI Symptom Checker</Text>
          </View>
          <Text className="text-base text-white/80">Powered by Random Forest ML (41 diseases, 132 symptoms)</Text>
          
          {/* Search Input */}
          <View className="mt-4 bg-white/20 rounded-xl flex-row items-center px-4">
            <Ionicons name="search" size={20} color="#fff" />
            <TextInput
              className="flex-1 py-3 px-3 text-white"
              placeholder="Search symptoms..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#fff" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Chat-based Symptom Checker Option */}
        {showChatOption && (
          <View className="mx-4 mt-4 bg-surface border border-primary/30 rounded-2xl p-4">
            <View className="flex-row items-start">
              <View className="bg-primary/10 p-2 rounded-xl mr-3">
                <Ionicons name="chatbubbles" size={24} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-bold text-base">Try Conversational Mode</Text>
                <Text className="text-muted text-sm mt-1">
                  Chat with our AI assistant for a guided symptom assessment experience
                </Text>
              </View>
              <Pressable onPress={() => setShowChatOption(false)}>
                <Ionicons name="close" size={20} color={colors.muted} />
              </Pressable>
            </View>
            <Pressable
              className="bg-primary mt-3 py-3 rounded-xl flex-row items-center justify-center"
              onPress={() => router.push("/symptom-checker-chat" as any)}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="white" />
              <Text className="text-white font-semibold ml-2">Start Chat Assessment</Text>
            </Pressable>
          </View>
        )}

        {/* Selected Symptoms */}
        {selectedSymptoms.length > 0 && (
          <View className="px-6 pt-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Selected Symptoms ({selectedSymptoms.length})
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {selectedSymptoms.map((symptom) => (
                <Pressable
                  key={symptom.id}
                  className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-full"
                  onPress={() => toggleSymptom(symptom)}
                >
                  <Text className="text-sm text-primary mr-1">{symptom.name}</Text>
                  <Ionicons name="close-circle" size={16} color={colors.primary} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Category Tabs */}
        <View className="pt-4">
          {loadingLocations ? (
            <View className="px-6 py-4">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6">
              {bodyLocations?.map((category) => (
                <Pressable
                  key={category.id}
                  className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
                    selectedCategory === category.id ? "bg-primary" : "bg-surface border border-border"
                  }`}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text className="mr-2">{category.icon}</Text>
                  <Text
                    className={`text-sm font-medium ${
                      selectedCategory === category.id ? "text-white" : "text-foreground"
                    }`}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Symptoms Grid */}
        <View className="px-6 pt-4">
          <Text className="text-lg font-bold text-foreground mb-3">
            {searchQuery ? `Search Results` : `${bodyLocations?.find((c) => c.id === selectedCategory)?.name || "General"} Symptoms`}
          </Text>
          
          {loadingSymptoms ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-muted mt-2">Loading symptoms...</Text>
            </View>
          ) : symptoms.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {symptoms.map((symptom: { id: string; name: string; common_name: string }) => {
                const isSelected = selectedSymptoms.some((s) => s.id === symptom.id);
                return (
                  <Pressable
                    key={symptom.id}
                    className={`px-4 py-2.5 rounded-xl ${
                      isSelected ? "bg-primary" : "bg-surface border border-border"
                    }`}
                    onPress={() => toggleSymptom({ id: symptom.id, name: symptom.common_name || symptom.name })}
                  >
                    <Text
                      className={`text-sm font-medium ${isSelected ? "text-white" : "text-foreground"}`}
                    >
                      {symptom.common_name || symptom.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View className="py-8 items-center">
              <Ionicons name="search-outline" size={48} color={colors.muted} />
              <Text className="text-muted mt-2">No symptoms found</Text>
            </View>
          )}
        </View>

        {/* Patient Info */}
        <View className="px-6 pt-6">
          <Text className="text-lg font-bold text-foreground mb-3">Patient Information</Text>

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
            {/* Age Input */}
            <View className="mb-4">
              <Text className="text-sm text-muted mb-2">Age</Text>
              <TextInput
                className="bg-background rounded-xl px-4 py-3 text-base text-foreground"
                placeholder="Enter your age"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
                returnKeyType="done"
              />
            </View>

            {/* Gender Selection */}
            <View>
              <Text className="text-sm text-muted mb-2">Biological Sex</Text>
              <View className="flex-row gap-3">
                <Pressable
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border-2 ${
                    gender === "male" ? "border-primary bg-primary/10" : "border-border bg-background"
                  }`}
                  onPress={() => setGender("male")}
                >
                  <Ionicons name="male" size={20} color={gender === "male" ? colors.primary : colors.muted} />
                  <Text className={`ml-2 font-semibold ${gender === "male" ? "text-primary" : "text-muted"}`}>
                    Male
                  </Text>
                </Pressable>
                <Pressable
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border-2 ${
                    gender === "female" ? "border-primary bg-primary/10" : "border-border bg-background"
                  }`}
                  onPress={() => setGender("female")}
                >
                  <Ionicons name="female" size={20} color={gender === "female" ? colors.primary : colors.muted} />
                  <Text className={`ml-2 font-semibold ${gender === "female" ? "text-primary" : "text-muted"}`}>
                    Female
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View className="px-6 pt-4 pb-32">
          <View className="flex-row items-start bg-warning/10 rounded-xl p-4">
            <Ionicons name="warning" size={20} color={colors.warning} />
            <Text className="flex-1 ml-2 text-xs text-muted leading-5">
              This AI symptom checker is for informational purposes only and is not a substitute for professional
              medical advice. Always consult a healthcare provider for proper diagnosis and treatment.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border px-6 py-4 pb-8">
        <Pressable
          className={`py-4 rounded-xl items-center flex-row justify-center ${
            canAnalyze ? "bg-primary" : "bg-muted"
          }`}
          disabled={!canAnalyze}
          onPress={handleAnalyze}
          style={({ pressed }) => [
            { opacity: pressed && canAnalyze ? 0.9 : 1, transform: [{ scale: pressed && canAnalyze ? 0.98 : 1 }] },
          ]}
        >
          <Ionicons name="analytics" size={20} color="#fff" />
          <Text className="text-white text-lg font-semibold ml-2">
            {canAnalyze ? "Analyze Symptoms" : "Select symptoms and info"}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

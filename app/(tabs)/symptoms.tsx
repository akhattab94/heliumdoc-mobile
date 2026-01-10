import { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const symptomCategories = [
  { id: "general", name: "General", icon: "body" as const },
  { id: "head", name: "Head", icon: "person" as const },
  { id: "eyes", name: "Eyes/Ears", icon: "eye" as const },
  { id: "respiratory", name: "Respiratory", icon: "cloud" as const },
  { id: "heart", name: "Heart", icon: "heart" as const },
  { id: "digestive", name: "Digestive", icon: "restaurant" as const },
  { id: "muscles", name: "Muscles", icon: "fitness" as const },
  { id: "skin", name: "Skin", icon: "hand-left" as const },
  { id: "mental", name: "Mental", icon: "happy" as const },
];

const symptomsByCategory: Record<string, string[]> = {
  general: ["Fatigue", "Fever", "Chills", "Weight Loss", "Weight Gain", "Night Sweats", "Loss of Appetite", "General Weakness"],
  head: ["Headache", "Dizziness", "Memory Issues", "Confusion", "Fainting", "Migraine", "Neck Pain", "Scalp Tenderness"],
  eyes: ["Blurred Vision", "Eye Pain", "Redness", "Ear Pain", "Hearing Loss", "Tinnitus", "Sore Throat", "Runny Nose"],
  respiratory: ["Cough", "Shortness of Breath", "Wheezing", "Chest Tightness", "Sputum Production", "Difficulty Breathing"],
  heart: ["Chest Pain", "Palpitations", "Rapid Heartbeat", "Irregular Heartbeat", "Swelling in Legs", "High Blood Pressure"],
  digestive: ["Nausea", "Vomiting", "Abdominal Pain", "Diarrhea", "Constipation", "Bloating", "Heartburn", "Blood in Stool"],
  muscles: ["Joint Pain", "Back Pain", "Muscle Aches", "Stiffness", "Swelling", "Limited Movement", "Muscle Weakness"],
  skin: ["Rash", "Itching", "Dry Skin", "Acne", "Skin Discoloration", "Bruising", "Hives", "Skin Lesions"],
  mental: ["Anxiety", "Depression", "Insomnia", "Mood Swings", "Stress", "Panic Attacks", "Difficulty Concentrating"],
};

export default function SymptomsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const canAnalyze = selectedSymptoms.length > 0 && age && gender;

  const handleAnalyze = () => {
    router.push({
      pathname: "/symptom-analysis",
      params: { symptoms: selectedSymptoms.join(","), age, gender },
    });
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
          <Text className="text-base text-white/80">Select your symptoms for an AI-powered health assessment</Text>
        </View>

        {/* Selected Symptoms */}
        {selectedSymptoms.length > 0 && (
          <View className="px-6 pt-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Selected Symptoms ({selectedSymptoms.length})</Text>
            <View className="flex-row flex-wrap gap-2">
              {selectedSymptoms.map((symptom) => (
                <Pressable
                  key={symptom}
                  className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-full"
                  onPress={() => toggleSymptom(symptom)}
                >
                  <Text className="text-sm text-primary mr-1">{symptom}</Text>
                  <Ionicons name="close-circle" size={16} color={colors.primary} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Category Tabs */}
        <View className="pt-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6">
            {symptomCategories.map((category) => (
              <Pressable
                key={category.id}
                className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${selectedCategory === category.id ? "bg-primary" : "bg-surface border border-border"}`}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons 
                  name={category.icon} 
                  size={18} 
                  color={selectedCategory === category.id ? "#fff" : colors.muted} 
                />
                <Text className={`ml-2 text-sm font-medium ${selectedCategory === category.id ? "text-white" : "text-foreground"}`}>
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Symptoms Grid */}
        <View className="px-6 pt-4">
          <Text className="text-lg font-bold text-foreground mb-3">
            {symptomCategories.find((c) => c.id === selectedCategory)?.name} Symptoms
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {symptomsByCategory[selectedCategory]?.map((symptom) => (
              <Pressable
                key={symptom}
                className={`px-4 py-2.5 rounded-xl ${selectedSymptoms.includes(symptom) ? "bg-primary" : "bg-surface border border-border"}`}
                onPress={() => toggleSymptom(symptom)}
              >
                <Text className={`text-sm font-medium ${selectedSymptoms.includes(symptom) ? "text-white" : "text-foreground"}`}>
                  {symptom}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Patient Info */}
        <View className="px-6 pt-6">
          <Text className="text-lg font-bold text-foreground mb-3">Patient Information</Text>
          
          <View className="bg-surface rounded-2xl p-4 shadow-sm" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
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
              />
            </View>

            {/* Gender Selection */}
            <View>
              <Text className="text-sm text-muted mb-2">Gender</Text>
              <View className="flex-row gap-3">
                <Pressable
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border-2 ${gender === "male" ? "border-primary bg-primary/10" : "border-border bg-background"}`}
                  onPress={() => setGender("male")}
                >
                  <Ionicons name="male" size={20} color={gender === "male" ? colors.primary : colors.muted} />
                  <Text className={`ml-2 font-semibold ${gender === "male" ? "text-primary" : "text-muted"}`}>Male</Text>
                </Pressable>
                <Pressable
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border-2 ${gender === "female" ? "border-primary bg-primary/10" : "border-border bg-background"}`}
                  onPress={() => setGender("female")}
                >
                  <Ionicons name="female" size={20} color={gender === "female" ? colors.primary : colors.muted} />
                  <Text className={`ml-2 font-semibold ${gender === "female" ? "text-primary" : "text-muted"}`}>Female</Text>
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
              This symptom checker is for informational purposes only and is not a substitute for professional medical advice. 
              Always consult a healthcare provider for proper diagnosis and treatment.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border px-6 py-4 pb-8">
        <Pressable
          className={`py-4 rounded-xl items-center flex-row justify-center ${canAnalyze ? "bg-primary" : "bg-muted"}`}
          disabled={!canAnalyze}
          onPress={handleAnalyze}
          style={({ pressed }) => [{ opacity: pressed && canAnalyze ? 0.9 : 1, transform: [{ scale: pressed && canAnalyze ? 0.98 : 1 }] }]}
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

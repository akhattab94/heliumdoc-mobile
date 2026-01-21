import { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const { width } = Dimensions.get("window");

// Body region data with icons, colors, and TOP 5 common symptoms each
const bodyRegions = [
  { 
    id: "head", 
    name: "Head & Neck", 
    icon: "🧠", 
    color: "#6366F1",
    symptoms: [
      { id: "s_21", name: "Headache" },
      { id: "s_156", name: "Dizziness" },
      { id: "s_88", name: "Sore throat" },
      { id: "s_13", name: "Neck pain" },
      { id: "s_107", name: "Earache" },
    ]
  },
  { 
    id: "chest", 
    name: "Chest", 
    icon: "💗", 
    color: "#EC4899",
    symptoms: [
      { id: "s_50", name: "Chest pain" },
      { id: "s_102", name: "Heart palpitations" },
      { id: "s_87", name: "Chest tightness" },
      { id: "s_284", name: "Rapid heartbeat" },
      { id: "s_180", name: "Chest pressure" },
    ]
  },
  { 
    id: "abdomen", 
    name: "Abdomen", 
    icon: "🫁", 
    color: "#F59E0B",
    symptoms: [
      { id: "s_10", name: "Abdominal pain" },
      { id: "s_8", name: "Nausea" },
      { id: "s_64", name: "Vomiting" },
      { id: "s_5", name: "Diarrhea" },
      { id: "s_9", name: "Bloating" },
    ]
  },
  { 
    id: "respiratory", 
    name: "Respiratory", 
    icon: "🌬️", 
    color: "#10B981",
    symptoms: [
      { id: "s_30", name: "Cough" },
      { id: "s_25", name: "Shortness of breath" },
      { id: "s_110", name: "Runny nose" },
      { id: "s_17", name: "Wheezing" },
      { id: "s_85", name: "Sneezing" },
    ]
  },
  { 
    id: "musculoskeletal", 
    name: "Muscles & Joints", 
    icon: "💪", 
    color: "#8B5CF6",
    symptoms: [
      { id: "s_44", name: "Back pain" },
      { id: "s_33", name: "Joint pain" },
      { id: "s_157", name: "Muscle aches" },
      { id: "s_195", name: "Leg pain" },
      { id: "s_232", name: "Arm pain" },
    ]
  },
  { 
    id: "skin", 
    name: "Skin", 
    icon: "🖐️", 
    color: "#F97316",
    symptoms: [
      { id: "s_22", name: "Skin rash" },
      { id: "s_43", name: "Itching" },
      { id: "s_220", name: "Skin redness" },
      { id: "s_251", name: "Swelling" },
      { id: "s_272", name: "Bruising" },
    ]
  },
  { 
    id: "mental", 
    name: "Mental Health", 
    icon: "🧘", 
    color: "#06B6D4",
    symptoms: [
      { id: "s_146", name: "Anxiety" },
      { id: "s_286", name: "Depressed mood" },
      { id: "s_1", name: "Fatigue" },
      { id: "s_163", name: "Sleep problems" },
      { id: "s_288", name: "Stress" },
    ]
  },
  { 
    id: "general", 
    name: "General", 
    icon: "🩺", 
    color: "#14B8A6",
    symptoms: [
      { id: "s_98", name: "Fever" },
      { id: "s_7", name: "Chills" },
      { id: "s_1", name: "Fatigue" },
      { id: "s_206", name: "Loss of appetite" },
      { id: "s_305", name: "Weight loss" },
    ]
  },
];

export default function SymptomsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<{ id: string; name: string }[]>([]);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [showPatientInfo, setShowPatientInfo] = useState(false);

  const toggleSymptom = (symptom: { id: string; name: string }) => {
    setSelectedSymptoms((prev) =>
      prev.some((s) => s.id === symptom.id)
        ? prev.filter((s) => s.id !== symptom.id)
        : [...prev, symptom]
    );
  };

  const canAnalyze = selectedSymptoms.length > 0 && age && gender;

  const handleAnalyze = () => {
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

  const handleRegionSelect = (regionId: string) => {
    setSelectedRegion(regionId === selectedRegion ? null : regionId);
  };

  const selectedRegionData = bodyRegions.find(r => r.id === selectedRegion);

  return (
    <ScreenContainer edges={["left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Hero Header */}
        <View 
          className="px-6 pt-14 pb-6"
          style={{ 
            backgroundColor: colors.primary,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white/70 text-sm font-medium">AI-Powered</Text>
              <Text className="text-white text-2xl font-bold">Symptom Checker</Text>
            </View>
            <View className="bg-white/20 p-3 rounded-2xl">
              <Ionicons name="pulse" size={28} color="white" />
            </View>
          </View>
          
          <Text className="text-white/80 text-sm mb-2">
            Select a body region, then pick your symptoms. Quick and easy.
          </Text>
        </View>

        {/* Quick Start - Chat Mode */}
        <Pressable
          className="mx-4 mt-4 overflow-hidden"
          onPress={() => router.push("/symptom-checker-chat" as any)}
          style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
        >
          <View 
            className="flex-row items-center p-4 rounded-2xl"
            style={{ backgroundColor: `${colors.primary}15` }}
          >
            <View 
              className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
              style={{ backgroundColor: colors.primary }}
            >
              <Ionicons name="chatbubbles" size={26} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-bold text-base">Prefer to Chat?</Text>
              <Text className="text-muted text-sm mt-0.5">Describe symptoms in your own words</Text>
            </View>
            <View className="bg-primary/20 p-2 rounded-xl">
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </View>
          </View>
        </Pressable>

        {/* Selected Symptoms Pills */}
        {selectedSymptoms.length > 0 && (
          <View className="px-4 pt-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground font-bold text-base">
                Your Symptoms
              </Text>
              <Pressable 
                onPress={() => setSelectedSymptoms([])}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <Text className="text-primary text-sm font-medium">Clear all</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {selectedSymptoms.map((symptom) => (
                  <Pressable
                    key={symptom.id}
                    className="flex-row items-center bg-primary px-4 py-2.5 rounded-full"
                    onPress={() => toggleSymptom(symptom)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                  >
                    <Text className="text-white font-medium text-sm mr-2">{symptom.name}</Text>
                    <Ionicons name="close" size={16} color="white" />
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Body Region Selection */}
        <View className="px-4 pt-6">
          <Text className="text-foreground font-bold text-lg mb-1">1. Where does it hurt?</Text>
          <Text className="text-muted text-sm mb-4">Tap a body region</Text>
          
          <View className="flex-row flex-wrap justify-between">
            {bodyRegions.map((region) => (
              <Pressable
                key={region.id}
                className="mb-3"
                style={{ width: (width - 48) / 2 }}
                onPress={() => handleRegionSelect(region.id)}
              >
                <View 
                  className={`p-4 rounded-2xl border-2 ${
                    selectedRegion === region.id ? "border-primary" : "border-transparent"
                  }`}
                  style={{ 
                    backgroundColor: selectedRegion === region.id ? `${region.color}15` : colors.surface,
                  }}
                >
                  <View 
                    className="w-12 h-12 rounded-xl items-center justify-center mb-3"
                    style={{ backgroundColor: `${region.color}20` }}
                  >
                    <Text style={{ fontSize: 24 }}>{region.icon}</Text>
                  </View>
                  <Text className="text-foreground font-semibold text-sm">{region.name}</Text>
                  {selectedRegion === region.id && (
                    <View className="absolute top-3 right-3">
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    </View>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Top 5 Symptoms for Selected Region */}
        {selectedRegionData && (
          <View className="px-4 pt-4">
            <Text className="text-foreground font-bold text-lg mb-1">2. Select your symptoms</Text>
            <Text className="text-muted text-sm mb-4">Common {selectedRegionData.name.toLowerCase()} symptoms</Text>
            
            <View className="gap-2">
              {selectedRegionData.symptoms.map((symptom) => {
                const isSelected = selectedSymptoms.some((s) => s.id === symptom.id);
                return (
                  <Pressable
                    key={symptom.id}
                    onPress={() => toggleSymptom(symptom)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                  >
                    <View 
                      className={`p-4 rounded-2xl flex-row items-center justify-between ${
                        isSelected ? "" : "border border-border"
                      }`}
                      style={{ 
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                      }}
                    >
                      <View className="flex-row items-center flex-1">
                        <View 
                          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                          style={{ 
                            backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : `${selectedRegionData.color}15`,
                          }}
                        >
                          <Ionicons 
                            name={isSelected ? "checkmark" : "add"} 
                            size={20} 
                            color={isSelected ? "white" : selectedRegionData.color} 
                          />
                        </View>
                        <Text 
                          className={`text-base font-medium ${isSelected ? "text-white" : "text-foreground"}`}
                        >
                          {symptom.name}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color="white" />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* "Something else?" option */}
            <Pressable
              className="mt-3"
              onPress={() => router.push("/symptom-checker-chat" as any)}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              <View 
                className="p-4 rounded-2xl flex-row items-center justify-center border border-dashed"
                style={{ borderColor: colors.primary }}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
                <Text className="text-primary font-medium ml-2">Something else? Describe it to AI</Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Patient Information Card */}
        {selectedSymptoms.length > 0 && (
          <View className="px-4 pt-6">
            <Pressable 
              className="flex-row items-center justify-between mb-3"
              onPress={() => setShowPatientInfo(!showPatientInfo)}
            >
              <View className="flex-row items-center">
                <Text className="text-foreground font-bold text-lg">3. About you</Text>
                {age && gender && (
                  <View className="ml-2 bg-success/20 px-2 py-0.5 rounded-full">
                    <Ionicons name="checkmark" size={14} color={colors.success} />
                  </View>
                )}
              </View>
              <Ionicons 
                name={showPatientInfo ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.muted} 
              />
            </Pressable>
            
            {(showPatientInfo || (!age || !gender)) && (
              <View className="bg-surface rounded-2xl p-4 border border-border">
                {/* Age Input */}
                <View className="mb-4">
                  <Text className="text-foreground font-medium mb-2">Age</Text>
                  <View className="flex-row items-center bg-background rounded-xl border border-border px-4">
                    <Ionicons name="calendar-outline" size={20} color={colors.muted} />
                    <TextInput
                      className="flex-1 py-3 px-3 text-foreground text-base"
                      placeholder="Enter your age"
                      placeholderTextColor={colors.muted}
                      value={age}
                      onChangeText={setAge}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                  </View>
                </View>

                {/* Gender Selection */}
                <View>
                  <Text className="text-foreground font-medium mb-2">Gender</Text>
                  <View className="flex-row gap-3">
                    <Pressable 
                      className="flex-1"
                      onPress={() => setGender("male")}
                      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                    >
                      <View 
                        className={`p-4 rounded-xl flex-row items-center justify-center ${
                          gender === "male" ? "" : "border border-border"
                        }`}
                        style={{ 
                          backgroundColor: gender === "male" ? colors.primary : colors.background,
                        }}
                      >
                        <Ionicons 
                          name="male" 
                          size={20} 
                          color={gender === "male" ? "white" : colors.foreground} 
                        />
                        <Text 
                          className={`ml-2 font-medium ${gender === "male" ? "text-white" : "text-foreground"}`}
                        >
                          Male
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable 
                      className="flex-1"
                      onPress={() => setGender("female")}
                      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                    >
                      <View 
                        className={`p-4 rounded-xl flex-row items-center justify-center ${
                          gender === "female" ? "" : "border border-border"
                        }`}
                        style={{ 
                          backgroundColor: gender === "female" ? colors.primary : colors.background,
                        }}
                      >
                        <Ionicons 
                          name="female" 
                          size={20} 
                          color={gender === "female" ? "white" : colors.foreground} 
                        />
                        <Text 
                          className={`ml-2 font-medium ${gender === "female" ? "text-white" : "text-foreground"}`}
                        >
                          Female
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Analyze Button */}
        {selectedSymptoms.length > 0 && (
          <View className="px-4 pt-6 pb-8">
            <Pressable
              onPress={handleAnalyze}
              disabled={!canAnalyze}
              style={({ pressed }) => [{ 
                opacity: !canAnalyze ? 0.5 : pressed ? 0.9 : 1,
                transform: [{ scale: pressed && canAnalyze ? 0.98 : 1 }]
              }]}
            >
              <View 
                className="p-4 rounded-2xl flex-row items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Ionicons name="analytics" size={24} color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  Analyze Symptoms
                </Text>
              </View>
            </Pressable>
            
            {!canAnalyze && selectedSymptoms.length > 0 && (
              <Text className="text-muted text-sm text-center mt-2">
                Please enter your age and gender to continue
              </Text>
            )}
          </View>
        )}

        {/* Medical Disclaimer */}
        <View className="px-4 pb-32">
          <View className="bg-warning/10 p-4 rounded-2xl flex-row">
            <Ionicons name="information-circle" size={24} color={colors.warning} />
            <View className="flex-1 ml-3">
              <Text className="text-foreground font-semibold text-sm">Medical Disclaimer</Text>
              <Text className="text-muted text-xs mt-1 leading-5">
                This tool provides general health information only. It is not a substitute for professional medical advice, diagnosis, or treatment.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

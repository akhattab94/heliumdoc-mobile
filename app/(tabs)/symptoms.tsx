import { useState, useRef } from "react";
import { ScrollView, Text, View, Pressable, TextInput, ActivityIndicator, Animated, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const { width } = Dimensions.get("window");

// Body region data with icons and colors
const bodyRegions = [
  { id: "head", name: "Head & Neck", icon: "🧠", color: "#6366F1" },
  { id: "chest", name: "Chest", icon: "💗", color: "#EC4899" },
  { id: "abdomen", name: "Abdomen", icon: "🫁", color: "#F59E0B" },
  { id: "respiratory", name: "Respiratory", icon: "🌬️", color: "#10B981" },
  { id: "musculoskeletal", name: "Muscles & Joints", icon: "💪", color: "#8B5CF6" },
  { id: "skin", name: "Skin", icon: "🖐️", color: "#F97316" },
  { id: "mental", name: "Mental Health", icon: "🧘", color: "#06B6D4" },
  { id: "general", name: "General", icon: "🩺", color: "#14B8A6" },
];

export default function SymptomsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<{ id: string; name: string }[]>([]);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPatientInfo, setShowPatientInfo] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fetch symptoms from API
  const { data: symptomsData, isLoading: loadingSymptoms } = trpc.symptomChecker.getSymptoms.useQuery({
    search: searchQuery || undefined,
  });
  
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
          
          <Text className="text-white/80 text-sm mb-4">
            Describe your symptoms and get instant health insights powered by clinical AI
          </Text>

          {/* Search Bar */}
          <View className="bg-white rounded-2xl flex-row items-center px-4 py-1">
            <Ionicons name="search" size={20} color={colors.muted} />
            <TextInput
              className="flex-1 py-3 px-3 text-foreground text-base"
              placeholder="Search symptoms..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} className="p-1">
                <Ionicons name="close-circle" size={20} color={colors.muted} />
              </Pressable>
            )}
          </View>
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
              <Text className="text-foreground font-bold text-base">Chat with AI Assistant</Text>
              <Text className="text-muted text-sm mt-0.5">Guided conversation for better results</Text>
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
              <View className="bg-primary px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-semibold">{selectedSymptoms.length} selected</Text>
              </View>
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
          <Text className="text-foreground font-bold text-lg mb-1">Where does it hurt?</Text>
          <Text className="text-muted text-sm mb-4">Select a body region to see related symptoms</Text>
          
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
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Symptoms List */}
        {(searchQuery || selectedRegion) && (
          <View className="px-4 pt-4">
            <Text className="text-foreground font-bold text-lg mb-3">
              {searchQuery ? "Search Results" : `${bodyRegions.find(r => r.id === selectedRegion)?.name} Symptoms`}
            </Text>
            
            {loadingSymptoms ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-muted mt-3">Loading symptoms...</Text>
              </View>
            ) : symptoms.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {symptoms.slice(0, 20).map((symptom: { id: string; name: string; common_name: string }) => {
                  const isSelected = selectedSymptoms.some((s) => s.id === symptom.id);
                  return (
                    <Pressable
                      key={symptom.id}
                      onPress={() => toggleSymptom({ id: symptom.id, name: symptom.common_name || symptom.name })}
                      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                    >
                      <View 
                        className={`px-4 py-3 rounded-xl flex-row items-center ${
                          isSelected ? "bg-primary" : "bg-surface border border-border"
                        }`}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={16} color="white" style={{ marginRight: 6 }} />
                        )}
                        <Text className={`text-sm font-medium ${isSelected ? "text-white" : "text-foreground"}`}>
                          {symptom.common_name || symptom.name}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View className="py-8 items-center bg-surface rounded-2xl">
                <Ionicons name="search-outline" size={40} color={colors.muted} />
                <Text className="text-muted mt-2 font-medium">No symptoms found</Text>
                <Text className="text-muted text-sm mt-1">Try a different search term</Text>
              </View>
            )}
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
                <View className="bg-primary/10 p-2 rounded-xl mr-3">
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text className="text-foreground font-bold text-base">Patient Information</Text>
                  <Text className="text-muted text-xs">Required for accurate analysis</Text>
                </View>
              </View>
              <Ionicons 
                name={showPatientInfo ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.muted} 
              />
            </Pressable>

            {showPatientInfo && (
              <View className="bg-surface rounded-2xl p-4 border border-border">
                {/* Age Input */}
                <View className="mb-4">
                  <Text className="text-foreground font-medium text-sm mb-2">Age</Text>
                  <View className="flex-row items-center bg-background rounded-xl px-4 border border-border">
                    <Ionicons name="calendar-outline" size={18} color={colors.muted} />
                    <TextInput
                      className="flex-1 py-3.5 px-3 text-foreground text-base"
                      placeholder="Enter your age"
                      placeholderTextColor={colors.muted}
                      keyboardType="numeric"
                      value={age}
                      onChangeText={setAge}
                      returnKeyType="done"
                    />
                    {age && <Text className="text-muted">years</Text>}
                  </View>
                </View>

                {/* Gender Selection */}
                <View>
                  <Text className="text-foreground font-medium text-sm mb-2">Biological Sex</Text>
                  <View className="flex-row gap-3">
                    <Pressable
                      className="flex-1"
                      onPress={() => setGender("male")}
                      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                    >
                      <View 
                        className={`flex-row items-center justify-center py-4 rounded-xl border-2 ${
                          gender === "male" ? "border-primary bg-primary/10" : "border-border bg-background"
                        }`}
                      >
                        <View 
                          className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${
                            gender === "male" ? "bg-primary" : "bg-muted/20"
                          }`}
                        >
                          <Ionicons name="male" size={18} color={gender === "male" ? "white" : colors.muted} />
                        </View>
                        <Text className={`font-semibold ${gender === "male" ? "text-primary" : "text-muted"}`}>
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
                        className={`flex-row items-center justify-center py-4 rounded-xl border-2 ${
                          gender === "female" ? "border-primary bg-primary/10" : "border-border bg-background"
                        }`}
                      >
                        <View 
                          className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${
                            gender === "female" ? "bg-primary" : "bg-muted/20"
                          }`}
                        >
                          <Ionicons name="female" size={18} color={gender === "female" ? "white" : colors.muted} />
                        </View>
                        <Text className={`font-semibold ${gender === "female" ? "text-primary" : "text-muted"}`}>
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

        {/* Medical Disclaimer */}
        <View className="px-4 pt-6 pb-32">
          <View className="flex-row items-start bg-warning/10 rounded-2xl p-4">
            <View className="bg-warning/20 p-2 rounded-xl mr-3">
              <Ionicons name="information-circle" size={20} color={colors.warning} />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-semibold text-sm mb-1">Medical Disclaimer</Text>
              <Text className="text-muted text-xs leading-5">
                This tool provides general health information only. It is not a substitute for professional 
                medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Button */}
      {selectedSymptoms.length > 0 && (
        <View 
          className="absolute bottom-0 left-0 right-0 px-4 py-4 pb-8"
          style={{ backgroundColor: colors.background }}
        >
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-foreground font-bold text-base">Ready to analyze?</Text>
                <Text className="text-muted text-xs">
                  {!age || !gender ? "Complete patient info to continue" : `${selectedSymptoms.length} symptoms selected`}
                </Text>
              </View>
              {!showPatientInfo && (!age || !gender) && (
                <Pressable 
                  className="bg-primary/10 px-3 py-1.5 rounded-full"
                  onPress={() => setShowPatientInfo(true)}
                >
                  <Text className="text-primary text-xs font-semibold">Add Info</Text>
                </Pressable>
              )}
            </View>
            <Pressable
              disabled={!canAnalyze}
              onPress={handleAnalyze}
              style={({ pressed }) => [
                { opacity: pressed && canAnalyze ? 0.9 : 1, transform: [{ scale: pressed && canAnalyze ? 0.98 : 1 }] },
              ]}
            >
              <View 
                className={`py-4 rounded-xl flex-row items-center justify-center ${
                  canAnalyze ? "bg-primary" : "bg-muted/30"
                }`}
              >
                <Ionicons name="analytics" size={20} color={canAnalyze ? "white" : colors.muted} />
                <Text className={`text-lg font-bold ml-2 ${canAnalyze ? "text-white" : "text-muted"}`}>
                  Get AI Analysis
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

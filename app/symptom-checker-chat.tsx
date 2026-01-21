import { useState, useRef, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

// Import data
import symptomsData from "@/data/symptoms-database.json";

type Message = {
  id: string;
  type: "bot" | "user" | "options" | "body_selector";
  text?: string;
  options?: { id: string; label: string }[];
  selectedOption?: string;
};

type PatientInfo = {
  age: string;
  gender: "male" | "female" | "";
  symptoms: string[];
  answers: Record<string, string | string[]>;
};

export default function SymptomCheckerChatScreen() {
  const router = useRouter();
  const colors = useColors();
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<"welcome" | "age" | "gender" | "body_region" | "symptoms" | "follow_up" | "more_symptoms" | "analyzing" | "complete">("welcome");
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    age: "",
    gender: "",
    symptoms: [],
    answers: {},
  });
  const [inputValue, setInputValue] = useState("");
  const [selectedBodyRegion, setSelectedBodyRegion] = useState<string | null>(null);
  const [currentFollowUpIndex, setCurrentFollowUpIndex] = useState(0);
  const [followUpQuestions, setFollowUpQuestions] = useState<typeof symptomsData.follow_up_questions>([]);

  useEffect(() => {
    // Start conversation
    addBotMessage("Hello! I'm your AI health assistant. I'll help you understand your symptoms and guide you to the right care.");
    setTimeout(() => {
      addBotMessage("Before we begin, please note: This is not a medical diagnosis. Always consult a healthcare professional for proper medical advice.");
      setTimeout(() => {
        setCurrentStep("age");
        addBotMessage("Let's start. How old are you?");
      }, 1000);
    }, 1500);
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [messages]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const addBotMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), type: "bot", text },
    ]);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), type: "user", text },
    ]);
  };

  const addOptionsMessage = (options: { id: string; label: string }[]) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), type: "options", options },
    ]);
  };

  const addBodySelectorMessage = () => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), type: "body_selector" },
    ]);
  };

  const handleAgeSubmit = () => {
    if (!inputValue.trim()) return;
    const age = inputValue.trim();
    addUserMessage(`${age} years old`);
    setPatientInfo((prev) => ({ ...prev, age }));
    setInputValue("");
    
    setTimeout(() => {
      setCurrentStep("gender");
      addBotMessage("What is your biological sex?");
      addOptionsMessage([
        { id: "male", label: "Male" },
        { id: "female", label: "Female" },
      ]);
    }, 500);
  };

  const handleGenderSelect = (gender: "male" | "female") => {
    addUserMessage(gender === "male" ? "Male" : "Female");
    setPatientInfo((prev) => ({ ...prev, gender }));
    
    setTimeout(() => {
      setCurrentStep("body_region");
      addBotMessage("Where are you experiencing discomfort? Select a body region:");
      addBodySelectorMessage();
    }, 500);
  };

  const handleBodyRegionSelect = (regionId: string) => {
    const region = symptomsData.body_regions.find((r) => r.id === regionId);
    if (!region) return;
    
    setSelectedBodyRegion(regionId);
    addUserMessage(region.name);
    
    setTimeout(() => {
      setCurrentStep("symptoms");
      const regionSymptoms = symptomsData.symptoms.filter((s) => s.region === regionId);
      addBotMessage(`What symptoms are you experiencing in your ${region.name.toLowerCase()}? Select all that apply:`);
      addOptionsMessage(regionSymptoms.map((s) => ({ id: s.id, label: s.name })));
    }, 500);
  };

  const handleSymptomSelect = (symptomId: string) => {
    const symptom = symptomsData.symptoms.find((s) => s.id === symptomId);
    if (!symptom) return;
    
    const newSymptoms = [...patientInfo.symptoms, symptomId];
    setPatientInfo((prev) => ({ ...prev, symptoms: newSymptoms }));
    addUserMessage(symptom.name);
    
    // Check if symptom has follow-up questions
    const followUps = symptom.follow_up_questions || [];
    const relevantFollowUps = symptomsData.follow_up_questions.filter((q) =>
      followUps.includes(q.id)
    );
    
    if (relevantFollowUps.length > 0) {
      setFollowUpQuestions(relevantFollowUps);
      setCurrentFollowUpIndex(0);
      setCurrentStep("follow_up");
      askFollowUpQuestion(relevantFollowUps[0]);
    } else {
      askForMoreSymptoms(newSymptoms);
    }
  };

  const askFollowUpQuestion = (question: typeof symptomsData.follow_up_questions[0]) => {
    setTimeout(() => {
      addBotMessage(question.question);
      if (question.type === "single_choice" || question.type === "multi_choice") {
        addOptionsMessage(question.options?.map((o) => ({ id: o.value, label: o.label })) || []);
      } else if (question.type === "yes_no") {
        addOptionsMessage([
          { id: "yes", label: "Yes" },
          { id: "no", label: "No" },
        ]);
      } else if (question.type === "duration") {
        addOptionsMessage(question.options?.map((o) => ({ id: o.value, label: o.label })) || []);
      }
    }, 500);
  };

  const handleFollowUpAnswer = (answerId: string, answerLabel: string) => {
    addUserMessage(answerLabel);
    
    const currentQuestion = followUpQuestions[currentFollowUpIndex];
    setPatientInfo((prev) => ({
      ...prev,
      answers: { ...prev.answers, [currentQuestion.id]: answerId },
    }));
    
    const nextIndex = currentFollowUpIndex + 1;
    if (nextIndex < followUpQuestions.length) {
      setCurrentFollowUpIndex(nextIndex);
      askFollowUpQuestion(followUpQuestions[nextIndex]);
    } else {
      askForMoreSymptoms(patientInfo.symptoms);
    }
  };

  const askForMoreSymptoms = (currentSymptoms: string[]) => {
    setCurrentStep("more_symptoms");
    setTimeout(() => {
      if (currentSymptoms.length < 3) {
        addBotMessage("Do you have any other symptoms?");
        addOptionsMessage([
          { id: "more_same", label: "Yes, in the same area" },
          { id: "more_different", label: "Yes, in a different area" },
          { id: "no_more", label: "No, that's all" },
        ]);
      } else {
        addBotMessage("I have enough information. Let me analyze your symptoms...");
        startAnalysis();
      }
    }, 500);
  };

  const handleMoreSymptomsChoice = (choice: string) => {
    if (choice === "more_same" && selectedBodyRegion) {
      addUserMessage("Yes, in the same area");
      setCurrentStep("symptoms");
      const regionSymptoms = symptomsData.symptoms
        .filter((s) => s.region === selectedBodyRegion && !patientInfo.symptoms.includes(s.id));
      addBotMessage("What other symptoms are you experiencing?");
      addOptionsMessage(regionSymptoms.map((s) => ({ id: s.id, label: s.name })));
    } else if (choice === "more_different") {
      addUserMessage("Yes, in a different area");
      setCurrentStep("body_region");
      addBotMessage("Select another body region:");
      addBodySelectorMessage();
    } else {
      addUserMessage("No, that's all");
      addBotMessage("Thank you. Let me analyze your symptoms...");
      startAnalysis();
    }
  };

  const startAnalysis = () => {
    setCurrentStep("analyzing");
    
    // Simulate analysis with loading messages
    setTimeout(() => {
      addBotMessage("Analyzing your symptoms...");
    }, 500);
    setTimeout(() => {
      addBotMessage("Checking against our medical database...");
    }, 1500);
    setTimeout(() => {
      addBotMessage("Determining urgency level...");
    }, 2500);
    setTimeout(() => {
      // Navigate to results
      router.push({
        pathname: "/symptom-results" as any,
        params: {
          symptoms: JSON.stringify(patientInfo.symptoms),
          age: patientInfo.age,
          gender: patientInfo.gender,
          answers: JSON.stringify(patientInfo.answers),
        },
      });
    }, 3500);
  };

  const resetConversation = () => {
    setMessages([]);
    setCurrentStep("welcome");
    setPatientInfo({ age: "", gender: "", symptoms: [], answers: {} });
    setSelectedBodyRegion(null);
    setCurrentFollowUpIndex(0);
    setFollowUpQuestions([]);
    
    // Restart conversation
    setTimeout(() => {
      addBotMessage("Hello! I'm your AI health assistant. I'll help you understand your symptoms and guide you to the right care.");
      setTimeout(() => {
        addBotMessage("Before we begin, please note: This is not a medical diagnosis. Always consult a healthcare professional for proper medical advice.");
        setTimeout(() => {
          setCurrentStep("age");
          addBotMessage("Let's start. How old are you?");
        }, 1000);
      }, 1500);
    }, 500);
  };

  const renderMessage = (message: Message, index: number) => {
    const isLastOptionsMessage = message.type === "options" && 
      messages.slice(index + 1).every(m => m.type !== "options");

    if (message.type === "bot") {
      return (
        <View key={message.id} className="flex-row mb-3">
          <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-2">
            <Ionicons name="medical" size={16} color="white" />
          </View>
          <View className="flex-1 bg-surface rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
            <Text className="text-foreground text-base leading-6">{message.text}</Text>
          </View>
        </View>
      );
    }

    if (message.type === "user") {
      return (
        <View key={message.id} className="flex-row justify-end mb-3">
          <View className="bg-primary rounded-2xl rounded-tr-sm p-3 max-w-[85%]">
            <Text className="text-white text-base">{message.text}</Text>
          </View>
        </View>
      );
    }

    if (message.type === "options" && isLastOptionsMessage && currentStep !== "analyzing") {
      return (
        <View key={message.id} className="flex-row flex-wrap gap-2 mb-3 ml-10">
          {message.options?.map((option) => (
            <TouchableOpacity
              key={option.id}
              className="bg-surface border border-border rounded-full px-4 py-2 active:bg-primary/10"
              onPress={() => {
                if (currentStep === "gender") {
                  handleGenderSelect(option.id as "male" | "female");
                } else if (currentStep === "symptoms") {
                  handleSymptomSelect(option.id);
                } else if (currentStep === "follow_up") {
                  handleFollowUpAnswer(option.id, option.label);
                } else if (currentStep === "more_symptoms") {
                  handleMoreSymptomsChoice(option.id);
                }
              }}
            >
              <Text className="text-foreground">{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (message.type === "body_selector" && currentStep === "body_region") {
      return (
        <View key={message.id} className="mb-3 ml-10">
          <View className="flex-row flex-wrap gap-2">
            {symptomsData.body_regions.map((region) => (
              <TouchableOpacity
                key={region.id}
                className="bg-surface border border-border rounded-xl p-3 items-center active:bg-primary/10"
                style={{ width: "30%", minWidth: 100 }}
                onPress={() => handleBodyRegionSelect(region.id)}
              >
                <Ionicons
                  name={getBodyRegionIcon(region.id)}
                  size={24}
                  color={colors.primary}
                />
                <Text className="text-foreground text-xs mt-1 text-center">{region.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    return null;
  };

  const getBodyRegionIcon = (regionId: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      head: "happy-outline",
      eyes: "eye-outline",
      ears: "ear-outline",
      nose: "water-outline",
      mouth: "chatbubble-outline",
      neck: "body-outline",
      chest: "heart-outline",
      abdomen: "fitness-outline",
      back: "body-outline",
      arms: "hand-left-outline",
      legs: "footsteps-outline",
      skin: "finger-print-outline",
      urinary: "water-outline",
      general: "body-outline",
    };
    return iconMap[regionId] || "body-outline";
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={100}
      >
        {/* Header */}
        <View className="px-4 py-3 border-b border-border flex-row items-center">
          <TouchableOpacity
            className="mr-3"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">AI Health Assistant</Text>
            <Text className="text-sm text-muted">Conversational Symptom Check</Text>
          </View>
          <TouchableOpacity
            className="bg-surface p-2 rounded-full"
            onPress={resetConversation}
          >
            <Ionicons name="refresh" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {messages.map((msg, idx) => renderMessage(msg, idx))}
            
            {currentStep === "analyzing" && (
              <View className="flex-row items-center ml-10 mt-2">
                <View className="flex-row gap-1">
                  <View className="w-2 h-2 rounded-full bg-primary" />
                  <View className="w-2 h-2 rounded-full bg-primary" style={{ opacity: 0.7 }} />
                  <View className="w-2 h-2 rounded-full bg-primary" style={{ opacity: 0.4 }} />
                </View>
                <Text className="text-muted text-sm ml-2">Analyzing...</Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Input Area */}
        {currentStep === "age" && (
          <View className="px-4 py-3 border-t border-border bg-background">
            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 bg-surface border border-border rounded-full px-4 py-3 text-foreground"
                placeholder="Enter your age"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                value={inputValue}
                onChangeText={setInputValue}
                onSubmitEditing={handleAgeSubmit}
                returnKeyType="done"
              />
              <TouchableOpacity
                className="bg-primary w-12 h-12 rounded-full items-center justify-center"
                onPress={handleAgeSubmit}
              >
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Disclaimer Footer */}
        <View className="px-4 py-2 bg-warning/10">
          <Text className="text-xs text-center text-warning">
            This tool provides general health information only. It is not a substitute for professional medical advice.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

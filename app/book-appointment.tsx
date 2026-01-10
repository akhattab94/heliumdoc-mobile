import { useState } from "react";
import { ScrollView, Text, View, Pressable, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const doctorData: Record<string, any> = {
  "1": { name: "Dr. Sarah Ahmed", specialty: "Cardiologist", hospital: "Hamad Medical Corporation", price: 500 },
  "2": { name: "Dr. Mohammed Al-Thani", specialty: "Dermatologist", hospital: "Sidra Medicine", price: 450 },
  "3": { name: "Dr. Fatima Hassan", specialty: "Pediatrician", hospital: "Al Ahli Hospital", price: 400 },
  "4": { name: "Dr. Ahmed Al-Kuwari", specialty: "Orthopedic Surgeon", hospital: "Hamad Medical Corporation", price: 550 },
};

const defaultDoctor = { name: "Dr. Ahmed Al-Kuwari", specialty: "Orthopedic Surgeon", hospital: "Hamad Medical Corporation", price: 550 };

export default function BookAppointmentScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; date?: string; time?: string }>();
  const doctor = doctorData[params.id || ""] || defaultDoctor;
  const [consultationType, setConsultationType] = useState<"clinic" | "video">("clinic");
  const [isBooking, setIsBooking] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  const handleBooking = async () => {
    setIsBooking(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsBooking(false);
    
    if (Platform.OS === "web") {
      alert("Appointment booked successfully! You will receive a confirmation email shortly.");
    } else {
      Alert.alert(
        "Booking Confirmed!",
        "Your appointment has been booked successfully. You will receive a confirmation email shortly.",
        [{ text: "OK", onPress: () => router.push("/") }]
      );
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Book Appointment", headerTintColor: "#fff", headerStyle: { backgroundColor: colors.primary } }} />
      <ScreenContainer edges={["left", "right"]}>
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Doctor Summary Card */}
          <View className="mx-4 mt-4 bg-surface rounded-2xl p-4 shadow-sm" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
            <View className="flex-row items-center">
              <View className="w-16 h-16 rounded-full bg-background items-center justify-center">
                <Ionicons name="person" size={32} color={colors.primary} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-lg font-bold text-foreground">{doctor.name}</Text>
                <Text className="text-sm text-muted">{doctor.specialty}</Text>
                <Text className="text-xs text-muted">{doctor.hospital}</Text>
              </View>
            </View>
          </View>

          {/* Appointment Details */}
          <View className="mx-4 mt-4 bg-surface rounded-2xl p-4 shadow-sm" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
            <Text className="text-lg font-bold text-foreground mb-4">Appointment Details</Text>
            
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </View>
              <View className="ml-3">
                <Text className="text-xs text-muted">Date</Text>
                <Text className="text-base font-semibold text-foreground">{params.date ? formatDate(params.date) : "Not selected"}</Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                <Ionicons name="time" size={20} color={colors.primary} />
              </View>
              <View className="ml-3">
                <Text className="text-xs text-muted">Time</Text>
                <Text className="text-base font-semibold text-foreground">{params.time || "Not selected"}</Text>
              </View>
            </View>
          </View>

          {/* Consultation Type */}
          <View className="mx-4 mt-4 bg-surface rounded-2xl p-4 shadow-sm" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
            <Text className="text-lg font-bold text-foreground mb-4">Consultation Type</Text>
            
            <View className="flex-row gap-3">
              <Pressable
                className={`flex-1 flex-row items-center justify-center py-4 rounded-xl border-2 ${consultationType === "clinic" ? "border-primary bg-primary/10" : "border-border bg-background"}`}
                onPress={() => setConsultationType("clinic")}
              >
                <Ionicons name="business" size={24} color={consultationType === "clinic" ? colors.primary : colors.muted} />
                <Text className={`ml-2 font-semibold ${consultationType === "clinic" ? "text-primary" : "text-muted"}`}>Clinic Visit</Text>
              </Pressable>
              
              <Pressable
                className={`flex-1 flex-row items-center justify-center py-4 rounded-xl border-2 ${consultationType === "video" ? "border-primary bg-primary/10" : "border-border bg-background"}`}
                onPress={() => setConsultationType("video")}
              >
                <Ionicons name="videocam" size={24} color={consultationType === "video" ? colors.primary : colors.muted} />
                <Text className={`ml-2 font-semibold ${consultationType === "video" ? "text-primary" : "text-muted"}`}>Video Call</Text>
              </Pressable>
            </View>
          </View>

          {/* Payment Summary */}
          <View className="mx-4 mt-4 bg-surface rounded-2xl p-4 shadow-sm" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
            <Text className="text-lg font-bold text-foreground mb-4">Payment Summary</Text>
            
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-muted">Consultation Fee</Text>
              <Text className="text-sm font-semibold text-foreground">{doctor.price} QAR</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-muted">Service Fee</Text>
              <Text className="text-sm font-semibold text-foreground">25 QAR</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-muted">VAT (5%)</Text>
              <Text className="text-sm font-semibold text-foreground">{Math.round((doctor.price + 25) * 0.05)} QAR</Text>
            </View>
            
            <View className="border-t border-border mt-3 pt-3 flex-row justify-between">
              <Text className="text-base font-bold text-foreground">Total</Text>
              <Text className="text-xl font-bold text-primary">{Math.round((doctor.price + 25) * 1.05)} QAR</Text>
            </View>
          </View>

          {/* Terms */}
          <View className="mx-4 mt-4 mb-32">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color={colors.muted} />
              <Text className="flex-1 ml-2 text-xs text-muted leading-5">
                By confirming this booking, you agree to our Terms of Service and Cancellation Policy. 
                Free cancellation is available up to 24 hours before the appointment.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border px-4 py-4 pb-8">
          <Pressable
            className={`py-4 rounded-xl items-center flex-row justify-center ${isBooking ? "bg-muted" : "bg-primary"}`}
            disabled={isBooking}
            onPress={handleBooking}
            style={({ pressed }) => [{ opacity: pressed && !isBooking ? 0.9 : 1, transform: [{ scale: pressed && !isBooking ? 0.98 : 1 }] }]}
          >
            {isBooking ? (
              <>
                <Ionicons name="hourglass" size={20} color="#fff" />
                <Text className="text-white text-lg font-semibold ml-2">Processing...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text className="text-white text-lg font-semibold ml-2">Confirm Booking</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScreenContainer>
    </>
  );
}

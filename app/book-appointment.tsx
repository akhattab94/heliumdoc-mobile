import { useState } from "react";
import { ScrollView, Text, View, Pressable, Alert, Platform, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function BookAppointmentScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ doctorId: string; id?: string; date?: string; time?: string }>();
  const doctorId = parseInt(params.doctorId || params.id || "0");
  const [consultationType, setConsultationType] = useState<"clinic" | "video">("clinic");
  const [isBooking, setIsBooking] = useState(false);

  // Fetch doctor data from API
  const { data: doctor, isLoading } = trpc.doctors.getById.useQuery({ id: doctorId });

  // Book appointment mutation
  const bookMutation = trpc.appointments.book.useMutation({
    onSuccess: (data) => {
      setIsBooking(false);
      if (Platform.OS === "web") {
        alert("Appointment booked successfully! You will receive a confirmation email shortly.");
        router.push("/");
      } else {
        Alert.alert(
          "Booking Confirmed!",
          "Your appointment has been booked successfully. You will receive a confirmation email shortly.",
          [{ text: "OK", onPress: () => router.push("/") }]
        );
      }
    },
    onError: (error) => {
      setIsBooking(false);
      if (Platform.OS === "web") {
        alert(`Booking failed: ${error.message}`);
      } else {
        Alert.alert("Booking Failed", error.message);
      }
    },
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  const formatTime = (time: string) => {
    if (!time) return "Not selected";
    const [hours, mins] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
  };

  const handleBooking = async () => {
    if (!params.date || !params.time) {
      Alert.alert("Error", "Please select a date and time");
      return;
    }

    // Navigate to payment screen
    router.push({
      pathname: "/payment",
      params: {
        appointmentId: "0", // Will be created after payment
        amount: total.toString(),
        doctorName: doctor?.name || "Doctor",
        date: params.date ? formatDate(params.date) : "",
        time: formatTime(params.time || ""),
        doctorId: doctorId.toString(),
        consultationType,
      },
    });
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: "Book Appointment", headerTintColor: "#fff", headerStyle: { backgroundColor: colors.primary } }} />
        <ScreenContainer edges={["left", "right"]}>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </ScreenContainer>
      </>
    );
  }

  if (!doctor) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: "Book Appointment", headerTintColor: "#fff", headerStyle: { backgroundColor: colors.primary } }} />
        <ScreenContainer edges={["left", "right"]}>
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="alert-circle" size={60} color={colors.muted} />
            <Text className="text-lg font-semibold text-foreground mt-4">Doctor not found</Text>
            <Pressable
              className="mt-4 bg-primary px-6 py-2 rounded-full"
              onPress={() => router.back()}
            >
              <Text className="text-white font-medium">Go Back</Text>
            </Pressable>
          </View>
        </ScreenContainer>
      </>
    );
  }

  const consultationFee = consultationType === "video" && doctor.videoConsultationFee
    ? Number(doctor.videoConsultationFee)
    : Number(doctor.consultationFee);
  const serviceFee = 25;
  const vat = Math.round((consultationFee + serviceFee) * 0.05);
  const total = consultationFee + serviceFee + vat;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Book Appointment", headerTintColor: "#fff", headerStyle: { backgroundColor: colors.primary } }} />
      <ScreenContainer edges={["left", "right"]}>
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Doctor Summary Card */}
          <View className="mx-4 mt-4 bg-surface rounded-2xl p-4 shadow-sm" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
            <View className="flex-row items-center">
              <View className="w-16 h-16 rounded-full bg-background items-center justify-center">
                <Text className="text-primary text-lg font-bold">
                  {doctor.name.split(" ").slice(1, 3).map(n => n[0]).join("")}
                </Text>
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-lg font-bold text-foreground">{doctor.name}</Text>
                <Text className="text-sm text-primary">{doctor.specialtyName}</Text>
                <Text className="text-xs text-muted">{doctor.hospitalName}</Text>
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
                <Text className="text-base font-semibold text-foreground">{formatTime(params.time || "")}</Text>
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
              
              {doctor.videoConsultEnabled && (
                <Pressable
                  className={`flex-1 flex-row items-center justify-center py-4 rounded-xl border-2 ${consultationType === "video" ? "border-primary bg-primary/10" : "border-border bg-background"}`}
                  onPress={() => setConsultationType("video")}
                >
                  <Ionicons name="videocam" size={24} color={consultationType === "video" ? colors.primary : colors.muted} />
                  <Text className={`ml-2 font-semibold ${consultationType === "video" ? "text-primary" : "text-muted"}`}>Video Call</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Payment Summary */}
          <View className="mx-4 mt-4 bg-surface rounded-2xl p-4 shadow-sm" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
            <Text className="text-lg font-bold text-foreground mb-4">Payment Summary</Text>
            
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-muted">Consultation Fee</Text>
              <Text className="text-sm font-semibold text-foreground">{consultationFee} QAR</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-muted">Service Fee</Text>
              <Text className="text-sm font-semibold text-foreground">{serviceFee} QAR</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-muted">VAT (5%)</Text>
              <Text className="text-sm font-semibold text-foreground">{vat} QAR</Text>
            </View>
            
            <View className="border-t border-border mt-3 pt-3 flex-row justify-between">
              <Text className="text-base font-bold text-foreground">Total</Text>
              <Text className="text-xl font-bold text-primary">{total} QAR</Text>
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
                <ActivityIndicator size="small" color="#fff" />
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

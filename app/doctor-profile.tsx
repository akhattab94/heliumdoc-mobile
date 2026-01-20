import { useState } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const getNextDays = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push({
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      date: date.getDate(),
      full: date.toISOString().split("T")[0],
    });
  }
  return days;
};

export default function DoctorProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const doctorId = parseInt(params.id || "0");
  
  const [selectedDate, setSelectedDate] = useState(getNextDays()[0].full);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const days = getNextDays();

  // Fetch doctor data from API
  const { data: doctor, isLoading } = trpc.doctors.getById.useQuery({ id: doctorId });
  
  // Fetch available slots for selected date
  const { data: availableSlots, isLoading: slotsLoading } = trpc.doctors.getAvailableSlots.useQuery({
    doctorId,
    date: selectedDate,
  });

  // Format time slot for display (24h to 12h)
  const formatTime = (time: string) => {
    const [hours, mins] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: "Doctor Profile", headerTintColor: "#fff", headerStyle: { backgroundColor: colors.primary } }} />
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
        <Stack.Screen options={{ headerShown: true, title: "Doctor Profile", headerTintColor: "#fff", headerStyle: { backgroundColor: colors.primary } }} />
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

  const education = doctor.education || [];
  const languages = doctor.languages || [];

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Doctor Profile", headerTintColor: "#fff", headerStyle: { backgroundColor: colors.primary } }} />
      <ScreenContainer edges={["left", "right"]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Doctor Header */}
          <View className="bg-primary px-6 pt-6 pb-8" style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
            <View className="flex-row items-center">
              <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center">
                <Text className="text-white text-2xl font-bold">
                  {doctor.name.split(" ").slice(1, 3).map(n => n[0]).join("")}
                </Text>
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-2xl font-bold text-white">{doctor.name}</Text>
                <Text className="text-base text-white/80">{doctor.specialtyName}</Text>
                <Text className="text-sm text-white/60">{doctor.hospitalName}</Text>
                {doctor.videoConsultEnabled && (
                  <View className="flex-row items-center mt-2 gap-1">
                    <Ionicons name="videocam" size={16} color="#fff" />
                    <Text className="text-sm text-white">Video Consultation Available</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Stats Row */}
            <View className="flex-row mt-6 gap-4">
              <View className="flex-1 bg-white/20 rounded-xl p-3 items-center">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="star" size={18} color="#FFD700" />
                  <Text className="text-xl font-bold text-white">
                    {((doctor.rating || 0) / 10).toFixed(1)}
                  </Text>
                </View>
                <Text className="text-xs text-white/70 mt-1">{doctor.totalReviews} reviews</Text>
              </View>
              <View className="flex-1 bg-white/20 rounded-xl p-3 items-center">
                <Text className="text-xl font-bold text-white">{doctor.experience || 0}+</Text>
                <Text className="text-xs text-white/70 mt-1">Years Exp.</Text>
              </View>
              <View className="flex-1 bg-white/20 rounded-xl p-3 items-center">
                <Text className="text-xl font-bold text-white">{doctor.totalPatients || 0}+</Text>
                <Text className="text-xs text-white/70 mt-1">Patients</Text>
              </View>
            </View>
          </View>

          {/* About Section */}
          <View className="px-6 pt-6">
            <Text className="text-lg font-bold text-foreground mb-3">About</Text>
            <Text className="text-sm text-muted leading-6">
              {doctor.bio || `${doctor.name} is a highly qualified ${doctor.specialtyName} at ${doctor.hospitalName}. Book an appointment to receive expert medical care.`}
            </Text>
          </View>

          {/* Education Section */}
          {education.length > 0 && (
            <View className="px-6 pt-6">
              <Text className="text-lg font-bold text-foreground mb-3">Education & Qualifications</Text>
              {education.map((edu: any, index: number) => (
                <View key={index} className="flex-row items-start mb-3">
                  <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3 mt-0.5">
                    <Ionicons name="school" size={16} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">{edu.degree || edu}</Text>
                    {edu.institution && <Text className="text-sm text-muted">{edu.institution}</Text>}
                    {edu.year && <Text className="text-xs text-muted">{edu.year}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <View className="px-6 pt-4">
              <Text className="text-lg font-bold text-foreground mb-3">Languages</Text>
              <View className="flex-row flex-wrap gap-2">
                {languages.map((lang: string) => (
                  <View key={lang} className="bg-background px-3 py-1.5 rounded-full">
                    <Text className="text-sm text-foreground">{lang}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Available Slots */}
          <View className="px-6 pt-6">
            <Text className="text-lg font-bold text-foreground mb-3">Available Slots</Text>
            
            {/* Date Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6 mb-4">
              {days.map((day) => (
                <Pressable
                  key={day.full}
                  className={`w-16 py-3 rounded-xl mr-3 items-center ${selectedDate === day.full ? "bg-primary" : "bg-surface border border-border"}`}
                  onPress={() => {
                    setSelectedDate(day.full);
                    setSelectedTime(null);
                  }}
                >
                  <Text className={`text-xs ${selectedDate === day.full ? "text-white/70" : "text-muted"}`}>{day.day}</Text>
                  <Text className={`text-lg font-bold ${selectedDate === day.full ? "text-white" : "text-foreground"}`}>{day.date}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Time Slots */}
            {slotsLoading ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : availableSlots && availableSlots.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {availableSlots.map((slot) => (
                  <Pressable
                    key={slot}
                    className={`px-4 py-2.5 rounded-xl ${
                      selectedTime === slot 
                        ? "bg-primary" 
                        : "bg-surface border border-border"
                    }`}
                    onPress={() => setSelectedTime(slot)}
                  >
                    <Text className={`text-sm font-medium ${
                      selectedTime === slot 
                        ? "text-white" 
                        : "text-foreground"
                    }`}>
                      {formatTime(slot)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View className="py-8 items-center bg-surface rounded-xl">
                <Ionicons name="calendar-outline" size={32} color={colors.muted} />
                <Text className="text-muted mt-2">No slots available for this date</Text>
              </View>
            )}
          </View>

          {/* Price Info */}
          <View className="px-6 pt-6 pb-32">
            <View className="flex-row items-center justify-between bg-surface rounded-xl p-4 border border-border">
              <View>
                <Text className="text-sm text-muted">Consultation Fee</Text>
                <Text className="text-2xl font-bold text-primary">{doctor.consultationFee} QAR</Text>
              </View>
              {doctor.videoConsultEnabled && doctor.videoConsultationFee && (
                <View className="items-end">
                  <Text className="text-xs text-muted">Video Consult</Text>
                  <Text className="text-lg font-bold text-success">{doctor.videoConsultationFee} QAR</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border px-6 py-4 pb-8">
          <Pressable
            className={`py-4 rounded-xl items-center ${selectedTime ? "bg-primary" : "bg-muted"}`}
            disabled={!selectedTime}
            onPress={() => router.push({ 
              pathname: "/book-appointment", 
              params: { 
                doctorId: params.id, 
                date: selectedDate, 
                time: selectedTime || "" 
              } 
            })}
            style={({ pressed }) => [{ opacity: pressed && selectedTime ? 0.9 : 1, transform: [{ scale: pressed && selectedTime ? 0.98 : 1 }] }]}
          >
            <Text className="text-white text-lg font-semibold">
              {selectedTime ? "Book Appointment" : "Select a Time Slot"}
            </Text>
          </Pressable>
        </View>
      </ScreenContainer>
    </>
  );
}

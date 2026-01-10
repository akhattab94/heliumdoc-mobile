import { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const doctorData: Record<string, any> = {
  "1": { 
    name: "Dr. Sarah Ahmed", 
    specialty: "Cardiologist", 
    hospital: "Hamad Medical Corporation", 
    rating: 4.9, 
    reviews: 127, 
    price: 500, 
    experience: 15,
    patients: 2500,
    videoConsult: true,
    bio: "Dr. Sarah Ahmed is a board-certified cardiologist with over 15 years of experience in treating cardiovascular diseases. She specializes in preventive cardiology, heart failure management, and cardiac imaging.",
    education: [
      { degree: "MD", institution: "Weill Cornell Medicine - Qatar", year: "2008" },
      { degree: "Fellowship in Cardiology", institution: "Cleveland Clinic", year: "2012" },
      { degree: "Board Certification", institution: "American Board of Internal Medicine", year: "2013" },
    ],
    languages: ["English", "Arabic"],
  },
  "2": { 
    name: "Dr. Mohammed Al-Thani", 
    specialty: "Dermatologist", 
    hospital: "Sidra Medicine", 
    rating: 4.8, 
    reviews: 89, 
    price: 450, 
    experience: 12,
    patients: 1800,
    videoConsult: true,
    bio: "Dr. Mohammed Al-Thani is a renowned dermatologist specializing in cosmetic dermatology, skin cancer treatment, and pediatric skin conditions. He has extensive experience in laser treatments and aesthetic procedures.",
    education: [
      { degree: "MD", institution: "Qatar University", year: "2010" },
      { degree: "Residency in Dermatology", institution: "Johns Hopkins", year: "2014" },
    ],
    languages: ["English", "Arabic", "French"],
  },
};

const defaultDoctor = {
  name: "Dr. Ahmed Al-Kuwari",
  specialty: "Orthopedic Surgeon",
  hospital: "Hamad Medical Corporation",
  rating: 4.7,
  reviews: 203,
  price: 550,
  experience: 18,
  patients: 3200,
  videoConsult: true,
  bio: "Experienced orthopedic surgeon specializing in sports medicine and joint replacement surgery.",
  education: [
    { degree: "MD", institution: "Qatar University", year: "2005" },
    { degree: "Fellowship", institution: "Mayo Clinic", year: "2010" },
  ],
  languages: ["English", "Arabic"],
};

const timeSlots = [
  { time: "09:00 AM", available: true },
  { time: "09:30 AM", available: false },
  { time: "10:00 AM", available: true },
  { time: "10:30 AM", available: true },
  { time: "11:00 AM", available: false },
  { time: "11:30 AM", available: true },
  { time: "02:00 PM", available: true },
  { time: "02:30 PM", available: true },
  { time: "03:00 PM", available: false },
  { time: "03:30 PM", available: true },
  { time: "04:00 PM", available: true },
  { time: "04:30 PM", available: false },
];

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
  const doctor = doctorData[params.id || ""] || defaultDoctor;
  const [selectedDate, setSelectedDate] = useState(getNextDays()[0].full);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const days = getNextDays();

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Doctor Profile", headerTintColor: "#fff", headerStyle: { backgroundColor: colors.primary } }} />
      <ScreenContainer edges={["left", "right"]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Doctor Header */}
          <View className="bg-primary px-6 pt-6 pb-8" style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
            <View className="flex-row items-center">
              <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center">
                <Ionicons name="person" size={48} color="#fff" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-2xl font-bold text-white">{doctor.name}</Text>
                <Text className="text-base text-white/80">{doctor.specialty}</Text>
                <Text className="text-sm text-white/60">{doctor.hospital}</Text>
                {doctor.videoConsult && (
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
                  <Text className="text-xl font-bold text-white">{doctor.rating}</Text>
                </View>
                <Text className="text-xs text-white/70 mt-1">{doctor.reviews} reviews</Text>
              </View>
              <View className="flex-1 bg-white/20 rounded-xl p-3 items-center">
                <Text className="text-xl font-bold text-white">{doctor.experience}+</Text>
                <Text className="text-xs text-white/70 mt-1">Years Exp.</Text>
              </View>
              <View className="flex-1 bg-white/20 rounded-xl p-3 items-center">
                <Text className="text-xl font-bold text-white">{doctor.patients}+</Text>
                <Text className="text-xs text-white/70 mt-1">Patients</Text>
              </View>
            </View>
          </View>

          {/* About Section */}
          <View className="px-6 pt-6">
            <Text className="text-lg font-bold text-foreground mb-3">About</Text>
            <Text className="text-sm text-muted leading-6">{doctor.bio}</Text>
          </View>

          {/* Education Section */}
          <View className="px-6 pt-6">
            <Text className="text-lg font-bold text-foreground mb-3">Education & Qualifications</Text>
            {doctor.education.map((edu: any, index: number) => (
              <View key={index} className="flex-row items-start mb-3">
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3 mt-0.5">
                  <Ionicons name="school" size={16} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{edu.degree}</Text>
                  <Text className="text-sm text-muted">{edu.institution}</Text>
                  <Text className="text-xs text-muted">{edu.year}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Languages */}
          <View className="px-6 pt-4">
            <Text className="text-lg font-bold text-foreground mb-3">Languages</Text>
            <View className="flex-row flex-wrap gap-2">
              {doctor.languages.map((lang: string) => (
                <View key={lang} className="bg-background px-3 py-1.5 rounded-full">
                  <Text className="text-sm text-foreground">{lang}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Available Slots */}
          <View className="px-6 pt-6">
            <Text className="text-lg font-bold text-foreground mb-3">Available Slots</Text>
            
            {/* Date Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6 mb-4">
              {days.map((day) => (
                <Pressable
                  key={day.full}
                  className={`w-16 py-3 rounded-xl mr-3 items-center ${selectedDate === day.full ? "bg-primary" : "bg-surface border border-border"}`}
                  onPress={() => setSelectedDate(day.full)}
                >
                  <Text className={`text-xs ${selectedDate === day.full ? "text-white/70" : "text-muted"}`}>{day.day}</Text>
                  <Text className={`text-lg font-bold ${selectedDate === day.full ? "text-white" : "text-foreground"}`}>{day.date}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Time Slots */}
            <View className="flex-row flex-wrap gap-2">
              {timeSlots.map((slot) => (
                <Pressable
                  key={slot.time}
                  className={`px-4 py-2.5 rounded-xl ${
                    !slot.available 
                      ? "bg-background opacity-50" 
                      : selectedTime === slot.time 
                        ? "bg-primary" 
                        : "bg-surface border border-border"
                  }`}
                  disabled={!slot.available}
                  onPress={() => setSelectedTime(slot.time)}
                >
                  <Text className={`text-sm font-medium ${
                    !slot.available 
                      ? "text-muted" 
                      : selectedTime === slot.time 
                        ? "text-white" 
                        : "text-foreground"
                  }`}>
                    {slot.time}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Price Info */}
          <View className="px-6 pt-6 pb-32">
            <View className="flex-row items-center justify-between bg-surface rounded-xl p-4 border border-border">
              <View>
                <Text className="text-sm text-muted">Consultation Fee</Text>
                <Text className="text-2xl font-bold text-primary">{doctor.price} QAR</Text>
              </View>
              <Ionicons name="information-circle-outline" size={24} color={colors.muted} />
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border px-6 py-4 pb-8">
          <Pressable
            className={`py-4 rounded-xl items-center ${selectedTime ? "bg-primary" : "bg-muted"}`}
            disabled={!selectedTime}
            onPress={() => router.push({ pathname: "/book-appointment", params: { id: params.id, date: selectedDate, time: selectedTime || "" } })}
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

import { ScrollView, Text, View, TextInput, Pressable, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const specialties = [
  { id: "1", name: "General", icon: "medical" as const },
  { id: "2", name: "Cardiology", icon: "heart" as const },
  { id: "3", name: "Dermatology", icon: "body" as const },
  { id: "4", name: "Pediatrics", icon: "happy" as const },
  { id: "5", name: "Neurology", icon: "pulse" as const },
  { id: "6", name: "Orthopedics", icon: "fitness" as const },
  { id: "7", name: "Gynecology", icon: "female" as const },
  { id: "8", name: "ENT", icon: "ear" as const },
];

const featuredDoctors = [
  { id: "1", name: "Dr. Sarah Ahmed", specialty: "Cardiologist", hospital: "Hamad Medical Corporation", rating: 4.9, reviews: 127, price: 500, videoConsult: true },
  { id: "2", name: "Dr. Mohammed Al-Thani", specialty: "Dermatologist", hospital: "Sidra Medicine", rating: 4.8, reviews: 89, price: 450, videoConsult: true },
  { id: "3", name: "Dr. Fatima Hassan", specialty: "Pediatrician", hospital: "Al Ahli Hospital", rating: 4.9, reviews: 156, price: 400, videoConsult: false },
];

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer edges={["left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View className="bg-primary px-6 pt-16 pb-8" style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          <Text className="text-3xl font-bold text-white mb-1">Find Your Doctor</Text>
          <Text className="text-base text-white/80 mb-6">Book appointments with top specialists in Qatar</Text>
          
          {/* Search Bar */}
          <Pressable 
            onPress={() => router.push("/doctor-search")}
            style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
          >
            <View className="flex-row items-center bg-white rounded-xl px-4 py-3 mb-4">
              <Ionicons name="search" size={20} color={colors.muted} />
              <Text className="flex-1 ml-3 text-muted">Search doctors, specialties...</Text>
            </View>
          </Pressable>

          {/* Quick Actions */}
          <View className="flex-row gap-3">
            <Pressable 
              className="flex-1 flex-row items-center justify-center bg-white rounded-xl py-3 gap-2"
              onPress={() => router.push({ pathname: "/doctor-search", params: { type: "clinic" } })}
              style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            >
              <Ionicons name="business" size={22} color={colors.primary} />
              <Text className="text-primary font-semibold">Clinic Visit</Text>
            </Pressable>
            <Pressable 
              className="flex-1 flex-row items-center justify-center bg-white rounded-xl py-3 gap-2"
              onPress={() => router.push({ pathname: "/doctor-search", params: { type: "video" } })}
              style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            >
              <Ionicons name="videocam" size={22} color={colors.primary} />
              <Text className="text-primary font-semibold">Video Call</Text>
            </Pressable>
          </View>
        </View>

        {/* Specialties */}
        <View className="px-6 pt-6">
          <Text className="text-xl font-bold text-foreground mb-4">Specialties</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
            {specialties.map((specialty) => (
              <Pressable 
                key={specialty.id}
                className="items-center mr-4"
                style={{ width: 72 }}
                onPress={() => router.push({ pathname: "/doctor-search", params: { specialty: specialty.name } })}
              >
                <View className="w-14 h-14 rounded-2xl bg-surface items-center justify-center mb-2 shadow-sm" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                  <Ionicons name={specialty.icon} size={26} color={colors.primary} />
                </View>
                <Text className="text-xs text-foreground text-center" numberOfLines={1}>{specialty.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Featured Doctors */}
        <View className="px-6 pt-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-foreground">Featured Doctors</Text>
            <Pressable onPress={() => router.push("/doctor-search")}>
              <Text className="text-sm text-primary font-semibold">See All</Text>
            </Pressable>
          </View>
          
          {featuredDoctors.map((doctor) => (
            <Pressable 
              key={doctor.id}
              className="flex-row items-center bg-surface rounded-2xl p-4 mb-3 shadow-sm"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
              onPress={() => router.push({ pathname: "/doctor-profile", params: { id: doctor.id } })}
            >
              <View className="w-14 h-14 rounded-full bg-background items-center justify-center">
                <Ionicons name="person" size={28} color={colors.primary} />
              </View>
              <View className="flex-1 ml-3">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-semibold text-foreground">{doctor.name}</Text>
                  {doctor.videoConsult && (
                    <View className="bg-secondary/20 px-2 py-0.5 rounded">
                      <Text className="text-xs text-secondary font-medium">Video</Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-muted">{doctor.specialty}</Text>
                <View className="flex-row items-center mt-1 gap-1">
                  <Ionicons name="star" size={14} color={colors.warning} />
                  <Text className="text-sm font-semibold text-foreground">{doctor.rating}</Text>
                  <Text className="text-xs text-muted">({doctor.reviews} reviews)</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-lg font-bold text-primary">{doctor.price}</Text>
                <Text className="text-xs text-muted">QAR</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* AI Symptom Checker Banner */}
        <Pressable 
          className="mx-6 mt-4 mb-8 flex-row items-center justify-between bg-secondary rounded-2xl p-5"
          onPress={() => router.push("/(tabs)/symptoms")}
          style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
        >
          <View className="flex-row items-center gap-4">
            <Ionicons name="medical" size={36} color="#fff" />
            <View>
              <Text className="text-lg font-bold text-white">AI Symptom Checker</Text>
              <Text className="text-sm text-white/80">Get instant health insights</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

import { ScrollView, Text, View, TouchableOpacity, TextInput, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

// Quick action buttons data
const quickActions = [
  { id: "find-doctor", title: "Find Doctor", icon: "stethoscope" as const, route: "/doctor-search" },
  { id: "video-consult", title: "Video Consult", icon: "video.fill" as const, route: "/doctor-search?video=true" },
  { id: "symptoms", title: "Symptoms", icon: "heart.text.square" as const, route: "/(tabs)/symptoms" },
  { id: "referrals", title: "Referrals", icon: "arrow.triangle.branch" as const, route: "/(tabs)/referrals" },
];

// Specialties data
const specialtiesData = [
  { id: 1, name: "General", icon: "stethoscope" as const },
  { id: 2, name: "Cardiology", icon: "heart.fill" as const },
  { id: 3, name: "Dermatology", icon: "hand.raised.fill" as const },
  { id: 4, name: "Pediatrics", icon: "figure.child" as const },
  { id: 5, name: "Orthopedics", icon: "figure.walk" as const },
  { id: 6, name: "Neurology", icon: "brain.head.profile" as const },
];

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();

  // Fetch doctors from API
  const { data: doctorsData, isLoading: doctorsLoading } = trpc.doctors.list.useQuery({
    limit: 5,
    sortBy: "rating",
    sortOrder: "desc",
  });

  // Fetch specialties from API
  const { data: specialtiesApiData } = trpc.specialties.list.useQuery();

  const doctors = doctorsData?.doctors || [];
  const specialties = specialtiesApiData || [];

  return (
    <ScreenContainer>
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-muted text-sm">Good morning</Text>
            <Text className="text-foreground text-2xl font-bold">Welcome back!</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-surface items-center justify-center border border-border"
              onPress={() => router.push("/notifications")}
              activeOpacity={0.7}
            >
              <IconSymbol name="bell.fill" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-primary items-center justify-center"
              onPress={() => router.push("/login")}
              activeOpacity={0.7}
            >
              <IconSymbol name="person.fill" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-5 py-3">
          <TouchableOpacity 
            className="flex-row items-center bg-surface rounded-xl px-4 py-3 border border-border"
            onPress={() => router.push("/doctor-search")}
            activeOpacity={0.7}
          >
            <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
            <Text className="text-muted ml-3 flex-1">Search doctors, specialties...</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View className="px-5 py-4">
          <View className="flex-row justify-between">
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                className="items-center w-[22%]"
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <View className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center mb-2">
                  <IconSymbol name={action.icon} size={24} color={colors.primary} />
                </View>
                <Text className="text-foreground text-xs text-center font-medium">{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Specialties */}
        <View className="py-4">
          <View className="flex-row justify-between items-center px-5 mb-3">
            <Text className="text-foreground text-lg font-semibold">Specialties</Text>
            <TouchableOpacity onPress={() => router.push("/doctor-search")}>
              <Text className="text-primary text-sm">See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {(specialties.length > 0 ? specialties.slice(0, 8) : specialtiesData).map((specialty, index) => (
              <TouchableOpacity
                key={specialty.id || index}
                className="items-center mr-4"
                onPress={() => router.push(`/doctor-search?specialty=${specialty.id}`)}
                activeOpacity={0.7}
              >
                <View className="w-16 h-16 rounded-full bg-surface border border-border items-center justify-center mb-2">
                  <IconSymbol 
                    name={specialtiesData[index % specialtiesData.length]?.icon || "stethoscope"} 
                    size={28} 
                    color={colors.primary} 
                  />
                </View>
                <Text className="text-foreground text-xs text-center" numberOfLines={1}>
                  {specialty.name.split(" ")[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* AI Symptom Checker Banner */}
        <View className="px-5 py-3">
          <TouchableOpacity
            className="bg-primary rounded-2xl p-4 flex-row items-center"
            onPress={() => router.push("/(tabs)/symptoms")}
            activeOpacity={0.8}
          >
            <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-4">
              <IconSymbol name="waveform.path.ecg" size={24} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-base">AI Symptom Checker</Text>
              <Text className="text-white/80 text-sm">Get instant health insights</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Featured Doctors */}
        <View className="py-4">
          <View className="flex-row justify-between items-center px-5 mb-3">
            <Text className="text-foreground text-lg font-semibold">Featured Doctors</Text>
            <TouchableOpacity onPress={() => router.push("/doctor-search")}>
              <Text className="text-primary text-sm">See All</Text>
            </TouchableOpacity>
          </View>
          
          {doctorsLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {doctors.map((doctor) => (
                <TouchableOpacity
                  key={doctor.id}
                  className="bg-surface rounded-2xl p-4 mr-4 w-64 border border-border"
                  onPress={() => router.push(`/doctor-profile?id=${doctor.id}`)}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center mb-3">
                    <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center mr-3">
                      <Text className="text-primary text-lg font-bold">
                        {doctor.name.split(" ").slice(1, 3).map(n => n[0]).join("")}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold" numberOfLines={1}>{doctor.name}</Text>
                      <Text className="text-muted text-sm" numberOfLines={1}>{doctor.specialtyName}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <IconSymbol name="star.fill" size={14} color="#FFD700" />
                      <Text className="text-foreground text-sm ml-1">{((doctor.rating || 0) / 10).toFixed(1)}</Text>
                      <Text className="text-muted text-sm ml-1">({doctor.totalReviews})</Text>
                    </View>
                    <Text className="text-primary font-semibold">QAR {doctor.consultationFee}</Text>
                  </View>
                  <Text className="text-muted text-xs mt-2" numberOfLines={1}>
                    {doctor.hospitalName}
                  </Text>
                  {doctor.videoConsultEnabled && (
                    <View className="flex-row items-center mt-2">
                      <IconSymbol name="video.fill" size={12} color={colors.success} />
                      <Text className="text-success text-xs ml-1">Video Consult Available</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Upcoming Appointments Placeholder */}
        <View className="px-5 py-4">
          <Text className="text-foreground text-lg font-semibold mb-3">Upcoming Appointments</Text>
          <View className="bg-surface rounded-2xl p-6 border border-border items-center">
            <IconSymbol name="calendar" size={40} color={colors.muted} />
            <Text className="text-muted text-center mt-3">No upcoming appointments</Text>
            <TouchableOpacity 
              className="mt-4 bg-primary px-6 py-2 rounded-full"
              onPress={() => router.push("/doctor-search")}
            >
              <Text className="text-white font-medium">Book Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

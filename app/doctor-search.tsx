import { useState } from "react";
import { ScrollView, Text, View, TextInput, Pressable, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function DoctorSearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ specialty?: string; type?: string; video?: string }>();
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<number | null>(
    params.specialty ? parseInt(params.specialty) : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [videoOnly, setVideoOnly] = useState(params.video === "true" || params.type === "video");

  // Fetch specialties from API
  const { data: specialtiesData } = trpc.specialties.list.useQuery();
  const specialties = specialtiesData || [];

  // Fetch doctors with filters
  const { data: doctorsData, isLoading } = trpc.doctors.list.useQuery({
    search: searchQuery || undefined,
    specialtyId: selectedSpecialtyId || undefined,
    videoConsultOnly: videoOnly || undefined,
    limit: 50,
    sortBy: "rating",
    sortOrder: "desc",
  });

  const doctors = doctorsData?.doctors || [];

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Find Doctors", headerTintColor: "#fff", headerStyle: { backgroundColor: colors.primary } }} />
      <ScreenContainer edges={["left", "right", "bottom"]}>
        {/* Search Bar */}
        <View className="px-4 py-3 bg-surface border-b border-border">
          <View className="flex-row items-center bg-background rounded-xl px-4 py-2.5">
            <Ionicons name="search" size={20} color={colors.muted} />
            <TextInput
              className="flex-1 ml-3 text-base text-foreground"
              placeholder="Search doctors..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color={colors.muted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Bar */}
        <View className="bg-surface border-b border-border">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-3">
            {/* Video Consult Filter */}
            <Pressable
              className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${videoOnly ? "bg-primary" : "bg-background"}`}
              onPress={() => setVideoOnly(!videoOnly)}
            >
              <Ionicons name="videocam" size={14} color={videoOnly ? "#FFFFFF" : colors.muted} />
              <Text className={`ml-1 text-sm font-medium ${videoOnly ? "text-white" : "text-foreground"}`}>
                Video
              </Text>
            </Pressable>

            {/* All Filter */}
            <Pressable
              className={`px-4 py-2 rounded-full mr-2 ${selectedSpecialtyId === null ? "bg-primary" : "bg-background"}`}
              onPress={() => setSelectedSpecialtyId(null)}
            >
              <Text className={`text-sm font-medium ${selectedSpecialtyId === null ? "text-white" : "text-foreground"}`}>
                All
              </Text>
            </Pressable>

            {/* Specialty Filters */}
            {specialties.slice(0, 10).map((specialty) => (
              <Pressable
                key={specialty.id}
                className={`px-4 py-2 rounded-full mr-2 ${selectedSpecialtyId === specialty.id ? "bg-primary" : "bg-background"}`}
                onPress={() => setSelectedSpecialtyId(specialty.id === selectedSpecialtyId ? null : specialty.id)}
              >
                <Text className={`text-sm font-medium ${selectedSpecialtyId === specialty.id ? "text-white" : "text-foreground"}`}>
                  {specialty.name.split(" ")[0]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Results Count */}
        <View className="px-4 py-3">
          <Text className="text-sm text-muted">
            {isLoading ? "Searching..." : `${doctors.length} doctors found`}
          </Text>
        </View>

        {/* Doctor List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={doctors}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
            renderItem={({ item: doctor }) => (
              <Pressable 
                className="flex-row items-center bg-surface rounded-2xl p-4 mb-3 shadow-sm"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
                onPress={() => router.push({ pathname: "/doctor-profile", params: { id: doctor.id.toString() } })}
              >
                <View className="w-16 h-16 rounded-full bg-background items-center justify-center">
                  <Text className="text-primary text-lg font-bold">
                    {doctor.name.split(" ").slice(1, 3).map(n => n[0]).join("")}
                  </Text>
                </View>
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center flex-wrap gap-2">
                    <Text className="text-base font-semibold text-foreground" numberOfLines={1}>{doctor.name}</Text>
                    {doctor.videoConsultEnabled && (
                      <View className="bg-success/20 px-2 py-0.5 rounded">
                        <Text className="text-xs text-success font-medium">Video</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-sm text-primary">{doctor.specialtyName}</Text>
                  <Text className="text-xs text-muted mt-0.5" numberOfLines={1}>{doctor.hospitalName}</Text>
                  <View className="flex-row items-center mt-1 gap-1">
                    <Ionicons name="star" size={14} color={colors.warning} />
                    <Text className="text-sm font-semibold text-foreground">
                      {((doctor.rating || 0) / 10).toFixed(1)}
                    </Text>
                    <Text className="text-xs text-muted">({doctor.totalReviews} reviews)</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-lg font-bold text-primary">{doctor.consultationFee}</Text>
                  <Text className="text-xs text-muted">QAR</Text>
                  <Pressable 
                    className="mt-2 bg-primary px-4 py-2 rounded-full"
                    onPress={() => router.push({ pathname: "/book-appointment", params: { doctorId: doctor.id.toString() } })}
                    style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                  >
                    <Text className="text-white text-sm font-semibold">Book</Text>
                  </Pressable>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <View className="items-center py-12">
                <Ionicons name="search" size={48} color={colors.muted} />
                <Text className="text-lg font-semibold text-foreground mt-4">No doctors found</Text>
                <Text className="text-sm text-muted mt-1">Try adjusting your filters</Text>
                <Pressable
                  className="mt-4 bg-primary px-6 py-2 rounded-full"
                  onPress={() => {
                    setSearchQuery("");
                    setSelectedSpecialtyId(null);
                    setVideoOnly(false);
                  }}
                >
                  <Text className="text-white font-medium">Clear Filters</Text>
                </Pressable>
              </View>
            }
          />
        )}
      </ScreenContainer>
    </>
  );
}

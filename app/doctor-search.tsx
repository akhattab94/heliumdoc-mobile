import { useState } from "react";
import { ScrollView, Text, View, TextInput, Pressable, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const filters = ["All", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics", "Neurology", "Gynecology", "ENT"];

const doctors = [
  { id: "1", name: "Dr. Sarah Ahmed", specialty: "Cardiologist", hospital: "Hamad Medical Corporation", rating: 4.9, reviews: 127, price: 500, videoConsult: true, availableToday: true },
  { id: "2", name: "Dr. Mohammed Al-Thani", specialty: "Dermatologist", hospital: "Sidra Medicine", rating: 4.8, reviews: 89, price: 450, videoConsult: true, availableToday: false },
  { id: "3", name: "Dr. Fatima Hassan", specialty: "Pediatrician", hospital: "Al Ahli Hospital", rating: 4.9, reviews: 156, price: 400, videoConsult: false, availableToday: true },
  { id: "4", name: "Dr. Ahmed Al-Kuwari", specialty: "Orthopedic Surgeon", hospital: "Hamad Medical Corporation", rating: 4.7, reviews: 203, price: 550, videoConsult: true, availableToday: true },
  { id: "5", name: "Dr. Layla Ibrahim", specialty: "Neurologist", hospital: "Qatar Medical Center", rating: 4.8, reviews: 78, price: 480, videoConsult: true, availableToday: false },
  { id: "6", name: "Dr. Khalid Al-Naimi", specialty: "General Physician", hospital: "PHCC", rating: 4.6, reviews: 312, price: 200, videoConsult: true, availableToday: true },
  { id: "7", name: "Dr. Maryam Al-Sulaiti", specialty: "Gynecologist", hospital: "Women's Hospital", rating: 4.9, reviews: 167, price: 520, videoConsult: false, availableToday: true },
  { id: "8", name: "Dr. Hassan Al-Emadi", specialty: "ENT Specialist", hospital: "Sidra Medicine", rating: 4.7, reviews: 94, price: 420, videoConsult: true, availableToday: false },
];

export default function DoctorSearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ specialty?: string; type?: string }>();
  const [selectedFilter, setSelectedFilter] = useState(params.specialty || "All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesFilter = selectedFilter === "All" || doctor.specialty.toLowerCase().includes(selectedFilter.toLowerCase());
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !params.type || (params.type === "video" ? doctor.videoConsult : true);
    return matchesFilter && matchesSearch && matchesType;
  });

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
            {filters.map((filter) => (
              <Pressable
                key={filter}
                className={`px-4 py-2 rounded-full mr-2 ${selectedFilter === filter ? "bg-primary" : "bg-background"}`}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text className={`text-sm font-medium ${selectedFilter === filter ? "text-white" : "text-foreground"}`}>
                  {filter}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Results Count */}
        <View className="px-4 py-3">
          <Text className="text-sm text-muted">{filteredDoctors.length} doctors found</Text>
        </View>

        {/* Doctor List */}
        <FlatList
          data={filteredDoctors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          renderItem={({ item: doctor }) => (
            <Pressable 
              className="flex-row items-center bg-surface rounded-2xl p-4 mb-3 shadow-sm"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
              onPress={() => router.push({ pathname: "/doctor-profile", params: { id: doctor.id } })}
            >
              <View className="w-16 h-16 rounded-full bg-background items-center justify-center">
                <Ionicons name="person" size={32} color={colors.primary} />
              </View>
              <View className="flex-1 ml-3">
                <View className="flex-row items-center flex-wrap gap-2">
                  <Text className="text-base font-semibold text-foreground">{doctor.name}</Text>
                  {doctor.videoConsult && (
                    <View className="bg-secondary/20 px-2 py-0.5 rounded">
                      <Text className="text-xs text-secondary font-medium">Video</Text>
                    </View>
                  )}
                  {doctor.availableToday && (
                    <View className="bg-success/20 px-2 py-0.5 rounded">
                      <Text className="text-xs text-success font-medium">Today</Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-muted">{doctor.specialty}</Text>
                <Text className="text-xs text-muted mt-0.5">{doctor.hospital}</Text>
                <View className="flex-row items-center mt-1 gap-1">
                  <Ionicons name="star" size={14} color={colors.warning} />
                  <Text className="text-sm font-semibold text-foreground">{doctor.rating}</Text>
                  <Text className="text-xs text-muted">({doctor.reviews} reviews)</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-lg font-bold text-primary">{doctor.price}</Text>
                <Text className="text-xs text-muted">QAR</Text>
                <Pressable 
                  className="mt-2 bg-primary px-4 py-2 rounded-full"
                  onPress={() => router.push({ pathname: "/book-appointment", params: { id: doctor.id } })}
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
            </View>
          }
        />
      </ScreenContainer>
    </>
  );
}

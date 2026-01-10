import { useState } from "react";
import { ScrollView, Text, View, Pressable, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

interface Referral {
  id: string;
  patientName: string;
  fromDoctor: string;
  fromHospital: string;
  toDoctor: string;
  toHospital: string;
  specialty: string;
  date: string;
  urgency: "routine" | "urgent" | "emergency";
  status: "pending" | "accepted" | "completed" | "cancelled";
  reason: string;
}

const referrals: Referral[] = [
  {
    id: "1",
    patientName: "Ahmed Hassan",
    fromDoctor: "Dr. Khalid Al-Naimi",
    fromHospital: "PHCC - Al Wakra",
    toDoctor: "Dr. Sarah Ahmed",
    toHospital: "Hamad Medical Corporation",
    specialty: "Cardiology",
    date: "Jan 10, 2026",
    urgency: "urgent",
    status: "pending",
    reason: "Suspected cardiac arrhythmia, requires specialist evaluation",
  },
  {
    id: "2",
    patientName: "Fatima Al-Sulaiti",
    fromDoctor: "Dr. Mohammed Al-Thani",
    fromHospital: "Sidra Medicine",
    toDoctor: "Dr. Layla Ibrahim",
    toHospital: "Qatar Medical Center",
    specialty: "Neurology",
    date: "Jan 8, 2026",
    urgency: "routine",
    status: "accepted",
    reason: "Chronic migraine management, follow-up consultation",
  },
  {
    id: "3",
    patientName: "Omar Al-Kuwari",
    fromDoctor: "Dr. Fatima Hassan",
    fromHospital: "Al Ahli Hospital",
    toDoctor: "Dr. Ahmed Al-Kuwari",
    toHospital: "Hamad Medical Corporation",
    specialty: "Orthopedics",
    date: "Jan 5, 2026",
    urgency: "routine",
    status: "completed",
    reason: "Knee replacement surgery consultation",
  },
  {
    id: "4",
    patientName: "Maryam Ibrahim",
    fromDoctor: "Dr. Khalid Al-Naimi",
    fromHospital: "PHCC - Doha",
    toDoctor: "Dr. Hassan Al-Emadi",
    toHospital: "Sidra Medicine",
    specialty: "ENT",
    date: "Dec 28, 2025",
    urgency: "urgent",
    status: "completed",
    reason: "Severe ear infection, requires specialist treatment",
  },
  {
    id: "5",
    patientName: "Khalid Al-Thani",
    fromDoctor: "Dr. Sarah Ahmed",
    fromHospital: "Hamad Medical Corporation",
    toDoctor: "Dr. Mohammed Al-Thani",
    toHospital: "Sidra Medicine",
    specialty: "Dermatology",
    date: "Dec 20, 2025",
    urgency: "routine",
    status: "cancelled",
    reason: "Skin condition evaluation",
  },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-warning/20", text: "text-warning" },
  accepted: { bg: "bg-primary/20", text: "text-primary" },
  completed: { bg: "bg-success/20", text: "text-success" },
  cancelled: { bg: "bg-error/20", text: "text-error" },
};

const urgencyColors: Record<string, { bg: string; text: string }> = {
  routine: { bg: "bg-muted/20", text: "text-muted" },
  urgent: { bg: "bg-warning/20", text: "text-warning" },
  emergency: { bg: "bg-error/20", text: "text-error" },
};

export default function ReferralsScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const filteredReferrals = referrals.filter((r) => {
    if (filter === "active") return ["pending", "accepted"].includes(r.status);
    if (filter === "completed") return ["completed", "cancelled"].includes(r.status);
    return true;
  });

  const activeCount = referrals.filter((r) => ["pending", "accepted"].includes(r.status)).length;
  const completedCount = referrals.filter((r) => ["completed", "cancelled"].includes(r.status)).length;

  return (
    <ScreenContainer edges={["left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 pt-16 pb-8" style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          <Text className="text-2xl font-bold text-white mb-2">Medical Referrals</Text>
          <Text className="text-base text-white/80 mb-6">Track your doctor-to-doctor referrals</Text>
          
          {/* Stats */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white/20 rounded-xl p-4 items-center">
              <Text className="text-3xl font-bold text-white">{activeCount}</Text>
              <Text className="text-sm text-white/70">Active</Text>
            </View>
            <View className="flex-1 bg-white/20 rounded-xl p-4 items-center">
              <Text className="text-3xl font-bold text-white">{completedCount}</Text>
              <Text className="text-sm text-white/70">Completed</Text>
            </View>
            <View className="flex-1 bg-white/20 rounded-xl p-4 items-center">
              <Text className="text-3xl font-bold text-white">{referrals.length}</Text>
              <Text className="text-sm text-white/70">Total</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View className="px-6 pt-4">
          <View className="flex-row bg-surface rounded-xl p-1">
            {[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "completed", label: "Completed" },
            ].map((tab) => (
              <Pressable
                key={tab.key}
                className={`flex-1 py-2.5 rounded-lg ${filter === tab.key ? "bg-primary" : ""}`}
                onPress={() => setFilter(tab.key as any)}
              >
                <Text className={`text-center text-sm font-semibold ${filter === tab.key ? "text-white" : "text-muted"}`}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Status Legend */}
        <View className="px-6 pt-4">
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded-full bg-warning" />
              <Text className="text-xs text-muted">Pending</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded-full bg-primary" />
              <Text className="text-xs text-muted">Accepted</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded-full bg-success" />
              <Text className="text-xs text-muted">Completed</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded-full bg-error" />
              <Text className="text-xs text-muted">Cancelled</Text>
            </View>
          </View>
        </View>

        {/* Referral List */}
        <View className="px-6 pt-4 pb-8">
          {filteredReferrals.map((referral) => (
            <View 
              key={referral.id}
              className="bg-surface rounded-2xl p-4 mb-3 shadow-sm"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
            >
              {/* Header Row */}
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">{referral.specialty} Referral</Text>
                  <Text className="text-xs text-muted">{referral.date}</Text>
                </View>
                <View className="flex-row gap-2">
                  <View className={`px-2 py-1 rounded ${urgencyColors[referral.urgency].bg}`}>
                    <Text className={`text-xs font-medium ${urgencyColors[referral.urgency].text}`}>
                      {referral.urgency.toUpperCase()}
                    </Text>
                  </View>
                  <View className={`px-2 py-1 rounded ${statusColors[referral.status].bg}`}>
                    <Text className={`text-xs font-medium ${statusColors[referral.status].text}`}>
                      {referral.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* From/To Section */}
              <View className="flex-row items-center mb-3">
                <View className="flex-1">
                  <Text className="text-xs text-muted mb-1">FROM</Text>
                  <Text className="text-sm font-semibold text-foreground">{referral.fromDoctor}</Text>
                  <Text className="text-xs text-muted">{referral.fromHospital}</Text>
                </View>
                <View className="px-3">
                  <Ionicons name="arrow-forward" size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted mb-1">TO</Text>
                  <Text className="text-sm font-semibold text-foreground">{referral.toDoctor}</Text>
                  <Text className="text-xs text-muted">{referral.toHospital}</Text>
                </View>
              </View>

              {/* Reason */}
              <View className="bg-background rounded-xl p-3">
                <Text className="text-xs text-muted mb-1">Reason for Referral</Text>
                <Text className="text-sm text-foreground">{referral.reason}</Text>
              </View>

              {/* Actions */}
              {referral.status === "accepted" && (
                <Pressable
                  className="mt-3 bg-primary py-3 rounded-xl items-center"
                  style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
                >
                  <Text className="text-white font-semibold">View Appointment Details</Text>
                </Pressable>
              )}
            </View>
          ))}

          {filteredReferrals.length === 0 && (
            <View className="items-center py-12">
              <Ionicons name="document-text-outline" size={48} color={colors.muted} />
              <Text className="text-lg font-semibold text-foreground mt-4">No referrals found</Text>
              <Text className="text-sm text-muted mt-1">No referrals match your filter</Text>
            </View>
          )}
        </View>

        {/* Qatar Healthcare Integration Info */}
        <View className="px-6 pb-8">
          <Text className="text-lg font-bold text-foreground mb-3">Qatar Healthcare Network</Text>
          <View className="bg-surface rounded-2xl p-4 shadow-sm" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
            <Text className="text-sm text-muted mb-3">HealthPlus integrates with major healthcare providers in Qatar:</Text>
            <View className="flex-row flex-wrap gap-2">
              {["HMC", "PHCC", "Sidra Medicine", "Al Ahli Hospital", "Qatar Medical Center"].map((provider) => (
                <View key={provider} className="bg-primary/10 px-3 py-1.5 rounded-full">
                  <Text className="text-sm text-primary">{provider}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

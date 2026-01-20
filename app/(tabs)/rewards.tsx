import { useState } from "react";
import { ScrollView, Text, View, Pressable, Alert, Platform, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

// Fallback data for when user is not authenticated
const fallbackTiers = [
  { name: "Bronze", minPoints: 0, maxPoints: 999, color: "#CD7F32", benefits: ["Earn 1 point per QAR spent", "Birthday bonus points"] },
  { name: "Silver", minPoints: 1000, maxPoints: 4999, color: "#C0C0C0", benefits: ["Earn 1.5 points per QAR spent", "Priority customer support", "Exclusive offers"] },
  { name: "Gold", minPoints: 5000, maxPoints: 9999, color: "#FFD700", benefits: ["Earn 2 points per QAR spent", "Free priority booking", "Partner discounts"] },
  { name: "Platinum", minPoints: 10000, maxPoints: 999999, color: "#E5E4E2", benefits: ["Earn 3 points per QAR spent", "Dedicated account manager", "VIP lounge access", "Annual health checkup"] },
];

const fallbackActivities = [
  { id: "1", description: "Appointment with Dr. Sarah Ahmed", points: 100, date: "Jan 10, 2026", type: "earn" as const },
  { id: "2", description: "Referred a friend", points: 250, date: "Jan 8, 2026", type: "earn" as const },
  { id: "3", description: "Redeemed: 10% Off Consultation", points: -500, date: "Jan 5, 2026", type: "redeem" as const },
  { id: "4", description: "Left a review", points: 50, date: "Jan 3, 2026", type: "earn" as const },
];

export default function RewardsScreen() {
  const colors = useColors();
  const [showActivities, setShowActivities] = useState(false);

  // Fetch loyalty tiers from API
  const { data: tiersData } = trpc.loyalty.getTiers.useQuery();
  
  // Fetch available rewards from API
  const { data: rewardsData, isLoading: rewardsLoading } = trpc.loyalty.getRewards.useQuery();

  // Use API data or fallback
  const rewards = rewardsData || [];
  const tiers = tiersData && tiersData.length > 0 ? tiersData : fallbackTiers;

  // Demo user points (in real app, this would come from user loyalty status)
  const userPoints = 2750;
  const currentTier = fallbackTiers.find((t) => userPoints >= t.minPoints && userPoints <= t.maxPoints) || fallbackTiers[0];
  const nextTier = fallbackTiers[fallbackTiers.indexOf(currentTier) + 1];
  const progressToNext = nextTier ? ((userPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100 : 100;

  const handleRedeem = (reward: typeof rewards[0]) => {
    if (userPoints < reward.pointsCost) {
      if (Platform.OS === "web") {
        alert("Insufficient points. Keep earning to redeem this reward!");
      } else {
        Alert.alert("Insufficient Points", "Keep earning to redeem this reward!");
      }
      return;
    }
    
    if (Platform.OS === "web") {
      alert(`Successfully redeemed: ${reward.name}`);
    } else {
      Alert.alert(
        "Redeem Reward",
        `Are you sure you want to redeem "${reward.name}" for ${reward.pointsCost} points?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Redeem", onPress: () => Alert.alert("Success!", "Your reward has been redeemed. Check your email for details.") },
        ]
      );
    }
  };

  const getRewardIcon = (category: string | null): string => {
    switch (category) {
      case "consultation": return "medical";
      case "lab": return "flask";
      case "pharmacy": return "medkit";
      case "video": return "videocam";
      case "checkup": return "fitness";
      case "dental": return "happy";
      default: return "gift";
    }
  };

  return (
    <ScreenContainer edges={["left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 pt-16 pb-8" style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          <Text className="text-lg text-white/80 mb-1">Your Points Balance</Text>
          <Text className="text-5xl font-bold text-white mb-4">{userPoints.toLocaleString()}</Text>
          
          {/* Tier Badge */}
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: currentTier.color }}>
              <Ionicons name="trophy" size={20} color="#fff" />
            </View>
            <View>
              <Text className="text-lg font-bold text-white">{currentTier.name} Member</Text>
              {nextTier && (
                <Text className="text-sm text-white/70">{nextTier.minPoints - userPoints} points to {nextTier.name}</Text>
              )}
            </View>
          </View>

          {/* Progress Bar */}
          {nextTier && (
            <View className="bg-white/20 rounded-full h-2 overflow-hidden">
              <View className="h-full rounded-full" style={{ width: `${progressToNext}%`, backgroundColor: currentTier.color }} />
            </View>
          )}
        </View>

        {/* Tier Benefits */}
        <View className="px-6 pt-6">
          <Text className="text-lg font-bold text-foreground mb-3">{currentTier.name} Benefits</Text>
          <View className="bg-surface rounded-2xl p-4 shadow-sm" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
            {currentTier.benefits.map((benefit, index) => (
              <View key={index} className={`flex-row items-center ${index > 0 ? "mt-3" : ""}`}>
                <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: `${currentTier.color}30` }}>
                  <Ionicons name="checkmark" size={14} color={currentTier.color} />
                </View>
                <Text className="flex-1 ml-3 text-sm text-foreground">{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Available Rewards */}
        <View className="px-6 pt-6">
          <Text className="text-lg font-bold text-foreground mb-3">Available Rewards</Text>
          {rewardsLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : rewards.length > 0 ? (
            <View className="flex-row flex-wrap gap-3">
              {rewards.map((reward) => (
                <View 
                  key={reward.id} 
                  className="bg-surface rounded-2xl p-4 shadow-sm"
                  style={{ width: "47%", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
                >
                  <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-3">
                    <Ionicons name={getRewardIcon(reward.category) as any} size={24} color={colors.primary} />
                  </View>
                  <Text className="text-sm font-semibold text-foreground mb-1" numberOfLines={2}>{reward.name}</Text>
                  <Text className="text-xs text-muted mb-3" numberOfLines={2}>{reward.description}</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-bold text-primary">{reward.pointsCost}</Text>
                    <Pressable
                      className={`px-3 py-1.5 rounded-full ${userPoints >= reward.pointsCost ? "bg-primary" : "bg-muted"}`}
                      onPress={() => handleRedeem(reward)}
                      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                    >
                      <Text className="text-xs text-white font-semibold">Redeem</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-surface rounded-2xl p-6 items-center">
              <Ionicons name="gift" size={40} color={colors.muted} />
              <Text className="text-muted mt-2">No rewards available</Text>
            </View>
          )}
        </View>

        {/* Activity History */}
        <View className="px-6 pt-6 pb-8">
          <Pressable 
            className="flex-row items-center justify-between mb-3"
            onPress={() => setShowActivities(!showActivities)}
          >
            <Text className="text-lg font-bold text-foreground">Activity History</Text>
            <Ionicons name={showActivities ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
          </Pressable>
          
          {showActivities && (
            <View className="bg-surface rounded-2xl shadow-sm overflow-hidden" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
              {fallbackActivities.map((activity, index) => (
                <View 
                  key={activity.id} 
                  className={`flex-row items-center p-4 ${index > 0 ? "border-t border-border" : ""}`}
                >
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${activity.type === "earn" ? "bg-success/20" : "bg-error/20"}`}>
                    <Ionicons 
                      name={activity.type === "earn" ? "add" : "remove"} 
                      size={20} 
                      color={activity.type === "earn" ? colors.success : colors.error} 
                    />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-sm text-foreground" numberOfLines={1}>{activity.description}</Text>
                    <Text className="text-xs text-muted">{activity.date}</Text>
                  </View>
                  <Text className={`text-base font-semibold ${activity.type === "earn" ? "text-success" : "text-error"}`}>
                    {activity.type === "earn" ? "+" : ""}{activity.points}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* How to Earn */}
        <View className="px-6 pb-8">
          <Text className="text-lg font-bold text-foreground mb-3">How to Earn Points</Text>
          <View className="bg-surface rounded-2xl p-4 shadow-sm" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
            <View className="flex-row items-center mb-3">
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text className="flex-1 ml-3 text-sm text-foreground">Book appointments</Text>
              <Text className="text-sm font-semibold text-primary">100 pts</Text>
            </View>
            <View className="flex-row items-center mb-3">
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text className="flex-1 ml-3 text-sm text-foreground">Refer a friend</Text>
              <Text className="text-sm font-semibold text-primary">250 pts</Text>
            </View>
            <View className="flex-row items-center mb-3">
              <Ionicons name="star" size={20} color={colors.primary} />
              <Text className="flex-1 ml-3 text-sm text-foreground">Leave a review</Text>
              <Text className="text-sm font-semibold text-primary">50 pts</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="clipboard" size={20} color={colors.primary} />
              <Text className="flex-1 ml-3 text-sm text-foreground">Complete health surveys</Text>
              <Text className="text-sm font-semibold text-primary">75 pts</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

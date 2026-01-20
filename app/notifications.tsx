import { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

type NotificationType = "appointment_reminder" | "referral_update" | "loyalty" | "general";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  data: string | null;
  isRead: boolean;
  createdAt: Date;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch notifications
  const { data: notifications, isLoading, refetch } = trpc.notifications.list.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );

  // Get unread count
  const { data: unreadData } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Mark as read mutation
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  // Mark all as read mutation
  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment_reminder":
        return "calendar";
      case "referral_update":
        return "arrow.right.arrow.left";
      case "loyalty":
        return "star.fill";
      default:
        return "bell.fill";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "appointment_reminder":
        return colors.primary;
      case "referral_update":
        return colors.warning;
      case "loyalty":
        return "#FFD700";
      default:
        return colors.muted;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead.mutateAsync({ notificationId: notification.id });
    }

    // Navigate based on notification type
    if (notification.data) {
      try {
        const data = JSON.parse(notification.data);
        if (notification.type === "appointment_reminder" && data.appointmentId) {
          // Navigate to appointment details
          router.push("/(tabs)");
        } else if (notification.type === "referral_update" && data.referralId) {
          router.push("/(tabs)/referrals");
        }
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      className={`flex-row p-4 border-b border-border ${!item.isRead ? "bg-primary/5" : ""}`}
      onPress={() => handleNotificationPress(item)}
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{ backgroundColor: getNotificationColor(item.type) + "20" }}
      >
        <IconSymbol
          name={getNotificationIcon(item.type) as any}
          size={24}
          color={getNotificationColor(item.type)}
        />
      </View>
      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between">
          <Text className={`font-semibold ${!item.isRead ? "text-foreground" : "text-muted"}`}>
            {item.title}
          </Text>
          {!item.isRead && (
            <View className="w-2 h-2 rounded-full bg-primary" />
          )}
        </View>
        {item.body && (
          <Text className="text-muted text-sm mt-1" numberOfLines={2}>
            {item.body}
          </Text>
        )}
        <Text className="text-muted text-xs mt-2">{formatTime(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View className="flex-row items-center p-4 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground ml-4">Notifications</Text>
        </View>
        <View className="flex-1 items-center justify-center p-6">
          <IconSymbol name="bell.fill" size={64} color={colors.muted} />
          <Text className="text-xl font-semibold text-foreground mt-4">Sign in to view notifications</Text>
          <Text className="text-muted text-center mt-2">
            Get appointment reminders and important updates
          </Text>
          <TouchableOpacity
            className="bg-primary px-8 py-3 rounded-xl mt-6"
            onPress={() => router.push("/login")}
          >
            <Text className="text-white font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-border">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground ml-4">Notifications</Text>
          {unreadData && unreadData.count > 0 && (
            <View className="bg-primary rounded-full px-2 py-0.5 ml-2">
              <Text className="text-white text-xs font-medium">{unreadData.count}</Text>
            </View>
          )}
        </View>
        {unreadData && unreadData.count > 0 && (
          <TouchableOpacity onPress={() => markAllAsRead.mutate()}>
            <Text className="text-primary font-medium">Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notifications && notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotification}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View className="flex-1 items-center justify-center p-6">
          <IconSymbol name="bell.fill" size={64} color={colors.muted} />
          <Text className="text-xl font-semibold text-foreground mt-4">No notifications</Text>
          <Text className="text-muted text-center mt-2">
            You're all caught up! We'll notify you about appointments and updates.
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

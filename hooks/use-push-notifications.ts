import { useState, useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useAuth } from "./use-auth";
import { trpc } from "@/lib/trpc";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const { isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // Register push token mutation
  const registerToken = trpc.notifications.registerPushToken.useMutation();

  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    let token: string | null = null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0D9488",
      });
    }

    // Check if running on a physical device (web always returns false)
    const isPhysicalDevice = Platform.OS !== "web";

    if (isPhysicalDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("[Push] Permission not granted");
        return null;
      }

      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId || undefined,
        });
        token = tokenData.data;
        console.log("[Push] Token:", token);
      } catch (error) {
        console.error("[Push] Failed to get token:", error);
      }
    } else {
      console.log("[Push] Web platform - push notifications limited");
    }

    return token;
  }, []);

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications().then((token) => {
      if (token) {
        setExpoPushToken(token);
        // Register token with server if authenticated
        if (isAuthenticated) {
          registerToken.mutate({
            token,
            platform: Platform.OS as "ios" | "android" | "web",
          });
        }
      }
    });

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    // Listen for notification responses (when user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        // Handle navigation based on notification data
        console.log("[Push] Notification tapped:", data);
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, registerForPushNotifications]);

  return {
    expoPushToken,
    notification,
  };
}

// Helper to schedule local notification
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  trigger?: Notifications.NotificationTriggerInput
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: trigger || null, // null = immediate
  });
}

// Helper to schedule appointment reminder
export async function scheduleAppointmentReminder(
  appointmentId: number,
  doctorName: string,
  appointmentDate: Date,
  hoursBefore: number = 24
) {
  const triggerDate = new Date(appointmentDate);
  triggerDate.setHours(triggerDate.getHours() - hoursBefore);

  // Only schedule if in the future
  if (triggerDate > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Appointment Reminder",
        body: `Your appointment with ${doctorName} is ${hoursBefore === 24 ? "tomorrow" : "in 1 hour"}`,
        data: { appointmentId, type: "appointment_reminder" },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }
}

// Cancel all scheduled notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get badge count
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

// Set badge count
export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}

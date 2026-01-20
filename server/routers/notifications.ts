import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { notifications, appointments, users } from "../../drizzle/schema";
import { eq, and, lte, gte, isNull, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Expo Push Notification types
interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
}

// Send push notification via Expo
async function sendExpoPushNotification(message: ExpoPushMessage): Promise<boolean> {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log("[Push] Notification sent:", result);
    return response.ok;
  } catch (error) {
    console.error("[Push] Failed to send notification:", error);
    return false;
  }
}

export const notificationsRouter = router({
  // Register device push token
  registerPushToken: protectedProcedure
    .input(z.object({
      token: z.string(),
      platform: z.enum(["ios", "android", "web"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Store token in user record (we'd need to add a pushToken field to users table)
      // For now, we'll store it in a notification preferences table or just log it
      console.log(`[Push] Registered token for user ${ctx.user.id}: ${input.token.substring(0, 20)}...`);

      return { success: true };
    }),

  // Get user's notifications
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const limit = input?.limit || 20;
      const offset = input?.offset || 0;

      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      return userNotifications;
    }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({
      notificationId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  // Mark all notifications as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.isRead, false)
        )
      );

    return { success: true };
  }),

  // Get unread count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const unread = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.isRead, false)
        )
      );

    return { count: unread.length };
  }),

  // Send appointment reminder (called by cron job or scheduler)
  sendAppointmentReminder: publicProcedure
    .input(z.object({
      appointmentId: z.number(),
      reminderType: z.enum(["24h", "1h"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get appointment details
      const appointment = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, input.appointmentId))
        .then((r: any[]) => r[0]);

      if (!appointment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found" });
      }

      // Get user details
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, appointment.userId))
        .then((r: any[]) => r[0]);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Create notification message
      const reminderText = input.reminderType === "24h" 
        ? "You have an appointment tomorrow"
        : "Your appointment is in 1 hour";

      const title = "Appointment Reminder";
      const body = `${reminderText} at ${appointment.startTime}`;

      // Store notification in database
      await db.insert(notifications).values({
        userId: user.id,
        type: "appointment_reminder",
        title,
        body,
        data: JSON.stringify({
          appointmentId: appointment.id,
          reminderType: input.reminderType,
        }),
      });

      // TODO: Send actual push notification if user has registered a push token
      // This would require storing push tokens in the database

      return { success: true };
    }),

  // Send referral status notification
  sendReferralUpdate: publicProcedure
    .input(z.object({
      userId: z.number(),
      referralId: z.number(),
      status: z.string(),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const title = "Referral Update";

      // Store notification in database
      await db.insert(notifications).values({
        userId: input.userId,
        type: "referral_update",
        title,
        body: input.message,
        data: JSON.stringify({
          referralId: input.referralId,
          status: input.status,
        }),
      });

      return { success: true };
    }),

  // Update notification preferences
  updatePreferences: protectedProcedure
    .input(z.object({
      appointmentReminders: z.boolean().optional(),
      referralUpdates: z.boolean().optional(),
      promotions: z.boolean().optional(),
      emailNotifications: z.boolean().optional(),
      smsNotifications: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // In a full implementation, store these preferences in a user_preferences table
      console.log(`[Notifications] Updated preferences for user ${ctx.user.id}:`, input);
      return { success: true };
    }),
});

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq, or } from "drizzle-orm";
import * as crypto from "crypto";
import { TRPCError } from "@trpc/server";

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash password using SHA256 (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Generate session token
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const authRouter = router({
  // Request OTP for phone login
  requestPhoneOTP: publicProcedure
    .input(z.object({
      phone: z.string().min(8).max(20),
      countryCode: z.string().default("+974"), // Qatar default
    }))
    .mutation(async ({ input }) => {
      const fullPhone = `${input.countryCode}${input.phone.replace(/^0+/, "")}`;
      const otp = generateOTP();
      
      // Store OTP with 5 minute expiry
      otpStore.set(fullPhone, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0,
      });

      // In production, send SMS via Twilio/MessageBird
      console.log(`[Auth] OTP for ${fullPhone}: ${otp}`);
      
      // For demo purposes, return success (in production, actually send SMS)
      return { 
        success: true, 
        message: "OTP sent successfully",
        // For demo only - remove in production
        demoOTP: process.env.NODE_ENV === "development" ? otp : undefined,
      };
    }),

  // Verify phone OTP and login/register
  verifyPhoneOTP: publicProcedure
    .input(z.object({
      phone: z.string().min(8).max(20),
      countryCode: z.string().default("+974"),
      otp: z.string().length(6),
      name: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const fullPhone = `${input.countryCode}${input.phone.replace(/^0+/, "")}`;
      const stored = otpStore.get(fullPhone);

      if (!stored) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No OTP request found. Please request a new OTP.",
        });
      }

      if (Date.now() > stored.expiresAt) {
        otpStore.delete(fullPhone);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "OTP has expired. Please request a new one.",
        });
      }

      if (stored.attempts >= 3) {
        otpStore.delete(fullPhone);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many attempts. Please request a new OTP.",
        });
      }

      if (stored.otp !== input.otp) {
        stored.attempts++;
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid OTP. Please try again.",
        });
      }

      // OTP verified - delete it
      otpStore.delete(fullPhone);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find or create user
      let user = await db.select().from(users).where(eq(users.phone, fullPhone)).then((r: any[]) => r[0]);

      if (!user) {
        // Create new user
        const openId = `phone_${crypto.randomBytes(16).toString("hex")}`;
        const result = await db.insert(users).values({
          openId,
          phone: fullPhone,
          name: input.name || null,
          loginMethod: "phone",
        });
        
        user = await db.select().from(users).where(eq(users.id, Number((result as any).insertId))).then((r: any[]) => r[0]);
      } else {
        // Update last sign in
        await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
      }

      if (!user) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });
      }

      // Generate session token
      const sessionToken = generateSessionToken();

      return {
        success: true,
        sessionToken,
        user: {
          id: user.id,
          openId: user.openId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          loginMethod: user.loginMethod,
          lastSignedIn: user.lastSignedIn,
        },
      };
    }),

  // Email login with password
  loginWithEmail: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // For demo, we'll accept any password for existing users
      // In production, store and verify hashed passwords
      const user = await db.select().from(users).where(eq(users.email, input.email)).then((r: any[]) => r[0]);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No account found with this email. Please register first.",
        });
      }

      // Update last sign in
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      const sessionToken = generateSessionToken();

      return {
        success: true,
        sessionToken,
        user: {
          id: user.id,
          openId: user.openId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          loginMethod: user.loginMethod,
          lastSignedIn: user.lastSignedIn,
        },
      };
    }),

  // Register with email
  registerWithEmail: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(2),
      phone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if email already exists
      const existing = await db.select().from(users).where(eq(users.email, input.email)).then((r: any[]) => r[0]);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }

      // Create new user
      const openId = `email_${crypto.randomBytes(16).toString("hex")}`;
      const result = await db.insert(users).values({
        openId,
        email: input.email,
        name: input.name,
        phone: input.phone || null,
        loginMethod: "email",
      });

      const user = await db.select().from(users).where(eq(users.id, Number((result as any).insertId))).then((r: any[]) => r[0]);

      if (!user) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });
      }

      const sessionToken = generateSessionToken();

      return {
        success: true,
        sessionToken,
        user: {
          id: user.id,
          openId: user.openId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          loginMethod: user.loginMethod,
          lastSignedIn: user.lastSignedIn,
        },
      };
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
      phone: z.string().min(8).max(20).optional(),
      dateOfBirth: z.string().optional(),
      gender: z.enum(["male", "female", "other"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const updateData: Record<string, any> = {};
      if (input.name) updateData.name = input.name;
      if (input.email) updateData.email = input.email;
      if (input.phone) updateData.phone = input.phone;
      if (input.gender) updateData.gender = input.gender;
      if (input.dateOfBirth) updateData.dateOfBirth = new Date(input.dateOfBirth);

      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.id, ctx.user.id));
      }

      const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).then((r: any[]) => r[0]);

      return {
        success: true,
        user: {
          id: user?.id,
          openId: user?.openId,
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
          dateOfBirth: user?.dateOfBirth,
          gender: user?.gender,
          loginMethod: user?.loginMethod,
        },
      };
    }),

  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).then((r: any[]) => r[0]);

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return {
      id: user.id,
      openId: user.openId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      avatarUrl: user.avatarUrl,
      loginMethod: user.loginMethod,
      lastSignedIn: user.lastSignedIn,
    };
  }),
});

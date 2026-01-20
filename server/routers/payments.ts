import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { appointments, doctors, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Payment status types
type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded";

// Stripe-like payment intent response
interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  clientSecret: string;
  appointmentId: number;
  createdAt: Date;
}

// In-memory payment storage (in production, use database + Stripe)
const paymentIntents = new Map<string, PaymentIntent>();

// Generate payment intent ID
function generatePaymentIntentId(): string {
  return `pi_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Generate client secret
function generateClientSecret(paymentIntentId: string): string {
  return `${paymentIntentId}_secret_${Math.random().toString(36).substring(2, 15)}`;
}

export const paymentsRouter = router({
  // Create payment intent for appointment
  createPaymentIntent: protectedProcedure
    .input(z.object({
      appointmentId: z.number(),
      amount: z.number().min(1), // Amount in QAR (smallest unit)
      currency: z.string().default("QAR"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify appointment exists and belongs to user
      const appointment = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, input.appointmentId))
        .then((r: any[]) => r[0]);

      if (!appointment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found" });
      }

      if (appointment.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to pay for this appointment" });
      }

      // Create payment intent
      const paymentIntentId = generatePaymentIntentId();
      const clientSecret = generateClientSecret(paymentIntentId);

      const paymentIntent: PaymentIntent = {
        id: paymentIntentId,
        amount: input.amount,
        currency: input.currency,
        status: "pending",
        clientSecret,
        appointmentId: input.appointmentId,
        createdAt: new Date(),
      };

      paymentIntents.set(paymentIntentId, paymentIntent);

      // In production, this would call Stripe API:
      // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: input.amount,
      //   currency: input.currency.toLowerCase(),
      //   metadata: { appointmentId: input.appointmentId.toString() },
      // });

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      };
    }),

  // Confirm payment (simulates Stripe webhook)
  confirmPayment: protectedProcedure
    .input(z.object({
      paymentIntentId: z.string(),
      paymentMethodId: z.string().optional(), // Card token from Stripe
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const paymentIntent = paymentIntents.get(input.paymentIntentId);

      if (!paymentIntent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Payment intent not found" });
      }

      // Simulate payment processing
      paymentIntent.status = "processing";

      // In production, this would confirm with Stripe:
      // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      // await stripe.paymentIntents.confirm(input.paymentIntentId, {
      //   payment_method: input.paymentMethodId,
      // });

      // Simulate successful payment (in production, this happens via webhook)
      setTimeout(async () => {
        paymentIntent.status = "completed";

        // Update appointment payment status
        try {
          await db
            .update(appointments)
            .set({ 
              paymentStatus: "paid",
              paymentId: input.paymentIntentId,
            })
            .where(eq(appointments.id, paymentIntent.appointmentId));
        } catch (error) {
          console.error("[Payment] Failed to update appointment:", error);
        }
      }, 1000);

      return {
        status: "processing",
        message: "Payment is being processed",
      };
    }),

  // Get payment status
  getPaymentStatus: protectedProcedure
    .input(z.object({
      paymentIntentId: z.string(),
    }))
    .query(async ({ input }) => {
      const paymentIntent = paymentIntents.get(input.paymentIntentId);

      if (!paymentIntent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Payment intent not found" });
      }

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        appointmentId: paymentIntent.appointmentId,
      };
    }),

  // Get payment history
  getPaymentHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get appointments with payment info
      const paidAppointments = await db
        .select({
          id: appointments.id,
          doctorId: appointments.doctorId,
          appointmentDate: appointments.appointmentDate,
          totalAmount: appointments.totalAmount,
          paymentStatus: appointments.paymentStatus,
          paymentId: appointments.paymentId,
          createdAt: appointments.createdAt,
        })
        .from(appointments)
        .where(eq(appointments.userId, ctx.user.id))
        .limit(input?.limit || 20)
        .offset(input?.offset || 0);

      return paidAppointments;
    }),

  // Request refund
  requestRefund: protectedProcedure
    .input(z.object({
      appointmentId: z.number(),
      reason: z.string().min(10).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get appointment
      const appointment = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, input.appointmentId))
        .then((r: any[]) => r[0]);

      if (!appointment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found" });
      }

      if (appointment.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      if (appointment.paymentStatus !== "paid") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Appointment has not been paid" });
      }

      // Check if appointment can be refunded (e.g., 24h before)
      const appointmentDate = new Date(appointment.date);
      const now = new Date();
      const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilAppointment < 24) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Refunds must be requested at least 24 hours before the appointment",
        });
      }

      // In production, process refund via Stripe:
      // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      // await stripe.refunds.create({
      //   payment_intent: appointment.paymentId,
      // });

      // Update appointment status
      await db
        .update(appointments)
        .set({ 
          paymentStatus: "refunded",
          status: "cancelled",
        })
        .where(eq(appointments.id, input.appointmentId));

      // Update in-memory payment intent if exists
      if (appointment.paymentId) {
        const paymentIntent = paymentIntents.get(appointment.paymentId);
        if (paymentIntent) {
          paymentIntent.status = "refunded";
        }
      }

      return {
        success: true,
        message: "Refund request submitted. Amount will be credited within 5-7 business days.",
      };
    }),

  // Get available payment methods (for Qatar)
  getPaymentMethods: publicProcedure.query(() => {
    return {
      methods: [
        {
          id: "card",
          name: "Credit/Debit Card",
          description: "Visa, Mastercard, American Express",
          icon: "credit-card",
          enabled: true,
        },
        {
          id: "apple_pay",
          name: "Apple Pay",
          description: "Pay with Apple Pay",
          icon: "apple",
          enabled: true,
        },
        {
          id: "google_pay",
          name: "Google Pay",
          description: "Pay with Google Pay",
          icon: "google",
          enabled: true,
        },
        {
          id: "qpay",
          name: "QPay",
          description: "Qatar National Payment System",
          icon: "qpay",
          enabled: true,
        },
        {
          id: "naps",
          name: "NAPS",
          description: "National Payment System Debit Card",
          icon: "naps",
          enabled: true,
        },
      ],
      currency: "QAR",
      vatRate: 0, // Qatar has no VAT currently
    };
  }),
});

import { z } from "zod";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { appointments, doctors, hospitals, specialties } from "../../drizzle/schema";

export const appointmentsRouter = router({
  // List user's appointments
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]).optional(),
        upcoming: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { appointments: [], total: 0 };

      const conditions = [eq(appointments.userId, ctx.user.id)];

      if (input.status) {
        conditions.push(eq(appointments.status, input.status));
      }

      if (input.upcoming) {
        conditions.push(gte(appointments.appointmentDate, new Date()));
      }

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(and(...conditions));
      const total = Number(countResult[0]?.count || 0);

      // Get appointments with doctor and hospital info
      const result = await db
        .select({
          id: appointments.id,
          appointmentDate: appointments.appointmentDate,
          startTime: appointments.startTime,
          endTime: appointments.endTime,
          consultationType: appointments.consultationType,
          status: appointments.status,
          consultationFee: appointments.consultationFee,
          serviceFee: appointments.serviceFee,
          totalAmount: appointments.totalAmount,
          notes: appointments.notes,
          videoCallUrl: appointments.videoCallUrl,
          createdAt: appointments.createdAt,
          doctorId: appointments.doctorId,
          doctorName: doctors.name,
          doctorPhotoUrl: doctors.photoUrl,
          hospitalId: appointments.hospitalId,
          hospitalName: hospitals.name,
          hospitalAddress: hospitals.address,
          specialtyName: specialties.name,
        })
        .from(appointments)
        .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
        .leftJoin(hospitals, eq(appointments.hospitalId, hospitals.id))
        .leftJoin(specialties, eq(doctors.specialtyId, specialties.id))
        .where(and(...conditions))
        .orderBy(desc(appointments.appointmentDate))
        .limit(input.limit)
        .offset(input.offset);

      return { appointments: result, total };
    }),

  // Get single appointment by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select({
          id: appointments.id,
          appointmentDate: appointments.appointmentDate,
          startTime: appointments.startTime,
          endTime: appointments.endTime,
          consultationType: appointments.consultationType,
          status: appointments.status,
          consultationFee: appointments.consultationFee,
          serviceFee: appointments.serviceFee,
          totalAmount: appointments.totalAmount,
          notes: appointments.notes,
          cancelReason: appointments.cancelReason,
          videoCallUrl: appointments.videoCallUrl,
          createdAt: appointments.createdAt,
          doctorId: appointments.doctorId,
          doctorName: doctors.name,
          doctorPhotoUrl: doctors.photoUrl,
          doctorRating: doctors.rating,
          hospitalId: appointments.hospitalId,
          hospitalName: hospitals.name,
          hospitalAddress: hospitals.address,
          hospitalCity: hospitals.city,
          specialtyName: specialties.name,
        })
        .from(appointments)
        .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
        .leftJoin(hospitals, eq(appointments.hospitalId, hospitals.id))
        .leftJoin(specialties, eq(doctors.specialtyId, specialties.id))
        .where(
          and(
            eq(appointments.id, input.id),
            eq(appointments.userId, ctx.user.id)
          )
        )
        .limit(1);

      return result.length > 0 ? result[0] : null;
    }),

  // Book a new appointment
  book: protectedProcedure
    .input(
      z.object({
        doctorId: z.number(),
        date: z.string(), // YYYY-MM-DD
        startTime: z.string(), // HH:MM
        consultationType: z.enum(["clinic", "video"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get doctor info
      const doctorResult = await db
        .select()
        .from(doctors)
        .where(eq(doctors.id, input.doctorId))
        .limit(1);

      if (doctorResult.length === 0) {
        throw new Error("Doctor not found");
      }

      const doctor = doctorResult[0];

      // Calculate end time (30 min slots)
      const startParts = input.startTime.split(":").map(Number);
      const endMinutes = startParts[0] * 60 + startParts[1] + 30;
      const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;

      // Calculate fees
      const consultationFee = input.consultationType === "video" && doctor.videoConsultationFee
        ? doctor.videoConsultationFee
        : doctor.consultationFee;
      const serviceFee = 25; // Fixed service fee
      const totalAmount = consultationFee + serviceFee;

      // Check for conflicts
      const appointmentDate = new Date(input.date);
      const existingAppointments = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.doctorId, input.doctorId),
            eq(appointments.appointmentDate, appointmentDate),
            eq(appointments.startTime, input.startTime),
            eq(appointments.status, "confirmed")
          )
        );

      if (existingAppointments.length > 0) {
        throw new Error("This time slot is already booked");
      }

      // Create appointment
      const result = await db.insert(appointments).values({
        userId: ctx.user.id,
        doctorId: input.doctorId,
        hospitalId: doctor.hospitalId,
        appointmentDate,
        startTime: input.startTime,
        endTime,
        consultationType: input.consultationType,
        status: "confirmed",
        consultationFee,
        serviceFee,
        totalAmount,
        notes: input.notes,
      });

      return {
        id: Number(result[0].insertId),
        message: "Appointment booked successfully",
      };
    }),

  // Cancel an appointment
  cancel: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const existing = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.id, input.id),
            eq(appointments.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        throw new Error("Appointment not found");
      }

      if (existing[0].status === "cancelled") {
        throw new Error("Appointment is already cancelled");
      }

      if (existing[0].status === "completed") {
        throw new Error("Cannot cancel a completed appointment");
      }

      // Update appointment
      await db
        .update(appointments)
        .set({
          status: "cancelled",
          cancelReason: input.reason,
        })
        .where(eq(appointments.id, input.id));

      return { success: true, message: "Appointment cancelled successfully" };
    }),

  // Reschedule an appointment
  reschedule: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        date: z.string(),
        startTime: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const existing = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.id, input.id),
            eq(appointments.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        throw new Error("Appointment not found");
      }

      if (existing[0].status !== "confirmed" && existing[0].status !== "pending") {
        throw new Error("Cannot reschedule this appointment");
      }

      // Calculate end time
      const startParts = input.startTime.split(":").map(Number);
      const endMinutes = startParts[0] * 60 + startParts[1] + 30;
      const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;

      // Check for conflicts
      const appointmentDate = new Date(input.date);
      const conflicts = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.doctorId, existing[0].doctorId),
            eq(appointments.appointmentDate, appointmentDate),
            eq(appointments.startTime, input.startTime),
            eq(appointments.status, "confirmed")
          )
        );

      if (conflicts.length > 0) {
        throw new Error("This time slot is already booked");
      }

      // Update appointment
      await db
        .update(appointments)
        .set({
          appointmentDate,
          startTime: input.startTime,
          endTime,
        })
        .where(eq(appointments.id, input.id));

      return { success: true, message: "Appointment rescheduled successfully" };
    }),
});

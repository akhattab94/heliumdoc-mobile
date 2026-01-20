import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { referrals, doctors, hospitals, specialties } from "../../drizzle/schema";

export const referralsRouter = router({
  // List user's referrals
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "accepted", "completed", "cancelled", "expired"]).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { referrals: [], total: 0 };

      const conditions = [eq(referrals.patientId, ctx.user.id)];
      if (input.status) {
        conditions.push(eq(referrals.status, input.status));
      }

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(referrals)
        .where(and(...conditions));
      const total = Number(countResult[0]?.count || 0);

      // Get referrals with doctor and hospital info
      // Using aliases for the joined tables
      const fromDoctors = db
        .select({
          id: doctors.id,
          name: doctors.name,
          photoUrl: doctors.photoUrl,
        })
        .from(doctors)
        .as("fromDoctors");

      const toDoctors = db
        .select({
          id: doctors.id,
          name: doctors.name,
          photoUrl: doctors.photoUrl,
        })
        .from(doctors)
        .as("toDoctors");

      // Simplified query without complex joins
      const result = await db
        .select()
        .from(referrals)
        .where(and(...conditions))
        .orderBy(desc(referrals.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Enrich with doctor and hospital data
      const enrichedReferrals = await Promise.all(
        result.map(async (ref) => {
          const fromDoctor = await db
            .select({ name: doctors.name, photoUrl: doctors.photoUrl })
            .from(doctors)
            .where(eq(doctors.id, ref.fromDoctorId))
            .limit(1);

          const toDoctor = await db
            .select({ name: doctors.name, photoUrl: doctors.photoUrl })
            .from(doctors)
            .where(eq(doctors.id, ref.toDoctorId))
            .limit(1);

          const fromHospital = await db
            .select({ name: hospitals.name })
            .from(hospitals)
            .where(eq(hospitals.id, ref.fromHospitalId))
            .limit(1);

          const toHospital = await db
            .select({ name: hospitals.name })
            .from(hospitals)
            .where(eq(hospitals.id, ref.toHospitalId))
            .limit(1);

          const specialty = await db
            .select({ name: specialties.name })
            .from(specialties)
            .where(eq(specialties.id, ref.specialtyId))
            .limit(1);

          return {
            ...ref,
            fromDoctorName: fromDoctor[0]?.name || "Unknown",
            fromDoctorPhotoUrl: fromDoctor[0]?.photoUrl || null,
            toDoctorName: toDoctor[0]?.name || "Unknown",
            toDoctorPhotoUrl: toDoctor[0]?.photoUrl || null,
            fromHospitalName: fromHospital[0]?.name || "Unknown",
            toHospitalName: toHospital[0]?.name || "Unknown",
            specialtyName: specialty[0]?.name || "Unknown",
          };
        })
      );

      return { referrals: enrichedReferrals, total };
    }),

  // Get single referral by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(referrals)
        .where(
          and(
            eq(referrals.id, input.id),
            eq(referrals.patientId, ctx.user.id)
          )
        )
        .limit(1);

      if (result.length === 0) return null;

      const ref = result[0];

      // Get related data
      const fromDoctor = await db
        .select({ name: doctors.name, photoUrl: doctors.photoUrl })
        .from(doctors)
        .where(eq(doctors.id, ref.fromDoctorId))
        .limit(1);

      const toDoctor = await db
        .select({ name: doctors.name, photoUrl: doctors.photoUrl })
        .from(doctors)
        .where(eq(doctors.id, ref.toDoctorId))
        .limit(1);

      const fromHospital = await db
        .select({ name: hospitals.name, address: hospitals.address })
        .from(hospitals)
        .where(eq(hospitals.id, ref.fromHospitalId))
        .limit(1);

      const toHospital = await db
        .select({ name: hospitals.name, address: hospitals.address })
        .from(hospitals)
        .where(eq(hospitals.id, ref.toHospitalId))
        .limit(1);

      const specialty = await db
        .select({ name: specialties.name })
        .from(specialties)
        .where(eq(specialties.id, ref.specialtyId))
        .limit(1);

      return {
        ...ref,
        fromDoctor: fromDoctor[0] || null,
        toDoctor: toDoctor[0] || null,
        fromHospital: fromHospital[0] || null,
        toHospital: toHospital[0] || null,
        specialty: specialty[0] || null,
      };
    }),

  // Accept a referral (book appointment with referred doctor)
  accept: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(referrals)
        .where(
          and(
            eq(referrals.id, input.id),
            eq(referrals.patientId, ctx.user.id)
          )
        )
        .limit(1);

      if (result.length === 0) {
        throw new Error("Referral not found");
      }

      if (result[0].status !== "pending") {
        throw new Error("Referral is not pending");
      }

      await db
        .update(referrals)
        .set({ status: "accepted" })
        .where(eq(referrals.id, input.id));

      return { success: true, message: "Referral accepted" };
    }),
});

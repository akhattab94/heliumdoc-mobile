import { z } from "zod";
import { eq, like, and, or, desc, asc, sql } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { doctors, hospitals, specialties, doctorSchedules, reviews } from "../../drizzle/schema";

export const doctorsRouter = router({
  // List all doctors with filters
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        specialtyId: z.number().optional(),
        hospitalId: z.number().optional(),
        videoConsultOnly: z.boolean().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        sortBy: z.enum(["rating", "price", "experience", "name"]).optional(),
        sortOrder: z.enum(["asc", "desc"]).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { doctors: [], total: 0 };

      const conditions = [eq(doctors.isActive, true)];

      if (input.search) {
        conditions.push(
          or(
            like(doctors.name, `%${input.search}%`),
            like(doctors.nameAr, `%${input.search}%`)
          )!
        );
      }

      if (input.specialtyId) {
        conditions.push(eq(doctors.specialtyId, input.specialtyId));
      }

      if (input.hospitalId) {
        conditions.push(eq(doctors.hospitalId, input.hospitalId));
      }

      if (input.videoConsultOnly) {
        conditions.push(eq(doctors.videoConsultEnabled, true));
      }

      if (input.minPrice !== undefined) {
        conditions.push(sql`${doctors.consultationFee} >= ${input.minPrice}`);
      }

      if (input.maxPrice !== undefined) {
        conditions.push(sql`${doctors.consultationFee} <= ${input.maxPrice}`);
      }

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(doctors)
        .where(and(...conditions));
      const total = Number(countResult[0]?.count || 0);

      // Build order by
      let orderBy: ReturnType<typeof desc> = desc(doctors.rating);
      if (input.sortBy) {
        const direction = input.sortOrder === "asc" ? asc : desc;
        switch (input.sortBy) {
          case "rating":
            orderBy = direction(doctors.rating);
            break;
          case "price":
            orderBy = direction(doctors.consultationFee);
            break;
          case "experience":
            orderBy = direction(doctors.experience);
            break;
          case "name":
            orderBy = direction(doctors.name);
            break;
        }
      }

      // Get doctors with hospital and specialty info
      const result = await db
        .select({
          id: doctors.id,
          name: doctors.name,
          nameAr: doctors.nameAr,
          title: doctors.title,
          bio: doctors.bio,
          photoUrl: doctors.photoUrl,
          experience: doctors.experience,
          consultationFee: doctors.consultationFee,
          videoConsultationFee: doctors.videoConsultationFee,
          videoConsultEnabled: doctors.videoConsultEnabled,
          rating: doctors.rating,
          totalReviews: doctors.totalReviews,
          totalPatients: doctors.totalPatients,
          languages: doctors.languages,
          hospitalId: doctors.hospitalId,
          hospitalName: hospitals.name,
          hospitalAddress: hospitals.address,
          specialtyId: doctors.specialtyId,
          specialtyName: specialties.name,
          specialtyIcon: specialties.icon,
        })
        .from(doctors)
        .leftJoin(hospitals, eq(doctors.hospitalId, hospitals.id))
        .leftJoin(specialties, eq(doctors.specialtyId, specialties.id))
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(input.limit)
        .offset(input.offset);

      return {
        doctors: result.map((d) => ({
          ...d,
          languages: d.languages ? JSON.parse(d.languages) : [],
        })),
        total,
      };
    }),

  // Get single doctor by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select({
          id: doctors.id,
          name: doctors.name,
          nameAr: doctors.nameAr,
          title: doctors.title,
          bio: doctors.bio,
          photoUrl: doctors.photoUrl,
          experience: doctors.experience,
          consultationFee: doctors.consultationFee,
          videoConsultationFee: doctors.videoConsultationFee,
          videoConsultEnabled: doctors.videoConsultEnabled,
          rating: doctors.rating,
          totalReviews: doctors.totalReviews,
          totalPatients: doctors.totalPatients,
          languages: doctors.languages,
          education: doctors.education,
          hospitalId: doctors.hospitalId,
          hospitalName: hospitals.name,
          hospitalAddress: hospitals.address,
          hospitalCity: hospitals.city,
          specialtyId: doctors.specialtyId,
          specialtyName: specialties.name,
          specialtyIcon: specialties.icon,
        })
        .from(doctors)
        .leftJoin(hospitals, eq(doctors.hospitalId, hospitals.id))
        .leftJoin(specialties, eq(doctors.specialtyId, specialties.id))
        .where(eq(doctors.id, input.id))
        .limit(1);

      if (result.length === 0) return null;

      const doctor = result[0];
      return {
        ...doctor,
        languages: doctor.languages ? JSON.parse(doctor.languages) : [],
        education: doctor.education ? JSON.parse(doctor.education) : [],
      };
    }),

  // Get doctor schedule
  getSchedule: publicProcedure
    .input(z.object({ doctorId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const schedule = await db
        .select()
        .from(doctorSchedules)
        .where(
          and(
            eq(doctorSchedules.doctorId, input.doctorId),
            eq(doctorSchedules.isActive, true)
          )
        )
        .orderBy(asc(doctorSchedules.dayOfWeek));

      return schedule;
    }),

  // Get available time slots for a specific date
  getAvailableSlots: publicProcedure
    .input(
      z.object({
        doctorId: z.number(),
        date: z.string(), // YYYY-MM-DD format
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const date = new Date(input.date);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Get schedule for this day
      const schedules = await db
        .select()
        .from(doctorSchedules)
        .where(
          and(
            eq(doctorSchedules.doctorId, input.doctorId),
            eq(doctorSchedules.dayOfWeek, dayOfWeek),
            eq(doctorSchedules.isActive, true)
          )
        );

      if (schedules.length === 0) return [];

      const schedule = schedules[0];
      const slots: string[] = [];

      // Generate time slots
      const startParts = schedule.startTime.split(":").map(Number);
      const endParts = schedule.endTime.split(":").map(Number);
      const startMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];
      const slotDuration = schedule.slotDuration;

      for (let time = startMinutes; time < endMinutes; time += slotDuration) {
        const hours = Math.floor(time / 60);
        const mins = time % 60;
        slots.push(`${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`);
      }

      // TODO: Filter out already booked slots from appointments table
      return slots;
    }),

  // Get doctor reviews
  getReviews: publicProcedure
    .input(
      z.object({
        doctorId: z.number(),
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { reviews: [], total: 0 };

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(reviews)
        .where(eq(reviews.doctorId, input.doctorId));
      const total = Number(countResult[0]?.count || 0);

      const result = await db
        .select()
        .from(reviews)
        .where(eq(reviews.doctorId, input.doctorId))
        .orderBy(desc(reviews.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return { reviews: result, total };
    }),
});

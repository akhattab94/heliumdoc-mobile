import { z } from "zod";
import { eq, like, sql } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { hospitals, doctors } from "../../drizzle/schema";

export const hospitalsRouter = router({
  // List all hospitals
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        city: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db
        .select({
          id: hospitals.id,
          name: hospitals.name,
          nameAr: hospitals.nameAr,
          address: hospitals.address,
          city: hospitals.city,
          phone: hospitals.phone,
          email: hospitals.email,
          logoUrl: hospitals.logoUrl,
          latitude: hospitals.latitude,
          longitude: hospitals.longitude,
          doctorCount: sql<number>`(SELECT COUNT(*) FROM doctors WHERE doctors.hospitalId = ${hospitals.id} AND doctors.isActive = true)`,
        })
        .from(hospitals)
        .where(eq(hospitals.isActive, true));

      // Note: Additional filtering would need to be added with proper query builder

      const result = await query;
      return result;
    }),

  // Get hospital by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(hospitals)
        .where(eq(hospitals.id, input.id))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    }),

  // Get doctors at a hospital
  getDoctors: publicProcedure
    .input(z.object({ hospitalId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const result = await db
        .select()
        .from(doctors)
        .where(eq(doctors.hospitalId, input.hospitalId));

      return result.map((d) => ({
        ...d,
        languages: d.languages ? JSON.parse(d.languages) : [],
      }));
    }),
});

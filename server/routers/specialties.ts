import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { specialties, doctors } from "../../drizzle/schema";

export const specialtiesRouter = router({
  // List all specialties
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const result = await db
      .select({
        id: specialties.id,
        name: specialties.name,
        nameAr: specialties.nameAr,
        icon: specialties.icon,
        description: specialties.description,
        doctorCount: sql<number>`(SELECT COUNT(*) FROM doctors WHERE doctors.specialtyId = ${specialties.id} AND doctors.isActive = true)`,
      })
      .from(specialties)
      .where(eq(specialties.isActive, true));

    return result;
  }),

  // Get specialty by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(specialties)
        .where(eq(specialties.id, input.id))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    }),
});

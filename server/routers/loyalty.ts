import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loyaltyTiers, userLoyalty, loyaltyTransactions, rewards, userRewards } from "../../drizzle/schema";

export const loyaltyRouter = router({
  // Get all loyalty tiers
  getTiers: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const result = await db
      .select()
      .from(loyaltyTiers)
      .where(eq(loyaltyTiers.isActive, true))
      .orderBy(loyaltyTiers.minPoints);

    return result.map((tier) => ({
      ...tier,
      benefits: tier.benefits ? JSON.parse(tier.benefits) : [],
    }));
  }),

  // Get user's loyalty status
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    // Get or create user loyalty record
    let userLoyaltyRecord = await db
      .select()
      .from(userLoyalty)
      .where(eq(userLoyalty.userId, ctx.user.id))
      .limit(1);

    if (userLoyaltyRecord.length === 0) {
      // Create default loyalty record (Bronze tier)
      const bronzeTier = await db
        .select()
        .from(loyaltyTiers)
        .where(eq(loyaltyTiers.name, "Bronze"))
        .limit(1);

      if (bronzeTier.length > 0) {
        await db.insert(userLoyalty).values({
          userId: ctx.user.id,
          totalPoints: 0,
          lifetimePoints: 0,
          tierId: bronzeTier[0].id,
        });

        userLoyaltyRecord = await db
          .select()
          .from(userLoyalty)
          .where(eq(userLoyalty.userId, ctx.user.id))
          .limit(1);
      }
    }

    if (userLoyaltyRecord.length === 0) return null;

    // Get tier info
    const tier = await db
      .select()
      .from(loyaltyTiers)
      .where(eq(loyaltyTiers.id, userLoyaltyRecord[0].tierId))
      .limit(1);

    // Get next tier
    const nextTier = await db
      .select()
      .from(loyaltyTiers)
      .where(sql`${loyaltyTiers.minPoints} > ${userLoyaltyRecord[0].lifetimePoints}`)
      .orderBy(loyaltyTiers.minPoints)
      .limit(1);

    return {
      ...userLoyaltyRecord[0],
      tier: tier.length > 0 ? {
        ...tier[0],
        benefits: tier[0].benefits ? JSON.parse(tier[0].benefits) : [],
      } : null,
      nextTier: nextTier.length > 0 ? {
        ...nextTier[0],
        benefits: nextTier[0].benefits ? JSON.parse(nextTier[0].benefits) : [],
        pointsNeeded: nextTier[0].minPoints - userLoyaltyRecord[0].lifetimePoints,
      } : null,
    };
  }),

  // Get user's transaction history
  getTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { transactions: [], total: 0 };

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(loyaltyTransactions)
        .where(eq(loyaltyTransactions.userId, ctx.user.id));
      const total = Number(countResult[0]?.count || 0);

      const result = await db
        .select()
        .from(loyaltyTransactions)
        .where(eq(loyaltyTransactions.userId, ctx.user.id))
        .orderBy(desc(loyaltyTransactions.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return { transactions: result, total };
    }),

  // Get available rewards
  getRewards: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const result = await db
      .select()
      .from(rewards)
      .where(eq(rewards.isActive, true));

    return result;
  }),

  // Redeem a reward
  redeemReward: protectedProcedure
    .input(z.object({ rewardId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get reward
      const reward = await db
        .select()
        .from(rewards)
        .where(eq(rewards.id, input.rewardId))
        .limit(1);

      if (reward.length === 0) {
        throw new Error("Reward not found");
      }

      // Get user loyalty
      const userLoyaltyRecord = await db
        .select()
        .from(userLoyalty)
        .where(eq(userLoyalty.userId, ctx.user.id))
        .limit(1);

      if (userLoyaltyRecord.length === 0) {
        throw new Error("No loyalty record found");
      }

      if (userLoyaltyRecord[0].totalPoints < reward[0].pointsCost) {
        throw new Error("Insufficient points");
      }

      // Check max redemptions
      if (reward[0].maxRedemptions && reward[0].currentRedemptions && 
          reward[0].currentRedemptions >= reward[0].maxRedemptions) {
        throw new Error("Reward is no longer available");
      }

      // Create transaction
      const transactionResult = await db.insert(loyaltyTransactions).values({
        userId: ctx.user.id,
        type: "redeem",
        points: -reward[0].pointsCost,
        description: `Redeemed: ${reward[0].name}`,
        referenceType: "reward",
        referenceId: reward[0].id,
      });

      // Generate unique code
      const code = `HP${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (reward[0].validDays || 30));

      // Create user reward
      await db.insert(userRewards).values({
        userId: ctx.user.id,
        rewardId: reward[0].id,
        transactionId: Number(transactionResult[0].insertId),
        code,
        status: "active",
        expiresAt,
      });

      // Update user points
      await db
        .update(userLoyalty)
        .set({
          totalPoints: userLoyaltyRecord[0].totalPoints - reward[0].pointsCost,
        })
        .where(eq(userLoyalty.userId, ctx.user.id));

      // Update reward redemption count
      await db
        .update(rewards)
        .set({
          currentRedemptions: (reward[0].currentRedemptions || 0) + 1,
        })
        .where(eq(rewards.id, reward[0].id));

      return {
        success: true,
        code,
        expiresAt,
        message: `Successfully redeemed ${reward[0].name}`,
      };
    }),

  // Get user's redeemed rewards
  getMyRewards: protectedProcedure
    .input(
      z.object({
        status: z.enum(["active", "used", "expired"]).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { rewards: [], total: 0 };

      const conditions = [eq(userRewards.userId, ctx.user.id)];
      if (input.status) {
        conditions.push(eq(userRewards.status, input.status));
      }

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(userRewards)
        .where(sql`${userRewards.userId} = ${ctx.user.id}`);
      const total = Number(countResult[0]?.count || 0);

      const result = await db
        .select({
          id: userRewards.id,
          code: userRewards.code,
          status: userRewards.status,
          expiresAt: userRewards.expiresAt,
          usedAt: userRewards.usedAt,
          createdAt: userRewards.createdAt,
          rewardName: rewards.name,
          rewardDescription: rewards.description,
          rewardCategory: rewards.category,
          rewardIcon: rewards.icon,
        })
        .from(userRewards)
        .leftJoin(rewards, eq(userRewards.rewardId, rewards.id))
        .where(eq(userRewards.userId, ctx.user.id))
        .orderBy(desc(userRewards.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return { rewards: result, total };
    }),
});

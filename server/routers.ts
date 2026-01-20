import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { doctorsRouter } from "./routers/doctors";
import { appointmentsRouter } from "./routers/appointments";
import { specialtiesRouter } from "./routers/specialties";
import { hospitalsRouter } from "./routers/hospitals";
import { loyaltyRouter } from "./routers/loyalty";
import { referralsRouter } from "./routers/referrals";
import { authRouter } from "./routers/auth";
import { notificationsRouter } from "./routers/notifications";
import { paymentsRouter } from "./routers/payments";

export const appRouter = router({
  system: systemRouter,
  
  // Built-in auth (for OAuth logout)
  authCore: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Custom auth (phone/email login)
  auth: authRouter,

  // Feature routers
  doctors: doctorsRouter,
  appointments: appointmentsRouter,
  specialties: specialtiesRouter,
  hospitals: hospitalsRouter,
  loyalty: loyaltyRouter,
  referrals: referralsRouter,
  notifications: notificationsRouter,
  payments: paymentsRouter,
});

export type AppRouter = typeof appRouter;

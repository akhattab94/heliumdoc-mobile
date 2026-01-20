import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  dateOfBirth: timestamp("dateOfBirth"),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Medical specialties table
 */
export const specialties = mysqlTable("specialties", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  nameAr: varchar("nameAr", { length: 100 }),
  icon: varchar("icon", { length: 50 }),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Specialty = typeof specialties.$inferSelect;
export type InsertSpecialty = typeof specialties.$inferInsert;

/**
 * Hospitals/Clinics table
 */
export const hospitals = mysqlTable("hospitals", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  logoUrl: text("logoUrl"),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Hospital = typeof hospitals.$inferSelect;
export type InsertHospital = typeof hospitals.$inferInsert;

/**
 * Doctors table
 */
export const doctors = mysqlTable("doctors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  hospitalId: int("hospitalId").notNull(),
  specialtyId: int("specialtyId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  title: varchar("title", { length: 100 }),
  bio: text("bio"),
  photoUrl: text("photoUrl"),
  experience: int("experience"),
  consultationFee: int("consultationFee").notNull(),
  videoConsultationFee: int("videoConsultationFee"),
  videoConsultEnabled: boolean("videoConsultEnabled").default(false).notNull(),
  rating: int("rating").default(0),
  totalReviews: int("totalReviews").default(0),
  totalPatients: int("totalPatients").default(0),
  languages: text("languages"), // JSON string
  education: text("education"), // JSON string
  isActive: boolean("isActive").default(true).notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = typeof doctors.$inferInsert;

/**
 * Doctor availability/schedule table
 */
export const doctorSchedules = mysqlTable("doctorSchedules", {
  id: int("id").autoincrement().primaryKey(),
  doctorId: int("doctorId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  slotDuration: int("slotDuration").default(30).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

export type DoctorSchedule = typeof doctorSchedules.$inferSelect;
export type InsertDoctorSchedule = typeof doctorSchedules.$inferInsert;

/**
 * Appointments table
 */
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  doctorId: int("doctorId").notNull(),
  hospitalId: int("hospitalId").notNull(),
  appointmentDate: timestamp("appointmentDate").notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  consultationType: mysqlEnum("consultationType", ["clinic", "video"]).default("clinic").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled", "no_show"]).default("pending").notNull(),
  consultationFee: int("consultationFee").notNull(),
  serviceFee: int("serviceFee").default(25),
  totalAmount: int("totalAmount").notNull(),
  notes: text("notes"),
  cancelReason: text("cancelReason"),
  videoCallUrl: text("videoCallUrl"),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "refunded", "failed"]).default("pending").notNull(),
  paymentId: varchar("paymentId", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/**
 * Doctor reviews table
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  doctorId: int("doctorId").notNull(),
  appointmentId: int("appointmentId"),
  rating: int("rating").notNull(),
  comment: text("comment"),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Loyalty tiers table
 */
export const loyaltyTiers = mysqlTable("loyaltyTiers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  minPoints: int("minPoints").notNull(),
  maxPoints: int("maxPoints").notNull(),
  pointsMultiplier: int("pointsMultiplier").default(100).notNull(), // 100 = 1x, 150 = 1.5x
  color: varchar("color", { length: 7 }),
  benefits: text("benefits"), // JSON string
  isActive: boolean("isActive").default(true).notNull(),
});

export type LoyaltyTier = typeof loyaltyTiers.$inferSelect;
export type InsertLoyaltyTier = typeof loyaltyTiers.$inferInsert;

/**
 * User loyalty points table
 */
export const userLoyalty = mysqlTable("userLoyalty", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalPoints: int("totalPoints").default(0).notNull(),
  lifetimePoints: int("lifetimePoints").default(0).notNull(),
  tierId: int("tierId").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserLoyalty = typeof userLoyalty.$inferSelect;
export type InsertUserLoyalty = typeof userLoyalty.$inferInsert;

/**
 * Loyalty transactions table
 */
export const loyaltyTransactions = mysqlTable("loyaltyTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["earn", "redeem", "expire", "adjust"]).notNull(),
  points: int("points").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  referenceType: varchar("referenceType", { length: 50 }),
  referenceId: int("referenceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type InsertLoyaltyTransaction = typeof loyaltyTransactions.$inferInsert;

/**
 * Rewards catalog table
 */
export const rewards = mysqlTable("rewards", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  pointsCost: int("pointsCost").notNull(),
  category: varchar("category", { length: 50 }),
  icon: varchar("icon", { length: 50 }),
  validDays: int("validDays").default(30),
  maxRedemptions: int("maxRedemptions"),
  currentRedemptions: int("currentRedemptions").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;

/**
 * User redeemed rewards table
 */
export const userRewards = mysqlTable("userRewards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rewardId: int("rewardId").notNull(),
  transactionId: int("transactionId").notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  status: mysqlEnum("status", ["active", "used", "expired"]).default("active").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserReward = typeof userRewards.$inferSelect;
export type InsertUserReward = typeof userRewards.$inferInsert;

/**
 * Medical referrals table
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  fromDoctorId: int("fromDoctorId").notNull(),
  toDoctorId: int("toDoctorId").notNull(),
  fromHospitalId: int("fromHospitalId").notNull(),
  toHospitalId: int("toHospitalId").notNull(),
  specialtyId: int("specialtyId").notNull(),
  urgency: mysqlEnum("urgency", ["routine", "urgent", "emergency"]).default("routine").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "completed", "cancelled", "expired"]).default("pending").notNull(),
  reason: text("reason").notNull(),
  notes: text("notes"),
  appointmentId: int("appointmentId"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * User medical history table
 */
export const medicalHistory = mysqlTable("medicalHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  conditions: text("conditions"), // JSON string
  allergies: text("allergies"), // JSON string
  medications: text("medications"), // JSON string
  bloodType: varchar("bloodType", { length: 5 }),
  emergencyContact: varchar("emergencyContact", { length: 100 }),
  emergencyPhone: varchar("emergencyPhone", { length: 20 }),
  insuranceProvider: varchar("insuranceProvider", { length: 100 }),
  insurancePolicyNumber: varchar("insurancePolicyNumber", { length: 50 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MedicalHistory = typeof medicalHistory.$inferSelect;
export type InsertMedicalHistory = typeof medicalHistory.$inferInsert;

/**
 * Symptom checker sessions table
 */
export const symptomSessions = mysqlTable("symptomSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  symptoms: text("symptoms").notNull(), // JSON string
  age: int("age"),
  gender: varchar("gender", { length: 10 }),
  analysisResult: text("analysisResult"), // JSON string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SymptomSession = typeof symptomSessions.$inferSelect;
export type InsertSymptomSession = typeof symptomSessions.$inferInsert;

/**
 * Notifications table
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  data: text("data"), // JSON string
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

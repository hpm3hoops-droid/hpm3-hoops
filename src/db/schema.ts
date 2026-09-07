import {
  pgTable, text, integer, boolean, timestamp, jsonb, serial, date, real, uniqueIndex, index,
} from "drizzle-orm/pg-core";

export type Track = "TRYOUT" | "MADE_TEAM" | "REBUILD";
export type Tier = "NONE" | "COHORT" | "CORE" | "ELITE";
export type Block = "ACTIVATE" | "HANDLE" | "FINISH" | "SHOOT" | "ENGINE";
export type Role = "ATHLETE" | "COACH";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role").$type<Role>().notNull().default("ATHLETE"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const athletes = pgTable("athletes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  grade: integer("grade"),
  position: text("position"),
  parentEmail: text("parent_email"),
  parentName: text("parent_name"),
  hasHoop: boolean("has_hoop").notNull().default(true),
  track: text("track").$type<Track>().notNull().default("TRYOUT"),
  tier: text("tier").$type<Tier>().notNull().default("NONE"),
  startDate: date("start_date"),
  tryoutDate: date("tryout_date"),
  practiceDays: jsonb("practice_days").$type<number[]>().notNull().default([]), // 0=Sun..6=Sat, in-season
  daysPerWeek: integer("days_per_week").notNull().default(4),
  levels: jsonb("levels").$type<Record<string, number>>().notNull().default({ HANDLE: 1, FINISH: 1, SHOOT: 1, ENGINE: 1 }),
  goals: text("goals"),
  onboarded: boolean("onboarded").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const drills = pgTable("drills", {
  id: serial("id").primaryKey(),
  block: text("block").$type<Block>().notNull(),
  level: integer("level").notNull().default(1), // 1-6; ACTIVATE/ENGINE ignore level (use 1)
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  videoUrl: text("video_url"),
  needsHoop: boolean("needs_hoop").notNull().default(false),
  noHoopName: text("no_hoop_name"),
  noHoopDescription: text("no_hoop_description"),
  minutes: integer("minutes").notNull().default(4),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  isSample: boolean("is_sample").notNull().default(false),
}, (t) => [index("drills_block_level").on(t.block, t.level)]);

export type SessionItem = {
  drillId: number; block: Block; name: string; description: string; videoUrl?: string | null;
  minutes: number; done: boolean; usedNoHoop: boolean;
};

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull().references(() => athletes.id),
  date: date("date").notNull(),
  kind: text("kind").$type<"SKILL" | "FILM" | "BENCHMARK" | "REST" | "PRACTICE">().notNull(),
  plannedMinutes: integer("planned_minutes").notNull().default(0),
  items: jsonb("items").$type<SessionItem[]>().notNull().default([]),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  actualMinutes: integer("actual_minutes"),
  effort: integer("effort"), // 1-5
  notes: text("notes"),
  withHoop: boolean("with_hoop").notNull().default(true),
}, (t) => [uniqueIndex("sessions_athlete_date").on(t.athleteId, t.date)]);

export const benchmarks = pgTable("benchmarks", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull().references(() => athletes.id),
  date: date("date").notNull(),
  handle60: integer("handle60"),
  twoBall90: integer("two_ball90"),
  form25: integer("form25"),
  spot25: integer("spot25"),
  finish60: integer("finish60"),
  shuttle: real("shuttle"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("benchmarks_athlete").on(t.athleteId, t.date)]);

export const filmModules = pgTable("film_modules", {
  id: serial("id").primaryKey(),
  weekNumber: integer("week_number").notNull().default(1),
  track: text("track").$type<Track | "ALL">().notNull().default("ALL"),
  title: text("title").notNull(),
  theme: text("theme"),
  videoUrl: text("video_url"),
  breakdown: text("breakdown").notNull().default(""),
  questions: jsonb("questions").$type<string[]>().notNull().default([]),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const filmResponses = pgTable("film_responses", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull().references(() => athletes.id),
  moduleId: integer("module_id").notNull().references(() => filmModules.id),
  answers: jsonb("answers").$type<string[]>().notNull().default([]),
  minutesWatched: integer("minutes_watched"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  coachReply: text("coach_reply"),
}, (t) => [uniqueIndex("film_resp_unique").on(t.athleteId, t.moduleId)]);

export const clips = pgTable("clips", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull().references(() => athletes.id),
  url: text("url").notNull(),
  note: text("note"),
  coachFeedback: text("coach_feedback"),
  feedbackAt: timestamp("feedback_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const groupCalls = pgTable("group_calls", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  track: text("track").$type<Track | "ALL">().notNull().default("ALL"),
  tier: text("tier").$type<Tier | "ALL">().notNull().default("ALL"),
  weekday: integer("weekday").notNull().default(3), // 0=Sun
  time: text("time").notNull().default("19:00"), // local HH:MM
  timezone: text("timezone").notNull().default("America/New_York"),
  meetUrl: text("meet_url"),
  agenda: text("agenda"),
  active: boolean("active").notNull().default(true),
});

export const coachNotes = pgTable("coach_notes", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull().references(() => athletes.id),
  body: text("body").notNull(),
  visibleToAthlete: boolean("visible_to_athlete").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  tier: text("tier").$type<Tier>().notNull(),
  status: text("status").notNull().default("active"), // active | canceled | past_due
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCheckoutId: text("stripe_checkout_id"),
  currentPeriodEnd: timestamp("current_period_end"),
  source: text("source").notNull().default("stripe"), // stripe | manual
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("memberships_email").on(t.email)]);

export const magicTokens = pgTable("magic_tokens", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
});

export const nudges = pgTable("nudges", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull().references(() => athletes.id),
  kind: text("kind").notNull(), // missed2 | benchmark | film
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  athleteName: text("athlete_name"),
  grade: text("grade"),
  tier: text("tier"),
  message: text("message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

import type { Tier } from "@/db";

/** Public program config. Dates are for the 2026-27 Florida (FHSAA) season. */
export const TRYOUT_DATE_ISO = "2026-10-26";
export const TRYOUT_DATE_LABEL = "Mon Oct 26, 2026";
export const COHORT_START_ISO = "2026-09-28";
export const COHORT_START_LABEL = "Sept 28";

/** Shared by both programs: same program, two lengths. */
const PROGRAM_BULLETS = [
  "Personalized daily plan, 15 → 60 min ramp",
  "Saturday benchmarks + accountability texts",
  "Weekly group call",
  "Weekly film study hour with breakdown",
  "Weekly 1:1 call with your coach",
  "Coach breaks down your own game film",
  "Clip feedback within 72 hours",
  "Parent call each block",
];

export const TIERS: Record<Exclude<Tier, "NONE">, {
  name: string; price: string; cadence: string; blurb: string; bullets: string[]; who: string; mode: "payment" | "subscription"; envKey: string;
}> = {
  // Legacy: the Sept 2026 camp. No longer sold; kept so existing camp members still see their plan name.
  COHORT: {
    name: "Tryout Prep Camp", price: "$297", cadence: "one-time",
    blurb: "No longer offered",
    bullets: ["Full plan, 15 → 60 min ramp", "Saturday benchmarks + coach dashboard", "Weekly group call with your camp", "Weekly film study hour"],
    who: "The original tryout camp.", mode: "payment", envKey: "STRIPE_PRICE_COHORT",
  },
  // Internal keys stay CORE / ELITE (they're in the database). Customer-facing names are the programs.
  CORE: {
    name: "6-Month Program", price: "$3,000", cadence: "one payment", blurb: "6 months · start any week",
    bullets: PROGRAM_BULLETS,
    who: "One full season of development: tryouts, the season, and the work after it.", mode: "payment", envKey: "STRIPE_PRICE_6MO",
  },
  ELITE: {
    name: "12-Month Program", price: "$5,000", cadence: "one payment", blurb: "12 months · start any week",
    bullets: PROGRAM_BULLETS,
    who: "The same program for a full year. Built for long-term growth.", mode: "payment", envKey: "STRIPE_PRICE_12MO",
  },
};

/** What's on sale. Order = order on the page. */
export const PROGRAMS = ["CORE", "ELITE"] as const;
/** Both programs include the 1:1 call, own-film breakdown and clip feedback. */
export const hasFullAccess = (tier: Tier) => tier === "CORE" || tier === "ELITE";
export const COACH_CALL_URL = "https://cal.com/hpm3-calls/hoops-call";
export const contactEmail = () => process.env.CONTACT_EMAIL || "";

export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;

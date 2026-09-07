import type { Tier } from "@/db";

/** Public program config. Dates are for the 2026-27 Florida (FHSAA) season. */
export const TRYOUT_DATE_ISO = "2026-10-26";
export const TRYOUT_DATE_LABEL = "Mon Oct 26, 2026";
export const COHORT_START_ISO = "2026-09-28";
export const COHORT_START_LABEL = "Sept 28";

export const TIERS: Record<Exclude<Tier, "NONE">, {
  name: string; price: string; cadence: string; blurb: string; bullets: string[]; who: string; mode: "payment" | "subscription"; envKey: string;
}> = {
  COHORT: {
    name: "Tryout Prep Camp", price: "$297", cadence: "one-time · 7 weeks",
    blurb: `Starts ${COHORT_START_LABEL} · 25 spots`,
    bullets: ["Full 7-week plan, 15 → 60 min ramp", "Saturday benchmarks + coach dashboard", "Weekly group call with your camp", "Weekly film study hour", "\"What coaches look for\" tryout checklist, weeks 6–7"],
    who: "For anyone trying out Oct 26 — middle or high school.", mode: "payment", envKey: "STRIPE_PRICE_COHORT",
  },
  CORE: {
    name: "Core", price: "$199", cadence: "/ month", blurb: "Monthly",
    bullets: ["Personalized daily plan (in-season or rebuild track)", "Benchmarks + accountability texts", "Weekly group call for your track", "Weekly film study hour with breakdown", "1 clip reviewed per week"],
    who: "Made the team and want minutes. Or didn't, and want next year.", mode: "subscription", envKey: "STRIPE_PRICE_CORE",
  },
  ELITE: {
    name: "Elite", price: "$349", cadence: "/ month", blurb: "Monthly · 10 athletes max",
    bullets: ["Everything in Core", "Weekly 1:1 call", "Coach breaks down your own game film", "Unlimited clip feedback within 72 hours", "Parent call each block"],
    who: "Serious about playing in college.", mode: "subscription", envKey: "STRIPE_PRICE_ELITE",
  },
};

export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;
import type { Tier } from "@/db";

/** Public program config. Dates are for the 2026-27 Florida (FHSAA) season. */
export const TRYOUT_DATE_ISO = "2026-10-26";
export const TRYOUT_DATE_LABEL = "Mon Oct 26, 2026";
export const COHORT_START_ISO = "2026-09-28";
export const COHORT_START_LABEL = "Sept 28";

export const TIERS: Record<Exclude<Tier, "NONE">, {
  name: string; price: string; cadence: string; blurb: string; bullets: string[]; who: string; mode: "payment" | "subscription"; envKey: string;
}> = {
  COHORT: {
    name: "Tryout Prep Cohort", price: "$297", cadence: "one-time · 7 weeks",
    blurb: `Starts ${COHORT_START_LABEL} · 25 spots`,
    bullets: ["Full 7-week plan, 15 → 60 min ramp", "Saturday benchmarks + coach dashboard", "Weekly group call for the cohort", "Weekly film study hour", "\"What coaches look for\" tryout checklist, weeks 6–7"],
    who: "For anyone trying out Oct 26 — middle or high school.", mode: "payment", envKey: "STRIPE_PRICE_COHORT",
  },
  CORE: {
    name: "Core", price: "$199", cadence: "/ month", blurb: "Monthly",
    bullets: ["Personalized daily plan (in-season or rebuild track)", "Benchmarks + accountability texts", "Weekly group call for your track", "Weekly film study hour with breakdown", "1 clip reviewed per week"],
    who: "Made the team and want minutes. Or didn't, and want next year.", mode: "subscription", envKey: "STRIPE_PRICE_CORE",
  },
  ELITE: {
    name: "Elite", price: "$349", cadence: "/ month", blurb: "Monthly · 10 athletes max",
    bullets: ["Everything in Core", "Weekly 1:1 call", "Coach breaks down your own game film", "Unlimited clip feedback within 72 hours", "Parent call each block"],
    who: "Serious about playing in college.", mode: "subscription", envKey: "STRIPE_PRICE_ELITE",
  },
};

export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;

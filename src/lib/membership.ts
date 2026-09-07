import type Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { db, memberships, users, athletes, type Tier } from "@/db";
import { upsertUser, syncMembershipToAthlete } from "./auth";
import { sendMail } from "./mail";
import { TIERS } from "./config";

/** Idempotently record a paid checkout as an active membership; returns the email. */
export async function recordCheckout(cs: Stripe.Checkout.Session): Promise<string | null> {
  const email = (cs.customer_details?.email || cs.customer_email || "").toLowerCase();
  const tier = (cs.metadata?.tier || "CORE").toUpperCase() as Tier;
  if (!email) return null;
  const [existing] = await db.select().from(memberships).where(eq(memberships.stripeCheckoutId, cs.id));
  if (!existing) {
    await db.insert(memberships).values({
      email, tier, status: "active", source: "stripe",
      stripeCheckoutId: cs.id,
      stripeCustomerId: typeof cs.customer === "string" ? cs.customer : cs.customer?.id ?? null,
      stripeSubscriptionId: typeof cs.subscription === "string" ? cs.subscription : cs.subscription?.id ?? null,
    });
    const u = await upsertUser(email, cs.customer_details?.name ?? null);
    await syncMembershipToAthlete(u.id, email);
    const athleteName = cs.metadata?.athleteName;
    if (athleteName) {
      const [a] = await db.select().from(athletes).where(eq(athletes.userId, u.id));
      if (a && !a.firstName) await db.update(athletes).set({ firstName: athleteName.split(" ")[0], lastName: athleteName.split(" ").slice(1).join(" ") }).where(eq(athletes.id, a.id));
    }
    const base = process.env.APP_URL || "";
    await sendMail({
      to: email, subject: `Welcome to HPM3 Hoops — ${TIERS[tier as keyof typeof TIERS]?.name ?? tier}`,
      text: `You're in.\n\nSign in here to set up your athlete profile and see Day 1:\n${base}/login\n\n— Coach`,
    });
  }
  return email;
}

export async function cancelSubscription(subId: string) {
  await db.update(memberships).set({ status: "canceled" }).where(eq(memberships.stripeSubscriptionId, subId));
  const rows = await db.select().from(memberships).where(eq(memberships.stripeSubscriptionId, subId));
  for (const m of rows) {
    const [u] = await db.select().from(users).where(eq(users.email, m.email));
    if (!u) continue;
    const active = await db.select().from(memberships).where(and(eq(memberships.email, m.email), eq(memberships.status, "active")));
    if (!active.length) await db.update(athletes).set({ tier: "NONE" }).where(eq(athletes.userId, u.id));
    else await syncMembershipToAthlete(u.id, m.email);
  }
}

/** Coach adds a member by hand (founder cohort, comps, offline payments). */
export async function addManualMember(emailRaw: string, tier: Tier, athleteName?: string, parentEmail?: string) {
  const email = emailRaw.trim().toLowerCase();
  await db.insert(memberships).values({ email, tier, status: "active", source: "manual" });
  const u = await upsertUser(email);
  await syncMembershipToAthlete(u.id, email);
  const [a] = await db.select().from(athletes).where(eq(athletes.userId, u.id));
  if (a) {
    const patch: Partial<typeof athletes.$inferInsert> = {};
    if (athleteName && !a.firstName) { patch.firstName = athleteName.split(" ")[0]; patch.lastName = athleteName.split(" ").slice(1).join(" "); }
    if (parentEmail) patch.parentEmail = parentEmail.toLowerCase();
    if (Object.keys(patch).length) await db.update(athletes).set(patch).where(eq(athletes.id, a.id));
  }
  const base = process.env.APP_URL || "";
  await sendMail({ to: email, subject: "You're in — HPM3 Hoops", text: `Coach added you to HPM3 Hoops (${tier}).\n\nSign in here to set up your profile and see Day 1:\n${base}/login\n\n— Coach` });
  return u;
}

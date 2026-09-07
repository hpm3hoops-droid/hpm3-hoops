import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { and, eq, gt, isNull } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, users, athletes, magicTokens, memberships, type Role } from "@/db";
import { sendMail } from "./mail";
import { redirect } from "next/navigation";

const COOKIE = "hpm3_session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

export function coachEmails(): string[] {
  return (process.env.COACH_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}
export const isCoachEmail = (email: string) => coachEmails().includes(email.toLowerCase());

export async function createSession(userId: number) {
  const jwt = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  const c = await cookies();
  c.set(COOKIE, jwt, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function clearSession() {
  const c = await cookies();
  c.delete(COOKIE);
}

export async function currentUser() {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const uid = Number(payload.uid);
    const [u] = await db.select().from(users).where(eq(users.id, uid));
    return u ?? null;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const u = await currentUser();
  if (!u) redirect("/login");
  return u;
}

export async function requireCoach() {
  const u = await requireUser();
  if (u.role !== "COACH" && !isCoachEmail(u.email)) redirect("/app");
  return u;
}

export async function requireAthlete() {
  const u = await requireUser();
  let [a] = await db.select().from(athletes).where(eq(athletes.userId, u.id));
  if (!a) {
    [a] = await db.insert(athletes).values({ userId: u.id }).returning();
  }
  return { user: u, athlete: a };
}

/** Find-or-create a user by email; role from COACH_EMAILS. */
export async function upsertUser(emailRaw: string, name?: string | null) {
  const email = emailRaw.trim().toLowerCase();
  const role: Role = isCoachEmail(email) ? "COACH" : "ATHLETE";
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    if (existing.role !== role && role === "COACH") await db.update(users).set({ role }).where(eq(users.id, existing.id));
    return existing;
  }
  const [u] = await db.insert(users).values({ email, name: name ?? null, role }).returning();
  return u;
}

/** Sends a magic link. Returns the link when SMTP is not configured (dev). */
export async function sendMagicLink(emailRaw: string): Promise<{ ok: boolean; devLink?: string; reason?: string }> {
  const email = emailRaw.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, reason: "That email doesn't look right." };

  // Only members, coaches, or existing users may log in.
  const [u] = await db.select().from(users).where(eq(users.email, email));
  const [m] = await db.select().from(memberships).where(and(eq(memberships.email, email), eq(memberships.status, "active")));
  if (!u && !m && !isCoachEmail(email)) {
    return { ok: false, reason: "No account for that email yet. Join a program first, or ask your coach to add you." };
  }

  const token = randomBytes(24).toString("hex");
  await db.insert(magicTokens).values({ email, token, expiresAt: new Date(Date.now() + 1000 * 60 * 20) });
  const base = process.env.APP_URL || "http://localhost:3000";
  const link = `${base}/auth/verify?token=${token}`;
  const sent = await sendMail({
    to: email,
    subject: "Your HPM3 Hoops sign-in link",
    text: `Tap to sign in (link expires in 20 minutes):\n\n${link}\n\nIf you didn't request this, ignore it.`,
    html: `<p>Tap to sign in (expires in 20 minutes):</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, ignore it.</p>`,
  });
  if (!sent.delivered) return { ok: true, devLink: process.env.DEV_SHOW_MAGIC_LINK === "1" ? link : undefined };
  return { ok: true };
}

export async function consumeMagicToken(token: string) {
  const [t] = await db.select().from(magicTokens)
    .where(and(eq(magicTokens.token, token), isNull(magicTokens.usedAt), gt(magicTokens.expiresAt, new Date())));
  if (!t) return null;
  await db.update(magicTokens).set({ usedAt: new Date() }).where(eq(magicTokens.id, t.id));
  const u = await upsertUser(t.email);
  await syncMembershipToAthlete(u.id, t.email);
  return u;
}

/** Apply the newest active membership to the athlete profile. */
export async function syncMembershipToAthlete(userId: number, email: string) {
  const ms = await db.select().from(memberships).where(and(eq(memberships.email, email.toLowerCase()), eq(memberships.status, "active")));
  if (!ms.length) return;
  const rank: Record<string, number> = { NONE: 0, COHORT: 1, CORE: 2, ELITE: 3 };
  const best = ms.sort((a, b) => rank[b.tier] - rank[a.tier])[0];
  let [a] = await db.select().from(athletes).where(eq(athletes.userId, userId));
  if (!a) [a] = await db.insert(athletes).values({ userId }).returning();
  if (a.tier !== best.tier) await db.update(athletes).set({ tier: best.tier }).where(eq(athletes.id, a.id));
}

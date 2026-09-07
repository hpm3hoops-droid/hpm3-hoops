import { and, eq, gte, ne } from "drizzle-orm";
import { db, athletes, users, nudges } from "@/db";
import { compliance } from "./program";
import { sendMail } from "./mail";

/**
 * Daily accountability pass. For every active athlete with 2+ consecutive missed
 * scheduled days, email the athlete (and parent) once per 3 days. Returns a summary.
 */
export async function runNudges(today = new Date()) {
  const rows = await db.select({ a: athletes, u: users }).from(athletes).innerJoin(users, eq(users.id, athletes.userId))
    .where(and(ne(athletes.tier, "NONE"), eq(athletes.onboarded, true)));
  const base = process.env.APP_URL || "";
  const summary: { athleteId: number; name: string; missed: number; sent: boolean }[] = [];
  for (const { a, u } of rows) {
    const c = await compliance(a, today);
    if (c.missedStreak < 2) continue;
    const recent = await db.select().from(nudges).where(and(eq(nudges.athleteId, a.id), eq(nudges.kind, "missed2"), gte(nudges.sentAt, new Date(today.getTime() - 3 * 864e5))));
    if (recent.length) { summary.push({ athleteId: a.id, name: a.firstName, missed: c.missedStreak, sent: false }); continue; }
    const name = a.firstName || "there";
    const text = `${name} — you've missed ${c.missedStreak} scheduled sessions in a row. Nobody's mad; the plan just doesn't work if it sits there.\n\nToday's session is ready (it's shorter than you think): ${base}/app\n\nIf something's in the way — schedule, injury, no hoop — reply and we'll adjust the plan. That's what it's for.\n\n— Coach`;
    await sendMail({ to: u.email, subject: `${name}, two missed days — let's fix it today`, text });
    if (a.parentEmail && a.parentEmail !== u.email) {
      await sendMail({ to: a.parentEmail, subject: `${name} has missed ${c.missedStreak} sessions`, text: `Heads up: ${name} has missed ${c.missedStreak} scheduled sessions in a row. A 15-minute session tonight gets the streak back. If the schedule changed, reply and we'll rebuild the plan around it.\n\n— Coach, HPM3 Hoops` });
    }
    await db.insert(nudges).values({ athleteId: a.id, kind: "missed2" });
    summary.push({ athleteId: a.id, name: a.firstName, missed: c.missedStreak, sent: true });
  }
  return summary;
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TIERS, stripeConfigured } from "@/lib/config";
import { stripe } from "@/lib/stripe";
import { db, leads } from "@/db";
import { sendMail } from "@/lib/mail";
import { coachEmails } from "@/lib/auth";
import type { Tier } from "@/db";

export const metadata = { title: "Join" };

const tierKey = (s: string): Exclude<Tier, "NONE"> | null => {
  const k = s.toUpperCase();
  return k === "COHORT" || k === "CORE" || k === "ELITE" ? k : null;
};

async function checkout(formData: FormData) {
  "use server";
  const k = tierKey(String(formData.get("tier") || ""));
  if (!k) redirect("/");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const athleteName = String(formData.get("athleteName") || "").trim();
  const t = TIERS[k];
  const s = stripe();
  const price = process.env[t.envKey];
  if (!s || !price) redirect(`/join/${k.toLowerCase()}?err=${encodeURIComponent("Checkout isn't live yet — use the request form.")}`);
  const base = process.env.APP_URL || "http://localhost:3000";
  const session = await s.checkout.sessions.create({
    mode: t.mode,
    line_items: [{ price, quantity: 1 }],
    customer_email: email || undefined,
    allow_promotion_codes: true,
    metadata: { tier: k, athleteName },
    success_url: `${base}/welcome?tier=${k}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/join/${k.toLowerCase()}`,
  });
  redirect(session.url!);
}

async function requestInvite(formData: FormData) {
  "use server";
  const k = tierKey(String(formData.get("tier") || "")) ?? "COHORT";
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const athleteName = String(formData.get("athleteName") || "").trim();
  const grade = String(formData.get("grade") || "").trim();
  const message = String(formData.get("message") || "").trim();
  if (!email) redirect(`/join/${k.toLowerCase()}?err=Email+is+required`);
  await db.insert(leads).values({ email, name, athleteName, grade, tier: k, message });
  for (const to of coachEmails()) {
    await sendMail({ to, subject: `New ${TIERS[k].name} request — ${athleteName || name || email}`,
      text: `Tier: ${TIERS[k].name}\nParent: ${name} <${email}>\nAthlete: ${athleteName} (grade ${grade})\n\n${message}\n\nAdd them at ${process.env.APP_URL || ""}/coach/athletes/new` });
  }
  redirect(`/join/${k.toLowerCase()}?sent=1`);
}

export default async function Join({ params, searchParams }: { params: Promise<{ tier: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { tier } = await params;
  const sp = await searchParams;
  const k = tierKey(tier);
  if (!k) notFound();
  const t = TIERS[k];
  const live = stripeConfigured() && !!process.env[t.envKey];
  return (
    <div className="narrow" style={{ paddingTop: 56, paddingBottom: 64 }}>
      <Link href="/#pricing" className="eyebrow" style={{ textDecoration: "none" }}>← All programs</Link>
      <p className="eyebrow" style={{ marginTop: 22 }}>{t.blurb}</p>
      <h1 style={{ fontSize: 44, marginTop: 8 }}>{t.name}</h1>
      <div className="tier" style={{ marginTop: 20 }}>
        <div className="price">{t.price} <small>{t.cadence}</small></div>
        <ul>{t.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
        <p className="small muted">{t.who}</p>
      </div>
      {sp.err && <div className="alert err" style={{ marginTop: 20 }}>{sp.err}</div>}
      {sp.sent && <div className="alert ok" style={{ marginTop: 20 }}>Got it. Coach will email you within a day with next steps.</div>}

      {live ? (
        <form action={checkout} style={{ marginTop: 24 }} className="stack">
          <input type="hidden" name="tier" value={k} />
          <div className="field"><label htmlFor="email">Parent or athlete email</label><input id="email" name="email" type="email" required /></div>
          <div className="field"><label htmlFor="athleteName">Athlete&apos;s name</label><input id="athleteName" name="athleteName" required /></div>
          <button className="btn" type="submit">Continue to secure checkout</button>
          <p className="small muted">Card is charged by Stripe. You&apos;ll get a sign-in link by email right after.</p>
        </form>
      ) : (
        <form action={requestInvite} style={{ marginTop: 24 }} className="stack">
          <input type="hidden" name="tier" value={k} />
          <div className="alert">Founding cohort: spots are confirmed by the coach. Request one below and you&apos;ll hear back within a day.</div>
          <div className="row c2">
            <div className="field"><label htmlFor="name">Your name (parent)</label><input id="name" name="name" required /></div>
            <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required /></div>
          </div>
          <div className="row c2">
            <div className="field"><label htmlFor="athleteName">Athlete&apos;s name</label><input id="athleteName" name="athleteName" required /></div>
            <div className="field"><label htmlFor="grade">Grade</label><select id="grade" name="grade">{["6", "7", "8", "9", "10", "11", "12"].map((g) => <option key={g}>{g}</option>)}</select></div>
          </div>
          <div className="field"><label htmlFor="message">Anything we should know? (team, position, tryout date)</label><textarea id="message" name="message" /></div>
          <button className="btn" type="submit">Request a spot</button>
        </form>
      )}
    </div>
  );
}

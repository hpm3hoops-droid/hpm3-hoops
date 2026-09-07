import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, athletes, users, benchmarks } from "@/db";
import { compliance, programWeek, TRACK_LABEL } from "@/lib/program";
import { addMember } from "./actions";

export const metadata = { title: "Roster" };
export const dynamic = "force-dynamic";

export default async function Roster({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const rows = await db.select({ a: athletes, u: users }).from(athletes).innerJoin(users, eq(users.id, athletes.userId)).orderBy(desc(athletes.createdAt));
  const today = new Date();
  const enriched = await Promise.all(rows.map(async ({ a, u }) => {
    const c = await compliance(a, today);
    const [lastB] = await db.select().from(benchmarks).where(eq(benchmarks.athleteId, a.id)).orderBy(desc(benchmarks.date)).limit(1);
    return { a, u, c, lastB };
  }));
  const order = { red: 0, yellow: 1, green: 2 };
  enriched.sort((x, y) => (x.a.tier === "NONE" ? 1 : 0) - (y.a.tier === "NONE" ? 1 : 0) || order[x.c.color] - order[y.c.color]);
  const active = enriched.filter((e) => e.a.tier !== "NONE");
  const red = active.filter((e) => e.c.color === "red").length;
  return (
    <div>
      <div className="topline"><div><p className="eyebrow">{active.length} active · {red} need a text</p><h2 style={{ marginTop: 6 }}>Roster</h2></div></div>
      {sp.added && <div className="alert ok" style={{ marginBottom: 16 }}>Added. They got a welcome email with the sign-in link.</div>}
      <div className="scroll card" style={{ padding: 0, marginBottom: 22 }}>
        <table>
          <thead><tr><th></th><th>Athlete</th><th>Track · Wk</th><th>Plan</th><th>7 days</th><th>Missed</th><th>Levels</th><th>Last benchmark</th><th>Email</th></tr></thead>
          <tbody>
            {enriched.map(({ a, u, c, lastB }) => (
              <tr key={a.id} style={{ opacity: a.tier === "NONE" ? 0.55 : 1 }}>
                <td><span className={`dot ${c.color}`} /></td>
                <td><Link href={`/coach/athletes/${a.id}`}><b>{a.firstName || "(no name)"} {a.lastName}</b></Link>{!a.onboarded && <span className="pill" style={{ marginLeft: 6 }}>not set up</span>}<div className="small muted">Gr {a.grade ?? "—"} · {a.position ?? "—"}</div></td>
                <td className="small">{TRACK_LABEL[a.track]}<div className="mono muted">wk {programWeek(a, today)}</div></td>
                <td><span className={`pill ${a.tier === "NONE" ? "" : "accent"}`}>{a.tier}</span></td>
                <td className="mono">{c.done}/{c.scheduled}</td>
                <td className="mono" style={{ color: c.missedStreak >= 2 ? "var(--red)" : undefined }}>{c.missedStreak}</td>
                <td className="mono small">H{a.levels?.HANDLE ?? 1} F{a.levels?.FINISH ?? 1} S{a.levels?.SHOOT ?? 1} E{a.levels?.ENGINE ?? 1}</td>
                <td className="mono small">{lastB ? lastB.date : "—"}</td>
                <td className="small">{u.email}</td>
              </tr>
            ))}
            {!enriched.length && <tr><td colSpan={9} className="muted">No athletes yet. Add the first one below.</td></tr>}
          </tbody>
        </table>
      </div>

      <form action={addMember} className="card">
        <h4>Add an athlete by hand</h4>
        <p className="small muted" style={{ margin: "6px 0 12px" }}>First camp, comps, Venmo/Zelle payments. They get a welcome email with the sign-in link; they set up their own profile.</p>
        <div className="row c4">
          <div className="field"><label htmlFor="email">Sign-in email</label><input id="email" name="email" type="email" required /></div>
          <div className="field"><label htmlFor="athleteName">Athlete name</label><input id="athleteName" name="athleteName" /></div>
          <div className="field"><label htmlFor="parentEmail">Parent email</label><input id="parentEmail" name="parentEmail" type="email" /></div>
          <div className="field"><label htmlFor="tier">Plan</label><select id="tier" name="tier" defaultValue="COHORT"><option>COHORT</option><option>CORE</option><option>ELITE</option></select></div>
        </div>
        <button className="btn sm" type="submit">Add athlete</button>
      </form>
    </div>
  );
}

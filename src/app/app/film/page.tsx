import Link from "next/link";
import { and, desc, eq, lte, or } from "drizzle-orm";
import { requireAthlete } from "@/lib/auth";
import { db, filmModules, filmResponses } from "@/db";
import { programWeek } from "@/lib/program";

export const metadata = { title: "Film study" };
export const dynamic = "force-dynamic";

export default async function Film() {
  const { athlete: a } = await requireAthlete();
  const week = programWeek(a, new Date());
  const mods = await db.select().from(filmModules).where(and(eq(filmModules.published, true), lte(filmModules.weekNumber, week), or(eq(filmModules.track, "ALL"), eq(filmModules.track, a.track)))).orderBy(desc(filmModules.weekNumber));
  const done = await db.select().from(filmResponses).where(eq(filmResponses.athleteId, a.id));
  const byId = new Map(done.map((d) => [d.moduleId, d]));
  return (
    <div>
      <div className="topline"><div><p className="eyebrow">One hour a week · 40 min watch · 20 min write</p><h2 style={{ marginTop: 6 }}>Film study</h2></div></div>
      {!mods.length && <div className="card"><p className="muted">No modules unlocked yet. Week {week} content appears here when Coach posts it.</p></div>}
      <div className="stack">
        {mods.map((m) => {
          const r = byId.get(m.id);
          return (
            <div className="card" key={m.id} style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <p className="eyebrow">Week {m.weekNumber}{m.theme ? ` · ${m.theme}` : ""}</p>
                <h3 style={{ marginTop: 6 }}>{m.title}</h3>
                {r?.coachReply && <p className="small" style={{ marginTop: 6 }}><b>Coach:</b> {r.coachReply}</p>}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {r ? <span className="pill green">Submitted</span> : <span className="pill">Due</span>}
                <Link className="btn sm" href={`/app/film/${m.id}`}>{r ? "Review" : "Start"}</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

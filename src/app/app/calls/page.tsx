import { and, eq, or } from "drizzle-orm";
import { requireAthlete } from "@/lib/auth";
import { db, groupCalls, settings } from "@/db";
import { TRACK_LABEL } from "@/lib/program";

export const metadata = { title: "Calls" };
export const dynamic = "force-dynamic";
const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function Calls() {
  const { athlete: a } = await requireAthlete();
  const calls = await db.select().from(groupCalls).where(and(eq(groupCalls.active, true), or(eq(groupCalls.track, "ALL"), eq(groupCalls.track, a.track)), or(eq(groupCalls.tier, "ALL"), eq(groupCalls.tier, a.tier))));
  const [cal] = await db.select().from(settings).where(eq(settings.key, "calendly_url"));
  const calendly = cal?.value || process.env.CALENDLY_URL || "";
  return (
    <div>
      <div className="topline"><div><p className="eyebrow">{TRACK_LABEL[a.track]}</p><h2 style={{ marginTop: 6 }}>Calls</h2></div></div>
      <div className="stack">
        {calls.length ? calls.map((c) => (
          <div className="card" key={c.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div><h3>{c.title}</h3><p className="mono small" style={{ marginTop: 6 }}>Every {WD[c.weekday]} · {c.time} {c.timezone.replace("America/", "")}</p></div>
              {c.meetUrl && <a className="btn sm" href={c.meetUrl} target="_blank" rel="noreferrer">Join call</a>}
            </div>
            {c.agenda && <p className="small muted" style={{ marginTop: 10, whiteSpace: "pre-line" }}>{c.agenda}</p>}
          </div>
        )) : <div className="card"><p className="muted">No group call scheduled for your track yet — Coach will post it here.</p></div>}

        <div className="card">
          <h3>Same agenda every week</h3>
          <ol style={{ margin: "10px 0 0", paddingLeft: 20, color: "var(--ink2)", fontSize: 15 }}>
            <li>Numbers — who moved, who&apos;s stuck, why</li>
            <li>One clip — a player&apos;s film or a pro&apos;s, broken down</li>
            <li>Next week — what changes in the plan</li>
            <li>Schedule — practice, games, life; we rebuild around it</li>
          </ol>
          <p className="small muted" style={{ marginTop: 10 }}>Parents: join the first and last call of each block. Otherwise it&apos;s the athletes&apos; room.</p>
        </div>

        {a.tier === "ELITE" && (
          <div className="card hot">
            <h3>Your weekly 1:1</h3>
            <p className="small muted" style={{ marginTop: 8 }}>20 minutes, on video. Book the same slot each week if you can.</p>
            {calendly ? <a className="btn sm" href={calendly} target="_blank" rel="noreferrer" style={{ marginTop: 12 }}>Book my 1:1</a> : <p className="small" style={{ marginTop: 8 }}>Booking link coming — Coach will text you the slot for now.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

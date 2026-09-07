import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireAthlete } from "@/lib/auth";
import { db, clips } from "@/db";
import { addClip } from "../actions";

export const metadata = { title: "My clips" };
export const dynamic = "force-dynamic";

export default async function Clips() {
  const { athlete: a } = await requireAthlete();
  if (a.tier !== "ELITE") redirect("/app");
  const rows = await db.select().from(clips).where(eq(clips.athleteId, a.id)).orderBy(desc(clips.createdAt));
  return (
    <div>
      <div className="topline"><div><p className="eyebrow">Elite · feedback within 72 hours</p><h2 style={{ marginTop: 6 }}>My clips</h2></div></div>
      <form action={addClip} className="card" style={{ marginBottom: 22 }}>
        <h4>Send Coach a clip</h4>
        <p className="small muted" style={{ margin: "6px 0 12px" }}>Upload to YouTube (unlisted), Hudl, or Google Drive and paste the link. Game film or a workout — say what you want eyes on.</p>
        <div className="field"><label htmlFor="url">Link</label><input id="url" name="url" type="url" required placeholder="https://" /></div>
        <div className="field"><label htmlFor="note">What should Coach look at?</label><input id="note" name="note" placeholder="e.g. my footwork on the left-side drive, 2nd quarter" /></div>
        <button className="btn" type="submit">Send clip</button>
      </form>
      <div className="stack">
        {rows.map((c) => (
          <div className="card" key={c.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <a href={c.url} target="_blank" rel="noreferrer" style={{ wordBreak: "break-all" }}>{c.url}</a>
              <span className={`pill ${c.coachFeedback ? "green" : ""}`}>{c.coachFeedback ? "Reviewed" : "Waiting on coach"}</span>
            </div>
            {c.note && <p className="small muted" style={{ marginTop: 6 }}>You: {c.note}</p>}
            {c.coachFeedback && <div className="alert" style={{ marginTop: 10, whiteSpace: "pre-line" }}><b>Coach:</b> {c.coachFeedback}</div>}
          </div>
        ))}
        {!rows.length && <p className="muted">No clips yet.</p>}
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, gte } from "drizzle-orm";
import { db, athletes, users, sessions, benchmarks, coachNotes, filmResponses, filmModules, clips } from "@/db";
import { compliance, programWeek, TRACK_LABEL, addDays, toISODate } from "@/lib/program";
import { addNote, updateAthlete, endMembership, feedbackClip, replyFilm } from "../../actions";
import Sparkline from "@/components/Sparkline";

export const dynamic = "force-dynamic";

export default async function AthletePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const [row] = await db.select({ a: athletes, u: users }).from(athletes).innerJoin(users, eq(users.id, athletes.userId)).where(eq(athletes.id, Number(id)));
  if (!row) notFound();
  const { a, u } = row;
  const today = new Date();
  const c = await compliance(a, today);
  const recent = await db.select().from(sessions).where(and(eq(sessions.athleteId, a.id), gte(sessions.date, toISODate(addDays(today, -13))))).orderBy(desc(sessions.date));
  const bms = await db.select().from(benchmarks).where(eq(benchmarks.athleteId, a.id)).orderBy(asc(benchmarks.date));
  const notes = await db.select().from(coachNotes).where(eq(coachNotes.athleteId, a.id)).orderBy(desc(coachNotes.createdAt)).limit(10);
  const films = await db.select({ r: filmResponses, m: filmModules }).from(filmResponses).innerJoin(filmModules, eq(filmModules.id, filmResponses.moduleId)).where(eq(filmResponses.athleteId, a.id)).orderBy(desc(filmResponses.submittedAt)).limit(5);
  const myClips = await db.select().from(clips).where(eq(clips.athleteId, a.id)).orderBy(desc(clips.createdAt)).limit(5);
  const series = (k: keyof typeof bms[number]) => bms.filter((r) => r[k] != null).map((r) => ({ x: r.date, y: Number(r[k]) }));
  return (
    <div>
      <Link href="/coach" className="eyebrow" style={{ textDecoration: "none" }}>← Roster</Link>
      <div className="topline" style={{ marginTop: 14 }}>
        <div><p className="eyebrow"><span className={`dot ${c.color}`} />{TRACK_LABEL[a.track]} · Week {programWeek(a, today)} · {a.tier}</p><h2 style={{ marginTop: 6 }}>{a.firstName} {a.lastName}</h2>
          <p className="small muted" style={{ marginTop: 4 }}>Gr {a.grade ?? "—"} · {a.position ?? "—"} · {u.email}{a.parentEmail ? ` · parent ${a.parentEmail}` : ""}{a.hasHoop ? " · has hoop" : " · no hoop"}</p>
          {a.goals && <p className="small" style={{ marginTop: 6 }}><i>&ldquo;{a.goals}&rdquo;</i></p>}
        </div>
        <div className="stat"><div className="bignum">{c.done}/{c.scheduled}</div><span>last 7 days · {c.missedStreak} missed in a row</span></div>
      </div>
      {sp.saved && <div className="alert ok" style={{ marginBottom: 16 }}>Saved.</div>}

      <div className="grid2">
        <form action={addNote} className="card">
          <input type="hidden" name="athleteId" value={a.id} />
          <h4>Note</h4>
          <div className="field" style={{ marginTop: 8 }}><textarea name="body" placeholder="Private by default. Tick the box to show it on their Today page." style={{ minHeight: 80 }} required /></div>
          <label className="check" style={{ marginBottom: 12 }}><input type="checkbox" name="visible" /> Show to athlete</label>
          <button className="btn sm" type="submit">Save note</button>
          <div className="stack" style={{ marginTop: 14, gap: 8 }}>
            {notes.map((n) => <div key={n.id} className="small" style={{ borderLeft: `3px solid ${n.visibleToAthlete ? "var(--accent)" : "var(--line)"}`, paddingLeft: 10 }}><span className="mono muted">{toISODate(n.createdAt)}</span> {n.body}</div>)}
          </div>
        </form>

        <form action={updateAthlete} className="card">
          <input type="hidden" name="id" value={a.id} />
          <h4>Plan settings</h4>
          <div className="row c2" style={{ marginTop: 8 }}>
            <div className="field"><label>Track</label><select name="track" defaultValue={a.track}><option value="TRYOUT">Tryout Prep</option><option value="MADE_TEAM">Made the Team</option><option value="REBUILD">Rebuild</option></select></div>
            <div className="field"><label>Plan</label><select name="tier" defaultValue={a.tier}><option>NONE</option><option>COHORT</option><option>CORE</option><option>ELITE</option></select></div>
            <div className="field"><label>Start date</label><input type="date" name="startDate" defaultValue={a.startDate ?? ""} /></div>
            <div className="field"><label>Tryout date</label><input type="date" name="tryoutDate" defaultValue={a.tryoutDate ?? ""} /></div>
          </div>
          <div className="row c4">
            {(["HANDLE", "FINISH", "SHOOT", "ENGINE"] as const).map((k) => (
              <div className="field" key={k}><label>{k} lvl</label><select name={`lvl${k}`} defaultValue={a.levels?.[k] ?? 1}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
            ))}
          </div>
          <div className="field"><label>Parent email</label><input name="parentEmail" type="email" defaultValue={a.parentEmail ?? ""} /></div>
          <label className="check" style={{ marginBottom: 12 }}><input type="checkbox" name="hasHoop" defaultChecked={a.hasHoop} /> Has hoop access</label>
          <button className="btn sm" type="submit">Save plan</button>
        </form>
      </div>

      <div className="grid3" style={{ marginTop: 16 }}>
        <Sparkline label="Handle 60s" points={series("handle60")} />
        <Sparkline label="Spot 25" points={series("spot25")} />
        <Sparkline label="Finish 60s" points={series("finish60")} />
      </div>

      <div className="grid2" style={{ marginTop: 16 }}>
        <div className="card">
          <h4>Last 14 days</h4>
          <table style={{ marginTop: 8 }}><tbody>
            {recent.map((s) => <tr key={s.id}><td className="mono small">{s.date}</td><td className="small">{s.kind}</td><td className="mono small">{s.completed ? `✓ ${s.actualMinutes ?? s.plannedMinutes}m · e${s.effort ?? "-"}` : s.plannedMinutes ? "—" : ""}</td><td className="small muted">{s.notes}</td></tr>)}
            {!recent.length && <tr><td className="muted small">No sessions opened yet.</td></tr>}
          </tbody></table>
        </div>
        <div className="card">
          <h4>Film answers</h4>
          <div className="stack" style={{ marginTop: 8 }}>
            {films.map(({ r, m }) => (
              <form action={replyFilm} key={r.id} className="small" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>
                <input type="hidden" name="id" value={r.id} />
                <b>Wk {m.weekNumber} · {m.title}</b> <span className="mono muted">{toISODate(r.submittedAt)}</span>
                <ol style={{ margin: "6px 0", paddingLeft: 18 }}>{m.questions.map((q, i) => <li key={i}><span className="muted">{q}</span><br />{r.answers[i]}</li>)}</ol>
                <div style={{ display: "flex", gap: 8 }}><input name="reply" defaultValue={r.coachReply ?? ""} placeholder="Reply (they see it on the module)" /><button className="btn sm" type="submit">Reply</button></div>
              </form>
            ))}
            {!films.length && <p className="muted small">Nothing submitted yet.</p>}
          </div>
        </div>
      </div>

      {(a.tier === "ELITE" || myClips.length > 0) && (
        <div className="card" style={{ marginTop: 16 }}>
          <h4>Clips</h4>
          <div className="stack" style={{ marginTop: 8 }}>
            {myClips.map((cl) => (
              <form action={feedbackClip} key={cl.id} className="small" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>
                <input type="hidden" name="id" value={cl.id} />
                <a href={cl.url} target="_blank" rel="noreferrer">{cl.url}</a> <span className="mono muted">{toISODate(cl.createdAt)}</span>{cl.note && <div className="muted">{cl.note}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}><textarea name="feedback" defaultValue={cl.coachFeedback ?? ""} placeholder="Feedback" style={{ minHeight: 60 }} /><button className="btn sm" type="submit">Send</button></div>
              </form>
            ))}
            {!myClips.length && <p className="muted small">No clips yet.</p>}
          </div>
        </div>
      )}

      {a.tier !== "NONE" && (
        <form action={endMembership} className="card" style={{ marginTop: 16, borderColor: "var(--red)" }}>
          <input type="hidden" name="email" value={u.email} /><input type="hidden" name="athleteId" value={a.id} />
          <h4>End membership</h4>
          <p className="small muted" style={{ margin: "6px 0 10px" }}>Marks all their memberships canceled and sets plan to NONE. (Doesn&apos;t touch Stripe — cancel there too if they&apos;re on a subscription.)</p>
          <button className="btn ghost sm" type="submit">End membership</button>
        </form>
      )}
    </div>
  );
}

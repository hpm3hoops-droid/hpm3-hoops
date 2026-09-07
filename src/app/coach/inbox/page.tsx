import Link from "next/link";
import { desc, eq, isNull, and, isNotNull, gte } from "drizzle-orm";
import { db, filmResponses, filmModules, athletes, clips, sessions } from "@/db";
import { replyFilm, feedbackClip } from "../actions";
import { toISODate, addDays } from "@/lib/program";

export const metadata = { title: "Inbox" };
export const dynamic = "force-dynamic";

export default async function Inbox() {
  const films = await db.select({ r: filmResponses, m: filmModules, a: athletes }).from(filmResponses)
    .innerJoin(filmModules, eq(filmModules.id, filmResponses.moduleId)).innerJoin(athletes, eq(athletes.id, filmResponses.athleteId))
    .where(isNull(filmResponses.coachReply)).orderBy(desc(filmResponses.submittedAt)).limit(30);
  const pendingClips = await db.select({ c: clips, a: athletes }).from(clips).innerJoin(athletes, eq(athletes.id, clips.athleteId)).where(isNull(clips.coachFeedback)).orderBy(desc(clips.createdAt));
  const notes = await db.select({ s: sessions, a: athletes }).from(sessions).innerJoin(athletes, eq(athletes.id, sessions.athleteId))
    .where(and(isNotNull(sessions.notes), gte(sessions.date, toISODate(addDays(new Date(), -7))))).orderBy(desc(sessions.date)).limit(30);
  return (
    <div>
      <div className="topline"><div><p className="eyebrow">{films.length} film · {pendingClips.length} clips · {notes.length} session notes</p><h2 style={{ marginTop: 6 }}>Inbox</h2></div></div>
      <div className="grid2">
        <div>
          <h3>Film study to reply to</h3>
          <div className="stack" style={{ marginTop: 10 }}>
            {films.map(({ r, m, a }) => (
              <form action={replyFilm} className="card small" key={r.id}>
                <input type="hidden" name="id" value={r.id} />
                <Link href={`/coach/athletes/${a.id}`}><b>{a.firstName} {a.lastName}</b></Link> · Wk {m.weekNumber} {m.title} <span className="mono muted">{toISODate(r.submittedAt)}</span>
                <ol style={{ margin: "8px 0", paddingLeft: 18 }}>{m.questions.map((q, i) => <li key={i}><span className="muted">{q}</span><br />{r.answers[i]}</li>)}</ol>
                <div style={{ display: "flex", gap: 8 }}><input name="reply" placeholder="One or two sentences" required /><button className="btn sm" type="submit">Reply</button></div>
              </form>
            ))}
            {!films.length && <p className="muted">Caught up.</p>}
          </div>
          <h3 style={{ marginTop: 26 }}>Clips waiting (Elite · 72 hrs)</h3>
          <div className="stack" style={{ marginTop: 10 }}>
            {pendingClips.map(({ c, a }) => (
              <form action={feedbackClip} className="card small" key={c.id}>
                <input type="hidden" name="id" value={c.id} />
                <Link href={`/coach/athletes/${a.id}`}><b>{a.firstName} {a.lastName}</b></Link> <span className="mono muted">{toISODate(c.createdAt)}</span><br />
                <a href={c.url} target="_blank" rel="noreferrer">{c.url}</a>{c.note && <div className="muted">{c.note}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}><textarea name="feedback" style={{ minHeight: 60 }} required /><button className="btn sm" type="submit">Send</button></div>
              </form>
            ))}
            {!pendingClips.length && <p className="muted">None.</p>}
          </div>
        </div>
        <div>
          <h3>Session notes · last 7 days</h3>
          <div className="stack" style={{ marginTop: 10 }}>
            {notes.map(({ s, a }) => (
              <div className="card small" key={s.id} style={{ padding: 12 }}><Link href={`/coach/athletes/${a.id}`}><b>{a.firstName}</b></Link> <span className="mono muted">{s.date} · {s.actualMinutes ?? s.plannedMinutes}m · effort {s.effort ?? "-"}</span><div>{s.notes}</div></div>
            ))}
            {!notes.length && <p className="muted">No notes this week.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

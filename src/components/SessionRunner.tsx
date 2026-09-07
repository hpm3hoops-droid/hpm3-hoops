"use client";
import { useMemo, useState, useTransition } from "react";
import type { sessions, SessionItem, Block } from "@/db/schema";
import { completeSession, saveItems, toggleHoop } from "@/app/app/actions";

type S = typeof sessions.$inferSelect;
const LABEL: Record<Block, string> = { ACTIVATE: "Activate", HANDLE: "Handle", FINISH: "Finish / Footwork", SHOOT: "Shoot", ENGINE: "Engine" };
const ORDER: Block[] = ["ACTIVATE", "HANDLE", "FINISH", "SHOOT", "ENGINE"];

export default function SessionRunner({ session, date, hasHoopDefault }: { session: S; date: string; hasHoopDefault: boolean }) {
  const [items, setItems] = useState<SessionItem[]>(session.items);
  const [minutes, setMinutes] = useState<number>(session.actualMinutes ?? session.plannedMinutes);
  const [effort, setEffort] = useState<number>(session.effort ?? 3);
  const [notes, setNotes] = useState(session.notes ?? "");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(session.completed);
  const doneCount = items.filter((i) => i.done).length;

  const grouped = useMemo(() => ORDER.map((b) => ({ b, list: items.map((it, idx) => ({ it, idx })).filter((x) => x.it.block === b) })).filter((g) => g.list.length), [items]);

  const toggle = (idx: number) => {
    if (done) return;
    const next = items.map((it, i) => (i === idx ? { ...it, done: !it.done } : it));
    setItems(next);
    start(() => saveItems(session.id, next));
  };

  const finish = () => {
    start(async () => {
      await completeSession(session.id, { items, actualMinutes: minutes, effort, notes });
      setDone(true);
    });
  };

  if (!items.length) {
    return (
      <div className="card">
        <h3>{session.plannedMinutes} minutes planned</h3>
        <p className="muted" style={{ marginTop: 8 }}>Coach hasn&apos;t added drills for this level yet. Check back shortly — or do 10 minutes of form shooting and stationary handle and mark it done.</p>
        {!done && <button className="btn sm" style={{ marginTop: 12 }} onClick={finish} disabled={pending}>Mark done anyway</button>}
        {done && <p className="pill green" style={{ marginTop: 12 }}>Done</p>}
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", borderBottom: "1px solid var(--line)" }}>
        <div>
          <h3>{session.plannedMinutes}-minute session {done && <span className="pill green" style={{ marginLeft: 8 }}>Done</span>}</h3>
          <p className="small muted" style={{ marginTop: 4 }}>{doneCount}/{items.length} drills · {session.withHoop ? "hoop version" : "no-hoop version"}</p>
        </div>
        {!done && (
          <div style={{ display: "inline-flex", border: "2px solid var(--ink)" }}>
            <button type="button" className="btn ghost sm" style={{ border: 0, background: session.withHoop ? "var(--ink)" : "transparent", color: session.withHoop ? "var(--bg)" : "var(--ink)" }} disabled={pending || session.withHoop} onClick={() => start(() => toggleHoop(date, true))}>I have a hoop</button>
            <button type="button" className="btn ghost sm" style={{ border: 0, background: !session.withHoop ? "var(--ink)" : "transparent", color: !session.withHoop ? "var(--bg)" : "var(--ink)" }} disabled={pending || !session.withHoop} onClick={() => start(() => toggleHoop(date, false))}>No hoop tonight</button>
          </div>
        )}
      </div>
      <div style={{ padding: "0 20px 20px" }}>
        {grouped.map(({ b, list }) => (
          <div key={b}>
            <div className="blockhead"><h4>{LABEL[b]}</h4><span className="mono">{list.reduce((s, x) => s + x.it.minutes, 0)} min</span></div>
            {list.map(({ it, idx }) => (
              <div className={`drill ${it.done ? "done" : ""}`} key={idx}>
                <input type="checkbox" checked={it.done} onChange={() => toggle(idx)} disabled={done} aria-label={`Done: ${it.name}`} />
                <span className="min">{it.minutes} min</span>
                <div>
                  <b>{it.name}{it.usedNoHoop && <span className="pill" style={{ marginLeft: 8 }}>no hoop</span>}</b>
                  {it.description && <p>{it.description}</p>}
                  {it.videoUrl && <a className="small" href={it.videoUrl} target="_blank" rel="noreferrer">Watch demo ↗</a>}
                </div>
              </div>
            ))}
          </div>
        ))}

        {!done ? (
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: "2px solid var(--ink)" }}>
            <div className="row c3">
              <div className="field"><label>Minutes actually trained</label><input type="number" min={1} max={180} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} /></div>
              <div className="field"><label>Effort (1 easy – 5 all out)</label>
                <select value={effort} onChange={(e) => setEffort(Number(e.target.value))}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
              <div className="field"><label>Note for coach (optional)</label><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="what felt good / what didn't" /></div>
            </div>
            <button className="btn" onClick={finish} disabled={pending}>{pending ? "Saving…" : doneCount === items.length ? "Finish session" : `Finish with ${doneCount}/${items.length} done`}</button>
          </div>
        ) : (
          <p className="small muted" style={{ marginTop: 18 }}>Logged {session.actualMinutes ?? minutes} min · effort {session.effort ?? effort}/5{session.notes ? ` · "${session.notes}"` : ""}. See you tomorrow.</p>
        )}
      </div>
    </div>
  );
}

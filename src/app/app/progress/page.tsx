import { and, desc, eq, gte } from "drizzle-orm";
import { requireAthlete } from "@/lib/auth";
import { db, sessions, benchmarks } from "@/db";
import { addDays, toISODate, dayKind, programWeek, BLOCK_LABEL } from "@/lib/program";
import type { Block } from "@/db";

export const metadata = { title: "Progress" };
export const dynamic = "force-dynamic";

export default async function Progress() {
  const { athlete: a } = await requireAthlete();
  const today = new Date();
  const from = addDays(today, -41); // 6 weeks
  const rows = await db.select().from(sessions).where(and(eq(sessions.athleteId, a.id), gte(sessions.date, toISODate(from))));
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const bms = await db.select().from(benchmarks).where(eq(benchmarks.athleteId, a.id)).orderBy(desc(benchmarks.date));
  const first = bms[bms.length - 1], last = bms[0];

  // Build 6 rows × 7 days, Monday-first.
  const start = addDays(from, -((from.getDay() + 6) % 7));
  const weeks: { date: Date; iso: string }[][] = [];
  for (let d = new Date(start); d <= today; d = addDays(d, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => { const x = addDays(d, i); return { date: x, iso: toISODate(x) }; }));
  }
  const totalMin = rows.filter((r) => r.completed).reduce((s, r) => s + (r.actualMinutes ?? r.plannedMinutes), 0);
  const doneCount = rows.filter((r) => r.completed).length;
  const cell = (iso: string, date: Date) => {
    if (date > today) return { bg: "transparent", title: "" };
    const k = dayKind(a, date);
    const r = byDate.get(iso);
    if (k === "REST") return { bg: "var(--bg2)", title: "rest" };
    if (k === "PRACTICE") return { bg: r?.completed ? "var(--court)" : "var(--bg2)", title: "team practice" };
    if (r?.completed) return { bg: "var(--green)", title: `${r.actualMinutes ?? r.plannedMinutes} min` };
    if (a.startDate && iso < a.startDate) return { bg: "var(--bg2)", title: "before start" };
    return { bg: "var(--red)", title: "missed" };
  };
  const delta = (k: keyof typeof benchmarks.$inferSelect) => first && last && first[k] != null && last[k] != null && first.id !== last.id ? Number(last[k]) - Number(first[k]) : null;
  return (
    <div>
      <div className="topline"><div><p className="eyebrow">Week {programWeek(a, today)}</p><h2 style={{ marginTop: 6 }}>Progress</h2></div></div>
      <div className="grid3" style={{ marginBottom: 22 }}>
        <div className="stat"><div className="bignum">{doneCount}</div><span>sessions done, last 6 weeks</span></div>
        <div className="stat"><div className="bignum">{Math.round(totalMin / 60 * 10) / 10}h</div><span>hours trained</span></div>
        <div className="stat"><div className="bignum">{bms.length}</div><span>benchmark Saturdays logged</span></div>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <h4>Consistency · last 6 weeks</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginTop: 12, maxWidth: 420 }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i} className="mono small muted" style={{ textAlign: "center" }}>{d}</div>)}
          {weeks.flat().map(({ iso, date }) => { const c = cell(iso, date); return <div key={iso} title={`${iso} ${c.title}`} style={{ aspectRatio: "1", background: c.bg, border: "1px solid var(--line)" }} />; })}
        </div>
        <p className="small muted" style={{ marginTop: 10 }}><span className="dot green" />done · <span className="dot red" />missed · <span className="dot" style={{ background: "var(--court)" }} />practice-day touch-up · grey = rest / not started</p>
      </div>

      <div className="grid2">
        <div className="card">
          <h4>Skill levels</h4>
          <div className="stack" style={{ marginTop: 10, gap: 8 }}>
            {(["HANDLE", "FINISH", "SHOOT", "ENGINE"] as Block[]).map((b) => {
              const l = a.levels?.[b] ?? 1;
              return (
                <div key={b} style={{ display: "grid", gridTemplateColumns: "120px 1fr 30px", gap: 10, alignItems: "center" }}>
                  <span className="small">{BLOCK_LABEL[b]}</span>
                  <div style={{ display: "flex", gap: 3 }}>{[1, 2, 3, 4, 5, 6].map((n) => <div key={n} style={{ flex: 1, height: 10, background: n <= l ? "var(--accent)" : "var(--bg2)", border: "1px solid var(--line)" }} />)}</div>
                  <span className="mono small">L{l}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <h4>Day 1 → latest</h4>
          {first && last && first.id !== last.id ? (
            <table style={{ marginTop: 8 }}>
              <tbody>
                {([["Handle 60s", "handle60"], ["Two-ball 90s", "twoBall90"], ["Form 25", "form25"], ["Spot 25", "spot25"], ["Finish 60s", "finish60"], ["5-10-5 (s)", "shuttle"]] as const).map(([label, k]) => {
                  const d = delta(k);
                  return <tr key={k}><td>{label}</td><td className="mono">{first[k] ?? "—"} → {last[k] ?? "—"}</td><td className="mono" style={{ color: d == null ? "var(--ink2)" : (k === "shuttle" ? d < 0 : d > 0) ? "var(--green)" : d === 0 ? "var(--ink2)" : "var(--red)" }}>{d == null ? "" : `${d > 0 ? "+" : ""}${Number.isInteger(d) ? d : d.toFixed(2)}`}</td></tr>;
                })}
              </tbody>
            </table>
          ) : <p className="small muted" style={{ marginTop: 8 }}>Log two benchmark Saturdays and the before/after shows up here — the numbers you bring to tryouts.</p>}
        </div>
      </div>
    </div>
  );
}

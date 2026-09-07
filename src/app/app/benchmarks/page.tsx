import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireAthlete } from "@/lib/auth";
import { db, benchmarks } from "@/db";
import { toISODate, loadThresholds } from "@/lib/program";
import { logBenchmark } from "../actions";
import Sparkline from "@/components/Sparkline";

export const metadata = { title: "Benchmarks" };
export const dynamic = "force-dynamic";

const FIELDS = [
  { k: "handle60", label: "Stationary handle · 60 sec", hint: "clean reps", step: 1 },
  { k: "twoBall90", label: "Two-ball series · 90 sec", hint: "clean reps", step: 1 },
  { k: "form25", label: "Form shooting · 25", hint: "makes (needs hoop)", step: 1 },
  { k: "spot25", label: "Spot shooting · 25", hint: "makes (needs hoop)", step: 1 },
  { k: "finish60", label: "Finishing series · 60 sec", hint: "makes (needs hoop)", step: 1 },
  { k: "shuttle", label: "5-10-5 shuttle", hint: "seconds (lower is better)", step: 0.01 },
] as const;

async function save(formData: FormData) {
  "use server";
  const r = await logBenchmark(formData);
  const q = r.promoted.length ? `?promoted=${encodeURIComponent(r.promoted.join(" · "))}` : "?saved=1";
  redirect(`/app/benchmarks${q}`);
}

export default async function Benchmarks({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { athlete: a } = await requireAthlete();
  const sp = await searchParams;
  const rows = await db.select().from(benchmarks).where(eq(benchmarks.athleteId, a.id)).orderBy(asc(benchmarks.date));
  const t = await loadThresholds();
  const date = sp.date ?? toISODate(new Date());
  const series = (k: keyof typeof rows[number]) => rows.filter((r) => r[k] != null).map((r) => ({ x: r.date, y: Number(r[k]) }));
  const lvl = a.levels ?? {};
  const bar = (skill: keyof typeof t) => t[skill][(lvl[skill] ?? 1) - 1];
  return (
    <div>
      <div className="topline"><div><p className="eyebrow">Every Saturday · 2 minutes each</p><h2 style={{ marginTop: 6 }}>Benchmarks</h2></div></div>
      {sp.promoted && <div className="alert ok" style={{ marginBottom: 18 }}><b>Level up:</b> {sp.promoted}. Tomorrow&apos;s session gets harder.</div>}
      {sp.saved && <div className="alert ok" style={{ marginBottom: 18 }}>Saved. Two Saturdays over the bar moves you up a level.</div>}

      <div className="card" style={{ marginBottom: 22 }}>
        <h4>Where the bar is right now</h4>
        <div className="row c4" style={{ marginTop: 10 }}>
          <div><span className="small muted">Handle L{lvl.HANDLE ?? 1} →</span><div className="mono">{bar("HANDLE") ?? "max"} reps</div></div>
          <div><span className="small muted">Finish L{lvl.FINISH ?? 1} →</span><div className="mono">{bar("FINISH") ?? "max"} makes</div></div>
          <div><span className="small muted">Shoot L{lvl.SHOOT ?? 1} →</span><div className="mono">{bar("SHOOT") ?? "max"} makes ({(lvl.SHOOT ?? 1) <= 2 ? "form" : "spot"})</div></div>
          <div><span className="small muted">Engine L{lvl.ENGINE ?? 1} →</span><div className="mono">≤ {bar("ENGINE") ?? "max"} s</div></div>
        </div>
      </div>

      <form action={save} className="card" style={{ marginBottom: 26 }}>
        <div className="field" style={{ maxWidth: 220 }}><label htmlFor="date">Date</label><input id="date" name="date" type="date" defaultValue={date} required /></div>
        <div className="row c3">
          {FIELDS.map((f) => (
            <div className="field" key={f.k}><label htmlFor={f.k}>{f.label}</label><input id={f.k} name={f.k} type="number" step={f.step} min={0} inputMode="decimal" placeholder={f.hint} /></div>
          ))}
        </div>
        <div className="field"><label htmlFor="notes">Notes</label><input id="notes" name="notes" placeholder="tired legs, new ball, whatever matters" /></div>
        <button className="btn" type="submit">Save benchmarks</button>
        <p className="small muted" style={{ marginTop: 10 }}>Leave a field blank if you couldn&apos;t do it (no hoop). Blank never counts against you.</p>
      </form>

      <div className="grid3">
        <Sparkline label="Handle 60s" points={series("handle60")} />
        <Sparkline label="Two-ball 90s" points={series("twoBall90")} />
        <Sparkline label="Form 25" points={series("form25")} />
        <Sparkline label="Spot 25" points={series("spot25")} />
        <Sparkline label="Finish 60s" points={series("finish60")} />
        <Sparkline label="5-10-5" points={series("shuttle")} unit="s" invert />
      </div>

      {rows.length > 0 && (
        <div className="scroll" style={{ marginTop: 26 }}>
          <table>
            <thead><tr><th>Date</th><th>Handle</th><th>2-ball</th><th>Form</th><th>Spot</th><th>Finish</th><th>5-10-5</th><th>Notes</th></tr></thead>
            <tbody>{[...rows].reverse().map((r) => (
              <tr key={r.id} className="mono"><td>{r.date}</td><td>{r.handle60 ?? "—"}</td><td>{r.twoBall90 ?? "—"}</td><td>{r.form25 ?? "—"}</td><td>{r.spot25 ?? "—"}</td><td>{r.finish60 ?? "—"}</td><td>{r.shuttle ?? "—"}</td><td style={{ fontFamily: "inherit" }}>{r.notes}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

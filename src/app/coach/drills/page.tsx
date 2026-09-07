import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db, drills, type Block } from "@/db";
import { BLOCKS, BLOCK_LABEL, ALLOC } from "@/lib/program";
import { saveDrill, deleteDrill } from "../actions";

export const metadata = { title: "Drill library" };
export const dynamic = "force-dynamic";

export default async function Drills({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const block = (BLOCKS.includes(sp.block as Block) ? sp.block : "HANDLE") as Block;
  const leveled = block !== "ACTIVATE" && block !== "ENGINE";
  const level = leveled ? Math.min(6, Math.max(1, Number(sp.level) || 1)) : 1;
  const list = await db.select().from(drills).where(and(eq(drills.block, block), eq(drills.level, level), eq(drills.active, true))).orderBy(asc(drills.sortOrder), asc(drills.id));
  const all = await db.select({ block: drills.block, level: drills.level, active: drills.active }).from(drills).where(eq(drills.active, true));
  const count = (b: Block, l: number) => all.filter((d) => d.block === b && (b === "ACTIVATE" || b === "ENGINE" || d.level === l)).length;
  const editing = sp.edit ? list.find((d) => d.id === Number(sp.edit)) : undefined;
  const totalMin = list.reduce((s, d) => s + d.minutes, 0);
  const need = ALLOC[60][block];
  return (
    <div>
      <div className="topline"><div><p className="eyebrow">Your content · the engine builds sessions from this</p><h2 style={{ marginTop: 6 }}>Drill library</h2></div></div>
      <div className="alert" style={{ marginBottom: 16 }}>Each block needs enough drills at each level to fill a 60-minute session (Activate {ALLOC[60].ACTIVATE} · Handle {ALLOC[60].HANDLE} · Finish {ALLOC[60].FINISH} · Shoot {ALLOC[60].SHOOT} · Engine {ALLOC[60].ENGINE} min). Levels earn up from benchmarks; Activate and Engine have no levels. Add a no-hoop version to any drill that needs a hoop.</div>

      <div className="scroll" style={{ marginBottom: 16 }}>
        <table>
          <thead><tr><th>Block</th>{[1, 2, 3, 4, 5, 6].map((l) => <th key={l}>L{l}</th>)}</tr></thead>
          <tbody>{BLOCKS.map((b) => (
            <tr key={b}><td><b>{BLOCK_LABEL[b]}</b></td>{[1, 2, 3, 4, 5, 6].map((l) => {
              const single = b === "ACTIVATE" || b === "ENGINE";
              if (single && l > 1) return <td key={l} className="muted">—</td>;
              const n = count(b, l); const on = b === block && l === level;
              return <td key={l}><Link href={`/coach/drills?block=${b}&level=${l}`} style={{ textDecoration: "none" }}><span className={`pill ${on ? "accent" : n === 0 ? "red" : ""}`}>{n}</span></Link></td>;
            })}</tr>
          ))}</tbody>
        </table>
      </div>

      <div className="grid2">
        <div>
          <h3>{BLOCK_LABEL[block]}{leveled ? ` · Level ${level}` : ""} <span className="mono small muted">{totalMin} min available / {need} needed</span></h3>
          <div className="stack" style={{ marginTop: 12 }}>
            {list.map((d) => (
              <div className="card" key={d.id} style={{ padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div><b>{d.name}</b> <span className="mono small muted">{d.minutes} min{d.needsHoop ? " · hoop" : ""}{d.noHoopName ? " · has no-hoop alt" : ""}{d.isSample ? " · sample" : ""}</span>
                    <p className="small muted" style={{ marginTop: 4, whiteSpace: "pre-line" }}>{d.description}</p></div>
                  <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <Link className="btn ghost sm" href={`/coach/drills?block=${block}&level=${level}&edit=${d.id}`}>Edit</Link>
                    <form action={deleteDrill}><input type="hidden" name="id" value={d.id} /><button className="btn ghost sm" type="submit">Remove</button></form>
                  </div>
                </div>
              </div>
            ))}
            {!list.length && <p className="muted">Nothing here yet. Add the first drill →</p>}
          </div>
        </div>

        <form action={saveDrill} className="card" key={editing?.id ?? "new"}>
          <h4>{editing ? `Edit: ${editing.name}` : "New drill"}</h4>
          <input type="hidden" name="id" value={editing?.id ?? 0} />
          <div className="row c2" style={{ marginTop: 8 }}>
            <div className="field"><label>Block</label><select name="block" defaultValue={editing?.block ?? block}>{BLOCKS.map((b) => <option key={b} value={b}>{BLOCK_LABEL[b]}</option>)}</select></div>
            <div className="field"><label>Level (1–6; ignored for Activate/Engine)</label><select name="level" defaultValue={editing?.level ?? level}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
          </div>
          <div className="field"><label>Name</label><input name="name" defaultValue={editing?.name ?? ""} required /></div>
          <div className="field"><label>How to do it (sets × reps, cues, what to watch for)</label><textarea name="description" defaultValue={editing?.description ?? ""} /></div>
          <div className="row c2">
            <div className="field"><label>Demo video URL (YouTube unlisted works)</label><input name="videoUrl" type="url" defaultValue={editing?.videoUrl ?? ""} /></div>
            <div className="field"><label>Minutes</label><input name="minutes" type="number" min={1} max={30} defaultValue={editing?.minutes ?? 4} /></div>
          </div>
          <label className="check" style={{ marginBottom: 12 }}><input type="checkbox" name="needsHoop" defaultChecked={editing?.needsHoop ?? false} /> Needs a hoop</label>
          <div className="field"><label>No-hoop version name (optional)</label><input name="noHoopName" defaultValue={editing?.noHoopName ?? ""} /></div>
          <div className="field"><label>No-hoop version instructions</label><textarea name="noHoopDescription" defaultValue={editing?.noHoopDescription ?? ""} style={{ minHeight: 70 }} /></div>
          <div className="field" style={{ maxWidth: 160 }}><label>Sort order</label><input name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? 0} /></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn sm" type="submit">{editing ? "Save changes" : "Add drill"}</button>
            {editing && <Link className="btn ghost sm" href={`/coach/drills?block=${block}&level=${level}`}>Cancel</Link>}
          </div>
        </form>
      </div>
    </div>
  );
}

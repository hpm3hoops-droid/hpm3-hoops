import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, filmModules } from "@/db";
import { saveFilmModule } from "../actions";

export const metadata = { title: "Film modules" };
export const dynamic = "force-dynamic";

export default async function Film({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const mods = await db.select().from(filmModules).orderBy(asc(filmModules.weekNumber), asc(filmModules.id));
  const editing = sp.edit ? mods.find((m) => m.id === Number(sp.edit)) : undefined;
  return (
    <div>
      <div className="topline"><div><p className="eyebrow">One per week · unlocks by program week</p><h2 style={{ marginTop: 6 }}>Film modules</h2></div></div>
      <div className="grid2">
        <div className="stack">
          {mods.map((m) => (
            <div className="card" key={m.id} style={{ padding: 14, display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div><span className="eyebrow">Wk {m.weekNumber} · {m.track}{m.published ? "" : " · draft"}</span><br /><b>{m.title}</b><div className="small muted">{m.theme} · {m.questions.length} questions{m.videoUrl ? " · video" : " · no video"}</div></div>
              <Link className="btn ghost sm" href={`/coach/film?edit=${m.id}`}>Edit</Link>
            </div>
          ))}
          {!mods.length && <p className="muted">No modules yet. Week 1 unlocks on each athlete&apos;s Day 1.</p>}
        </div>
        <form action={saveFilmModule} className="card" key={editing?.id ?? "new"}>
          <h4>{editing ? "Edit module" : "New module"}</h4>
          <input type="hidden" name="id" value={editing?.id ?? 0} />
          <div className="row c2" style={{ marginTop: 8 }}>
            <div className="field"><label>Week #</label><input name="weekNumber" type="number" min={1} max={52} defaultValue={editing?.weekNumber ?? (mods.length + 1)} /></div>
            <div className="field"><label>Track</label><select name="track" defaultValue={editing?.track ?? "ALL"}><option value="ALL">All tracks</option><option value="TRYOUT">Tryout Prep</option><option value="MADE_TEAM">Made the Team</option><option value="REBUILD">Rebuild</option></select></div>
          </div>
          <div className="field"><label>Title</label><input name="title" defaultValue={editing?.title ?? ""} required /></div>
          <div className="field"><label>Theme (matches the week&apos;s skill focus)</label><input name="theme" defaultValue={editing?.theme ?? ""} placeholder="e.g. Reading the help defender" /></div>
          <div className="field"><label>Video URL (YouTube / Vimeo embed automatically)</label><input name="videoUrl" type="url" defaultValue={editing?.videoUrl ?? ""} /></div>
          <div className="field"><label>Your breakdown (what to watch for, timestamps)</label><textarea name="breakdown" defaultValue={editing?.breakdown ?? ""} style={{ minHeight: 120 }} /></div>
          {[0, 1, 2, 3, 4].map((i) => <div className="field" key={i}><label>Question {i + 1}</label><input name={`q${i}`} defaultValue={editing?.questions?.[i] ?? ""} /></div>)}
          <label className="check" style={{ marginBottom: 12 }}><input type="checkbox" name="published" defaultChecked={editing?.published ?? false} /> Published (visible to athletes)</label>
          <div style={{ display: "flex", gap: 8 }}><button className="btn sm" type="submit">{editing ? "Save" : "Create"}</button>{editing && <Link className="btn ghost sm" href="/coach/film">Cancel</Link>}</div>
        </form>
      </div>
    </div>
  );
}

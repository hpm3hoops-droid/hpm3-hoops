import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, groupCalls } from "@/db";
import { saveCall, deleteCall } from "../actions";

export const metadata = { title: "Calls" };
export const dynamic = "force-dynamic";
const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function Calls({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const calls = await db.select().from(groupCalls).orderBy(asc(groupCalls.weekday), asc(groupCalls.time));
  const editing = sp.edit ? calls.find((c) => c.id === Number(sp.edit)) : undefined;
  return (
    <div>
      <div className="topline"><div><p className="eyebrow">Group by track · your hours stay flat as the roster grows</p><h2 style={{ marginTop: 6 }}>Calls</h2></div></div>
      <div className="grid2">
        <div className="stack">
          {calls.map((c) => (
            <div className="card" key={c.id} style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div><b>{c.title}</b>{!c.active && <span className="pill" style={{ marginLeft: 6 }}>off</span>}<div className="small muted mono">{WD[c.weekday]} {c.time} · {c.track} · {c.tier}</div>{c.meetUrl && <a className="small" href={c.meetUrl} target="_blank" rel="noreferrer">{c.meetUrl}</a>}</div>
                <div style={{ display: "flex", gap: 6 }}><Link className="btn ghost sm" href={`/coach/calls?edit=${c.id}`}>Edit</Link><form action={deleteCall}><input type="hidden" name="id" value={c.id} /><button className="btn ghost sm">Delete</button></form></div>
              </div>
            </div>
          ))}
          {!calls.length && <div className="alert">Suggested to start: one weekly call per track (Tryout Prep, Made the Team, Rebuild) at a fixed evening slot, plus an Elite 1:1 booking link in Settings.</div>}
        </div>
        <form action={saveCall} className="card" key={editing?.id ?? "new"}>
          <h4>{editing ? "Edit call" : "New group call"}</h4>
          <input type="hidden" name="id" value={editing?.id ?? 0} />
          <div className="field" style={{ marginTop: 8 }}><label>Title</label><input name="title" defaultValue={editing?.title ?? ""} placeholder="Tryout Prep weekly" required /></div>
          <div className="row c2">
            <div className="field"><label>Track</label><select name="track" defaultValue={editing?.track ?? "ALL"}><option value="ALL">All</option><option value="TRYOUT">Tryout Prep</option><option value="MADE_TEAM">Made the Team</option><option value="REBUILD">Rebuild</option></select></div>
            <div className="field"><label>Plan</label><select name="tier" defaultValue={editing?.tier ?? "ALL"}><option value="ALL">All</option><option>COHORT</option><option>CORE</option><option>ELITE</option></select></div>
            <div className="field"><label>Weekday</label><select name="weekday" defaultValue={editing?.weekday ?? 2}>{WD.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></div>
            <div className="field"><label>Time (local)</label><input name="time" type="time" defaultValue={editing?.time ?? "19:00"} /></div>
          </div>
          <div className="field"><label>Timezone</label><select name="timezone" defaultValue={editing?.timezone ?? "America/New_York"}>{["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"].map((z) => <option key={z}>{z}</option>)}</select></div>
          <div className="field"><label>Meeting link (Google Meet / Zoom)</label><input name="meetUrl" type="url" defaultValue={editing?.meetUrl ?? ""} /></div>
          <div className="field"><label>Agenda / notes shown to athletes</label><textarea name="agenda" defaultValue={editing?.agenda ?? ""} style={{ minHeight: 70 }} /></div>
          <label className="check" style={{ marginBottom: 12 }}><input type="checkbox" name="active" defaultChecked={editing?.active ?? true} value="on" /> Active</label>
          <div style={{ display: "flex", gap: 8 }}><button className="btn sm" type="submit">{editing ? "Save" : "Create"}</button>{editing && <Link className="btn ghost sm" href="/coach/calls">Cancel</Link>}</div>
        </form>
      </div>
    </div>
  );
}

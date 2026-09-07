import { desc } from "drizzle-orm";
import { db, leads } from "@/db";
import { addMember } from "../actions";
import { toISODate } from "@/lib/program";

export const metadata = { title: "Requests" };
export const dynamic = "force-dynamic";

export default async function Leads() {
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(100);
  return (
    <div>
      <div className="topline"><div><p className="eyebrow">From the join page when checkout isn&apos;t live</p><h2 style={{ marginTop: 6 }}>Spot requests</h2></div></div>
      <div className="stack">
        {rows.map((l) => (
          <form action={addMember} className="card" key={l.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div className="small">
              <b>{l.athleteName || "(athlete)"}</b> · grade {l.grade || "—"} · {l.tier} <span className="mono muted">{toISODate(l.createdAt)}</span>
              <div className="muted">{l.name} · {l.email}</div>
              {l.message && <div style={{ marginTop: 4 }}>{l.message}</div>}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="hidden" name="email" value={l.email} /><input type="hidden" name="athleteName" value={l.athleteName ?? ""} /><input type="hidden" name="parentEmail" value={l.email} />
              <select name="tier" defaultValue={l.tier ?? "COHORT"} style={{ width: 120 }}><option>COHORT</option><option>CORE</option><option>ELITE</option></select>
              <button className="btn sm" type="submit">Approve + add</button>
            </div>
          </form>
        ))}
        {!rows.length && <p className="muted">No requests yet.</p>}
      </div>
    </div>
  );
}

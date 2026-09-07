import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireAthlete } from "@/lib/auth";
import { db, athletes, type Track } from "@/db";
import { toISODate } from "@/lib/program";
import { TRYOUT_DATE_ISO, COHORT_START_ISO } from "@/lib/config";

export const metadata = { title: "Set up" };

async function save(formData: FormData) {
  "use server";
  const { athlete } = await requireAthlete();
  const track = String(formData.get("track") || "TRYOUT") as Track;
  const practiceDays = formData.getAll("practiceDays").map(Number);
  const today = toISODate(new Date());
  let startDate = String(formData.get("startDate") || "") || today;
  if (startDate < today) startDate = today;
  await db.update(athletes).set({
    firstName: String(formData.get("firstName") || "").trim(),
    lastName: String(formData.get("lastName") || "").trim(),
    grade: Number(formData.get("grade")) || null,
    position: String(formData.get("position") || "") || null,
    parentEmail: String(formData.get("parentEmail") || "").trim().toLowerCase() || null,
    parentName: String(formData.get("parentName") || "").trim() || null,
    hasHoop: formData.get("hasHoop") === "on",
    track,
    practiceDays: track === "MADE_TEAM" ? practiceDays : [],
    startDate,
    tryoutDate: String(formData.get("tryoutDate") || "") || null,
    goals: String(formData.get("goals") || "").trim() || null,
    onboarded: true,
  }).where(eq(athletes.id, athlete.id));
  redirect("/app");
}

export default async function Onboarding() {
  const { athlete: a, user } = await requireAthlete();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = toISODate(new Date());
  const defaultStart = a.startDate ?? (COHORT_START_ISO > today ? COHORT_START_ISO : today);
  return (
    <div className="narrow" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <p className="eyebrow">Day 0</p>
      <h1 style={{ fontSize: 44, marginTop: 8 }}>{a.onboarded ? "Update profile" : "Set up the athlete"}</h1>
      <p className="muted" style={{ marginTop: 10 }}>Two minutes. This builds the plan around a real schedule.</p>
      <form action={save} className="stack" style={{ marginTop: 24 }}>
        <div className="row c2">
          <div className="field"><label htmlFor="firstName">Athlete first name</label><input id="firstName" name="firstName" defaultValue={a.firstName} required /></div>
          <div className="field"><label htmlFor="lastName">Last name</label><input id="lastName" name="lastName" defaultValue={a.lastName} /></div>
        </div>
        <div className="row c2">
          <div className="field"><label htmlFor="grade">Grade</label>
            <select id="grade" name="grade" defaultValue={a.grade ?? 9}>{[6, 7, 8, 9, 10, 11, 12].map((g) => <option key={g} value={g}>{g}</option>)}</select></div>
          <div className="field"><label htmlFor="position">Position</label>
            <select id="position" name="position" defaultValue={a.position ?? "Guard"}>{["Guard", "Wing", "Forward", "Big", "Not sure"].map((p) => <option key={p}>{p}</option>)}</select></div>
        </div>
        <div className="field"><label htmlFor="track">Where are you right now?</label>
          <select id="track" name="track" defaultValue={a.track}>
            <option value="TRYOUT">Getting ready for tryouts</option>
            <option value="MADE_TEAM">Made the team — in season</option>
            <option value="REBUILD">Didn&apos;t make it — rebuilding for next year</option>
          </select>
        </div>
        <div className="card">
          <h4>In-season only: team practice days</h4>
          <p className="small muted" style={{ margin: "6px 0 10px" }}>We schedule short sessions on these days and real work on the others.</p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {days.map((d, i) => (
              <label className="check" key={d}><input type="checkbox" name="practiceDays" value={i} defaultChecked={(a.practiceDays ?? []).includes(i)} /> {d}</label>
            ))}
          </div>
        </div>
        <div className="row c2">
          <div className="field"><label htmlFor="startDate">Program start date</label><input id="startDate" name="startDate" type="date" defaultValue={defaultStart} min={today} /></div>
          <div className="field"><label htmlFor="tryoutDate">Tryout date (if known)</label><input id="tryoutDate" name="tryoutDate" type="date" defaultValue={a.tryoutDate ?? TRYOUT_DATE_ISO} /></div>
        </div>
        <label className="check" style={{ marginTop: 4 }}><input type="checkbox" name="hasHoop" defaultChecked={a.hasHoop} /> I usually have access to a hoop</label>
        <div className="row c2">
          <div className="field"><label htmlFor="parentName">Parent name</label><input id="parentName" name="parentName" defaultValue={a.parentName ?? ""} /></div>
          <div className="field"><label htmlFor="parentEmail">Parent email (for weekly recap)</label><input id="parentEmail" name="parentEmail" type="email" defaultValue={a.parentEmail ?? (user.role === "ATHLETE" ? "" : "")} /></div>
        </div>
        <div className="field"><label htmlFor="goals">One sentence: what does a great season look like?</label><textarea id="goals" name="goals" defaultValue={a.goals ?? ""} /></div>
        <button className="btn" type="submit">{a.onboarded ? "Save" : "Build my plan"}</button>
      </form>
    </div>
  );
}

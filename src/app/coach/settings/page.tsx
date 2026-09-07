import { eq } from "drizzle-orm";
import { db, settings } from "@/db";
import { DEFAULT_THRESHOLDS, loadThresholds } from "@/lib/program";
import { stripeConfigured, TIERS } from "@/lib/config";
import { saveSettings } from "../actions";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function Settings({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [cal] = await db.select().from(settings).where(eq(settings.key, "calendly_url"));
  const t = await loadThresholds();
  const smtp = !!process.env.SMTP_HOST && !!process.env.SMTP_USER;
  const stripeOn = stripeConfigured();
  return (
    <div>
      <div className="topline"><div><p className="eyebrow">System</p><h2 style={{ marginTop: 6 }}>Settings</h2></div></div>
      {sp.saved && <div className="alert ok" style={{ marginBottom: 16 }}>Saved.</div>}
      <div className="card" style={{ marginBottom: 16 }}>
        <h4>Status</h4>
        <table style={{ marginTop: 8 }}><tbody>
          <tr><td>Email (magic links, nudges)</td><td><span className={`pill ${smtp ? "green" : "red"}`}>{smtp ? "configured" : "not configured — links print to server logs"}</span></td></tr>
          <tr><td>Stripe checkout</td><td><span className={`pill ${stripeOn ? "green" : "yellow"}`}>{stripeOn ? "live" : "off — join page collects requests instead"}</span></td></tr>
          {(["COHORT", "CORE", "ELITE"] as const).map((k) => <tr key={k}><td>Price ID · {TIERS[k].name}</td><td className="mono small">{process.env[TIERS[k].envKey] ? "set" : "missing"}</td></tr>)}
          <tr><td>Coach emails</td><td className="mono small">{process.env.COACH_EMAILS || "(none — set COACH_EMAILS)"}</td></tr>
          <tr><td>Daily nudge cron</td><td className="small">GET <span className="mono">/api/cron/nudge?key=CRON_SECRET</span> once a day (Railway cron or any scheduler)</td></tr>
        </tbody></table>
      </div>
      <form action={saveSettings} className="card">
        <div className="field"><label>Elite 1:1 booking link (Calendly / Google appointment page)</label><input name="calendly_url" type="url" defaultValue={cal?.value ?? process.env.CALENDLY_URL ?? ""} /></div>
        <div className="field"><label>Level-up thresholds (JSON) — level n → n+1 needs two consecutive benchmarks at or past index n-1</label>
          <textarea name="thresholds" defaultValue={JSON.stringify(t, null, 2)} style={{ minHeight: 170, fontFamily: "Chivo Mono, monospace", fontSize: 13 }} /></div>
        <p className="small muted" style={{ marginBottom: 12 }}>Defaults: {JSON.stringify(DEFAULT_THRESHOLDS)}. HANDLE = handle60 reps · FINISH = finish60 makes · SHOOT = form25 makes at L1–2, spot25 after · ENGINE = 5-10-5 seconds (lower is better).</p>
        <button className="btn sm" type="submit">Save settings</button>
      </form>
    </div>
  );
}

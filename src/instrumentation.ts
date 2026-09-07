/**
 * Runs once when the Node server boots. Schedules the daily accountability pass
 * at 09:00 America/New_York without needing a second Railway service.
 * Disable with DISABLE_INTERNAL_CRON=1 if you run /api/cron/nudge from an external scheduler.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DISABLE_INTERNAL_CRON === "1") return;
  const { runNudges } = await import("./lib/nudge");
  let lastRun = "";
  const tick = async () => {
    try {
      const now = new Date();
      const et = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
      const get = (t: string) => et.find((p) => p.type === t)?.value ?? "";
      const day = `${get("year")}-${get("month")}-${get("day")}`;
      const hour = Number(get("hour")) % 24;
      if (hour === 9 && lastRun !== day) {
        lastRun = day;
        const s = await runNudges(now);
        console.log(`[cron] nudges ${day}:`, JSON.stringify(s));
      }
    } catch (e) {
      console.error("[cron] nudge error", e);
    }
  };
  setInterval(tick, 10 * 60 * 1000).unref();
  console.log("[cron] internal nudge scheduler armed (09:00 ET daily)");
}

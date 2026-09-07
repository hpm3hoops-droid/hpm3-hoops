/** Run the daily accountability pass from a cron: `npm run nudge`. Same logic as GET /api/cron/nudge. */
import { runNudges } from "../src/lib/nudge";

runNudges().then((s) => { console.log(JSON.stringify(s, null, 2)); process.exit(0); }).catch((e) => { console.error(e); process.exit(1); });

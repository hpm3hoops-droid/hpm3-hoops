/**
 * Seeds the starter drill library (scripts/drills.ts), group calls, and 7 weeks of film-study modules.
 * Safe to re-run: skips any section that already has rows.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { drills, groupCalls, filmModules } from "../src/db/schema";
import { DRILLS } from "./drills";

const FILM = [
  { weekNumber: 1, title: "How good players get open without the ball", theme: "Off-ball movement",
    breakdown: "Find any full game (NBA, college, or a high-level HS game on YouTube). Pick ONE player at your position and watch only them for two quarters — not the ball. Watch for: (1) the change of pace right before every cut, (2) eyes on the passer AND the defender, (3) how they use the defender's body to create the angle. Pause on three plays and say out loud what you'd do next.",
    questions: ["Pick one cut. What did the player do BEFORE the cut that made it work?", "Where do you usually stand when you don't have the ball? Be honest.", "Name one cut you'll try in your next game or pickup run.", "What does the defender do wrong on the play you liked most?", "Which of your teammates is the best passer to time a cut with, and why?"] },
  { weekNumber: 2, title: "The first step: how separation actually happens", theme: "Attacking off the catch",
    breakdown: "Watch a guard or wing for two quarters. Every time they catch the ball, count how long the ball sits in their hands before they attack or shoot. Notice: the best players have already decided before the catch. Watch their feet — inside foot, low hips, ball tucked. Pause on three drives.",
    questions: ["On the best drive you saw, what was the player's first movement — foot, ball, or eyes?", "How many dribbles did it take them to get past the defender? Why so few?", "What do you usually do in the first half-second after you catch?", "Describe one time this week you caught the ball and didn't have a plan.", "What's one 'pre-catch' decision you'll make every time next week?"] },
  { weekNumber: 3, title: "Finishing: reading the help before you leave the ground", theme: "Finishing reads",
    breakdown: "Watch two quarters and only track drives to the rim. For each one note: where was the help defender when the driver picked up the ball? Which finish did they choose (same hand, inside hand, Euro, pro-hop, floater, kick-out)? Was the choice made early or late? Great finishers choose late but never rushed.",
    questions: ["List three drives: help position → finish chosen. Was each the right call?", "Which finish from this week's sessions have you never used in a game? Why?", "When you get blocked, what's usually the reason — angle, height of the ball, or timing?", "What did the best finisher do with their off arm?", "Which one finish will you commit to using twice in your next game?"] },
  { weekNumber: 4, title: "Shot selection: the shots coaches trust", theme: "Shot selection",
    breakdown: "Watch two quarters and log every shot by one player: catch-and-shoot, pull-up, drive, or contested-late-clock. Then log makes. You'll see that the highest percentage shots come from feet already set and a decision already made. Coaches give minutes to players whose shot selection they can predict.",
    questions: ["What percentage of the player's shots were catch-and-shoot with feet set?", "Which of YOUR shots would a coach call a 'bad shot'? Describe one.", "What does the player do in the 1 second after a miss?", "Where on the floor do you make the highest percentage? (Guess, then check your benchmark numbers.)", "Name one shot you'll stop taking and one you'll take more."] },
  { weekNumber: 5, title: "Defense: what tryout coaches see in 30 seconds", theme: "Defensive habits",
    breakdown: "Coaches decide on defenders fast. Watch two quarters tracking one defender: stance when the ball is one pass away, hands active or dead, does he talk, does he close out under control, does he box out. Write down every time he relaxes. That's the list that gets players cut.",
    questions: ["How many times did the defender stand straight up when the ball was one pass away?", "Describe one great closeout: speed, chop, hand.", "Do you talk on defense? What did you say in your last game?", "What's your biggest defensive habit to fix before tryouts?", "Who is the best defender you've played against, and what made them hard?"] },
  { weekNumber: 6, title: "Decision-making: the pass you don't throw", theme: "Reads and turnovers",
    breakdown: "Track every turnover for one team in two quarters. Sort them: bad pass, bad dribble, charge, rushed. Then rewind and find the moment the turnover became likely — it's almost always 2 seconds earlier than the turnover itself. Tryout coaches count turnovers more than points.",
    questions: ["Which turnover type was most common? What caused it?", "Find one turnover and describe the safer play that was available.", "What kind of turnover do you make most? (Ask a teammate if unsure.)", "What do the good passers look at before they pass?", "One rule you'll follow next game to cut turnovers in half."] },
  { weekNumber: 7, title: "Tryout week: playing to your role", theme: "Tryouts",
    breakdown: "Watch a role player — not the star — for two quarters. Notice how they get on the floor: sprint the floor first, first to the loose ball, screens set with contact, extra pass, no complaining. That's the tryout checklist. Pick three of those things and do them every possession this week.",
    questions: ["List the three things the role player did that didn't show up in the box score.", "What is your role on the team you're trying out for? Be specific.", "What will the coach notice about you in the first 10 minutes of tryouts?", "What's your plan if you're nervous in the first drill?", "Write one sentence you'll say to yourself before tryouts start."] },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined });
  const db = drizzle(pool);
  const haveDrills = (await db.select({ id: drills.id }).from(drills).limit(1)).length > 0;
  if (!haveDrills) {
    await db.insert(drills).values(DRILLS.map((d, i) => ({ ...d, needsHoop: !!d.needsHoop, sortOrder: i, isSample: true })));
    console.log(`seeded ${DRILLS.length} drills`);
  } else console.log("drills present — skipped");
  const haveCalls = (await db.select({ id: groupCalls.id }).from(groupCalls).limit(1)).length > 0;
  if (!haveCalls) {
    await db.insert(groupCalls).values([
      { title: "Tryout Prep weekly", track: "TRYOUT", tier: "ALL", weekday: 2, time: "19:30", agenda: "Numbers · one clip · next week · your schedule" },
      { title: "In-season weekly", track: "MADE_TEAM", tier: "ALL", weekday: 4, time: "19:30", agenda: "Numbers · one clip from your games · next week · practice schedule" },
      { title: "Rebuild weekly", track: "REBUILD", tier: "ALL", weekday: 1, time: "19:30", agenda: "Numbers · one clip · next week · what's next in your season" },
    ]);
    console.log("seeded 3 group calls");
  } else console.log("calls present — skipped");
  const haveFilm = (await db.select({ id: filmModules.id }).from(filmModules).limit(1)).length > 0;
  if (!haveFilm) {
    await db.insert(filmModules).values(FILM.map((f) => ({ ...f, track: "ALL" as const, published: true })));
    console.log(`seeded ${FILM.length} film modules`);
  } else console.log("film present — skipped");
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });

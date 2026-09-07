import Link from "next/link";
import { and, eq, gte, lte, or, desc } from "drizzle-orm";
import { requireAthlete } from "@/lib/auth";
import { db, filmModules, filmResponses, groupCalls, coachNotes } from "@/db";
import { getOrBuildSession, compliance, programWeek, TRACK_COPY, TRACK_LABEL, toISODate, parseISO, dayKind } from "@/lib/program";
import SessionRunner from "@/components/SessionRunner";
import { TIERS } from "@/lib/config";

export const metadata = { title: "Today" };
export const dynamic = "force-dynamic";

const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function Today({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { athlete: a } = await requireAthlete();
  const sp = await searchParams;
  const today = new Date();
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? parseISO(sp.date) : today;
  const iso = toISODate(date);
  const isToday = iso === toISODate(today);
  const notStarted = !!a.startDate && a.startDate > toISODate(today);

  const session = await getOrBuildSession(a, date);
  const comp = await compliance(a, today);
  const week = programWeek(a, date);
  const kind = dayKind(a, date);

  // Film due this week?
  const mods = await db.select().from(filmModules).where(and(eq(filmModules.published, true), lte(filmModules.weekNumber, week), or(eq(filmModules.track, "ALL"), eq(filmModules.track, a.track))));
  const done = await db.select().from(filmResponses).where(eq(filmResponses.athleteId, a.id));
  const doneIds = new Set(done.map((d) => d.moduleId));
  const filmDue = mods.filter((m) => !doneIds.has(m.id)).sort((x, y) => y.weekNumber - x.weekNumber)[0];

  const calls = await db.select().from(groupCalls).where(and(eq(groupCalls.active, true), or(eq(groupCalls.track, "ALL"), eq(groupCalls.track, a.track)), or(eq(groupCalls.tier, "ALL"), eq(groupCalls.tier, a.tier))));
  const nextCall = calls.map((c) => ({ c, days: (c.weekday - today.getDay() + 7) % 7 })).sort((x, y) => x.days - y.days)[0];

  const notes = await db.select().from(coachNotes).where(and(eq(coachNotes.athleteId, a.id), eq(coachNotes.visibleToAthlete, true))).orderBy(desc(coachNotes.createdAt)).limit(1);

  const copy = TRACK_COPY[a.track];
  const prev = toISODate(new Date(date.getTime() - 864e5));
  const next = toISODate(new Date(date.getTime() + 864e5));

  return (
    <div>
      <div className="topline">
        <div>
          <p className="eyebrow">{TRACK_LABEL[a.track]} · Week {week} · {WD[date.getDay()]} {iso}</p>
          <h2 style={{ marginTop: 6 }}>{isToday ? `What's up, ${a.firstName || "hooper"}.` : `${WD[date.getDay()]}'s session`}</h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link className="btn ghost sm" href={`/app?date=${prev}`}>← Prev</Link>
          {!isToday && <Link className="btn ghost sm" href="/app">Today</Link>}
          <Link className="btn ghost sm" href={`/app?date=${next}`}>Next →</Link>
        </div>
      </div>

      {a.tier === "NONE" && <div className="alert err" style={{ marginBottom: 18 }}>No active membership on this account. <Link href="/#pricing">Pick a program</Link> or ask your coach to add you.</div>}
      {notStarted && <div className="alert" style={{ marginBottom: 18 }}>Your program starts <b>{a.startDate}</b>. You can preview sessions now; benchmarks and streaks start counting on Day 1.</div>}

      <div className="grid3" style={{ marginBottom: 22 }}>
        <div className="stat"><div className="bignum"><span className={`dot ${comp.color}`} />{comp.done}/{comp.scheduled}</div><span>sessions, last 7 days</span></div>
        <div className="stat"><div className="bignum">{comp.missedStreak}</div><span>missed in a row {comp.missedStreak >= 2 ? "— get one in today" : ""}</span></div>
        <div className="stat"><div className="bignum">{Object.values(a.levels ?? {}).reduce((s, v) => s + v, 0)}</div><span>total skill level (H{a.levels?.HANDLE ?? 1} F{a.levels?.FINISH ?? 1} S{a.levels?.SHOOT ?? 1} E{a.levels?.ENGINE ?? 1})</span></div>
      </div>

      {notes[0] && <div className="alert" style={{ marginBottom: 18 }}><b>From Coach:</b> {notes[0].body}</div>}

      {kind === "REST" && (
        <div className="card"><h3>Rest day</h3><p className="muted" style={{ marginTop: 8 }}>Sunday is off. Coach reviews your week and sends Monday&apos;s note. Stretch, hydrate, watch a game.</p></div>
      )}
      {kind === "PRACTICE" && (
        <div className="card" style={{ marginBottom: 18 }}><h3>Team practice day</h3><p className="muted" style={{ marginTop: 8 }}>Practice is the team&apos;s work. Below is an optional 15-minute touch-up — handle and form only. Skip it if you&apos;re cooked; it won&apos;t count against you.</p></div>
      )}
      {kind === "BENCHMARK" && (
        <div className="card hot" style={{ marginBottom: 18 }}>
          <h3>Benchmark Saturday</h3>
          <p className="muted" style={{ marginTop: 8 }}>Warm up with the short session below, then log your six numbers. Two clean weeks over the bar moves you up a level.</p>
          <Link className="btn sm" href={`/app/benchmarks?date=${iso}`} style={{ marginTop: 12 }}>Log benchmarks</Link>
        </div>
      )}
      {kind === "FILM" && (
        <div className="card hot" style={{ marginBottom: 18 }}>
          <h3>Film study Wednesday</h3>
          <p className="muted" style={{ marginTop: 8 }}>Shorter on-court block today. The main work is the hour of film: {filmDue ? <>this week&apos;s module is <b>{filmDue.title}</b>.</> : "no module assigned yet — coach will post it."}</p>
          {filmDue && <Link className="btn sm" href={`/app/film/${filmDue.id}`} style={{ marginTop: 12 }}>Open film study</Link>}
        </div>
      )}

      {kind !== "REST" && (
        <>
          <p className="eyebrow" style={{ marginBottom: 4 }}>{copy.headline}</p>
          <p className="small muted" style={{ marginBottom: 12, maxWidth: "40em" }}>{copy.body}</p>
          <SessionRunner session={session} date={iso} hasHoopDefault={a.hasHoop} />
        </>
      )}

      <div className="grid2" style={{ marginTop: 28 }}>
        <div className="card">
          <h4>Next call</h4>
          {nextCall ? (
            <p style={{ marginTop: 8 }}><b>{nextCall.c.title}</b> · {WD[nextCall.c.weekday]} {nextCall.c.time} {nextCall.c.timezone.replace("America/", "")} {nextCall.days === 0 ? "· today" : `· in ${nextCall.days} day${nextCall.days === 1 ? "" : "s"}`}
              {nextCall.c.meetUrl && <> · <a href={nextCall.c.meetUrl} target="_blank" rel="noreferrer">Join link</a></>}</p>
          ) : <p className="muted" style={{ marginTop: 8 }}>No group call scheduled for your track yet.</p>}
          <Link className="small" href="/app/calls" style={{ display: "inline-block", marginTop: 8 }}>All calls →</Link>
        </div>
        <div className="card">
          <h4>Film this week</h4>
          {filmDue ? <p style={{ marginTop: 8 }}><b>{filmDue.title}</b> — not submitted. <Link href={`/app/film/${filmDue.id}`}>Do it now</Link></p> : <p className="muted" style={{ marginTop: 8 }}>All caught up.</p>}
          <p className="small muted" style={{ marginTop: 8 }}>Plan: {a.tier !== "NONE" ? TIERS[a.tier].name : "—"}</p>
        </div>
      </div>
    </div>
  );
}

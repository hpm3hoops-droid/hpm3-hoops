/**
 * HPM3 Hoops program engine.
 * Turns an athlete (track, start date, levels, hoop access) + the drill library into
 * a concrete session for a given date, and moves levels when benchmarks earn it.
 */
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db, athletes, drills, sessions, benchmarks, settings, type Block, type SessionItem, type Track } from "@/db";

export const BLOCKS: Block[] = ["ACTIVATE", "HANDLE", "FINISH", "SHOOT", "ENGINE"];
export const BLOCK_LABEL: Record<Block, string> = {
  ACTIVATE: "Activate", HANDLE: "Handle", FINISH: "Finish / Footwork", SHOOT: "Shoot", ENGINE: "Engine",
};
export const TRACK_LABEL: Record<Track, string> = {
  TRYOUT: "Tryout Prep", MADE_TEAM: "Made the Team (in-season)", REBUILD: "The Rebuild",
};

/** Minutes per block at each session length (from the blueprint). */
export const ALLOC: Record<number, Record<Block, number>> = {
  15: { ACTIVATE: 2, HANDLE: 5, FINISH: 4, SHOOT: 4, ENGINE: 0 },
  30: { ACTIVATE: 4, HANDLE: 8, FINISH: 6, SHOOT: 9, ENGINE: 3 },
  45: { ACTIVATE: 5, HANDLE: 10, FINISH: 10, SHOOT: 14, ENGINE: 6 },
  60: { ACTIVATE: 6, HANDLE: 12, FINISH: 12, SHOOT: 20, ENGINE: 10 },
};

export type DayKind = "SKILL" | "FILM" | "BENCHMARK" | "REST" | "PRACTICE";

export const toISODate = (d: Date) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
export const parseISO = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

type AthleteRow = typeof athletes.$inferSelect;

/** 1-based program week for a date. Before start date = week 1. */
export function programWeek(a: AthleteRow, date: Date): number {
  if (!a.startDate) return 1;
  const start = parseISO(a.startDate);
  const diff = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return Math.max(1, Math.floor(diff / 7) + 1);
}

/** Target session length for the day. */
export function targetMinutes(a: AthleteRow, date: Date, kind: DayKind): number {
  const wk = programWeek(a, date);
  if (kind === "REST") return 0;
  if (kind === "BENCHMARK") return 15;
  if (kind === "PRACTICE") return 15;
  let base: number;
  switch (a.track) {
    case "TRYOUT": base = wk <= 1 ? 15 : wk === 2 ? 30 : wk <= 5 ? 45 : 60; break;
    case "MADE_TEAM": base = 30; break;
    case "REBUILD": base = wk <= 1 ? 30 : wk === 2 ? 45 : 60; break;
    default: base = 30;
  }
  if (kind === "FILM") return Math.min(base, 30); // film day: shorter on-court block, film is the main work
  return base;
}

/** What kind of day it is for this athlete. */
export function dayKind(a: AthleteRow, date: Date): DayKind {
  const wd = date.getDay();
  if (wd === 0) return "REST";
  if (wd === 6) return "BENCHMARK";
  if (a.track === "MADE_TEAM" && (a.practiceDays ?? []).includes(wd)) return "PRACTICE";
  if (wd === 3) return "FILM";
  return "SKILL";
}

/** Scheduled (non-rest) days in a window, used for compliance. */
export function scheduledDays(a: AthleteRow, from: Date, to: Date): string[] {
  const out: string[] = [];
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
    const k = dayKind(a, d);
    if (k !== "REST" && k !== "PRACTICE") out.push(toISODate(d));
  }
  return out;
}

type DrillRow = typeof drills.$inferSelect;

function pickForBlock(all: DrillRow[], block: Block, level: number, minutes: number, withHoop: boolean, rotate: number): SessionItem[] {
  if (minutes <= 0) return [];
  const lvl = block === "ACTIVATE" || block === "ENGINE" ? null : level;
  let pool = all.filter((d) => d.active && d.block === block && (lvl === null || d.level === lvl));
  // Fall back to the nearest lower level if this level has nothing yet.
  if (!pool.length && lvl !== null) {
    for (let l = lvl - 1; l >= 1 && !pool.length; l--) pool = all.filter((d) => d.active && d.block === block && d.level === l);
  }
  type Picked = DrillRow & { _noHoop: boolean };
  const usable: Picked[] = pool
    .map((d): Picked | null => {
      if (d.needsHoop && !withHoop) {
        if (d.noHoopName || d.noHoopDescription) return { ...d, _noHoop: true };
        return null;
      }
      return { ...d, _noHoop: false };
    })
    .filter((x): x is Picked => !!x)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  if (!usable.length) return [];
  const items: SessionItem[] = [];
  let sum = 0, i = rotate % usable.length, guard = 0;
  while (sum < minutes && guard < usable.length) {
    const d = usable[i % usable.length];
    const m = Math.min(d.minutes, Math.max(1, minutes - sum));
    items.push({
      drillId: d.id, block, minutes: m, done: false, usedNoHoop: d._noHoop,
      name: d._noHoop ? d.noHoopName || d.name : d.name,
      description: d._noHoop ? d.noHoopDescription || d.description : d.description,
      videoUrl: d.videoUrl,
    });
    sum += m; i++; guard++;
  }
  return items;
}

/** Build (or fetch) the athlete's session for a date. Idempotent per athlete/date. */
export async function getOrBuildSession(a: AthleteRow, date: Date, opts?: { withHoop?: boolean; rebuild?: boolean }) {
  const iso = toISODate(date);
  const [existing] = await db.select().from(sessions).where(and(eq(sessions.athleteId, a.id), eq(sessions.date, iso)));
  if (existing && !opts?.rebuild) return existing;
  if (existing?.completed) return existing;

  const kind = dayKind(a, date);
  const withHoop = opts?.withHoop ?? existing?.withHoop ?? a.hasHoop;
  const minutes = targetMinutes(a, date, kind);
  let items: SessionItem[] = [];
  if (kind === "SKILL" || kind === "FILM" || kind === "PRACTICE" || kind === "BENCHMARK") {
    const all = await db.select().from(drills).where(eq(drills.active, true));
    const key = ([15, 30, 45, 60].find((k) => k >= minutes) ?? 60) as 15 | 30 | 45 | 60;
    const alloc = { ...ALLOC[key] };
    if (kind === "FILM") { alloc.SHOOT = Math.max(0, alloc.SHOOT - 4); alloc.ENGINE += 4; }
    if (kind === "BENCHMARK") { alloc.ACTIVATE = 4; alloc.HANDLE = 5; alloc.FINISH = 0; alloc.SHOOT = 6; alloc.ENGINE = 0; }
    const rotate = Math.floor(date.getTime() / 86400000) + a.id;
    for (const b of BLOCKS) items.push(...pickForBlock(all, b, a.levels?.[b] ?? 1, alloc[b], withHoop, rotate));
  }
  const values = { athleteId: a.id, date: iso, kind, plannedMinutes: minutes, items, withHoop };
  if (existing) {
    const [s] = await db.update(sessions).set(values).where(eq(sessions.id, existing.id)).returning();
    return s;
  }
  const [s] = await db.insert(sessions).values(values).returning();
  return s;
}

/** Level thresholds: to move from level n to n+1 the athlete must hit thresholds[n-1] on two consecutive benchmarks. */
export type Thresholds = { HANDLE: number[]; FINISH: number[]; SHOOT: number[]; ENGINE: number[] };
export const DEFAULT_THRESHOLDS: Thresholds = {
  HANDLE: [40, 55, 70, 85, 100],   // handle60 clean reps
  FINISH: [8, 11, 14, 17, 20],     // finish60 makes
  SHOOT: [12, 15, 18, 20, 22],     // spot25 makes (form25 counts at levels 1-2)
  ENGINE: [5.6, 5.4, 5.2, 5.0, 4.8], // 5-10-5 seconds, lower is better
};

export async function loadThresholds(): Promise<Thresholds> {
  const [row] = await db.select().from(settings).where(eq(settings.key, "thresholds"));
  if (!row) return DEFAULT_THRESHOLDS;
  try { return { ...DEFAULT_THRESHOLDS, ...JSON.parse(row.value) }; } catch { return DEFAULT_THRESHOLDS; }
}

type BenchRow = typeof benchmarks.$inferSelect;
function meets(skill: keyof Thresholds, level: number, b: BenchRow, t: Thresholds): boolean {
  if (level >= 6) return false;
  const th = t[skill][level - 1];
  if (th === undefined) return false;
  switch (skill) {
    case "HANDLE": return (b.handle60 ?? 0) >= th;
    case "FINISH": return (b.finish60 ?? 0) >= th;
    case "SHOOT": return level <= 2 ? (b.form25 ?? 0) >= th : (b.spot25 ?? 0) >= th;
    case "ENGINE": return b.shuttle != null && b.shuttle > 0 && b.shuttle <= th;
  }
}

/** After a benchmark is logged: promote any skill where the last two benchmarks clear the bar. Returns promotions. */
export async function applyProgression(a: AthleteRow): Promise<string[]> {
  const last = await db.select().from(benchmarks).where(eq(benchmarks.athleteId, a.id)).orderBy(desc(benchmarks.date)).limit(2);
  if (last.length < 2) return [];
  const t = await loadThresholds();
  const levels = { ...(a.levels ?? {}) };
  const promoted: string[] = [];
  for (const skill of ["HANDLE", "FINISH", "SHOOT", "ENGINE"] as (keyof Thresholds)[]) {
    const lvl = levels[skill] ?? 1;
    if (meets(skill, lvl, last[0], t) && meets(skill, lvl, last[1], t)) {
      levels[skill] = lvl + 1;
      promoted.push(`${BLOCK_LABEL[skill]} → Level ${lvl + 1}`);
    }
  }
  if (promoted.length) await db.update(athletes).set({ levels }).where(eq(athletes.id, a.id));
  return promoted;
}

export type Compliance = { color: "green" | "yellow" | "red"; done: number; scheduled: number; missedStreak: number; lastCompleted: string | null };

/** Rolling 7-day compliance + consecutive missed scheduled days. */
export async function compliance(a: AthleteRow, today = new Date()): Promise<Compliance> {
  const from = addDays(today, -6);
  const sched = scheduledDays(a, from, today);
  const rows = await db.select().from(sessions).where(and(
    eq(sessions.athleteId, a.id), gte(sessions.date, toISODate(addDays(today, -30))), lte(sessions.date, toISODate(today)),
  ));
  const doneSet = new Set(rows.filter((r) => r.completed).map((r) => r.date));
  const done = sched.filter((d) => doneSet.has(d)).length;
  const ratio = sched.length ? done / sched.length : 1;
  // Missed streak: walk back from yesterday over scheduled days until a completed one.
  let missed = 0;
  for (let d = addDays(today, -1); d >= addDays(today, -14); d = addDays(d, -1)) {
    const k = dayKind(a, d);
    if (k === "REST" || k === "PRACTICE") continue;
    if (doneSet.has(toISODate(d))) break;
    missed++;
  }
  const lastCompleted = rows.filter((r) => r.completed).sort((x, y) => (x.date < y.date ? 1 : -1))[0]?.date ?? null;
  const started = !!a.startDate && parseISO(a.startDate) <= today;
  const color = !started ? "green" : ratio >= 0.8 && missed < 2 ? "green" : ratio >= 0.5 ? "yellow" : "red";
  return { color, done, scheduled: sched.length, missedStreak: missed, lastCompleted };
}

export const TRACK_COPY: Record<Track, { headline: string; body: string }> = {
  TRYOUT: {
    headline: "Seven weeks. Walk in with numbers.",
    body: "Every session is built for the day you're on. Log it, hit your Saturday benchmarks, and you'll walk into tryouts with proof you did the work.",
  },
  MADE_TEAM: {
    headline: "You made it. Now earn minutes.",
    body: "Practice is the team's work; this is yours. Short sessions on practice days, real work on off days, and film study switches to your own games.",
  },
  REBUILD: {
    headline: "Not the end. More gym time.",
    body: "No practice load means longer sessions and faster level-ups. There is a lot of basketball ahead — club, AAU, next year's tryout, and more routes than ever. Start here.",
  },
};

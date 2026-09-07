"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAthlete } from "@/lib/auth";
import { db, sessions, benchmarks, filmResponses, clips, athletes, type SessionItem } from "@/db";
import { applyProgression, getOrBuildSession, parseISO } from "@/lib/program";

export async function toggleHoop(date: string, withHoop: boolean) {
  const { athlete } = await requireAthlete();
  await getOrBuildSession(athlete, parseISO(date), { withHoop, rebuild: true });
  revalidatePath("/app");
}

export async function saveItems(sessionId: number, items: SessionItem[]) {
  const { athlete } = await requireAthlete();
  await db.update(sessions).set({ items }).where(and(eq(sessions.id, sessionId), eq(sessions.athleteId, athlete.id)));
}

export async function completeSession(sessionId: number, data: { items: SessionItem[]; actualMinutes: number; effort: number; notes: string }) {
  const { athlete } = await requireAthlete();
  await db.update(sessions).set({
    items: data.items, completed: true, completedAt: new Date(),
    actualMinutes: data.actualMinutes || null, effort: data.effort || null, notes: data.notes || null,
  }).where(and(eq(sessions.id, sessionId), eq(sessions.athleteId, athlete.id)));
  revalidatePath("/app");
}

export async function logBenchmark(formData: FormData) {
  const { athlete } = await requireAthlete();
  const num = (k: string) => { const v = String(formData.get(k) ?? "").trim(); return v === "" ? null : Number(v); };
  const date = String(formData.get("date") || "");
  const values = {
    athleteId: athlete.id, date,
    handle60: num("handle60"), twoBall90: num("twoBall90"), form25: num("form25"), spot25: num("spot25"),
    finish60: num("finish60"), shuttle: num("shuttle"), notes: String(formData.get("notes") || "") || null,
  };
  const [existing] = await db.select().from(benchmarks).where(and(eq(benchmarks.athleteId, athlete.id), eq(benchmarks.date, date)));
  if (existing) await db.update(benchmarks).set(values).where(eq(benchmarks.id, existing.id));
  else await db.insert(benchmarks).values(values);
  // Mark the benchmark session done.
  const s = await getOrBuildSession(athlete, parseISO(date));
  if (s.kind === "BENCHMARK" && !s.completed) await db.update(sessions).set({ completed: true, completedAt: new Date() }).where(eq(sessions.id, s.id));
  const [fresh] = await db.select().from(athletes).where(eq(athletes.id, athlete.id));
  const promoted = await applyProgression(fresh);
  revalidatePath("/app/benchmarks");
  return { promoted };
}

export async function submitFilm(moduleId: number, answers: string[], minutesWatched: number) {
  const { athlete } = await requireAthlete();
  const [existing] = await db.select().from(filmResponses).where(and(eq(filmResponses.athleteId, athlete.id), eq(filmResponses.moduleId, moduleId)));
  if (existing) await db.update(filmResponses).set({ answers, minutesWatched, submittedAt: new Date() }).where(eq(filmResponses.id, existing.id));
  else await db.insert(filmResponses).values({ athleteId: athlete.id, moduleId, answers, minutesWatched });
  revalidatePath("/app/film");
}

export async function addClip(formData: FormData) {
  const { athlete } = await requireAthlete();
  const url = String(formData.get("url") || "").trim();
  if (!/^https?:\/\//.test(url)) return;
  await db.insert(clips).values({ athleteId: athlete.id, url, note: String(formData.get("note") || "") || null });
  revalidatePath("/app/clips");
}

"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoach } from "@/lib/auth";
import { db, drills, filmModules, filmResponses, groupCalls, coachNotes, athletes, clips, settings, memberships, type Block, type Track, type Tier } from "@/db";
import { addManualMember } from "@/lib/membership";
import { getOrBuildSession } from "@/lib/program";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const n = (fd: FormData, k: string) => Number(fd.get(k)) || 0;

export async function saveDrill(fd: FormData) {
  await requireCoach();
  const id = n(fd, "id");
  const values = {
    block: s(fd, "block") as Block, level: Math.min(6, Math.max(1, n(fd, "level") || 1)), name: s(fd, "name"),
    description: s(fd, "description"), videoUrl: s(fd, "videoUrl") || null, needsHoop: fd.get("needsHoop") === "on",
    noHoopName: s(fd, "noHoopName") || null, noHoopDescription: s(fd, "noHoopDescription") || null,
    minutes: Math.max(1, n(fd, "minutes") || 4), sortOrder: n(fd, "sortOrder"), active: fd.get("active") !== "off", isSample: false,
  };
  if (!values.name) return;
  if (id) await db.update(drills).set(values).where(eq(drills.id, id));
  else await db.insert(drills).values(values);
  revalidatePath("/coach/drills");
  redirect(`/coach/drills?block=${values.block}&level=${values.level}`);
}

export async function deleteDrill(fd: FormData) {
  await requireCoach();
  await db.update(drills).set({ active: false }).where(eq(drills.id, n(fd, "id")));
  revalidatePath("/coach/drills");
}

export async function saveFilmModule(fd: FormData) {
  await requireCoach();
  const id = n(fd, "id");
  const questions = [0, 1, 2, 3, 4].map((i) => s(fd, `q${i}`)).filter(Boolean);
  const values = {
    weekNumber: Math.max(1, n(fd, "weekNumber") || 1), track: (s(fd, "track") || "ALL") as Track | "ALL", title: s(fd, "title"), theme: s(fd, "theme") || null,
    videoUrl: s(fd, "videoUrl") || null, breakdown: s(fd, "breakdown"), questions, published: fd.get("published") === "on",
  };
  if (!values.title) return;
  if (id) await db.update(filmModules).set(values).where(eq(filmModules.id, id));
  else await db.insert(filmModules).values(values);
  revalidatePath("/coach/film");
  redirect("/coach/film");
}

export async function replyFilm(fd: FormData) {
  await requireCoach();
  await db.update(filmResponses).set({ coachReply: s(fd, "reply") || null }).where(eq(filmResponses.id, n(fd, "id")));
  revalidatePath("/coach/inbox");
}

export async function saveCall(fd: FormData) {
  await requireCoach();
  const id = n(fd, "id");
  const values = {
    title: s(fd, "title"), track: (s(fd, "track") || "ALL") as Track | "ALL", tier: (s(fd, "tier") || "ALL") as Tier | "ALL",
    weekday: n(fd, "weekday"), time: s(fd, "time") || "19:00", timezone: s(fd, "timezone") || "America/New_York",
    meetUrl: s(fd, "meetUrl") || null, agenda: s(fd, "agenda") || null, active: fd.get("active") !== "off",
  };
  if (!values.title) return;
  if (id) await db.update(groupCalls).set(values).where(eq(groupCalls.id, id));
  else await db.insert(groupCalls).values(values);
  revalidatePath("/coach/calls");
  redirect("/coach/calls");
}

export async function deleteCall(fd: FormData) {
  await requireCoach();
  await db.delete(groupCalls).where(eq(groupCalls.id, n(fd, "id")));
  revalidatePath("/coach/calls");
}

export async function addNote(fd: FormData) {
  await requireCoach();
  const athleteId = n(fd, "athleteId");
  const body = s(fd, "body");
  if (!body) return;
  await db.insert(coachNotes).values({ athleteId, body, visibleToAthlete: fd.get("visible") === "on" });
  revalidatePath(`/coach/athletes/${athleteId}`);
}

export async function updateAthlete(fd: FormData) {
  await requireCoach();
  const id = n(fd, "id");
  const levels = { HANDLE: n(fd, "lvlHANDLE") || 1, FINISH: n(fd, "lvlFINISH") || 1, SHOOT: n(fd, "lvlSHOOT") || 1, ENGINE: n(fd, "lvlENGINE") || 1 };
  await db.update(athletes).set({
    track: s(fd, "track") as Track, tier: s(fd, "tier") as Tier, startDate: s(fd, "startDate") || null, tryoutDate: s(fd, "tryoutDate") || null,
    levels, hasHoop: fd.get("hasHoop") === "on", parentEmail: s(fd, "parentEmail") || null,
  }).where(eq(athletes.id, id));
  // Rebuild today's session so level/track changes show immediately.
  const [a] = await db.select().from(athletes).where(eq(athletes.id, id));
  if (a) await getOrBuildSession(a, new Date(), { rebuild: true });
  revalidatePath(`/coach/athletes/${id}`);
  redirect(`/coach/athletes/${id}?saved=1`);
}

export async function addMember(fd: FormData) {
  await requireCoach();
  const email = s(fd, "email");
  if (!email) return;
  await addManualMember(email, (s(fd, "tier") || "COHORT") as Tier, s(fd, "athleteName") || undefined, s(fd, "parentEmail") || undefined);
  revalidatePath("/coach");
  redirect("/coach?added=1");
}

export async function endMembership(fd: FormData) {
  await requireCoach();
  const email = s(fd, "email").toLowerCase();
  await db.update(memberships).set({ status: "canceled" }).where(eq(memberships.email, email));
  const id = n(fd, "athleteId");
  await db.update(athletes).set({ tier: "NONE" }).where(eq(athletes.id, id));
  revalidatePath("/coach");
  redirect(`/coach/athletes/${id}?saved=1`);
}

export async function feedbackClip(fd: FormData) {
  await requireCoach();
  await db.update(clips).set({ coachFeedback: s(fd, "feedback") || null, feedbackAt: new Date() }).where(eq(clips.id, n(fd, "id")));
  revalidatePath("/coach/inbox");
}

export async function saveSettings(fd: FormData) {
  await requireCoach();
  const pairs: [string, string][] = [["calendly_url", s(fd, "calendly_url")], ["thresholds", s(fd, "thresholds")]];
  for (const [key, value] of pairs) {
    if (key === "thresholds" && value) { try { JSON.parse(value); } catch { continue; } }
    await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
  }
  revalidatePath("/coach/settings");
  redirect("/coach/settings?saved=1");
}

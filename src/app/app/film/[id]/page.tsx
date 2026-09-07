import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireAthlete } from "@/lib/auth";
import { db, filmModules, filmResponses } from "@/db";
import { submitFilm } from "../../actions";

export const dynamic = "force-dynamic";

function embedUrl(u?: string | null) {
  if (!u) return null;
  const yt = u.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = u.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

async function submit(formData: FormData) {
  "use server";
  const moduleId = Number(formData.get("moduleId"));
  const n = Number(formData.get("n"));
  const answers = Array.from({ length: n }, (_, i) => String(formData.get(`a${i}`) || "").trim());
  await submitFilm(moduleId, answers, Number(formData.get("minutesWatched")) || 0);
  redirect(`/app/film/${moduleId}?saved=1`);
}

export default async function FilmModule({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { athlete: a } = await requireAthlete();
  const { id } = await params;
  const sp = await searchParams;
  const [m] = await db.select().from(filmModules).where(and(eq(filmModules.id, Number(id)), eq(filmModules.published, true)));
  if (!m) notFound();
  const [r] = await db.select().from(filmResponses).where(and(eq(filmResponses.athleteId, a.id), eq(filmResponses.moduleId, m.id)));
  const embed = embedUrl(m.videoUrl);
  return (
    <div>
      <Link href="/app/film" className="eyebrow" style={{ textDecoration: "none" }}>← Film study</Link>
      <p className="eyebrow" style={{ marginTop: 18 }}>Week {m.weekNumber}{m.theme ? ` · ${m.theme}` : ""}</p>
      <h2 style={{ marginTop: 6 }}>{m.title}</h2>
      {sp.saved && <div className="alert ok" style={{ marginTop: 16 }}>Submitted. Coach reads these before the weekly call.</div>}
      {embed ? (
        <div style={{ marginTop: 18, aspectRatio: "16/9", background: "#000" }}><iframe src={embed} title={m.title} style={{ width: "100%", height: "100%", border: 0 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
      ) : m.videoUrl ? <p style={{ marginTop: 18 }}><a className="btn sm" href={m.videoUrl} target="_blank" rel="noreferrer">Open the film ↗</a></p> : null}
      {m.breakdown && (
        <div className="card" style={{ marginTop: 18 }}>
          <h4>Coach&apos;s breakdown — read before you watch</h4>
          <p style={{ marginTop: 10, whiteSpace: "pre-line" }}>{m.breakdown}</p>
        </div>
      )}
      <form action={submit} className="card" style={{ marginTop: 18 }}>
        <input type="hidden" name="moduleId" value={m.id} />
        <input type="hidden" name="n" value={m.questions.length} />
        <h4>Find it in your own game</h4>
        <p className="small muted" style={{ margin: "6px 0 14px" }}>Short answers. Specific beats long. Coach reads every one.</p>
        {m.questions.map((q, i) => (
          <div className="field" key={i}><label htmlFor={`a${i}`}>{i + 1}. {q}</label><textarea id={`a${i}`} name={`a${i}`} defaultValue={r?.answers?.[i] ?? ""} style={{ minHeight: 70 }} required /></div>
        ))}
        <div className="field" style={{ maxWidth: 220 }}><label htmlFor="minutesWatched">Minutes watched</label><input id="minutesWatched" name="minutesWatched" type="number" min={0} max={180} defaultValue={r?.minutesWatched ?? 40} /></div>
        <button className="btn" type="submit">{r ? "Update answers" : "Submit film study"}</button>
        {r?.coachReply && <div className="alert" style={{ marginTop: 16 }}><b>Coach:</b> {r.coachReply}</div>}
      </form>
    </div>
  );
}

import Link from "next/link";
import { COACH_CALL_URL, contactEmail } from "@/lib/config";

export const metadata = { title: "Privacy" };
export const dynamic = "force-dynamic";

export default function Privacy() {
  const email = contactEmail();
  return (
    <div className="narrow" style={{ paddingTop: 56, paddingBottom: 64 }}>
      <Link href="/" className="eyebrow" style={{ textDecoration: "none" }}>← HPM3 Hoops</Link>
      <h1 style={{ fontSize: 44, marginTop: 18 }}>Privacy</h1>
      <p className="small muted" style={{ marginTop: 8 }}>Last updated October 2, 2026 · HPM3 Hoops is a program of HPM3 LLC.</p>

      <h3 style={{ marginTop: 28 }}>What we collect</h3>
      <p className="muted" style={{ marginTop: 8 }}>The parent&apos;s name and email. The athlete&apos;s name, grade, position, practice days and goals. Training logs, benchmark scores, and any game or drill clips the athlete uploads for feedback.</p>

      <h3 style={{ marginTop: 22 }}>Payments</h3>
      <p className="muted" style={{ marginTop: 8 }}>Card payments are handled by Stripe. We never see or store card numbers.</p>

      <h3 style={{ marginTop: 22 }}>How we use it</h3>
      <p className="muted" style={{ marginTop: 8 }}>To build the athlete&apos;s plan, track progress, give coaching feedback, and email parents and athletes about the program. We do not sell this information or share it with advertisers.</p>

      <h3 style={{ marginTop: 22 }}>Athletes under 18</h3>
      <p className="muted" style={{ marginTop: 8 }}>A parent or guardian enrolls the athlete and is the account contact. A parent can ask to see, correct or delete their athlete&apos;s information at any time.</p>

      <h3 style={{ marginTop: 22 }}>Contact</h3>
      <p className="muted" style={{ marginTop: 8 }}>
        {email ? <>Email <a href={`mailto:${email}`}>{email}</a>, or </> : null}
        <a href={COACH_CALL_URL} target="_blank" rel="noreferrer">{email ? "book a call with a coach" : "Book a call with a coach"}</a>.
      </p>
    </div>
  );
}

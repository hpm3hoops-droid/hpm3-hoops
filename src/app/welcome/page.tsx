import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { recordCheckout } from "@/lib/membership";

export const metadata = { title: "Welcome" };

export default async function Welcome({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  let email: string | null = null;
  // Belt and braces: if the webhook hasn't landed yet, record the membership from the session itself.
  const s = stripe();
  if (s && sp.session_id) {
    try {
      const cs = await s.checkout.sessions.retrieve(sp.session_id);
      if (cs.payment_status === "paid" || cs.status === "complete") {
        email = await recordCheckout(cs);
      }
    } catch (e) { console.error("welcome: retrieve failed", e); }
  }
  return (
    <div className="narrow" style={{ paddingTop: 64, paddingBottom: 64 }}>
      <p className="eyebrow">You&apos;re in</p>
      <h1 style={{ fontSize: 44, marginTop: 10 }}>Welcome to HPM3 Hoops</h1>
      <p className="muted" style={{ marginTop: 14 }}>
        {email ? <>Your membership is active for <b>{email}</b>. </> : null}
        Sign in with that email to set up the athlete&apos;s profile — grade, hoop access, practice days — and Day 1 is ready.
      </p>
      <Link className="btn" href="/login" style={{ marginTop: 24 }}>Sign in to set up</Link>
    </div>
  );
}

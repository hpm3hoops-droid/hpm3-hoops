import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, sendMagicLink } from "@/lib/auth";

export const metadata = { title: "Sign in" };

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "");
  const r = await sendMagicLink(email);
  const q = new URLSearchParams();
  if (!r.ok) q.set("err", r.reason || "Could not send link.");
  else { q.set("sent", "1"); if (r.devLink) q.set("dev", r.devLink); }
  redirect(`/login?${q.toString()}`);
}

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await currentUser();
  if (user) redirect(user.role === "COACH" ? "/coach" : "/app");
  const sp = await searchParams;
  return (
    <div className="narrow" style={{ paddingTop: 64, paddingBottom: 64 }}>
      <Link href="/" className="eyebrow" style={{ textDecoration: "none" }}>← HPM3 Hoops</Link>
      <h1 style={{ fontSize: 44, marginTop: 14 }}>Sign in</h1>
      <p className="muted" style={{ marginTop: 10 }}>No passwords. We email you a link that signs you in.</p>
      {sp.err && <div className="alert err" style={{ marginTop: 20 }}>{sp.err}</div>}
      {sp.sent && (
        <div className="alert ok" style={{ marginTop: 20 }}>
          Check your email for the sign-in link. It expires in 20 minutes.
          {sp.dev && <p style={{ marginTop: 8 }}><span className="pill">dev</span> <a href={sp.dev}>Open magic link</a></p>}
        </div>
      )}
      <form action={login} style={{ marginTop: 24 }}>
        <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required placeholder="athlete or parent email" autoComplete="email" /></div>
        <button className="btn" type="submit">Email me a link</button>
      </form>
      <p className="small muted" style={{ marginTop: 28 }}>Not a member yet? <Link href="/#pricing">Pick a program</Link>.</p>
    </div>
  );
}

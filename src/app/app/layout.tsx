import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAthlete } from "@/lib/auth";
import NavLink from "@/components/NavLink";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { athlete, user } = await requireAthlete();
  if (!athlete.onboarded) redirect("/onboarding");
  const isCoach = user.role === "COACH";
  return (
    <div className="shell">
      <aside className="side">
        <Link className="logo" href="/app">HPM<span>3</span> Hoops</Link>
        <NavLink href="/app" exact>Today</NavLink>
        <NavLink href="/app/benchmarks">Benchmarks</NavLink>
        <NavLink href="/app/film">Film study</NavLink>
        <NavLink href="/app/calls">Calls</NavLink>
        <NavLink href="/app/progress">Progress</NavLink>
        {athlete.tier === "ELITE" && <NavLink href="/app/clips">My clips</NavLink>}
        <NavLink href="/onboarding">Profile</NavLink>
        <div className="spacer" />
        {isCoach && <NavLink href="/coach">Coach view</NavLink>}
        <a className="nav" href="/logout">Sign out</a>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

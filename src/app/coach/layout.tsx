import Link from "next/link";
import { requireCoach } from "@/lib/auth";
import NavLink from "@/components/NavLink";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  await requireCoach();
  return (
    <div className="shell">
      <aside className="side">
        <Link className="logo" href="/coach">HPM<span>3</span> Coach</Link>
        <NavLink href="/coach" exact>Roster</NavLink>
        <NavLink href="/coach/drills">Drill library</NavLink>
        <NavLink href="/coach/film">Film modules</NavLink>
        <NavLink href="/coach/calls">Calls</NavLink>
        <NavLink href="/coach/inbox">Inbox</NavLink>
        <NavLink href="/coach/leads">Requests</NavLink>
        <NavLink href="/coach/settings">Settings</NavLink>
        <div className="spacer" />
        <Link className="nav" href="/">Public site</Link>
        <a className="nav" href="/logout">Sign out</a>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

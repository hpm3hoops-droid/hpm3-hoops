"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, children, exact }: { href: string; children: React.ReactNode; exact?: boolean }) {
  const p = usePathname();
  const on = exact ? p === href : p === href || p.startsWith(href + "/");
  return <Link className={`nav ${on ? "on" : ""}`} href={href}>{children}</Link>;
}

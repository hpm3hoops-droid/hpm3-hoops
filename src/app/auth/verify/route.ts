import { NextRequest, NextResponse } from "next/server";
import { consumeMagicToken, createSession } from "@/lib/auth";
import { db, athletes } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const user = await consumeMagicToken(token);
  const base = process.env.APP_URL || req.nextUrl.origin;
  if (!user) return NextResponse.redirect(`${base}/login?err=${encodeURIComponent("That link is expired or already used. Request a new one.")}`);
  await createSession(user.id);
  if (user.role === "COACH") return NextResponse.redirect(`${base}/coach`);
  const [a] = await db.select().from(athletes).where(eq(athletes.userId, user.id));
  return NextResponse.redirect(`${base}${a?.onboarded ? "/app" : "/onboarding"}`);
}

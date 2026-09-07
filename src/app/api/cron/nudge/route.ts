import { NextRequest, NextResponse } from "next/server";
import { runNudges } from "@/lib/nudge";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const key = req.nextUrl.searchParams.get("key") || "";
  const secret = process.env.CRON_SECRET;
  if (!secret || (auth !== `Bearer ${secret}` && key !== secret)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const summary = await runNudges();
  return NextResponse.json({ ok: true, summary });
}
export const POST = GET;

import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await clearSession();
  return NextResponse.redirect(`${process.env.APP_URL || req.nextUrl.origin}/`);
}
export const POST = GET;

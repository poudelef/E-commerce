import { NextResponse } from "next/server";
import { cookieIsSecure, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth-token";

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(cookieIsSecure(request)), maxAge: 0 });
  return response;
}

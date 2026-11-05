import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth-token";
import { clearLoginFailures, loginBlocked, recordLoginFailure } from "@/lib/rate-limit";
import { loginSchema, zodError } from "@/lib/validators";
import { errorResponse, readJson } from "@/lib/api";

export const dynamic = "force-dynamic";

let dummyHash: Promise<string> | null = null;

function placeholderHash() {
  dummyHash ??= bcrypt.hash("invalid-password", 12);
  return dummyHash;
}

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: zodError(parsed.error) }, { status: 400 });
    }
    const email = parsed.data.email.toLowerCase();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const emailKey = `email:${email}`;
    const ipKey = `ip:${ip}`;
    const emailLimit = loginBlocked(emailKey);
    const ipLimit = loginBlocked(ipKey);
    if (emailLimit.blocked || ipLimit.blocked) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Try again in 15 minutes." },
        { status: 429, headers: { "Retry-After": String(emailLimit.retryAfter || ipLimit.retryAfter || 900) } },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? (await placeholderHash()));
    if (!user || !ok) {
      recordLoginFailure(emailKey);
      recordLoginFailure(ipKey);
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    clearLoginFailures(emailKey);
    clearLoginFailures(ipKey);
    const token = await signSession({ sub: user.id, email: user.email, name: user.name });
    const response = NextResponse.json({ ok: true, name: user.name, email: user.email });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

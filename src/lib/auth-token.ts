import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "lks_session";
export const SESSION_MAX_AGE = 60 * 60 * 12;

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error("AUTH_SECRET must be set to a long random string");
  }
  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());
}

export async function readSession(token: string) {
  const { payload } = await jwtVerify(token, secret());
  if (!payload.sub || typeof payload.email !== "string") return null;
  return {
    id: payload.sub,
    email: payload.email,
    name: typeof payload.name === "string" ? payload.name : "Owner",
  };
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

import "server-only";
import { cookies } from "next/headers";
import { readSession, SESSION_COOKIE } from "./auth-token";

export async function getSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await readSession(token);
  } catch {
    return null;
  }
}

import "server-only";
import { NextResponse } from "next/server";
import { getSession } from "./auth";
import { HttpError } from "./http";

export async function requireOwner() {
  const session = await getSession();
  if (!session) throw new HttpError("Unauthorized", 401);
  return session;
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError("Invalid JSON.");
  }
}

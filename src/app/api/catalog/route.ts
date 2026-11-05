import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { errorResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getCatalog());
  } catch (error) {
    return errorResponse(error);
  }
}

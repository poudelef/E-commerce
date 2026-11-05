import { NextResponse } from "next/server";
import { errorResponse, requireOwner } from "@/lib/api";
import { getDashboardStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireOwner();
    return NextResponse.json(await getDashboardStats());
  } catch (error) {
    return errorResponse(error);
  }
}

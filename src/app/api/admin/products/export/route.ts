import { NextResponse } from "next/server";
import { errorResponse, requireOwner } from "@/lib/api";
import { exportProductsCsv } from "@/lib/product-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireOwner();
    const csv = await exportProductsCsv();
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=laxmi-kirana-products.csv",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

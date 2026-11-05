import { NextResponse } from "next/server";
import { errorResponse, requireOwner } from "@/lib/api";
import { importProductsCsv } from "@/lib/product-admin";
import { HttpError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOwner();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError("Choose a CSV file.");
    if (file.size > 1_000_000) throw new HttpError("CSV must be under 1 MB.");
    const result = await importProductsCsv(await file.text());
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

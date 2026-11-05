import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublicSettings } from "@/lib/settings";
import { buildSlots } from "@/lib/slots";
import { errorResponse } from "@/lib/api";
import { HttpError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const date = new URL(request.url).searchParams.get("date") ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError("Choose a valid date.");
    const row = await prisma.storeSettings.findUnique({ where: { id: "default" } });
    if (!row) throw new HttpError("Store settings are missing.", 500);
    const settings = toPublicSettings(row);
    return NextResponse.json({
      date,
      slots: buildSlots(date, settings),
      leadTimeMinutes: settings.leadTimeMinutes,
      timezone: settings.timezone,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

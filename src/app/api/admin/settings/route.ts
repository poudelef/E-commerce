import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, readJson, requireOwner } from "@/lib/api";
import { toPublicSettings } from "@/lib/settings";
import { settingsSchema, zodError } from "@/lib/validators";
import { HttpError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireOwner();
    const row = await prisma.storeSettings.findUnique({ where: { id: "default" } });
    if (!row) throw new HttpError("Store settings are missing.", 500);
    return NextResponse.json({ settings: toPublicSettings(row) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireOwner();
    const parsed = settingsSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: zodError(parsed.error) }, { status: 400 });
    }
    const data = parsed.data;
    const row = await prisma.storeSettings.update({
      where: { id: "default" },
      data: {
        storeName: data.storeName,
        address: data.address,
        phone: data.phone,
        email: data.email,
        hoursJson: JSON.stringify(data.hours),
        leadTimeMinutes: data.leadTimeMinutes,
        slotMinutes: data.slotMinutes,
        taxEnabled: data.taxEnabled,
        taxBps: data.taxBps,
        timezone: data.timezone,
      },
    });
    return NextResponse.json({ settings: toPublicSettings(row) });
  } catch (error) {
    return errorResponse(error);
  }
}

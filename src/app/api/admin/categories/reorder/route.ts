import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorResponse, readJson, requireOwner } from "@/lib/api";
import { zodError } from "@/lib/validators";

const schema = z.object({ ids: z.array(z.string().min(1)).min(1).max(100) });

export async function POST(request: Request) {
  try {
    await requireOwner();
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return NextResponse.json({ error: zodError(parsed.error) }, { status: 400 });
    await prisma.$transaction(
      parsed.data.ids.map((id, sortOrder) => prisma.category.update({ where: { id }, data: { sortOrder } })),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

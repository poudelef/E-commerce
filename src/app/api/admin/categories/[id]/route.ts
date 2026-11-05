import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, readJson, requireOwner } from "@/lib/api";
import { uniqueSlug } from "@/lib/product-admin";
import { HttpError } from "@/lib/http";
import { categorySchema, zodError } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    await requireOwner();
    const { id } = await context.params;
    const parsed = categorySchema.safeParse(await readJson(request));
    if (!parsed.success) return NextResponse.json({ error: zodError(parsed.error) }, { status: 400 });
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new HttpError("Category not found.", 404);
    const category = await prisma.category.update({
      where: { id },
      data: { name: parsed.data.name, slug: await uniqueSlug(parsed.data.name, "category", id) },
    });
    return NextResponse.json({ category });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    await requireOwner();
    const { id } = await context.params;
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) throw new HttpError("Move or delete the products in this category first.");
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

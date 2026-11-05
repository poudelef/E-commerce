import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, readJson, requireOwner } from "@/lib/api";
import { bulkProductSchema, zodError } from "@/lib/validators";
import { HttpError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOwner();
    const parsed = bulkProductSchema.safeParse(await readJson(request));
    if (!parsed.success) return NextResponse.json({ error: zodError(parsed.error) }, { status: 400 });
    const { ids, action, categoryId } = parsed.data;
    if (action === "delete") {
      const result = await prisma.product.deleteMany({ where: { id: { in: ids } } });
      return NextResponse.json({ count: result.count });
    }
    if (action === "category") {
      if (!categoryId) throw new HttpError("Choose a category.");
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) throw new HttpError("Category not found.", 404);
      const result = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { categoryId } });
      return NextResponse.json({ count: result.count });
    }
    const result = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { active: action === "show" },
    });
    return NextResponse.json({ count: result.count });
  } catch (error) {
    return errorResponse(error);
  }
}

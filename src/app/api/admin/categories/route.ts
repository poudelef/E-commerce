import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, readJson, requireOwner } from "@/lib/api";
import { uniqueSlug } from "@/lib/product-admin";
import { categorySchema, zodError } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireOwner();
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json({
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
        productCount: category._count.products,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireOwner();
    const parsed = categorySchema.safeParse(await readJson(request));
    if (!parsed.success) return NextResponse.json({ error: zodError(parsed.error) }, { status: 400 });
    const sortOrder = await prisma.category.count();
    const category = await prisma.category.create({
      data: { name: parsed.data.name, slug: await uniqueSlug(parsed.data.name, "category"), sortOrder },
    });
    return NextResponse.json({ category: { ...category, productCount: 0 } }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

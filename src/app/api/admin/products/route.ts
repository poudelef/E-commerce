import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/catalog";
import { errorResponse, readJson, requireOwner } from "@/lib/api";
import { cleanImage, uniqueSlug } from "@/lib/product-admin";
import { rupeesToPaise } from "@/lib/format";
import { productSchema, zodError } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireOwner();
    const [products, categories] = await Promise.all([
      prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
      prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    ]);
    return NextResponse.json({
      products: products.map(serializeProduct),
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireOwner();
    const parsed = productSchema.safeParse(await readJson(request));
    if (!parsed.success) return NextResponse.json({ error: zodError(parsed.error) }, { status: 400 });
    const data = parsed.data;
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: await uniqueSlug(`${data.name} ${data.unit}`, "product"),
        description: data.description,
        categoryId: data.categoryId,
        price: rupeesToPaise(data.priceRupees),
        unit: data.unit,
        stock: data.stock,
        lowStockThreshold: data.lowStockThreshold,
        image: cleanImage(data.image),
        keywords: data.keywords,
        active: data.active,
      },
      include: { category: true },
    });
    return NextResponse.json({ product: serializeProduct(product) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

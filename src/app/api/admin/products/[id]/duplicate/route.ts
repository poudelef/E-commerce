import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/catalog";
import { errorResponse, requireOwner } from "@/lib/api";
import { uniqueSlug } from "@/lib/product-admin";
import { HttpError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireOwner();
    const { id } = await context.params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new HttpError("Product not found.", 404);
    const name = `${product.name} (Copy)`.slice(0, 120);
    const copy = await prisma.product.create({
      data: {
        name,
        slug: await uniqueSlug(`${name} ${product.unit}`, "product"),
        description: product.description,
        categoryId: product.categoryId,
        price: product.price,
        unit: product.unit,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        image: product.image,
        keywords: product.keywords,
        active: false,
      },
      include: { category: true },
    });
    return NextResponse.json({ product: serializeProduct(copy) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

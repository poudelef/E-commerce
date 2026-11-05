import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/catalog";
import { errorResponse, readJson, requireOwner } from "@/lib/api";
import { cleanImage, uniqueSlug } from "@/lib/product-admin";
import { rupeesToPaise } from "@/lib/format";
import { HttpError } from "@/lib/http";
import { productSchema, zodError } from "@/lib/validators";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  priceRupees: z.number().positive().max(100000).optional(),
  stock: z.number().int().min(0).max(100000).optional(),
  active: z.boolean().optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    await requireOwner();
    const { id } = await context.params;
    const body = await readJson(request);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new HttpError("Product not found.", 404);

    if (body && typeof body === "object" && "name" in body) {
      const parsed = productSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: zodError(parsed.error) }, { status: 400 });
      const data = parsed.data;
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new HttpError("Choose a valid category.");
      const product = await prisma.product.update({
        where: { id },
        data: {
          name: data.name,
          slug: await uniqueSlug(`${data.name} ${data.unit}`, "product", id),
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
      return NextResponse.json({ product: serializeProduct(product) });
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: parsed.success ? "Nothing to update." : zodError(parsed.error) }, { status: 400 });
    }
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(parsed.data.priceRupees !== undefined ? { price: rupeesToPaise(parsed.data.priceRupees) } : {}),
        ...(parsed.data.stock !== undefined ? { stock: parsed.data.stock } : {}),
        ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
      },
      include: { category: true },
    });
    return NextResponse.json({ product: serializeProduct(product) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    await requireOwner();
    const { id } = await context.params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

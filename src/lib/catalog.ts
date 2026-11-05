import "server-only";
import { prisma } from "./prisma";
import { toPublicSettings } from "./settings";
import type { Catalog, ProductDTO } from "./types";

export function serializeProduct(product: {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  lowStockThreshold: number;
  image: string;
  keywords: string;
  categoryId: string;
  active: boolean;
  category: { name: string; slug: string };
}): ProductDTO {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    unit: product.unit,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    image: product.image,
    keywords: product.keywords,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    active: product.active,
  };
}

export async function getCatalog(): Promise<Catalog> {
  const [categories, products, settings] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.product.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.storeSettings.findUnique({ where: { id: "default" } }),
  ]);

  if (!settings) {
    throw new Error("Store settings are missing. Run npm run setup.");
  }

  return {
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      sortOrder: category.sortOrder,
    })),
    products: products.map(serializeProduct),
    settings: toPublicSettings(settings),
  };
}

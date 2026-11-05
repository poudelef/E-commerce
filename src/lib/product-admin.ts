import "server-only";
import { prisma } from "./prisma";
import { HttpError } from "./http";
import { slugify } from "./slug";
import { headerIndex, parseCsv, toCsv } from "./csv";
import { rupeesToPaise } from "./format";

export function cleanImage(image: string) {
  if (!image) return "";
  if (!/^\/(uploads|products)\/[A-Za-z0-9._-]+$/.test(image)) {
    throw new HttpError("Upload an image before saving.");
  }
  return image;
}

export async function uniqueSlug(source: string, table: "product" | "category", excludeId?: string) {
  const base = slugify(source);
  let slug = base;
  let count = 2;
  while (count < 500) {
    const existing =
      table === "product"
        ? await prisma.product.findUnique({ where: { slug } })
        : await prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${count}`;
    count += 1;
  }
  throw new HttpError("Could not create a unique name.");
}

export async function exportProductsCsv() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });
  return toCsv(
    ["name", "description", "category", "price", "unit", "stock", "lowStockThreshold", "keywords", "active", "image"],
    products.map((product) => [
      product.name,
      product.description,
      product.category.name,
      (product.price / 100).toFixed(2),
      product.unit,
      product.stock,
      product.lowStockThreshold,
      product.keywords,
      product.active ? "true" : "false",
      product.image,
    ]),
  );
}

export async function importProductsCsv(text: string) {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new HttpError("The CSV needs a header row and at least one product.");
  const headers = headerIndex(rows[0]);
  for (const required of ["name", "price", "unit", "category"]) {
    if (!headers.has(required)) throw new HttpError(`Missing the ${required} column.`);
  }

  const cell = (row: string[], key: string) => {
    const index = headers.get(key);
    return index === undefined ? "" : (row[index] ?? "").trim();
  };

  let created = 0;
  let updated = 0;
  const failed: { row: number; error: string }[] = [];

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    try {
      const name = cell(row, "name").replace(/^'/, "");
      const price = Number(cell(row, "price").replace(/^'/, ""));
      const unit = cell(row, "unit");
      const categoryName = cell(row, "category");
      if (name.length < 2 || !unit || !categoryName || !Number.isFinite(price) || price <= 0) {
        throw new Error("Name, category, unit, and a price are required.");
      }
      const category = await findOrCreateCategory(categoryName);
      const stock = Number(cell(row, "stock") || "0");
      const low = Number(cell(row, "lowstockthreshold") || cell(row, "low_stock_threshold") || "5");
      const activeRaw = cell(row, "active").toLowerCase();
      const active = activeRaw ? !["false", "0", "no", "hidden"].includes(activeRaw) : true;
      const description = cell(row, "description");
      const keywords = cell(row, "keywords");
      const image = cell(row, "image");
      if (image && !/^\/(uploads|products)\/[A-Za-z0-9._-]+$/.test(image)) {
        throw new Error("Image must be an uploaded store path.");
      }
      const slug = await uniqueSlug(`${name} ${unit}`, "product");
      const existing = await prisma.product.findFirst({
        where: { name, unit, categoryId: category.id },
      });
      const data = {
        name,
        description,
        categoryId: category.id,
        price: rupeesToPaise(price),
        unit,
        stock: Number.isFinite(stock) ? Math.max(0, Math.round(stock)) : 0,
        lowStockThreshold: Number.isFinite(low) ? Math.max(0, Math.round(low)) : 5,
        keywords,
        active,
        image,
      };
      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data });
        updated += 1;
      } else {
        await prisma.product.create({ data: { ...data, slug } });
        created += 1;
      }
    } catch (error) {
      failed.push({ row: index + 1, error: error instanceof Error ? error.message : "Could not import this row." });
    }
  }

  return { created, updated, failed };
}

async function findOrCreateCategory(name: string) {
  const existing = await prisma.category.findFirst({ where: { name } });
  if (existing) return existing;
  const sortOrder = await prisma.category.count();
  return prisma.category.create({
    data: { name, slug: await uniqueSlug(name, "category"), sortOrder },
  });
}

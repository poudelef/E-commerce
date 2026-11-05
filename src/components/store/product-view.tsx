"use client";

import Link from "next/link";
import { ProductCard, ProductImage, QuantityStepper, StockBadge } from "@/components/store/product-card";
import { useCart, useCatalog } from "@/components/store/providers";
import { formatINR } from "@/lib/format";

export function ProductView({ slug }: { slug: string }) {
  const { products } = useCatalog();
  const { add, lines, setQuantity } = useCart();
  const product = products.find((item) => item.slug === slug);
  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold">Product not available</h1>
        <Link href="/" className="mt-4 inline-flex font-bold text-accent-text">
          Back to shop
        </Link>
      </div>
    );
  }
  const quantity = lines.find((line) => line.productId === product.id)?.quantity ?? 0;
  const related = products.filter((item) => item.categoryId === product.categoryId && item.id !== product.id).slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <nav className="mb-4 text-sm text-muted">
        <Link href="/" className="font-semibold text-accent-text">
          Shop
        </Link>
        <span> / {product.categoryName}</span>
      </nav>
      <div className="grid gap-6 rounded-card bg-card p-4 shadow-card md:grid-cols-2 md:p-6">
        <ProductImage src={product.image} alt={`${product.name}, ${product.unit}`} className="aspect-square w-full rounded-card" />
        <div>
          <p className="text-sm font-semibold text-accent-text">{product.categoryName}</p>
          <h1 className="mt-1 text-3xl font-extrabold leading-tight">{product.name}</h1>
          <p className="mt-2 text-muted">{product.unit}</p>
          <p className="mt-4 text-3xl font-extrabold text-primary">{formatINR(product.price)}</p>
          <div className="mt-3">
            <StockBadge stock={product.stock} lowStockThreshold={product.lowStockThreshold} />
          </div>
          <p className="mt-4 leading-6 text-ink">{product.description}</p>
          <div className="mt-6 max-w-xs">
            {quantity > 0 ? (
              <QuantityStepper
                value={quantity}
                label={product.name}
                disableIncrease={quantity >= product.stock}
                onDecrease={() => setQuantity(product.id, quantity - 1)}
                onIncrease={() => setQuantity(product.id, quantity + 1)}
              />
            ) : (
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => add(product)}
                className="h-12 w-full rounded-full bg-primary text-sm font-bold text-white hover:bg-secondary hover:text-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
              >
                {product.stock <= 0 ? "Out of stock" : "Add to cart"}
              </button>
            )}
          </div>
        </div>
      </div>
      {related.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-extrabold">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} quantity={lines.find((line) => line.productId === item.id)?.quantity ?? 0} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { useCart } from "@/components/store/providers";
import { formatINR, stockLabel, stockLevel } from "@/lib/format";
import type { ProductDTO } from "@/lib/types";

export function ProductImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className={`grid place-items-center bg-background text-3xl font-extrabold text-primary ${className ?? ""}`}>{alt.slice(0, 1)}</div>;
  }
  return <img src={src} alt={alt} className={`bg-background object-contain ${className ?? ""}`} onError={() => setFailed(true)} />;
}

export function QuantityStepper({
  value,
  onDecrease,
  onIncrease,
  disableIncrease,
  label,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  disableIncrease?: boolean;
  label: string;
}) {
  return (
    <div className="flex h-10 items-center justify-between rounded-full bg-secondary text-ink" role="group" aria-label={label}>
      <button type="button" className="grid h-10 w-10 place-items-center rounded-full hover:brightness-95" aria-label={`Decrease ${label}`} onClick={onDecrease}>
        <Icon name="minus" className="h-4 w-4" />
      </button>
      <span className="min-w-6 text-center text-sm font-extrabold" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-full hover:brightness-95 disabled:opacity-40"
        aria-label={`Increase ${label}`}
        onClick={onIncrease}
        disabled={disableIncrease}
      >
        <Icon name="plus" className="h-4 w-4" />
      </button>
    </div>
  );
}

export function StockBadge({ stock, lowStockThreshold }: { stock: number; lowStockThreshold: number }) {
  const level = stockLevel(stock, lowStockThreshold);
  const className =
    level === "in" ? "bg-accent text-ink" : level === "low" ? "bg-secondary text-ink" : "bg-[#E7E0D2] text-muted";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${className}`}>{stockLabel(level)}</span>;
}

export function ProductCard({ product, quantity }: { product: ProductDTO; quantity: number }) {
  const { add, setQuantity } = useCart();
  const out = product.stock <= 0;
  return (
    <article className={`flex h-full flex-col overflow-hidden rounded-card bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-pop ${out ? "opacity-70" : ""}`}>
      <Link href={`/product/${product.slug}`} className="block">
        <ProductImage src={product.image} alt={`${product.name}, ${product.unit}`} className="aspect-square w-full" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-h-[2.6rem]">
          <Link href={`/product/${product.slug}`} className="line-clamp-2 text-sm font-semibold leading-5 hover:text-primary">
            {product.name}
          </Link>
        </div>
        <p className="text-xs text-muted">{product.unit}</p>
        <div className="mt-auto flex items-center justify-between gap-2">
          <p className="text-base font-extrabold text-primary">{formatINR(product.price)}</p>
          <StockBadge stock={product.stock} lowStockThreshold={product.lowStockThreshold} />
        </div>
        {quantity > 0 ? (
          <QuantityStepper
            value={quantity}
            label={`${product.name} quantity`}
            disableIncrease={quantity >= product.stock}
            onDecrease={() => setQuantity(product.id, quantity - 1)}
            onIncrease={() => setQuantity(product.id, quantity + 1)}
          />
        ) : (
          <button
            type="button"
            disabled={out}
            onClick={() => add(product)}
            className="h-10 rounded-full bg-secondary text-sm font-extrabold text-ink transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
          >
            {out ? "Out of stock" : "Add"}
          </button>
        )}
      </div>
    </article>
  );
}

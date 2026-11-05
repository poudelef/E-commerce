"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { ProductImage, QuantityStepper } from "@/components/store/product-card";
import { useCart, useCatalog, useResolvedCart } from "@/components/store/providers";
import { formatINR, formatTaxPercent, plural, quoteTotals } from "@/lib/format";
import { useState } from "react";

export function cartIssues(lines: ReturnType<typeof useResolvedCart>["lines"]) {
  return lines.flatMap((line) => {
    if (!line.product || !line.product.active) return ["An item in your cart is no longer available."];
    if (line.product.stock <= 0) return [`${line.product.name} is out of stock.`];
    if (line.quantity > line.product.stock) return [`Only ${line.product.stock} ${line.product.name} left.`];
    return [];
  });
}

export function CartContents({ onNavigate }: { onNavigate?: () => void }) {
  const { settings } = useCatalog();
  const { setQuantity, remove, clear } = useCart();
  const { lines, ready } = useResolvedCart();
  const [confirmClear, setConfirmClear] = useState(false);
  const issues = cartIssues(lines);
  const subtotal = lines.reduce((sum, line) => {
    if (!line.product || line.quantity > line.product.stock) return sum;
    return sum + line.product.price * line.quantity;
  }, 0);
  const totals = quoteTotals(subtotal, settings);

  if (!ready) return <div className="skeleton h-40 rounded-card" />;

  if (lines.length === 0) {
    return (
      <div className="rounded-card bg-card p-8 text-center shadow-card">
        <p className="text-lg font-extrabold">Your cart is empty</p>
        <p className="mt-2 text-sm text-muted">Add rice, dal, snacks, and daily essentials.</p>
        <Link href="/" onClick={onNavigate} className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-secondary hover:text-ink">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {lines.map((line) => {
          const product = line.product;
          return (
            <li key={line.productId} className="flex gap-3 rounded-card bg-card p-3 shadow-card">
              {product ? (
                <ProductImage src={product.image} alt="" className="h-20 w-20 shrink-0 rounded-xl" />
              ) : (
                <div className="h-20 w-20 shrink-0 rounded-xl bg-background" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold leading-5">{product?.name ?? "Unavailable item"}</p>
                    <p className="text-xs text-muted">{product ? `${product.unit} · ${formatINR(product.price)}` : "Remove this item to continue"}</p>
                  </div>
                  <button type="button" className="grid h-9 w-9 place-items-center rounded-full text-primary hover:bg-background" aria-label={`Remove ${product?.name ?? "item"}`} onClick={() => remove(line.productId)}>
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  {product ? (
                    <div className="w-32">
                      <QuantityStepper
                        value={line.quantity}
                        label={product.name}
                        disableIncrease={line.quantity >= product.stock}
                        onDecrease={() => setQuantity(product.id, line.quantity - 1)}
                        onIncrease={() => setQuantity(product.id, line.quantity + 1)}
                      />
                    </div>
                  ) : null}
                  <p className="font-extrabold text-primary">{product ? formatINR(product.price * Math.min(line.quantity, product.stock)) : "—"}</p>
                </div>
                {product && line.quantity > product.stock ? (
                  <p className="mt-2 text-sm font-semibold text-primary">Only {product.stock} left. Lower the quantity to check out.</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {issues.length > 0 ? (
        <div className="rounded-card bg-[#F3D6D2] px-4 py-3 text-sm font-semibold" role="alert">
          {issues[0]}
        </div>
      ) : null}

      <div className="rounded-card bg-card p-4 shadow-card">
        <div className="flex justify-between text-sm">
          <span>Subtotal · {plural(lines.reduce((sum, line) => sum + line.quantity, 0), "item")}</span>
          <span className="font-semibold">{formatINR(totals.subtotal)}</span>
        </div>
        {settings.taxEnabled ? (
          <div className="mt-2 flex justify-between text-sm">
            <span>Tax ({formatTaxPercent(settings.taxBps)})</span>
            <span className="font-semibold">{formatINR(totals.tax)}</span>
          </div>
        ) : null}
        <div className="mt-3 flex justify-between border-t border-line pt-3 text-lg font-extrabold">
          <span>Estimated total</span>
          <span className="text-primary">{formatINR(totals.total)}</span>
        </div>
        <p className="mt-2 text-xs text-muted">Pay at the store during pickup. No delivery charge.</p>
        <Link
          href="/checkout"
          aria-disabled={issues.length > 0}
          onClick={(event) => {
            if (issues.length > 0) event.preventDefault();
            else onNavigate?.();
          }}
          className={`mt-4 flex h-11 items-center justify-center rounded-full text-sm font-bold ${issues.length ? "pointer-events-none bg-line text-muted" : "bg-primary text-white hover:bg-secondary hover:text-ink"}`}
        >
          Checkout
        </Link>
        {confirmClear ? (
          <div className="mt-3 flex items-center justify-between gap-2 text-sm">
            <span>Clear all items?</span>
            <span className="flex gap-2">
              <button type="button" className="font-semibold text-muted" onClick={() => setConfirmClear(false)}>
                Keep
              </button>
              <button
                type="button"
                className="font-bold text-primary"
                onClick={() => {
                  clear();
                  setConfirmClear(false);
                }}
              >
                Clear cart
              </button>
            </span>
          </div>
        ) : (
          <button type="button" className="mt-3 text-sm font-semibold text-muted underline" onClick={() => setConfirmClear(true)}>
            Clear cart
          </button>
        )}
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { drawerOpen, setDrawerOpen, count } = useCart();
  if (!drawerOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] hidden md:block">
      <button type="button" className="absolute inset-0 z-0 bg-ink/40" aria-label="Close cart" onClick={() => setDrawerOpen(false)} />
      <aside className="absolute right-0 top-0 z-10 flex h-full w-full max-w-md flex-col bg-background shadow-pop" role="dialog" aria-modal="true" aria-label="Cart">
        <div className="flex items-center justify-between bg-primary px-4 py-4 text-white">
          <h2 className="text-lg font-extrabold">Cart ({count})</h2>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-white/15" aria-label="Close cart" onClick={() => setDrawerOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <CartContents onNavigate={() => setDrawerOpen(false)} />
        </div>
      </aside>
    </div>
  );
}

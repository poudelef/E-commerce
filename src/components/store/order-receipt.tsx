"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart, useCatalog } from "@/components/store/providers";
import { Field, fieldClass, primaryButton, quietButton, StatusPill, useToast } from "@/components/ui";
import { api, LAST_ORDER_KEY } from "@/lib/client";
import { formatINR, formatTaxPercent } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { formatDateLabel, formatSlotLabel } from "@/lib/time";
import type { OrderDTO } from "@/lib/types";

export function OrderReceipt({ order, confirmation = false }: { order: OrderDTO; confirmation?: boolean }) {
  const { settings, products } = useCatalog();
  const { add } = useCart();
  const push = useToast();
  const router = useRouter();

  function orderAgain() {
    let skipped = 0;
    for (const item of order.items) {
      const product = item.productId ? products.find((entry) => entry.id === item.productId && entry.active) : null;
      if (!product || product.stock <= 0 || item.unavailable) {
        skipped += 1;
        continue;
      }
      add(product, Math.min(item.quantity, product.stock));
    }
    push(skipped ? `Added the available items. ${skipped} could not be added.` : "Items added to your cart");
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-card bg-card p-6 shadow-card">
        {confirmation ? <p className="text-sm font-bold uppercase tracking-wide text-accent-text">Order placed</p> : null}
        <h1 className="mt-1 text-3xl font-extrabold text-primary">{order.orderNumber}</h1>
        <div className="mt-3">
          <StatusPill status={order.status} />
        </div>
        <p className="mt-4 text-lg font-semibold">Pickup at {settings.storeName}</p>
        <p className="text-sm text-muted">{settings.address}</p>
        <a className="text-sm font-semibold text-accent-text" href={`tel:${settings.phone.replace(/\s/g, "")}`}>{settings.phone}</a>
        <p className="mt-4 rounded-xl bg-background px-3 py-3 font-semibold">
          Needed by {formatDateLabel(order.pickupDate)} · {formatSlotLabel(order.pickupSlotStart, order.pickupSlotEnd)}
        </p>
        <p className="mt-3 text-sm font-semibold">Pay at the store during pickup.</p>
        <dl className="mt-4 grid gap-1 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-muted">Name</dt><dd>{order.customerName}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">Phone</dt><dd>{formatPhone(order.phone)}</dd></div>
          {order.notes ? <div><dt className="text-muted">Notes</dt><dd className="font-semibold">{order.notes}</dd></div> : null}
        </dl>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 py-2 text-sm">
              <span className={item.unavailable ? "line-through" : ""}>
                {item.name} · {item.unit} × {item.quantity}
                {item.unavailable ? " (unavailable)" : ""}
              </span>
              <span>{item.unavailable ? "—" : formatINR(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
          {order.tax > 0 ? <div className="flex justify-between"><span>Tax {settings.taxEnabled ? `(${formatTaxPercent(settings.taxBps)})` : ""}</span><span>{formatINR(order.tax)}</span></div> : null}
          <div className="mt-1 flex justify-between text-lg font-extrabold"><span>Estimated total</span><span className="text-primary">{formatINR(order.total)}</span></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className={primaryButton} onClick={orderAgain}>Order again</button>
          <Link href="/" className={quietButton}>Keep shopping</Link>
          <Link href="/order/lookup" className={quietButton}>Find another order</Link>
        </div>
      </div>
    </div>
  );
}

export function OrderLookupForm({ initialOrder = null }: { initialOrder?: OrderDTO | null }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<OrderDTO | null>(initialOrder);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api<{ order: OrderDTO }>("/api/orders/lookup", {
        method: "POST",
        body: JSON.stringify({ orderNumber, phone }),
      });
      setOrder(result.order);
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(result.order));
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : "Order not found.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="mx-auto mt-8 max-w-lg space-y-4 rounded-card bg-card p-5 shadow-card">
        <h1 className="text-2xl font-extrabold">Find your order</h1>
        <p className="text-sm text-muted">Use the order number and the phone number from checkout. No account needed.</p>
        <Field label="Order number">
          <input className={fieldClass} value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="LKS-000123" required />
        </Field>
        <Field label="Phone number">
          <input className={fieldClass} value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" required />
        </Field>
        {error ? <p className="text-sm font-semibold text-primary" role="alert">{error}</p> : null}
        <button className={primaryButton} disabled={loading} type="submit">{loading ? "Looking up..." : "Look up order"}</button>
      </form>
      {order ? <OrderReceipt order={order} /> : null}
    </div>
  );
}

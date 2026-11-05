"use client";

import Link from "next/link";
import { formatINR } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { STATUS_LABEL, isOrderStatus } from "@/lib/status";
import { formatDateLabel, formatDateTime, formatSlotLabel } from "@/lib/time";
import type { OrderDTO, PublicSettings } from "@/lib/types";

export function PrintBar({ backHref }: { backHref: string }) {
  return (
    <div className="no-print mb-4 flex gap-2">
      <Link href={backHref} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold">
        Back
      </Link>
      <button type="button" onClick={() => window.print()} className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white">
        Print
      </button>
    </div>
  );
}

export function PackingSlips({ orders, settings }: { orders: OrderDTO[]; settings: PublicSettings }) {
  if (orders.length === 0) {
    return <p className="rounded-card bg-white p-6">No orders to print for this view.</p>;
  }
  return (
    <div>
      {orders.map((order) => (
        <article key={order.id} className="print-sheet mb-8 rounded-card border border-ink bg-white p-6 text-ink">
          <header className="flex items-start justify-between gap-4 border-b border-ink pb-3">
            <div>
              <h1 className="text-2xl font-extrabold">{settings.storeName}</h1>
              <p className="text-sm">{settings.address}</p>
              <p className="text-sm">{settings.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-extrabold">{order.orderNumber}</p>
              <p className="text-sm">Pickup</p>
              <p className="font-bold">{formatDateLabel(order.pickupDate)}</p>
              <p className="font-bold">{formatSlotLabel(order.pickupSlotStart, order.pickupSlotEnd)}</p>
              <p className="text-sm">{isOrderStatus(order.status) ? STATUS_LABEL[order.status] : order.status}</p>
            </div>
          </header>
          <section className="mt-3 text-sm">
            <p className="font-bold">{order.customerName}</p>
            <p>{formatPhone(order.phone)}</p>
            <p className="text-muted">Placed {formatDateTime(order.createdAt, settings.timezone)}</p>
            {order.notes ? <p className="mt-2 border border-ink p-2 font-semibold">Note: {order.notes}</p> : null}
          </section>
          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink text-left">
                <th className="py-2">Pick</th>
                <th>Item</th>
                <th>Unit</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-line">
                  <td className="py-2"><span className="inline-block h-4 w-4 border border-ink" /></td>
                  <td className={item.unavailable ? "line-through" : ""}>
                    {item.name}
                    {item.unavailable ? " — UNAVAILABLE" : ""}
                  </td>
                  <td>{item.unit}</td>
                  <td className="font-bold">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 font-bold">Pay at pickup · {formatINR(order.total)}</p>
        </article>
      ))}
    </div>
  );
}

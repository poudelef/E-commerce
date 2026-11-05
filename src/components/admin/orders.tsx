"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { formatINR } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { NEXT_LABEL, NEXT_STATUS, ORDER_STATUSES, STATUS_LABEL, isOrderStatus, type OrderStatus } from "@/lib/status";
import { formatDateLabel, formatDateTime, formatSlotLabel } from "@/lib/time";
import type { OrderDTO, OrderListItem } from "@/lib/types";
import { fieldClass, primaryButton, quietButton, StatusPill, useToast } from "@/components/ui";

type ListResponse = { orders: OrderListItem[]; today: string; tomorrow: string; timezone: string };

export function OrdersBoard() {
  const [tab, setTab] = useState<"today" | "tomorrow" | "upcoming" | "all">("today");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("needed");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState("");
  const push = useToast();

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(q), 300);
    return () => window.clearTimeout(id);
  }, [q]);

  useEffect(() => {
    let stop = false;
    async function load() {
      const params = new URLSearchParams({ tab, status, sort, q: debounced, from, to });
      try {
        const next = await api<ListResponse>(`/api/admin/orders?${params.toString()}`, { cache: "no-store" });
        if (!stop) {
          setData(next);
          setError("");
        }
      } catch (err) {
        if (!stop) setError(err instanceof Error ? err.message : "Could not load orders.");
      }
    }
    void load();
    const id = window.setInterval(() => void load(), 20_000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [tab, status, sort, debounced, from, to]);

  async function advance(order: OrderListItem) {
    if (!isOrderStatus(order.status)) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    try {
      await api(`/api/admin/orders/${order.id}`, { method: "PATCH", body: JSON.stringify({ action: "status", status: next }) });
      push(`${order.orderNumber} marked ${STATUS_LABEL[next]}`);
      setData((current) =>
        current
          ? { ...current, orders: current.orders.map((item) => (item.id === order.id ? { ...item, status: next } : item)) }
          : current,
      );
    } catch (err) {
      push(err instanceof Error ? err.message : "Could not update status.", "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Orders</h1>
          <p className="text-sm text-muted">Soonest pickup first. Overdue orders stay on Today until they are completed or cancelled.</p>
        </div>
        <Link href="/admin/orders/today/print" className={quietButton}>
          Print all today&apos;s orders
        </Link>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Order days">
        {(["today", "tomorrow", "upcoming", "all"] as const).map((value) => (
          <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${tab === value ? "bg-primary text-white" : "bg-white"}`}>
            {value}
          </button>
        ))}
      </div>
      <div className="grid gap-3 rounded-card bg-card p-3 shadow-card md:grid-cols-5">
        <input className={fieldClass} value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name, phone, or order #" aria-label="Search orders" />
        <select className={fieldClass} aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((item) => (
            <option key={item} value={item}>{STATUS_LABEL[item]}</option>
          ))}
        </select>
        <select className={fieldClass} aria-label="Sort orders" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="needed">Needed by, soonest</option>
          <option value="needed-desc">Needed by, latest</option>
          <option value="newest">Recently placed</option>
          <option value="total">Total, high to low</option>
        </select>
        <input className={fieldClass} type="date" aria-label="Needed from" value={from} onChange={(event) => setFrom(event.target.value)} />
        <input className={fieldClass} type="date" aria-label="Needed to" value={to} onChange={(event) => setTo(event.target.value)} />
      </div>
      {error ? <p className="font-semibold text-primary">{error}</p> : null}
      {!data ? <div className="skeleton h-40 rounded-card" /> : null}
      {data ? <p className="text-sm text-muted">{data.orders.length} orders · refreshes every 20 seconds</p> : null}
      <div className="space-y-3 md:hidden">
        {data?.orders.map((order) => (
          <OrderCard key={order.id} order={order} timezone={data.timezone} onAdvance={() => void advance(order)} />
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-card bg-card shadow-card md:block">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              {["Order #", "Customer", "Phone", "Items", "Total", "Placed", "Needed by", "Status", ""].map((heading) => (
                <th key={heading} className="px-3 py-3 font-bold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.orders.map((order) => (
              <tr key={order.id} className={rowClass(order)}>
                <td className="px-3 py-3 font-extrabold"><Link className="text-accent-text" href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link></td>
                <td className="px-3 py-3">{order.customerName}</td>
                <td className="px-3 py-3">{formatPhone(order.phone)}</td>
                <td className="px-3 py-3">{order.itemCount}</td>
                <td className="px-3 py-3 font-semibold">{formatINR(order.total)}</td>
                <td className="px-3 py-3">{formatDateTime(order.createdAt, data.timezone)}</td>
                <td className="px-3 py-3 font-bold">
                  {formatDateLabel(order.pickupDate)}
                  <span className="block text-xs font-semibold">{formatSlotLabel(order.pickupSlotStart, order.pickupSlotEnd)}</span>
                  {order.overdue ? <span className="text-xs text-primary">Overdue</span> : null}
                  {order.urgent ? <span className="text-xs">Due soon</span> : null}
                </td>
                <td className="px-3 py-3"><StatusPill status={order.status} /></td>
                <td className="px-3 py-3">
                  {isOrderStatus(order.status) && NEXT_STATUS[order.status] ? (
                    <button type="button" className={primaryButton} onClick={() => void advance(order)}>
                      {NEXT_LABEL[order.status]}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.orders.length === 0 ? <p className="p-6 text-sm text-muted">No orders in this view.</p> : null}
      </div>
    </div>
  );
}

function rowClass(order: OrderListItem) {
  if (order.overdue) return "border-l-4 border-l-primary bg-[#FDE8E4]";
  if (order.urgent) return "border-l-4 border-l-secondary bg-[#FFF4E0]";
  return "border-t border-line";
}

function OrderCard({ order, timezone, onAdvance }: { order: OrderListItem; timezone: string; onAdvance: () => void }) {
  return (
    <article className={`rounded-card bg-card p-4 shadow-card ${rowClass(order)}`}>
      <div className="flex items-start justify-between gap-2">
        <Link href={`/admin/orders/${order.id}`} className="font-extrabold text-accent-text">{order.orderNumber}</Link>
        <StatusPill status={order.status} />
      </div>
      <p className="mt-1 font-semibold">{order.customerName}</p>
      <p className="text-sm text-muted">{formatPhone(order.phone)} · {order.itemCount} items · {formatINR(order.total)}</p>
      <p className="mt-2 text-sm font-bold">Needed by {formatDateLabel(order.pickupDate)} · {formatSlotLabel(order.pickupSlotStart, order.pickupSlotEnd)}</p>
      <p className="text-xs text-muted">Placed {formatDateTime(order.createdAt, timezone)}</p>
      {isOrderStatus(order.status) && NEXT_STATUS[order.status] ? (
        <button type="button" className={`${primaryButton} mt-3`} onClick={onAdvance}>{NEXT_LABEL[order.status]}</button>
      ) : null}
    </article>
  );
}

export function OrderEditor({ id }: { id: string }) {
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState<{ id: string; quantity: number; unavailable: boolean }[]>([]);
  const [error, setError] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kathmandu");
  const push = useToast();

  async function load() {
    const data = await api<{ order: OrderDTO; timezone: string }>(`/api/admin/orders/${id}`, { cache: "no-store" });
    setOrder(data.order);
    if (data.timezone) setTimezone(data.timezone);
    setDraft(data.order.items.map((item) => ({ id: item.id, quantity: item.quantity, unavailable: item.unavailable })));
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, [id]);

  async function setStatus(status: OrderStatus) {
    try {
      const data = await api<{ order: OrderDTO }>(`/api/admin/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "status", status }),
      });
      setOrder(data.order);
      push(`Marked ${STATUS_LABEL[status]}`);
    } catch (err) {
      push(err instanceof Error ? err.message : "Could not update status.", "error");
    }
  }

  async function saveItems() {
    try {
      const data = await api<{ order: OrderDTO }>(`/api/admin/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "edit", note, items: draft }),
      });
      setOrder(data.order);
      setDraft(data.order.items.map((item) => ({ id: item.id, quantity: item.quantity, unavailable: item.unavailable })));
      setNote("");
      push("Order updated");
    } catch (err) {
      push(err instanceof Error ? err.message : "Could not save changes.", "error");
    }
  }

  if (error) return <p className="font-semibold text-primary">{error}</p>;
  if (!order) return <div className="skeleton h-64 rounded-card" />;
  const locked = order.status === "cancelled" || order.status === "completed";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="text-sm font-bold text-accent-text">All orders</Link>
          <h1 className="text-2xl font-extrabold">{order.orderNumber}</h1>
          <div className="mt-2"><StatusPill status={order.status} /></div>
        </div>
        <Link href={`/admin/orders/${order.id}/print`} className={quietButton}>Packing slip</Link>
      </div>
      {(order.overdue || order.urgent) && (
        <p className={`rounded-card px-4 py-3 text-sm font-bold ${order.overdue ? "bg-[#FDE8E4] text-primary" : "bg-secondary text-ink"}`}>
          {order.overdue ? "This pickup window has passed." : "Needed within the next 2 hours."}
        </p>
      )}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-card bg-card p-4 shadow-card">
          <h2 className="font-extrabold">Customer</h2>
          <p className="mt-2 font-semibold">{order.customerName}</p>
          <p>{formatPhone(order.phone)}</p>
          {order.email ? <p>{order.email}</p> : null}
          <p className="mt-3 font-bold">Needed by {formatDateLabel(order.pickupDate)} · {formatSlotLabel(order.pickupSlotStart, order.pickupSlotEnd)}</p>
          <p className="text-sm text-muted">Placed {formatDateTime(order.createdAt, timezone)}</p>
          <p className="mt-2 text-sm">Pickup at the store. Pay at pickup.</p>
          {order.notes ? <p className="mt-3 rounded-xl bg-background p-3 text-sm font-semibold">Note: {order.notes}</p> : null}
        </div>
        <div className="rounded-card bg-card p-4 shadow-card">
          <h2 className="font-extrabold">Status</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {ORDER_STATUSES.map((status) => (
              <button key={status} type="button" disabled={order.status === status} onClick={() => void setStatus(status)} className={`${order.status === status ? primaryButton : quietButton}`}>
                {STATUS_LABEL[status]}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="rounded-card bg-card p-4 shadow-card">
        <h2 className="font-extrabold">Items</h2>
        <div className="mt-3 space-y-3">
          {order.items.map((item) => {
            const row = draft.find((entry) => entry.id === item.id);
            if (!row) return null;
            return (
              <div key={item.id} className="grid items-center gap-2 border-b border-line py-2 md:grid-cols-[1.4fr_90px_140px_100px]">
                <div>
                  <p className={`font-semibold ${row.unavailable ? "line-through" : ""}`}>{item.name}</p>
                  <p className="text-xs text-muted">{item.unit} · {formatINR(item.unitPrice)} · shelf stock {item.stock ?? "removed"}</p>
                </div>
                <label className="text-sm font-semibold">
                  Qty
                  <input
                    className={`${fieldClass} mt-1`}
                    type="number"
                    min={1}
                    max={99}
                    disabled={locked}
                    value={row.quantity}
                    onChange={(event) =>
                      setDraft((current) => current.map((entry) => (entry.id === item.id ? { ...entry, quantity: Number(event.target.value) } : entry)))
                    }
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    disabled={locked}
                    checked={row.unavailable}
                    onChange={(event) =>
                      setDraft((current) => current.map((entry) => (entry.id === item.id ? { ...entry, unavailable: event.target.checked } : entry)))
                    }
                  />
                  Unavailable
                </label>
                <p className="font-bold">{row.unavailable ? "—" : formatINR(item.unitPrice * row.quantity)}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-right text-lg font-extrabold">Total {formatINR(order.total)}</p>
        <label className="mt-3 block text-sm font-semibold">
          Change note
          <input className={`${fieldClass} mt-1`} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Only 1 kg of rice left" disabled={locked} />
        </label>
        <button type="button" className={`${primaryButton} mt-3`} disabled={locked} onClick={() => void saveItems()}>
          Save item changes
        </button>
        {locked ? <p className="mt-2 text-sm text-muted">Reopen the order from Completed or Cancelled before editing items. Cancelling returns stock.</p> : null}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-card bg-card p-4 shadow-card">
          <h2 className="font-extrabold">Status history</h2>
          <ol className="mt-3 space-y-2 text-sm">
            {order.statusEvents.map((event) => (
              <li key={event.id}>
                <span className="font-bold">{isOrderStatus(event.status) ? STATUS_LABEL[event.status] : event.status}</span>
                <span className="text-muted"> · {formatDateTime(event.createdAt, timezone)} · {event.note}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-card bg-card p-4 shadow-card">
          <h2 className="font-extrabold">Edit log</h2>
          {order.edits.length === 0 ? <p className="mt-3 text-sm text-muted">No item changes yet.</p> : null}
          <ul className="mt-3 space-y-2 text-sm">
            {order.edits.map((edit) => (
              <li key={edit.id}>
                <span className="font-semibold">{edit.message}</span>
                <span className="block text-xs text-muted">{formatDateTime(edit.createdAt, timezone)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

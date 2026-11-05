"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { formatINR } from "@/lib/format";

type Stats = {
  ordersToday: number;
  pending: number;
  dueSoon: number;
  lowStock: number;
  lowStockItems: { id: string; name: string; stock: number }[];
  chart: { date: string; label: string; count: number; total: number }[];
  topProducts: { name: string; quantity: number }[];
};

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Stats>("/api/admin/stats", { cache: "no-store" })
      .then(setStats)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <p className="font-semibold text-primary">{error}</p>;
  if (!stats) return <div className="skeleton h-40 rounded-card" />;

  const max = Math.max(1, ...stats.chart.map((day) => day.count));
  const topMax = Math.max(1, ...stats.topProducts.map((item) => item.quantity));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Today at the store</h1>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="Orders today" value={String(stats.ordersToday)} href="/admin/orders" />
        <Card label="Pending orders" value={String(stats.pending)} href="/admin/orders" />
        <Card label="Due in 2 hours" value={String(stats.dueSoon)} href="/admin/orders" accent />
        <Card label="Low stock" value={String(stats.lowStock)} href="/admin/products" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-card bg-card p-4 shadow-card">
          <h2 className="font-extrabold">Orders, last 7 days</h2>
          <div className="mt-4 flex h-48 items-end gap-2" role="img" aria-label="Bar chart of orders over the last 7 days">
            {stats.chart.map((day) => (
              <div key={day.date} className="flex h-full flex-1 flex-col justify-end text-center">
                <span className="text-xs font-bold">{day.count}</span>
                <div className="mt-1 rounded-t-lg bg-primary" style={{ height: `${Math.max(day.count ? 8 : 0, (day.count / max) * 140)}px` }} />
                <span className="mt-2 text-[11px] text-muted">{day.label}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-card bg-card p-4 shadow-card">
          <h2 className="font-extrabold">Top sellers, 30 days</h2>
          {stats.topProducts.length === 0 ? <p className="mt-4 text-sm text-muted">No completed sales in this window yet.</p> : null}
          <ul className="mt-4 space-y-3">
            {stats.topProducts.map((item) => (
              <li key={item.name}>
                <div className="flex justify-between text-sm font-semibold">
                  <span>{item.name}</span>
                  <span>{item.quantity}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-background">
                  <div className="h-2 rounded-full bg-accent" style={{ width: `${(item.quantity / topMax) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          {stats.lowStockItems.length > 0 ? (
            <div className="mt-5 border-t border-line pt-3">
              <h3 className="text-sm font-bold">Needs restock</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {stats.lowStockItems.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className="font-bold text-primary">{item.stock} left</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="mt-4 text-xs text-muted">Totals shown in rupees on each order. Chart counts placed orders, excluding cancelled. {stats.chart.reduce((sum, day) => sum + day.total, 0) ? `Last 7 days billed ${formatINR(stats.chart.reduce((sum, day) => sum + day.total, 0))}.` : ""}</p>
        </section>
      </div>
    </div>
  );
}

function Card({ label, value, href, accent = false }: { label: string; value: string; href: string; accent?: boolean }) {
  return (
    <Link href={href} className={`rounded-card p-4 shadow-card ${accent ? "bg-secondary text-ink" : "bg-card"}`}>
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{value}</p>
    </Link>
  );
}

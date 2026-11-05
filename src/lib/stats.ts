import "server-only";
import { prisma } from "./prisma";
import { toPublicSettings } from "./settings";
import { isOpenStatus } from "./status";
import { addDays, formatDateLabel, zonedParts } from "./time";
import { orderTiming } from "./orders";

export async function getDashboardStats() {
  const settingsRow = await prisma.storeSettings.findUnique({ where: { id: "default" } });
  if (!settingsRow) throw new Error("Store settings missing");
  const settings = toPublicSettings(settingsRow);
  const today = zonedParts(new Date(), settings.timezone).date;
  const recentSince = new Date(Date.now() - 32 * 24 * 60 * 60 * 1000);

  const [recentOrders, openOrders, products, latest] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: recentSince } },
      include: { items: true },
    }),
    prisma.order.findMany({
      where: { status: { in: ["new", "confirmed", "packing", "ready"] } },
    }),
    prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true, stock: true, lowStockThreshold: true },
      orderBy: { name: "asc" },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, orderNumber: true, customerName: true, createdAt: true, status: true },
    }),
  ]);

  const ordersToday = recentOrders.filter(
    (order) => zonedParts(order.createdAt, settings.timezone).date === today && order.status !== "cancelled",
  ).length;
  const dueSoon = openOrders.filter((order) => orderTiming(order, settings).urgent).length;
  const lowStock = products.filter((product) => product.stock <= product.lowStockThreshold);

  const chart = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    const matching = recentOrders.filter(
      (order) => zonedParts(order.createdAt, settings.timezone).date === date && order.status !== "cancelled",
    );
    return {
      date,
      label: formatDateLabel(date).replace(/,?\s*\d{4}$/, ""),
      count: matching.length,
      total: matching.reduce((sum, order) => sum + order.total, 0),
    };
  });

  const totals = new Map<string, { name: string; quantity: number }>();
  for (const order of recentOrders) {
    if (order.status === "cancelled") continue;
    if (zonedParts(order.createdAt, settings.timezone).date < addDays(today, -29)) continue;
    for (const item of order.items) {
      if (item.unavailable) continue;
      const current = totals.get(item.name) ?? { name: item.name, quantity: 0 };
      current.quantity += item.quantity;
      totals.set(item.name, current);
    }
  }
  const topProducts = [...totals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  return {
    ordersToday,
    pending: openOrders.length,
    dueSoon,
    lowStock: lowStock.length,
    lowStockItems: lowStock.slice(0, 6).map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
    })),
    chart,
    topProducts,
    latest: latest.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
    })),
    newCount: openOrders.filter((order) => order.status === "new").length,
    timezone: settings.timezone,
  };
}

export function isRecentOpen(status: string) {
  return isOpenStatus(status);
}

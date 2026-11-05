import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { HttpError } from "./http";
import { normalizePhone, phonesMatch } from "./phone";
import { toPublicSettings } from "./settings";
import { buildSlots } from "./slots";
import { isOpenStatus, isOrderStatus, type OrderStatus } from "./status";
import { addDays, zonedParts } from "./time";
import type { OrderDTO, OrderListItem, PublicSettings } from "./types";
import { quoteTotals } from "./format";

const detailInclude = {
  items: { orderBy: { name: "asc" as const } },
  statusEvents: { orderBy: { createdAt: "asc" as const } },
  edits: { orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.OrderInclude;

type DetailedOrder = Prisma.OrderGetPayload<{ include: typeof detailInclude }>;

async function loadSettings() {
  const row = await prisma.storeSettings.findUnique({ where: { id: "default" } });
  if (!row) throw new HttpError("Store settings are missing. Run npm run setup.", 500);
  return { row, settings: toPublicSettings(row) };
}

export function orderTiming(order: { pickupDate: string; pickupSlotStart: string; status: string }, settings: PublicSettings, now = new Date()) {
  const current = zonedParts(now, settings.timezone);
  const soon = zonedParts(new Date(now.getTime() + 2 * 60 * 60 * 1000), settings.timezone);
  const startKey = `${order.pickupDate}T${order.pickupSlotStart}`;
  const open = isOpenStatus(order.status);
  const overdue = open && startKey < `${current.date}T${current.time}`;
  const urgent = open && !overdue && startKey <= `${soon.date}T${soon.time}`;
  return { overdue, urgent };
}

function committedQuantity(status: string, item: { unavailable: boolean; quantity: number; productId: string | null }) {
  if (status === "cancelled" || item.unavailable || !item.productId) return 0;
  return item.quantity;
}

async function applyStockDelta(tx: Prisma.TransactionClient, productId: string, delta: number) {
  if (delta > 0) {
    const updated = await tx.product.updateMany({
      where: { id: productId, stock: { gte: delta } },
      data: { stock: { decrement: delta } },
    });
    if (updated.count !== 1) {
      const product = await tx.product.findUnique({ where: { id: productId } });
      throw new HttpError(product ? `Not enough stock for ${product.name}.` : "A product is no longer available.", 409);
    }
    return;
  }
  if (delta < 0) {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) return;
    await tx.product.update({
      where: { id: productId },
      data: { stock: { increment: -delta } },
    });
  }
}

export function serializeOrder(order: DetailedOrder, settings: PublicSettings): OrderDTO {
  const timing = orderTiming(order, settings);
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    phone: order.phone,
    email: order.email,
    notes: order.notes,
    fulfillmentType: order.fulfillmentType,
    pickupDate: order.pickupDate,
    pickupSlotStart: order.pickupSlotStart,
    pickupSlotEnd: order.pickupSlotEnd,
    status: order.status,
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    overdue: timing.overdue,
    urgent: timing.urgent,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      unit: item.unit,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      unavailable: item.unavailable,
      stock: null,
    })),
    statusEvents: order.statusEvents.map((event) => ({
      id: event.id,
      status: event.status,
      note: event.note,
      createdAt: event.createdAt.toISOString(),
    })),
    edits: order.edits.map((edit) => ({
      id: edit.id,
      message: edit.message,
      createdAt: edit.createdAt.toISOString(),
    })),
  };
}

export async function placeOrder(input: {
  customerName: string;
  phone: string;
  email?: string;
  notes?: string;
  pickupDate: string;
  pickupSlotStart: string;
  items: { productId: string; quantity: number }[];
}) {
  const phone = normalizePhone(input.phone);
  if (!phone) throw new HttpError("Enter a valid 10-digit Nepal mobile number.");

  const merged = new Map<string, number>();
  for (const item of input.items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  }
  for (const quantity of merged.values()) {
    if (quantity > 99) throw new HttpError("You can order up to 99 of each item.");
  }

  return prisma.$transaction(async (tx) => {
    const settingsRow = await tx.storeSettings.findUnique({ where: { id: "default" } });
    if (!settingsRow) throw new HttpError("Store settings are missing.", 500);
    const settings = toPublicSettings(settingsRow);
    const slot = buildSlots(input.pickupDate, settings).find((entry) => entry.start === input.pickupSlotStart);
    if (!slot) {
      throw new HttpError("That pickup time is no longer available. Choose a later slot.");
    }

    const products = await tx.product.findMany({
      where: { id: { in: [...merged.keys()] }, active: true },
    });
    const byId = new Map(products.map((product) => [product.id, product]));
    const lines = [...merged.entries()].map(([productId, quantity]) => {
      const product = byId.get(productId);
      if (!product) throw new HttpError("A product in your cart is no longer available.");
      if (product.stock < quantity) {
        throw new HttpError(
          product.stock <= 0 ? `${product.name} is out of stock.` : `Only ${product.stock} left for ${product.name}.`,
        );
      }
      return { product, quantity };
    });

    for (const line of lines) {
      await applyStockDelta(tx, line.product.id, line.quantity);
    }

    const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    const totals = quoteTotals(subtotal, settings);
    const counter = await tx.storeSettings.update({
      where: { id: "default" },
      data: { orderCounter: { increment: 1 } },
    });
    const orderNumber = `LKS-${String(counter.orderCounter).padStart(6, "0")}`;

    const order = await tx.order.create({
      data: {
        orderNumber,
        customerName: input.customerName.trim(),
        phone,
        email: input.email?.trim() ?? "",
        notes: input.notes?.trim() ?? "",
        // Pickup is the only fulfillment method for now. The column stays generic
        // so delivery can be added later without rewriting existing orders.
        fulfillmentType: "pickup",
        pickupDate: input.pickupDate,
        pickupSlotStart: slot.start,
        pickupSlotEnd: slot.end,
        status: "new",
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        items: {
          create: lines.map((line) => ({
            productId: line.product.id,
            name: line.product.name,
            unit: line.product.unit,
            unitPrice: line.product.price,
            quantity: line.quantity,
          })),
        },
        statusEvents: {
          create: { status: "new", note: "Order placed" },
        },
      },
      include: detailInclude,
    });

    return serializeOrder(order, settings);
  });
}

export async function getOrderByNumber(orderNumber: string, phone: string) {
  const normalized = normalizePhone(phone);
  if (!normalized) throw new HttpError("Enter the mobile number used on the order.");
  const order = await prisma.order.findUnique({
    where: { orderNumber: orderNumber.trim().toUpperCase() },
    include: detailInclude,
  });
  if (!order || !phonesMatch(order.phone, normalized)) {
    throw new HttpError("No order matched that number and phone.", 404);
  }
  const { settings } = await loadSettings();
  return withLiveStock(serializeOrder(order, settings));
}

async function withLiveStock(order: OrderDTO) {
  const ids = order.items.map((item) => item.productId).filter((id): id is string => Boolean(id));
  const products = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, stock: true } });
  const stock = new Map(products.map((product) => [product.id, product.stock]));
  return {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      stock: item.productId ? (stock.get(item.productId) ?? null) : null,
    })),
  };
}

export async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({ where: { id }, include: detailInclude });
  if (!order) throw new HttpError("Order not found.", 404);
  const { settings } = await loadSettings();
  return { order: await withLiveStock(serializeOrder(order, settings)), timezone: settings.timezone };
}

export async function listOrders(filters: {
  tab: "today" | "tomorrow" | "upcoming" | "all";
  status?: string;
  q?: string;
  from?: string;
  to?: string;
  sort: "needed" | "needed-desc" | "newest" | "total";
}) {
  const { settings } = await loadSettings();
  const today = zonedParts(new Date(), settings.timezone).date;
  const tomorrow = addDays(today, 1);
  const and: Prisma.OrderWhereInput[] = [];

  if (filters.status && filters.status !== "all") and.push({ status: filters.status });
  if (filters.tab === "today") {
    and.push({
      OR: [
        { pickupDate: today },
        { pickupDate: { lt: today }, status: { in: ["new", "confirmed", "packing", "ready"] } },
      ],
    });
  } else if (filters.tab === "tomorrow") {
    and.push({ pickupDate: tomorrow });
  } else if (filters.tab === "upcoming") {
    and.push({ pickupDate: { gt: tomorrow } });
  }
  if (filters.from || filters.to) {
    and.push({
      pickupDate: {
        ...(filters.from ? { gte: filters.from } : {}),
        ...(filters.to ? { lte: filters.to } : {}),
      },
    });
  }

  const where: Prisma.OrderWhereInput = and.length ? { AND: and } : {};

  const orderBy: Prisma.OrderOrderByWithRelationInput[] =
    filters.sort === "newest"
      ? [{ createdAt: "desc" }]
      : filters.sort === "total"
        ? [{ total: "desc" }]
        : filters.sort === "needed-desc"
          ? [{ pickupDate: "desc" }, { pickupSlotStart: "desc" }]
          : [{ pickupDate: "asc" }, { pickupSlotStart: "asc" }];

  const orders = await prisma.order.findMany({
    where,
    orderBy,
    include: { items: { select: { quantity: true } } },
    take: 500,
  });

  const q = filters.q?.trim().toLowerCase() ?? "";
  const digits = q.replace(/\D/g, "");
  const filtered = orders.filter((order) => {
    if (!q) return true;
    return (
      order.customerName.toLowerCase().includes(q) ||
      order.orderNumber.toLowerCase().includes(q) ||
      (digits.length >= 3 && order.phone.replace(/\D/g, "").includes(digits))
    );
  });

  const items: OrderListItem[] = filtered.map((order) => {
    const timing = orderTiming(order, settings);
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      phone: order.phone,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      total: order.total,
      createdAt: order.createdAt.toISOString(),
      pickupDate: order.pickupDate,
      pickupSlotStart: order.pickupSlotStart,
      pickupSlotEnd: order.pickupSlotEnd,
      status: order.status,
      overdue: timing.overdue,
      urgent: timing.urgent,
      notes: order.notes,
    };
  });

  return { orders: items, today, tomorrow, timezone: settings.timezone };
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  if (!isOrderStatus(status)) throw new HttpError("Unknown status.");
  return prisma.$transaction(async (tx) => {
    const settingsRow = await tx.storeSettings.findUnique({ where: { id: "default" } });
    if (!settingsRow) throw new HttpError("Store settings are missing.", 500);
    const settings = toPublicSettings(settingsRow);
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new HttpError("Order not found.", 404);
    if (order.status === status) {
      const fresh = await tx.order.findUniqueOrThrow({ where: { id }, include: detailInclude });
      return serializeOrder(fresh, settings);
    }

    const oldMap = new Map<string, number>();
    for (const item of order.items) {
      if (!item.productId) continue;
      oldMap.set(item.productId, (oldMap.get(item.productId) ?? 0) + committedQuantity(order.status, item));
    }
    const newMap = new Map<string, number>();
    for (const item of order.items) {
      if (!item.productId) continue;
      newMap.set(item.productId, (newMap.get(item.productId) ?? 0) + committedQuantity(status, item));
    }
    const productIds = new Set([...oldMap.keys(), ...newMap.keys()]);
    for (const productId of productIds) {
      await applyStockDelta(tx, productId, (newMap.get(productId) ?? 0) - (oldMap.get(productId) ?? 0));
    }

    await tx.order.update({
      where: { id },
      data: {
        status,
        statusEvents: { create: { status, note: "Status updated by owner" } },
      },
    });
    const fresh = await tx.order.findUniqueOrThrow({ where: { id }, include: detailInclude });
    return serializeOrder(fresh, settings);
  });
}

export async function editOrder(
  id: string,
  input: { note?: string; items: { id: string; quantity: number; unavailable: boolean }[] },
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new HttpError("Order not found.", 404);
    if (order.status === "cancelled" || order.status === "completed") {
      throw new HttpError("Reopen this order before changing items.");
    }

    const incoming = new Map(input.items.map((item) => [item.id, item]));
    if (incoming.size !== order.items.length || order.items.some((item) => !incoming.has(item.id))) {
      throw new HttpError("The item list is out of date. Reload the order and try again.");
    }

    const oldMap = new Map<string, number>();
    const newMap = new Map<string, number>();
    const messages: string[] = [];

    for (const item of order.items) {
      const next = incoming.get(item.id)!;
      if (item.productId) {
        oldMap.set(item.productId, (oldMap.get(item.productId) ?? 0) + committedQuantity(order.status, item));
        newMap.set(
          item.productId,
          (newMap.get(item.productId) ?? 0) +
            committedQuantity(order.status, { ...item, quantity: next.quantity, unavailable: next.unavailable }),
        );
      } else if (!next.unavailable && next.quantity > item.quantity) {
        throw new HttpError(`${item.name} is no longer in the catalog, so the quantity cannot increase.`);
      }
      if (next.quantity !== item.quantity) messages.push(`${item.name}: quantity ${item.quantity} → ${next.quantity}`);
      if (next.unavailable !== item.unavailable) {
        messages.push(`${item.name}: marked ${next.unavailable ? "unavailable" : "available"}`);
      }
    }

    for (const productId of new Set([...oldMap.keys(), ...newMap.keys()])) {
      await applyStockDelta(tx, productId, (newMap.get(productId) ?? 0) - (oldMap.get(productId) ?? 0));
    }

    const settingsRow = await tx.storeSettings.findUnique({ where: { id: "default" } });
    if (!settingsRow) throw new HttpError("Store settings are missing.", 500);
    const settings = toPublicSettings(settingsRow);
    let subtotal = 0;
    for (const item of order.items) {
      const next = incoming.get(item.id)!;
      if (!next.unavailable) subtotal += item.unitPrice * next.quantity;
      await tx.orderItem.update({
        where: { id: item.id },
        data: { quantity: next.quantity, unavailable: next.unavailable },
      });
    }
    const totals = quoteTotals(subtotal, settings);
    if (input.note?.trim()) messages.push(input.note.trim());
    const message = messages.join("; ") || "Order items reviewed";

    await tx.order.update({
      where: { id },
      data: {
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        edits: { create: { message } },
      },
    });

    const fresh = await tx.order.findUniqueOrThrow({ where: { id }, include: detailInclude });
    return serializeOrder(fresh, settings);
  });
}

export async function ordersForPrint(scope: { id?: string; today?: boolean }) {
  const { settings } = await loadSettings();
  const today = zonedParts(new Date(), settings.timezone).date;
  const orders = await prisma.order.findMany({
    where: scope.id ? { id: scope.id } : { pickupDate: today, status: { not: "cancelled" } },
    include: detailInclude,
    orderBy: [{ pickupDate: "asc" }, { pickupSlotStart: "asc" }],
  });
  return { settings, orders: orders.map((order) => serializeOrder(order, settings)) };
}

export function storeToday(settings: PublicSettings) {
  const today = zonedParts(new Date(), settings.timezone).date;
  return { today, tomorrow: addDays(today, 1) };
}

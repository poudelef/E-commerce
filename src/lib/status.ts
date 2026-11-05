export const ORDER_STATUSES = ["new", "confirmed", "packing", "ready", "completed", "cancelled"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  packing: "Packing",
  ready: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  new: "confirmed",
  confirmed: "packing",
  packing: "ready",
  ready: "completed",
};

export const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  new: "Confirm",
  confirmed: "Start packing",
  packing: "Mark ready",
  ready: "Complete pickup",
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isOpenStatus(status: string) {
  return status === "new" || status === "confirmed" || status === "packing" || status === "ready";
}

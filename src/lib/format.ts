import type { PublicSettings } from "./types";

export function formatINR(paise: number) {
  const rupees = paise / 100;
  const whole = paise % 100 === 0;
  const amount = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
  return `Rs ${amount}`;
}

export function rupeesToPaise(rupees: number) {
  return Math.round((rupees + Number.EPSILON) * 100);
}

export function paiseToRupees(paise: number) {
  return paise / 100;
}

export function quoteTotals(subtotal: number, settings: Pick<PublicSettings, "taxEnabled" | "taxBps">) {
  const tax = settings.taxEnabled ? Math.round((subtotal * settings.taxBps) / 10000) : 0;
  return { subtotal, tax, total: subtotal + tax };
}

export function formatTaxPercent(taxBps: number) {
  const percent = taxBps / 100;
  return Number.isInteger(percent) ? `${percent}%` : `${percent.toFixed(2)}%`;
}

export function stockLevel(stock: number, lowStockThreshold: number): "in" | "low" | "out" {
  if (stock <= 0) return "out";
  if (stock <= lowStockThreshold) return "low";
  return "in";
}

export function stockLabel(level: "in" | "low" | "out") {
  if (level === "out") return "Out of stock";
  if (level === "low") return "Low stock";
  return "In stock";
}

export function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

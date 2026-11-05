import { z } from "zod";
import { ORDER_STATUSES } from "./status";
import { WEEKDAYS } from "./types";
import { hoursAreValid, parseHours } from "./settings";
import { isValidTimeZone } from "./time";

export const loginSchema = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(1).max(200),
});

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z.string().trim().min(8, "Enter a valid mobile number").max(20),
  email: z.union([z.string().trim().email("Enter a valid email").max(120), z.literal("")]).optional(),
  notes: z.string().trim().max(500).optional().default(""),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a pickup date"),
  pickupSlotStart: z.string().regex(/^\d{2}:\d{2}$/, "Choose a pickup time"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1, "Your cart is empty")
    .max(100),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().default(""),
  categoryId: z.string().min(1, "Choose a category"),
  priceRupees: z.number().positive().max(100000),
  unit: z.string().trim().min(1).max(40),
  stock: z.number().int().min(0).max(100000),
  lowStockThreshold: z.number().int().min(0).max(100000),
  image: z.string().trim().max(300).optional().default(""),
  keywords: z.string().trim().max(300).optional().default(""),
  active: z.boolean().optional().default(true),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(40),
});

const daySchema = z.object({
  closed: z.boolean(),
  open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export const settingsSchema = z
  .object({
    storeName: z.string().trim().min(2).max(80),
    address: z.string().trim().min(4).max(300),
    phone: z.string().trim().min(6).max(30),
    email: z.string().trim().email().max(120),
    hours: z.object({
      mon: daySchema,
      tue: daySchema,
      wed: daySchema,
      thu: daySchema,
      fri: daySchema,
      sat: daySchema,
      sun: daySchema,
    }),
    leadTimeMinutes: z.number().int().min(0).max(720),
    slotMinutes: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]),
    taxEnabled: z.boolean(),
    taxBps: z.number().int().min(0).max(2800),
    timezone: z.string().trim().min(1).max(80),
  })
  .superRefine((value, ctx) => {
    if (!hoursAreValid(parseHours(value.hours))) {
      ctx.addIssue({ code: "custom", path: ["hours"], message: "Closing time must be after opening time" });
    }
    if (!isValidTimeZone(value.timezone)) {
      ctx.addIssue({ code: "custom", path: ["timezone"], message: "Enter a valid IANA timezone" });
    }
    if (WEEKDAYS.length !== 7) {
      ctx.addIssue({ code: "custom", path: ["hours"], message: "Hours are incomplete" });
    }
  });

export const orderStatusSchema = z.object({
  action: z.literal("status"),
  status: z.enum(ORDER_STATUSES),
});

export const orderEditSchema = z.object({
  action: z.literal("edit"),
  note: z.string().trim().max(300).optional().default(""),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
        unavailable: z.boolean(),
      }),
    )
    .min(1),
});

export const orderUpdateSchema = z.discriminatedUnion("action", [orderStatusSchema, orderEditSchema]);

export const bulkProductSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  action: z.enum(["hide", "show", "delete", "category"]),
  categoryId: z.string().optional(),
});

export function zodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the form and try again";
}

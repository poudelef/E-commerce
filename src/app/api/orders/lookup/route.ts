import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, readJson } from "@/lib/api";
import { getOrderByNumber } from "@/lib/orders";
import { zodError } from "@/lib/validators";

const schema = z.object({
  orderNumber: z.string().trim().min(4).max(40),
  phone: z.string().trim().min(8).max(20),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: zodError(parsed.error) }, { status: 400 });
    }
    const order = await getOrderByNumber(parsed.data.orderNumber, parsed.data.phone);
    return NextResponse.json({ order });
  } catch (error) {
    return errorResponse(error);
  }
}

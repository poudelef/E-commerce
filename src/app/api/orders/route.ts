import { NextResponse } from "next/server";
import { errorResponse, readJson } from "@/lib/api";
import { placeOrder } from "@/lib/orders";
import { checkoutSchema, zodError } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const parsed = checkoutSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: zodError(parsed.error) }, { status: 400 });
    }
    const order = await placeOrder(parsed.data);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

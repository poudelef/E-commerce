import { NextResponse } from "next/server";
import { errorResponse, readJson, requireOwner } from "@/lib/api";
import { editOrder, getOrderById, updateOrderStatus } from "@/lib/orders";
import { orderUpdateSchema, zodError } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    await requireOwner();
    const { id } = await context.params;
    return NextResponse.json(await getOrderById(id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    await requireOwner();
    const { id } = await context.params;
    const parsed = orderUpdateSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json({ error: zodError(parsed.error) }, { status: 400 });
    }
    const order =
      parsed.data.action === "status"
        ? await updateOrderStatus(id, parsed.data.status)
        : await editOrder(id, parsed.data);
    return NextResponse.json({ order });
  } catch (error) {
    return errorResponse(error);
  }
}

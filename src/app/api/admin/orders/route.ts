import { NextResponse } from "next/server";
import { errorResponse, requireOwner } from "@/lib/api";
import { listOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireOwner();
    const url = new URL(request.url);
    const tab = url.searchParams.get("tab");
    const sort = url.searchParams.get("sort");
    const data = await listOrders({
      tab: tab === "tomorrow" || tab === "upcoming" || tab === "all" ? tab : "today",
      status: url.searchParams.get("status") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      sort: sort === "needed-desc" || sort === "newest" || sort === "total" ? sort : "needed",
    });
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}

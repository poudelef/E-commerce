import { notFound } from "next/navigation";
import { PackingSlips, PrintBar } from "@/components/admin/print";
import { ordersForPrint } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function PrintOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { settings, orders } = await ordersForPrint({ id });
  if (!orders.length) notFound();
  return (
    <main className="mx-auto max-w-3xl p-6">
      <PrintBar backHref={`/admin/orders/${id}`} />
      <PackingSlips orders={orders} settings={settings} />
    </main>
  );
}

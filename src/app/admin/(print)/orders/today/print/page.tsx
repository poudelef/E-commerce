import { PackingSlips, PrintBar } from "@/components/admin/print";
import { ordersForPrint } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function PrintTodayPage() {
  const { settings, orders } = await ordersForPrint({ today: true });
  return (
    <main className="mx-auto max-w-3xl p-6">
      <PrintBar backHref="/admin/orders" />
      <h1 className="no-print mb-4 text-2xl font-extrabold">Today&apos;s packing slips</h1>
      <PackingSlips orders={orders} settings={settings} />
    </main>
  );
}

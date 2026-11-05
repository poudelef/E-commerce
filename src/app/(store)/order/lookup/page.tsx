import type { Metadata } from "next";
import { OrderLookupForm } from "@/components/store/order-receipt";

export const metadata: Metadata = { title: "Find your order" };

export default function LookupPage() {
  return <OrderLookupForm />;
}

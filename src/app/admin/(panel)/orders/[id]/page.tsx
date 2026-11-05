"use client";

import { useParams } from "next/navigation";
import { OrderEditor } from "@/components/admin/orders";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  return <OrderEditor id={params.id} />;
}

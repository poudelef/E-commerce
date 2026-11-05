"use client";

import { useEffect, useState } from "react";
import { OrderLookupForm, OrderReceipt } from "@/components/store/order-receipt";
import { LAST_ORDER_KEY } from "@/lib/client";
import type { OrderDTO } from "@/lib/types";

export function ConfirmationPage() {
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_ORDER_KEY);
      setOrder(raw ? (JSON.parse(raw) as OrderDTO) : null);
    } catch {
      setOrder(null);
    }
    setReady(true);
  }, []);

  if (!ready) return <div className="skeleton mx-auto mt-8 h-64 max-w-2xl rounded-card" />;
  if (!order) return <OrderLookupForm />;
  return <OrderReceipt order={order} confirmation />;
}

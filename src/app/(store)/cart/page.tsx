import type { Metadata } from "next";
import { CartContents } from "@/components/store/cart-view";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-extrabold">Your cart</h1>
      <CartContents />
    </div>
  );
}

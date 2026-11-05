import type { Metadata } from "next";
import { ShopPage } from "@/components/store/shop-page";

export const metadata: Metadata = { title: "Shop" };

export default function HomePage() {
  return <ShopPage />;
}

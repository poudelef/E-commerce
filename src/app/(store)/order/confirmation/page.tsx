import type { Metadata } from "next";
import { ConfirmationPage } from "@/components/store/confirmation";

export const metadata: Metadata = { title: "Order confirmation" };

export default function Page() {
  return <ConfirmationPage />;
}

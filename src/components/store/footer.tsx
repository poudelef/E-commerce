"use client";

import Link from "next/link";
import { useCatalog } from "@/components/store/providers";
import { hoursSummary } from "@/lib/time";

export function Footer() {
  const { settings } = useCatalog();
  const hours = hoursSummary(settings.hours);
  return (
    <footer className="mt-10 border-t border-line bg-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3">
        <div>
          <p className="font-extrabold">{settings.storeName}</p>
          <p className="mt-2 whitespace-pre-line text-sm text-muted">{settings.address}</p>
          <a className="mt-2 inline-block text-sm font-semibold text-accent-text" href={`tel:${settings.phone.replace(/\s/g, "")}`}>
            {settings.phone}
          </a>
        </div>
        <div>
          <p className="font-bold">Store hours</p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {hours.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="text-sm text-muted">
          <p>Pickup orders only. Pay at the store when you collect your bag.</p>
          <div className="mt-3 flex flex-wrap gap-3 font-semibold">
            <Link className="text-accent-text" href="/order/lookup">
              Find an order
            </Link>
            <Link className="text-accent-text" href="/admin">
              Store owner
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

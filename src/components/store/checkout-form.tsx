"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cartIssues } from "@/components/store/cart-view";
import { useCart, useCatalog, useResolvedCart } from "@/components/store/providers";
import { Field, fieldClass, primaryButton, quietButton } from "@/components/ui";
import { api, LAST_ORDER_KEY } from "@/lib/client";
import { formatINR, formatTaxPercent, quoteTotals } from "@/lib/format";
import { normalizePhone } from "@/lib/phone";
import { firstBookableDate } from "@/lib/slots";
import { addDays, formatDateLabel, hoursSummary, MAX_PICKUP_DAYS, timezoneAbbrev, zonedParts } from "@/lib/time";
import type { OrderDTO, Slot } from "@/lib/types";

export function CheckoutForm() {
  const router = useRouter();
  const { settings, refresh } = useCatalog();
  const { clear } = useCart();
  const { lines, ready } = useResolvedCart();
  const [step, setStep] = useState<"details" | "review">("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = zonedParts(new Date(), settings.timezone).date;
  const maxDate = addDays(today, MAX_PICKUP_DAYS);
  const issues = cartIssues(lines);
  const purchasable = lines.filter((line) => line.product && line.quantity <= line.product.stock && line.product.stock > 0);
  const subtotal = purchasable.reduce((sum, line) => sum + line.product!.price * line.quantity, 0);
  const totals = quoteTotals(subtotal, settings);
  const selectedSlot = slots.find((slot) => slot.start === slotStart);

  useEffect(() => {
    setDate((current) => current || firstBookableDate(settings));
  }, [settings]);

  useEffect(() => {
    if (!date) return;
    let ignore = false;
    setSlotsLoading(true);
    api<{ slots: Slot[] }>(`/api/slots?date=${date}`)
      .then((data) => {
        if (ignore) return;
        setSlots(data.slots);
        setSlotStart((current) => (data.slots.some((slot) => slot.start === current) ? current : ""));
      })
      .catch((err: Error) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setSlotsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [date]);

  const fieldErrors = useMemo(() => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter your full name.";
    if (!normalizePhone(phone)) next.phone = "Enter a 10-digit mobile number.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email or leave it blank.";
    if (!date) next.date = "Choose the day you will pick up.";
    if (!slotStart) next.slot = "Choose a pickup time.";
    return next;
  }, [name, phone, email, date, slotStart]);

  async function placeOrder() {
    setError("");
    setSubmitting(true);
    try {
      const result = await api<{ order: OrderDTO }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName: name.trim(),
          phone,
          email: email.trim(),
          notes: notes.trim(),
          pickupDate: date,
          pickupSlotStart: slotStart,
          items: purchasable.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        }),
      });
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(result.order));
      clear(true);
      await refresh().catch(() => undefined);
      router.push("/order/confirmation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place the order.");
      setSubmitting(false);
    }
  }

  if (!ready) return <div className="skeleton mx-auto mt-8 h-64 max-w-3xl rounded-card" />;
  if (submitting && lines.length === 0) {
    return <p className="px-4 py-16 text-center text-lg font-bold">Placing your order...</p>;
  }
  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold">Your cart is empty</h1>
        <Link href="/" className={`${primaryButton} mt-5`}>
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-4">
        <section className="rounded-card bg-card p-5 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-text">Fulfillment</p>
          <h1 className="mt-1 text-2xl font-extrabold">Pickup at {settings.storeName}</h1>
          <p className="mt-2 text-sm text-muted">{settings.address}</p>
          <p className="text-sm text-muted">{settings.phone}</p>
          <ul className="mt-3 grid gap-1 text-sm text-muted sm:grid-cols-2">
            {hoursSummary(settings.hours).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="mt-3 rounded-xl bg-background px-3 py-2 text-sm font-semibold">Pay at the store during pickup. Delivery can be added later; this order is store pickup.</p>
        </section>

        {step === "details" ? (
          <form
            className="space-y-4 rounded-card bg-card p-5 shadow-card"
            onSubmit={(event) => {
              event.preventDefault();
              if (Object.keys(fieldErrors).length || issues.length) {
                setError(issues[0] || "Check the highlighted fields.");
                return;
              }
              setError("");
              setStep("review");
            }}
          >
            <h2 className="text-xl font-extrabold">Pickup details</h2>
            <Field label="Full name" error={error && fieldErrors.name ? fieldErrors.name : undefined}>
              <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
            </Field>
            <Field label="Phone number" hint="10-digit Nepal mobile number, starting with 9" error={error && fieldErrors.phone ? fieldErrors.phone : undefined}>
              <input className={fieldClass} value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" required />
            </Field>
            <Field label="Email (optional)" error={error && fieldErrors.email ? fieldErrors.email : undefined}>
              <input className={fieldClass} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </Field>
            <Field label="Needed by" hint={`Times in ${timezoneAbbrev(settings.timezone)}. We need at least ${settings.leadTimeMinutes} minutes to pack.`}>
              <input className={fieldClass} type="date" min={today} max={maxDate} value={date} onChange={(event) => setDate(event.target.value)} required />
            </Field>
            <div>
              <p className="mb-2 text-sm font-semibold">Pickup time</p>
              {slotsLoading ? <div className="skeleton h-12 rounded-xl" /> : null}
              {!slotsLoading && slots.length === 0 ? (
                <p className="rounded-xl bg-background px-3 py-3 text-sm">No pickup slots left for this day. The store may be closed, or every remaining slot is inside the {settings.leadTimeMinutes}-minute lead time.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="listbox" aria-label="Pickup time slots">
                  {slots.map((slot) => (
                    <button
                      key={slot.start}
                      type="button"
                      role="option"
                      aria-selected={slotStart === slot.start}
                      onClick={() => setSlotStart(slot.start)}
                      className={`rounded-xl border px-2 py-2 text-sm font-semibold ${slotStart === slot.start ? "border-primary bg-primary text-white" : "border-line bg-white"}`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
              {error && fieldErrors.slot ? <p className="mt-1 text-sm font-semibold text-primary">{fieldErrors.slot}</p> : null}
            </div>
            <Field label="Order notes (optional)" hint='Example: "Please pick ripe bananas"'>
              <textarea className={`${fieldClass} min-h-24`} maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Field>
            {error ? <p className="rounded-xl bg-[#F3D6D2] px-3 py-2 text-sm font-semibold" role="alert">{error}</p> : null}
            {issues[0] ? <p className="text-sm font-semibold text-primary">{issues[0]}</p> : null}
            <button className={primaryButton} type="submit" disabled={issues.length > 0}>
              Review order
            </button>
          </form>
        ) : (
          <section className="space-y-4 rounded-card bg-card p-5 shadow-card">
            <h2 className="text-xl font-extrabold">Review order</h2>
            <dl className="grid gap-2 text-sm">
              <div><dt className="text-muted">Name</dt><dd className="font-semibold">{name}</dd></div>
              <div><dt className="text-muted">Phone</dt><dd className="font-semibold">{phone}</dd></div>
              {email ? <div><dt className="text-muted">Email</dt><dd className="font-semibold">{email}</dd></div> : null}
              <div>
                <dt className="text-muted">Needed by</dt>
                <dd className="font-semibold">{formatDateLabel(date)} · {selectedSlot?.label}</dd>
              </div>
              {notes ? <div><dt className="text-muted">Notes</dt><dd className="font-semibold">{notes}</dd></div> : null}
            </dl>
            <ul className="divide-y divide-line border-y border-line">
              {purchasable.map((line) => (
                <li key={line.productId} className="flex justify-between gap-3 py-2 text-sm">
                  <span>{line.product!.name} · {line.product!.unit} × {line.quantity}</span>
                  <span className="font-semibold">{formatINR(line.product!.price * line.quantity)}</span>
                </li>
              ))}
            </ul>
            {error ? <p className="rounded-xl bg-[#F3D6D2] px-3 py-2 text-sm font-semibold" role="alert">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button type="button" className={quietButton} onClick={() => setStep("details")}>
                Edit details
              </button>
              <button type="button" className={primaryButton} disabled={submitting || issues.length > 0} onClick={() => void placeOrder()}>
                {submitting ? "Placing order..." : "Place order"}
              </button>
            </div>
          </section>
        )}
      </div>
      <aside className="h-fit rounded-card bg-card p-5 shadow-card lg:sticky lg:top-28">
        <h2 className="font-extrabold">Order summary</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {lines.map((line) => (
            <li key={line.productId} className="flex justify-between gap-3">
              <span>{line.product?.name ?? "Unavailable"} × {line.quantity}</span>
              <span>{line.product ? formatINR(line.product.price * line.quantity) : "—"}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(totals.subtotal)}</span></div>
          {settings.taxEnabled ? <div className="mt-1 flex justify-between"><span>Tax ({formatTaxPercent(settings.taxBps)})</span><span>{formatINR(totals.tax)}</span></div> : null}
          <div className="mt-2 flex justify-between text-lg font-extrabold"><span>Estimated total</span><span className="text-primary">{formatINR(totals.total)}</span></div>
        </div>
      </aside>
    </div>
  );
}

"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { STATUS_LABEL, isOrderStatus } from "@/lib/status";

type Tone = "success" | "error" | "info";
type Toast = { id: string; message: string; tone: Tone };

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => undefined);

export function useToast() {
  return useContext(ToastContext);
}

const toneClass: Record<Tone, string> = {
  success: "bg-accent text-ink",
  error: "bg-primary text-white",
  info: "bg-ink text-white",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Tone = "success") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, tone }].slice(-3));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2800);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} role="status" className={`toast-in pointer-events-auto max-w-md rounded-full px-4 py-2.5 text-sm font-semibold shadow-pop ${toneClass[toast.tone]}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const fieldClass =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base text-ink shadow-sm outline-none placeholder:text-muted/70";

export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-secondary hover:text-ink active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary disabled:hover:text-white";

export const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-bold text-ink transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

export const quietButton =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-secondary";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
      {error ? <span className="mt-1 block text-sm font-semibold text-primary">{error}</span> : null}
    </label>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-primary text-white",
    confirmed: "bg-[#D7F6FA] text-ink",
    packing: "bg-secondary text-ink",
    ready: "bg-accent text-ink",
    completed: "bg-[#E7EFE4] text-ink",
    cancelled: "bg-[#F3D6D2] text-ink",
  };
  const label = isOrderStatus(status) ? STATUS_LABEL[status] : status;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles[status] ?? "bg-line text-ink"}`}>{label}</span>;
}

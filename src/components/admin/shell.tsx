"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { api } from "@/lib/client";

type AlertOrder = { id: string; orderNumber: string; customerName: string; createdAt: string; status: string };
type Stats = { newCount: number; latest: AlertOrder[] };

const links = [
  { href: "/admin", label: "Overview", icon: "chart" },
  { href: "/admin/orders", label: "Orders", icon: "clock" },
  { href: "/admin/products", label: "Products", icon: "box" },
  { href: "/admin/categories", label: "Categories", icon: "tag" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [banner, setBanner] = useState<AlertOrder[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const known = useRef<Set<string> | null>(null);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => {
    setSoundOn(localStorage.getItem("lks_order_sound") !== "off");
    const unlock = () => {
      const Ctx = window.AudioContext;
      audio.current ??= new Ctx();
      void audio.current.resume();
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const data = await api<Stats>("/api/admin/stats", { cache: "no-store" });
        if (stop) return;
        const ids = new Set(data.latest.map((order) => order.id));
        if (known.current) {
          const fresh = data.latest.filter((order) => !known.current?.has(order.id) && order.status === "new");
          if (fresh.length) {
            setBanner(fresh);
            if (soundOn) playChime(audio.current);
            document.title = `(${fresh.length}) New order · Laxmi Kirana Store`;
          }
        }
        known.current = ids;
        setStats(data);
      } catch {
        if (!stop) setStats(null);
      }
    }
    void load();
    const id = window.setInterval(() => void load(), 20_000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [soundOn]);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background text-ink md:grid md:grid-cols-[240px_1fr]">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-pop md:static md:w-auto md:shadow-none ${open ? "block" : "hidden md:block"}`}>
        <div className="flex h-full flex-col border-r border-line p-4">
          <Link href="/admin" className="mb-6 block">
            <span className="text-xs font-bold uppercase tracking-wide text-primary">Owner</span>
            <span className="block text-lg font-extrabold leading-tight">Laxmi Kirana Store</span>
          </Link>
          <nav className="space-y-1">
            {links.map((link) => {
              const active = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold ${active ? "bg-primary text-white" : "hover:bg-background"}`}
                >
                  <span className="flex items-center gap-2">
                    <Icon name={link.icon} className="h-4 w-4" />
                    {link.label}
                  </span>
                  {link.href === "/admin/orders" && stats?.newCount ? (
                    <span className={`rounded-full px-2 text-xs ${active ? "bg-secondary text-ink" : "bg-primary text-white"}`}>{stats.newCount}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto space-y-2 pt-6">
            <button
              type="button"
              className="w-full rounded-xl border border-line px-3 py-2 text-left text-sm font-semibold"
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                localStorage.setItem("lks_order_sound", next ? "on" : "off");
              }}
            >
              Sound alerts {soundOn ? "on" : "off"}
            </button>
            <Link href="/" className="block rounded-xl px-3 py-2 text-sm font-semibold text-accent-text">
              View store
            </Link>
            <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold" onClick={() => void logout()}>
              <Icon name="logout" className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </aside>
      {open ? <button type="button" className="fixed inset-0 z-30 bg-ink/40 md:hidden" aria-label="Close menu" onClick={() => setOpen(false)} /> : null}
      <div className="min-w-0">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-white" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Icon name="menu" />
          </button>
          <p className="font-extrabold">Laxmi Kirana Store</p>
        </div>
        {banner.length > 0 ? (
          <div className="no-print flex items-center justify-between gap-3 bg-secondary px-4 py-3 text-sm font-bold text-ink" role="status">
            <span>
              {banner.length === 1
                ? `New order ${banner[0].orderNumber} from ${banner[0].customerName}`
                : `${banner.length} new orders`}
            </span>
            <span className="flex gap-2">
              <Link href="/admin/orders" className="underline" onClick={() => setBanner([])}>
                View
              </Link>
              <button type="button" onClick={() => setBanner([])}>
                Dismiss
              </button>
            </span>
          </div>
        ) : null}
        <div className="px-4 py-5 md:px-6">{children}</div>
      </div>
    </div>
  );
}

function playChime(ctx: AudioContext | null) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.42);
}

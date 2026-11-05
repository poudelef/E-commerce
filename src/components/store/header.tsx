"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { useCart, useCatalog, useSearch } from "@/components/store/providers";
import { formatINR } from "@/lib/format";
import { searchScore } from "@/lib/search";

function SearchField({ inputId }: { inputId: string }) {
  const { products } = useCatalog();
  const { query, setQuery, debouncedQuery } = useSearch();
  const router = useRouter();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = debouncedQuery.trim();
    if (!q) return [];
    return products
      .map((product) => ({ product, score: searchScore(product, q) }))
      .filter((entry): entry is { product: (typeof products)[number]; score: number } => entry.score !== null)
      .sort((a, b) => a.score - b.score || a.product.name.localeCompare(b.product.name))
      .slice(0, 5)
      .map((entry) => entry.product);
  }, [debouncedQuery, products]);

  useEffect(() => setActive(-1), [debouncedQuery]);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  function goToProduct(slug: string) {
    setOpen(false);
    router.push(`/product/${slug}`);
  }

  function submit() {
    setOpen(false);
    if (window.location.pathname !== "/") router.push(`/?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div ref={boxRef} className="relative">
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
      <input
        id={inputId}
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label="Search products"
        placeholder="Search rice, dal, snacks..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((index) => Math.min(suggestions.length - 1, index + 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(-1, index - 1));
          } else if (event.key === "Escape") {
            setOpen(false);
          } else if (event.key === "Enter") {
            event.preventDefault();
            if (active >= 0 && suggestions[active]) goToProduct(suggestions[active].slug);
            else submit();
          }
        }}
        className="h-11 w-full rounded-full border-0 bg-white pl-10 pr-10 text-base text-ink shadow-sm outline-none placeholder:text-muted"
      />
      {query ? (
        <button
          type="button"
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-background"
          aria-label="Clear search"
          onClick={() => {
            setQuery("");
            setOpen(false);
            if (window.location.pathname !== "/") router.push("/");
          }}
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
      ) : null}
      {open && debouncedQuery.trim() ? (
        <ul id={listId} role="listbox" className="absolute z-50 mt-2 w-full overflow-hidden rounded-card bg-card text-ink shadow-pop">
          {suggestions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted">No matches. Browse categories on the shop page.</li>
          ) : (
            suggestions.map((product, index) => (
              <li key={product.id} role="option" aria-selected={index === active}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => goToProduct(product.slug)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left ${index === active ? "bg-background" : "hover:bg-background"}`}
                >
                  <img src={product.image} alt="" className="h-11 w-11 rounded-lg bg-background object-contain" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{product.name}</span>
                    <span className="block text-xs text-muted">{product.categoryName} · {product.unit}</span>
                  </span>
                  <span className="font-bold text-primary">{formatINR(product.price)}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

export function Header() {
  const { settings } = useCatalog();
  const { count, ready, setDrawerOpen } = useCart();
  const router = useRouter();
  const [bump, setBump] = useState(0);
  const previous = useRef(count);

  useEffect(() => {
    if (count !== previous.current) {
      setBump((value) => value + 1);
      previous.current = count;
    }
  }, [count]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (!target || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      event.preventDefault();
      const id = window.matchMedia("(min-width: 768px)").matches ? "store-search" : "store-search-mobile";
      document.getElementById(id)?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function openCart() {
    if (window.matchMedia("(min-width: 768px)").matches) setDrawerOpen(true);
    else router.push("/cart");
  }

  const headerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;
    const write = () => document.documentElement.style.setProperty("--store-header-offset", `${node.offsetHeight}px`);
    write();
    const observer = new ResizeObserver(write);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={headerRef} className="sticky top-0 z-40">
      <header className="bg-primary text-white shadow-card">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2 rounded-xl">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-sm font-extrabold text-primary">LK</span>
            <span className="text-[15px] font-extrabold leading-tight sm:text-lg">{settings.storeName}</span>
          </Link>
          <div className="hidden min-w-0 flex-1 md:block">
            <SearchField inputId="store-search" />
          </div>
          <button
            type="button"
            onClick={openCart}
            className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 hover:bg-white/25"
            aria-label={ready ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}
          >
            <Icon name="cart" className="h-6 w-6" />
            {ready && count > 0 ? (
              <span key={bump} className="badge-bump absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-secondary px-1 text-xs font-extrabold text-ink">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </button>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-3 md:hidden">
          <SearchField inputId="store-search-mobile" />
        </div>
      </header>
    </div>
  );
}

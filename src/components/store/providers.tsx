"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { CartLine, Catalog, ProductDTO } from "@/lib/types";
import { api } from "@/lib/client";
import { useToast } from "@/components/ui";

const CatalogContext = createContext<(Catalog & { refresh: () => Promise<void> }) | null>(null);

export function CatalogProvider({ initial, children }: { initial: Catalog; children: React.ReactNode }) {
  const [catalog, setCatalog] = useState(initial);
  const refresh = useCallback(async () => {
    const next = await api<Catalog>("/api/catalog", { cache: "no-store" });
    setCatalog(next);
  }, []);

  useEffect(() => {
    const onFocus = () => {
      void refresh().catch(() => undefined);
    };
    window.addEventListener("focus", onFocus);
    const id = window.setInterval(() => {
      void refresh().catch(() => undefined);
    }, 60_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(id);
    };
  }, [refresh]);

  const value = useMemo(() => ({ ...catalog, refresh }), [catalog, refresh]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("Catalog is unavailable");
  return value;
}

type SearchValue = {
  query: string;
  setQuery: (value: string) => void;
  debouncedQuery: string;
};

const SearchContext = createContext<SearchValue | null>(null);

function useDebounced(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 300);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;
    setQuery(new URLSearchParams(window.location.search).get("q") ?? "");
  }, [pathname]);

  const value = useMemo(() => ({ query, setQuery, debouncedQuery }), [query, debouncedQuery]);
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const value = useContext(SearchContext);
  if (!value) throw new Error("Search is unavailable");
  return value;
}

type CartValue = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  add: (product: ProductDTO, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: (silent?: boolean) => void;
};

const CartContext = createContext<CartValue | null>(null);
const CART_KEY = "lks_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { products } = useCatalog();
  const push = useToast();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
      if (Array.isArray(parsed)) {
        setLines(parsed.filter((line) => line && typeof line.productId === "string" && line.quantity > 0));
      }
    } catch {
      setLines([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const add = useCallback(
    (product: ProductDTO, quantity = 1) => {
      if (!product.active || product.stock <= 0) {
        push(`${product.name} is out of stock.`, "error");
        return;
      }
      const existing = lines.find((line) => line.productId === product.id)?.quantity ?? 0;
      if (existing >= product.stock) {
        push(`Only ${product.stock} ${product.name} left.`, "error");
        return;
      }
      const nextQty = Math.min(product.stock, existing + quantity);
      if (existing + quantity > product.stock) push(`Only ${product.stock} ${product.name} left.`, "error");
      setLines((current) => {
        const match = current.find((line) => line.productId === product.id);
        if (!match) return [...current, { productId: product.id, quantity: nextQty }];
        return current.map((line) => (line.productId === product.id ? { ...line, quantity: nextQty } : line));
      });
      push(existing ? `Updated ${product.name}` : `Added ${product.name}`, "success");
    },
    [lines, push],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      const product = products.find((item) => item.id === productId);
      if (quantity <= 0) {
        setLines((current) => current.filter((line) => line.productId !== productId));
        push(`Removed ${product?.name ?? "Item"}`, "info");
        return;
      }
      const capped = product ? Math.min(product.stock, quantity) : quantity;
      if (product && quantity > product.stock) push(`Only ${product.stock} ${product.name} left.`, "error");
      if (product && product.stock <= 0) {
        push(`${product.name} is out of stock.`, "error");
        return;
      }
      setLines((current) => current.map((line) => (line.productId === productId ? { ...line, quantity: capped } : line)));
    },
    [products, push],
  );

  const remove = useCallback(
    (productId: string) => {
      const product = products.find((item) => item.id === productId);
      setLines((current) => current.filter((line) => line.productId !== productId));
      push(`Removed ${product?.name ?? "Item"}`, "info");
    },
    [products, push],
  );

  const clear = useCallback((silent = false) => {
    setLines([]);
    if (!silent) push("Cart cleared", "info");
  }, [push]);

  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const value = useMemo(
    () => ({ lines, ready, count, drawerOpen, setDrawerOpen, add, setQuantity, remove, clear }),
    [lines, ready, count, drawerOpen, add, setQuantity, remove, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("Cart is unavailable");
  return value;
}

export function useResolvedCart() {
  const { lines, ready } = useCart();
  const { products } = useCatalog();
  return {
    ready,
    lines: lines.map((line) => ({
      ...line,
      product: products.find((product) => product.id === line.productId) ?? null,
    })),
  };
}

export function StoreProviders({ catalog, children }: { catalog: Catalog; children: React.ReactNode }) {
  return (
    <CatalogProvider initial={catalog}>
      <SearchProvider>
        <CartProvider>{children}</CartProvider>
      </SearchProvider>
    </CatalogProvider>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/store/product-card";
import { useCart, useCatalog, useSearch } from "@/components/store/providers";
import { fieldClass } from "@/components/ui";
import { searchScore } from "@/lib/search";

const PAGE_SIZE = 12;

export function ShopPage() {
  const { products, categories } = useCatalog();
  const { lines } = useCart();
  const { debouncedQuery, setQuery } = useSearch();
  const [category, setCategory] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<"name" | "price-asc" | "price-desc">("name");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("category");
    if (value) setCategory(value);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [category, inStockOnly, minPrice, maxPrice, sort, debouncedQuery]);

  const filtered = useMemo(() => {
    const min = minPrice === "" ? null : Math.round(Number(minPrice) * 100);
    const max = maxPrice === "" ? null : Math.round(Number(maxPrice) * 100);
    let list = products.filter((product) => {
      if (category !== "all" && product.categorySlug !== category && product.categoryId !== category) return false;
      if (inStockOnly && product.stock <= 0) return false;
      if (min !== null && !Number.isNaN(min) && product.price < min) return false;
      if (max !== null && !Number.isNaN(max) && product.price > max) return false;
      if (debouncedQuery.trim() && searchScore(product, debouncedQuery) === null) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price || a.name.localeCompare(b.name);
      if (sort === "price-desc") return b.price - a.price || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [products, category, inStockOnly, minPrice, maxPrice, sort, debouncedQuery]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const qty = new Map(lines.map((line) => [line.productId, line.quantity]));
  const filtersActive = category !== "all" || inStockOnly || minPrice !== "" || maxPrice !== "" || debouncedQuery.trim() !== "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <div className="sticky z-30 -mx-4 mb-4 border-b border-line bg-background/95 px-4 py-3 backdrop-blur" style={{ top: "var(--store-header-offset, 4.5rem)" }}>
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Categories">
          <CategoryChip active={category === "all"} onClick={() => setCategory("all")}>
            All
          </CategoryChip>
          {categories.map((item) => (
            <CategoryChip key={item.id} active={category === item.slug} onClick={() => setCategory(item.slug)}>
              {item.name}
            </CategoryChip>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-card bg-card p-3 shadow-card lg:flex-row lg:items-end">
        <label className="block text-sm font-semibold">
          Sort
          <select aria-label="Sort products" className={`${fieldClass} mt-1`} value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
            <option value="name">Name A–Z</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Min price (Rs)
          <input className={`${fieldClass} mt-1`} inputMode="decimal" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="0" />
        </label>
        <label className="block text-sm font-semibold">
          Max price (Rs)
          <input className={`${fieldClass} mt-1`} inputMode="decimal" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="500" />
        </label>
        <label className="flex items-center gap-2 pb-3 text-sm font-semibold">
          <input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} />
          In stock only
        </label>
        {filtersActive ? (
          <button
            type="button"
            className="pb-3 text-sm font-bold text-accent-text"
            onClick={() => {
              setCategory("all");
              setInStockOnly(false);
              setMinPrice("");
              setMaxPrice("");
              setQuery("");
            }}
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <p className="mb-3 text-sm text-muted" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "product" : "products"}
        {debouncedQuery.trim() ? ` for “${debouncedQuery.trim()}”` : ""}
      </p>

      {visible.length === 0 ? (
        <div className="rounded-card bg-card p-8 text-center shadow-card">
          <h2 className="text-xl font-extrabold">No results found</h2>
          <p className="mt-2 text-muted">Nothing matched that search. Try another word, or browse a category.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                className="rounded-full bg-background px-3 py-1.5 text-sm font-semibold"
                onClick={() => {
                  setCategory(item.slug);
                  setQuery("");
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} quantity={qty.get(product.id) ?? 0} />
          ))}
        </div>
      )}

      {pages > 1 ? (
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
          <button type="button" className="rounded-full bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>
            Previous
          </button>
          {Array.from({ length: pages }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-current={safePage === index + 1 ? "page" : undefined}
              className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold ${safePage === index + 1 ? "bg-primary text-white" : "bg-white"}`}
              onClick={() => setPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}
          <button type="button" className="rounded-full bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40" disabled={safePage === pages} onClick={() => setPage(safePage + 1)}>
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}

function CategoryChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${active ? "bg-primary text-white" : "bg-white text-ink shadow-sm"}`}
    >
      {children}
    </button>
  );
}

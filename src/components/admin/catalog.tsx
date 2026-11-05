"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client";
import { paiseToRupees, stockLevel } from "@/lib/format";
import type { CategoryDTO, ProductDTO } from "@/lib/types";
import { fieldClass, primaryButton, quietButton, useToast } from "@/components/ui";

type ProductPayload = {
  name: string;
  description: string;
  categoryId: string;
  priceRupees: number;
  unit: string;
  stock: number;
  lowStockThreshold: number;
  image: string;
  keywords: string;
  active: boolean;
};

const emptyForm = (categoryId = ""): ProductPayload => ({
  name: "",
  description: "",
  categoryId,
  priceRupees: 0,
  unit: "",
  stock: 0,
  lowStockThreshold: 5,
  image: "",
  keywords: "",
  active: true,
});

export function ProductsManager() {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<ProductDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const push = useToast();

  async function load() {
    const data = await api<{ products: ProductDTO[]; categories: CategoryDTO[] }>("/api/admin/products", { cache: "no-store" });
    setProducts(data.products);
    setCategories(data.categories);
  }

  useEffect(() => {
    load().catch((error: Error) => setMessage(error.message));
  }, []);

  const visible = useMemo(() => {
    return products.filter((product) => {
      if (categoryId !== "all" && product.categoryId !== categoryId) return false;
      const level = stockLevel(product.stock, product.lowStockThreshold);
      if (stockFilter === "low" && level === "in") return false;
      if (stockFilter === "out" && level !== "out") return false;
      if (query.trim()) {
        const haystack = `${product.name} ${product.keywords} ${product.unit}`.toLowerCase();
        if (!haystack.includes(query.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [products, categoryId, stockFilter, query]);

  async function patch(id: string, body: Record<string, unknown>) {
    const data = await api<{ product: ProductDTO }>(`/api/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    setProducts((current) => current.map((product) => (product.id === id ? data.product : product)));
  }

  async function bulk(action: "hide" | "show" | "delete" | "category", nextCategoryId?: string) {
    if (action === "delete" && !window.confirm(`Delete ${selected.length} products? Past orders keep their item names.`)) return;
    const result = await api<{ count: number }>("/api/admin/products/bulk", {
      method: "POST",
      body: JSON.stringify({ ids: selected, action, categoryId: nextCategoryId }),
    });
    setSelected([]);
    await load();
    push(`Updated ${result.count} products`);
  }

  async function duplicate(id: string) {
    await api(`/api/admin/products/${id}/duplicate`, { method: "POST" });
    await load();
    push("Duplicate saved as hidden");
  }

  async function importCsv(file: File) {
    const form = new FormData();
    form.set("file", file);
    const result = await api<{ created: number; updated: number; failed: { row: number; error: string }[] }>("/api/admin/products/import", {
      method: "POST",
      body: form,
    });
    await load();
    setMessage(`Imported ${result.created} new, updated ${result.updated}.${result.failed.length ? ` ${result.failed.length} rows failed.` : ""}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Products</h1>
        <div className="flex flex-wrap gap-2">
          <a className={quietButton} href="/api/admin/products/export">Export CSV</a>
          <label className={quietButton}>
            Import CSV
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) importCsv(file).catch((error: Error) => push(error.message, "error"));
              event.target.value = "";
            }} />
          </label>
          <button type="button" className={primaryButton} onClick={() => setCreating(true)}>Add product</button>
        </div>
      </div>
      {message ? <p className="rounded-xl bg-background px-3 py-2 text-sm font-semibold">{message}</p> : null}
      <div className="grid gap-3 md:grid-cols-3">
        <input className={fieldClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" aria-label="Search products" />
        <select className={fieldClass} aria-label="Filter by category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="all">All categories</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select className={fieldClass} aria-label="Filter by stock" value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}>
          <option value="all">All stock</option>
          <option value="low">Low and out of stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>
      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-card bg-secondary px-3 py-2 text-sm font-bold text-ink">
          <span>{selected.length} selected</span>
          <button type="button" onClick={() => void bulk("show")}>Show</button>
          <button type="button" onClick={() => void bulk("hide")}>Hide</button>
          <select className="rounded-full bg-white px-2 py-1" aria-label="Move to category" defaultValue="" onChange={(event) => { if (event.target.value) void bulk("category", event.target.value); }}>
            <option value="" disabled>Move to category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <button type="button" onClick={() => void bulk("delete")}>Delete</button>
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-card bg-card shadow-card">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-3"><input type="checkbox" aria-label="Select all visible products" checked={visible.length > 0 && visible.every((product) => selected.includes(product.id))} onChange={(event) => setSelected(event.target.checked ? visible.map((product) => product.id) : [])} /></th>
              {["Product", "Price", "Stock", "Status", ""].map((heading) => <th key={heading} className="px-3 py-3">{heading}</th>)}
            </tr>
          </thead>
          <tbody>
            {visible.map((product) => (
              <tr key={product.id} className="border-t border-line">
                <td className="px-3 py-3">
                  <input type="checkbox" aria-label={`Select ${product.name}`} checked={selected.includes(product.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id))} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <img src={product.image || "/icon.svg"} alt="" className="h-12 w-12 rounded-lg bg-background object-contain" />
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-xs text-muted">{product.categoryName} · {product.unit} · {product.active ? "Shown" : "Hidden"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <input
                    className="w-24 rounded-lg border border-line px-2 py-1"
                    aria-label={`Price for ${product.name}`}
                    defaultValue={paiseToRupees(product.price)}
                    key={`${product.id}-price-${product.price}`}
                    onBlur={(event) => {
                      const priceRupees = Number(event.target.value);
                      if (!Number.isFinite(priceRupees) || Math.round(priceRupees * 100) === product.price) return;
                      patch(product.id, { priceRupees }).catch((error: Error) => push(error.message, "error"));
                    }}
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    className="w-20 rounded-lg border border-line px-2 py-1"
                    aria-label={`Stock for ${product.name}`}
                    type="number"
                    defaultValue={product.stock}
                    key={`${product.id}-stock-${product.stock}`}
                    onBlur={(event) => {
                      const stock = Number(event.target.value);
                      if (!Number.isInteger(stock) || stock === product.stock) return;
                      patch(product.id, { stock }).catch((error: Error) => push(error.message, "error"));
                    }}
                  />
                </td>
                <td className="px-3 py-3">{stockLevel(product.stock, product.lowStockThreshold)}</td>
                <td className="px-3 py-3">
                  <div className="flex gap-2">
                    <button type="button" className="font-bold text-accent-text" onClick={() => setEditing(product)}>Edit</button>
                    <button type="button" className="font-bold" onClick={() => void duplicate(product.id)}>Duplicate</button>
                    <button type="button" className="font-bold text-primary" onClick={() => {
                      if (window.confirm(`Delete ${product.name}?`)) {
                        api(`/api/admin/products/${product.id}`, { method: "DELETE" }).then(load).catch((error: Error) => push(error.message, "error"));
                      }
                    }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">Prices are in rupees. Type a new price or stock and click away to save. The CSV price column is also in rupees.</p>
      {creating ? <ProductForm categories={categories} initial={emptyForm(categories[0]?.id)} title="Add product" onClose={() => setCreating(false)} onSaved={() => { setCreating(false); void load(); }} /> : null}
      {editing ? (
        <ProductForm
          categories={categories}
          title="Edit product"
          initial={{
            name: editing.name,
            description: editing.description,
            categoryId: editing.categoryId,
            priceRupees: paiseToRupees(editing.price),
            unit: editing.unit,
            stock: editing.stock,
            lowStockThreshold: editing.lowStockThreshold,
            image: editing.image,
            keywords: editing.keywords,
            active: editing.active,
          }}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); void load(); }}
          productId={editing.id}
        />
      ) : null}
    </div>
  );
}

function ProductForm({
  title,
  initial,
  categories,
  productId,
  onClose,
  onSaved,
}: {
  title: string;
  initial: ProductPayload;
  categories: CategoryDTO[];
  productId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const push = useToast();

  function set<K extends keyof ProductPayload>(key: K, value: ProductPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onUpload(file: File) {
    setUploading(true);
    try {
      const blob = await compressImage(file);
      const body = new FormData();
      body.set("file", new File([blob], "product.jpg", { type: "image/jpeg" }));
      const result = await api<{ url: string }>("/api/admin/uploads", { method: "POST", body });
      set("image", result.url);
    } catch (err) {
      push(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api(productId ? `/api/admin/products/${productId}` : "/api/admin/products", {
        method: productId ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      push(productId ? "Product saved" : "Product added");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <form onSubmit={save} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-card bg-card p-5 shadow-pop">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm font-bold">Close</button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold md:col-span-2">Name<input className={`${fieldClass} mt-1`} value={form.name} onChange={(event) => set("name", event.target.value)} required /></label>
          <label className="text-sm font-semibold md:col-span-2">Description<textarea className={`${fieldClass} mt-1 min-h-24`} value={form.description} onChange={(event) => set("description", event.target.value)} /></label>
          <label className="text-sm font-semibold">Category
            <select className={`${fieldClass} mt-1`} value={form.categoryId} onChange={(event) => set("categoryId", event.target.value)} required>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">Unit / size<input className={`${fieldClass} mt-1`} value={form.unit} onChange={(event) => set("unit", event.target.value)} required /></label>
          <label className="text-sm font-semibold">Price (Rs)<input className={`${fieldClass} mt-1`} type="number" min="0.01" step="0.01" value={form.priceRupees} onChange={(event) => set("priceRupees", Number(event.target.value))} required /></label>
          <label className="text-sm font-semibold">Stock<input className={`${fieldClass} mt-1`} type="number" min="0" step="1" value={form.stock} onChange={(event) => set("stock", Number(event.target.value))} required /></label>
          <label className="text-sm font-semibold">Low-stock threshold<input className={`${fieldClass} mt-1`} type="number" min="0" step="1" value={form.lowStockThreshold} onChange={(event) => set("lowStockThreshold", Number(event.target.value))} /></label>
          <label className="text-sm font-semibold">Keywords<input className={`${fieldClass} mt-1`} value={form.keywords} onChange={(event) => set("keywords", event.target.value)} /></label>
          <div className="md:col-span-2">
            <p className="text-sm font-semibold">Image</p>
            {form.image ? <img src={form.image} alt="Product preview" className="mt-2 h-28 w-28 rounded-xl bg-background object-contain" /> : null}
            <input className="mt-2 block text-sm" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onUpload(file); }} />
            <p className="mt-1 text-xs text-muted">{uploading ? "Compressing and uploading..." : "JPEG, PNG, or WebP. Compressed to 1200px and kept under 2 MB."}</p>
            {form.image ? <button type="button" className="mt-2 text-sm font-bold text-primary" onClick={() => set("image", "")}>Remove image</button> : null}
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={form.active} onChange={(event) => set("active", event.target.checked)} />
            Visible in the shop
          </label>
        </div>
        {error ? <p className="mt-3 text-sm font-semibold text-primary">{error}</p> : null}
        <button className={`${primaryButton} mt-4`} type="submit">Save product</button>
      </form>
    </div>
  );
}

async function compressImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Image must be under 8 MB before compression.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not compress the image.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) throw new Error("Could not compress the image.");
  if (blob.size > 2 * 1024 * 1024) throw new Error("Image is still over 2 MB after compression.");
  return blob;
}

export function CategoriesManager() {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [name, setName] = useState("");
  const push = useToast();

  async function load() {
    const data = await api<{ categories: CategoryDTO[] }>("/api/admin/categories", { cache: "no-store" });
    setCategories(data.categories);
  }
  useEffect(() => {
    load().catch((error: Error) => push(error.message, "error"));
  }, [push]);

  async function reorder(next: CategoryDTO[]) {
    setCategories(next);
    await api("/api/admin/categories/reorder", { method: "POST", body: JSON.stringify({ ids: next.map((category) => category.id) }) });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-extrabold">Categories</h1>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          api("/api/admin/categories", { method: "POST", body: JSON.stringify({ name }) })
            .then(() => {
              setName("");
              return load();
            })
            .catch((error: Error) => push(error.message, "error"));
        }}
      >
        <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="New category" aria-label="New category" required />
        <button className={primaryButton} type="submit">Add</button>
      </form>
      <ul className="space-y-2">
        {categories.map((category, index) => (
          <li key={category.id} className="flex flex-wrap items-center gap-2 rounded-card bg-card p-3 shadow-card">
            <input
              className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2 font-semibold"
              aria-label={`Rename ${category.name}`}
              defaultValue={category.name}
              key={`${category.id}-${category.name}`}
              onBlur={(event) => {
                const next = event.target.value.trim();
                if (!next || next === category.name) return;
                api(`/api/admin/categories/${category.id}`, { method: "PATCH", body: JSON.stringify({ name: next }) })
                  .then(load)
                  .catch((error: Error) => push(error.message, "error"));
              }}
            />
            <span className="text-xs text-muted">{category.productCount ?? 0} products</span>
            <button type="button" className={quietButton} disabled={index === 0} onClick={() => {
              const next = [...categories];
              [next[index - 1], next[index]] = [next[index], next[index - 1]];
              void reorder(next);
            }}>Up</button>
            <button type="button" className={quietButton} disabled={index === categories.length - 1} onClick={() => {
              const next = [...categories];
              [next[index + 1], next[index]] = [next[index], next[index + 1]];
              void reorder(next);
            }}>Down</button>
            <button type="button" className="text-sm font-bold text-primary" onClick={() => {
              api(`/api/admin/categories/${category.id}`, { method: "DELETE" })
                .then(load)
                .catch((error: Error) => push(error.message, "error"));
            }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SettingsForm() {
  const [form, setForm] = useState<null | {
    storeName: string;
    address: string;
    phone: string;
    email: string;
    hours: import("@/lib/types").HoursMap;
    leadTimeMinutes: number;
    slotMinutes: 15 | 30 | 45 | 60;
    taxEnabled: boolean;
    taxBps: number;
    timezone: string;
  }>(null);
  const [error, setError] = useState("");
  const push = useToast();

  useEffect(() => {
    api<{ settings: NonNullable<typeof form> }>("/api/admin/settings")
      .then((data) => setForm(data.settings))
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <p className="font-semibold text-primary">{error}</p>;
  if (!form) return <div className="skeleton h-64 rounded-card" />;

  const days = [
    ["mon", "Monday"],
    ["tue", "Tuesday"],
    ["wed", "Wednesday"],
    ["thu", "Thursday"],
    ["fri", "Friday"],
    ["sat", "Saturday"],
    ["sun", "Sunday"],
  ] as const;

  return (
    <form
      className="mx-auto max-w-3xl space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        api("/api/admin/settings", { method: "PATCH", body: JSON.stringify(form) })
          .then(() => push("Settings saved"))
          .catch((err: Error) => push(err.message, "error"));
      }}
    >
      <h1 className="text-2xl font-extrabold">Store settings</h1>
      <div className="grid gap-3 rounded-card bg-card p-4 shadow-card md:grid-cols-2">
        <label className="text-sm font-semibold">Store name<input className={`${fieldClass} mt-1`} value={form.storeName} onChange={(event) => setForm({ ...form, storeName: event.target.value })} /></label>
        <label className="text-sm font-semibold">Phone<input className={`${fieldClass} mt-1`} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
        <label className="text-sm font-semibold md:col-span-2">Address<textarea className={`${fieldClass} mt-1 min-h-20`} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
        <label className="text-sm font-semibold">Email<input className={`${fieldClass} mt-1`} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label className="text-sm font-semibold">Timezone<input className={`${fieldClass} mt-1`} value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} /></label>
        <label className="text-sm font-semibold">Lead time (minutes)<input className={`${fieldClass} mt-1`} type="number" min={0} max={720} value={form.leadTimeMinutes} onChange={(event) => setForm({ ...form, leadTimeMinutes: Number(event.target.value) })} /></label>
        <label className="text-sm font-semibold">Slot length
          <select className={`${fieldClass} mt-1`} value={form.slotMinutes} onChange={(event) => setForm({ ...form, slotMinutes: Number(event.target.value) as 15 | 30 | 45 | 60 })}>
            {[15, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={form.taxEnabled} onChange={(event) => setForm({ ...form, taxEnabled: event.target.checked })} />
          Add tax at checkout
        </label>
        <label className="text-sm font-semibold">Tax percent
          <input className={`${fieldClass} mt-1`} type="number" min={0} max={28} step="0.01" value={form.taxBps / 100} onChange={(event) => setForm({ ...form, taxBps: Math.round(Number(event.target.value) * 100) })} />
        </label>
      </div>
      <div className="rounded-card bg-card p-4 shadow-card">
        <h2 className="font-extrabold">Opening hours</h2>
        <div className="mt-3 space-y-2">
          {days.map(([key, label]) => (
            <div key={key} className="grid items-center gap-2 md:grid-cols-[140px_1fr_1fr_auto]">
              <span className="font-semibold">{label}</span>
              <input className={fieldClass} type="time" disabled={form.hours[key].closed} value={form.hours[key].open} onChange={(event) => setForm({ ...form, hours: { ...form.hours, [key]: { ...form.hours[key], open: event.target.value } } })} />
              <input className={fieldClass} type="time" disabled={form.hours[key].closed} value={form.hours[key].close} onChange={(event) => setForm({ ...form, hours: { ...form.hours, [key]: { ...form.hours[key], close: event.target.value } } })} />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={form.hours[key].closed} onChange={(event) => setForm({ ...form, hours: { ...form.hours, [key]: { ...form.hours[key], closed: event.target.checked } } })} />
                Closed
              </label>
            </div>
          ))}
        </div>
      </div>
      <button className={primaryButton} type="submit">Save settings</button>
    </form>
  );
}

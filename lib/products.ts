import type { Product, SizeKey } from "./products-types";
import { ALL_SIZES, emptyDeliveryOptions } from "./products-types";

export type { SizeKey, SizePricing, DeliveryOptions, Product } from "./products-types";
export { ALL_SIZES, emptyDeliveryOptions } from "./products-types";

type DataShape = { products: Product[] };

// ─── Helpers migration ───────────────────────────────────────────────────────

function migrateProduct(p: Product): Product {
  const legacy = p as unknown as {
    editionType?: "original" | "reproduction";
    originalPrice?: number;
    digitalPrice?: number;
    pricesBySize?: Record<string, number>;
    enabledSizes?: string[];
  };

  if (legacy.editionType === "original" && p.type === "print") p.type = "original";
  if (p.wallPreviewEnabled === undefined) p.wallPreviewEnabled = false;
  if (p.editionTotal === undefined) p.editionTotal = 0;
  if (p.editionSold === undefined) p.editionSold = 0;

  if (!p.delivery) {
    const d = emptyDeliveryOptions();
    if (legacy.enabledSizes?.length && legacy.pricesBySize) {
      d.print.enabled = true;
      for (const s of legacy.enabledSizes as SizeKey[]) {
        d.print.sizes[s] = { enabled: true, price: legacy.pricesBySize[s] || 0 };
      }
    }
    if (legacy.digitalPrice) { d.email.enabled = true; d.email.price = legacy.digitalPrice; }
    if (legacy.originalPrice) { d.original.enabled = true; d.original.price = legacy.originalPrice; }
    if (p.type === "bd" || p.type === "autre") {
      d.print.enabled = true;
      for (const s of ALL_SIZES) d.print.sizes[s] = { enabled: true, price: (p as unknown as {price?: number}).price || 0 };
    }
    p.delivery = d;
  }

  if (p.delivery) {
    const sizeModes = ["print", "canvas", "printEmail", "originalPrint", "originalPrintEmail"] as const;
    for (const mode of sizeModes) {
      if (p.delivery[mode]?.sizes) {
        for (const s of ALL_SIZES) {
          if (!p.delivery[mode].sizes[s]) p.delivery[mode].sizes[s] = { enabled: false, price: 0 };
        }
      }
    }
    if (!p.delivery.canvas) {
      p.delivery.canvas = { enabled: false, sizes: Object.fromEntries(ALL_SIZES.map(s => [s, { enabled: false, price: 0 }])) as never };
    }
  }

  if (p.temporaryUntil && new Date(p.temporaryUntil).getTime() < Date.now()) p.active = false;
  if (p.retireAt && new Date(p.retireAt).getTime() < Date.now()) p.active = false;
  if (p.isNew && p.createdAt) {
    if (Date.now() - new Date(p.createdAt).getTime() > 3 * 24 * 60 * 60 * 1000) p.isNew = false;
  }

  return p;
}

// ─── Supabase ou JSON selon l'environnement ──────────────────────────────────

const USE_SUPABASE = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);

async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}

async function readDataAsync(): Promise<DataShape> {
  if (USE_SUPABASE) {
    try {
      const sb = await getSupabase();
      const { data, error } = await sb.from("products").select("data").order("created_at", { ascending: false });
      if (error) throw error;
      const products = (data || []).map((row: { data: Product }) => migrateProduct(row.data));
      return { products };
    } catch { /* fallback JSON */ }
  }
  // Fallback JSON local
  const fs = await import("fs");
  const path = await import("path");
  const DATA_PATH = path.join(process.cwd(), "data", "products.json");
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const data = JSON.parse(raw) as DataShape;
    data.products = data.products.map(migrateProduct);
    return data;
  } catch { return { products: [] }; }
}

function readDataSync(): DataShape {
  const fs = require("fs");
  const path = require("path");
  const DATA_PATH = path.join(process.cwd(), "data", "products.json");
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const data = JSON.parse(raw) as DataShape;
    data.products = data.products.map(migrateProduct);
    return data;
  } catch { return { products: [] }; }
}

async function writeProductToSupabase(product: Product) {
  const sb = await getSupabase();
  await sb.from("products").upsert({ id: product.id, data: product, created_at: product.createdAt });
}

async function deleteProductFromSupabase(id: string) {
  const sb = await getSupabase();
  await sb.from("products").delete().eq("id", id);
}

// ─── API publique ─────────────────────────────────────────────────────────────

export async function getAllProductsAsync(): Promise<Product[]> {
  return (await readDataAsync()).products;
}

export async function getActiveProductsAsync(): Promise<Product[]> {
  return (await readDataAsync()).products.filter(p => p.active);
}

export async function getProductByIdAsync(id: string): Promise<Product | undefined> {
  return (await readDataAsync()).products.find(p => p.id === id);
}

// Sync fallback pour les endroits qui ne peuvent pas être async
export function getAllProducts(): Product[] { return readDataSync().products; }
export function getActiveProducts(): Product[] { return readDataSync().products.filter(p => p.active); }
export function getProductById(id: string): Product | undefined { return readDataSync().products.find(p => p.id === id); }
export function getFeaturedProduct(): Product | undefined {
  const active = getActiveProducts();
  return active.find(p => p.featured) || active[0];
}

export async function createProduct(input: Omit<Product, "id" | "createdAt">): Promise<Product> {
  const product: Product = {
    ...input,
    id: "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString(),
  };

  if (USE_SUPABASE) {
    // Désactiver featured sur les autres si nécessaire
    if (input.featured) {
      const sb = await getSupabase();
      const { data: all } = await sb.from("products").select("id, data");
      for (const row of (all || [])) {
        if (row.data.featured) {
          row.data.featured = false;
          await sb.from("products").upsert({ id: row.id, data: row.data });
        }
      }
    }
    await writeProductToSupabase(product);
  } else {
    // JSON local
    const fs = require("fs");
    const path = require("path");
    const DATA_PATH = path.join(process.cwd(), "data", "products.json");
    const data = readDataSync();
    if (input.featured) data.products.forEach(p => p.featured = false);
    data.products.unshift(product);
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
  }

  return product;
}

export async function updateProduct(id: string, updates: Partial<Omit<Product, "id" | "createdAt">>): Promise<Product | null> {
  if (USE_SUPABASE) {
    const sb = await getSupabase();
    const { data: row } = await sb.from("products").select("data").eq("id", id).single();
    if (!row) return null;
    if (updates.featured) {
      const { data: all } = await sb.from("products").select("id, data");
      for (const r of (all || [])) {
        if (r.id !== id && r.data.featured) {
          r.data.featured = false;
          await sb.from("products").upsert({ id: r.id, data: r.data });
        }
      }
    }
    const updated = { ...row.data, ...updates };
    await sb.from("products").upsert({ id, data: updated, created_at: updated.createdAt });
    return updated;
  } else {
    const fs = require("fs");
    const path = require("path");
    const DATA_PATH = path.join(process.cwd(), "data", "products.json");
    const data = readDataSync();
    const idx = data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    if (updates.featured) data.products.forEach(p => { if (p.id !== id) p.featured = false; });
    data.products[idx] = { ...data.products[idx], ...updates };
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
    return data.products[idx];
  }
}

export async function incrementEditionSold(id: string, qty: number): Promise<Product | null> {
  return updateProduct(id, {} as never).then(async () => {
    const p = await getProductByIdAsync(id);
    if (!p) return null;
    return updateProduct(id, { editionSold: (p.editionSold || 0) + qty } as never);
  });
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (USE_SUPABASE) {
    await deleteProductFromSupabase(id);
    return true;
  } else {
    const fs = require("fs");
    const path = require("path");
    const DATA_PATH = path.join(process.cwd(), "data", "products.json");
    const data = readDataSync();
    const before = data.products.length;
    data.products = data.products.filter(p => p.id !== id);
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
    return data.products.length < before;
  }
}

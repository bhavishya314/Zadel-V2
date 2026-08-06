/**
 * Product Catalog — admin-ready storefront data layer
 *
 * Future Firestore shape:
 *   products/{productId}  (published: true | false)
 *
 * Shop page reads only published products via paginated queries.
 * Admin add / publish / unpublish / delete flows through this module.
 * No fixed product limit — supports unlimited catalog size.
 */

import type { Category, Product } from './types';
import { products as seedProducts } from './products';

const ADMIN_PRODUCTS_KEY = 'zadel-admin-products';
const PAGE_SIZE = 8;

export type ShopSortKey =
  | 'featured'
  | 'price-asc'
  | 'price-desc'
  | 'name'
  | 'bestsellers'
  | 'discount';

export interface ShopQuery {
  category?: Category | 'All' | string;
  q?: string;
  sort?: ShopSortKey;
  /** 0-based page index for infinite scroll */
  page: number;
  pageSize?: number;
}

export interface ShopPageResult {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  /** Next page index to request, or null when exhausted */
  nextPage: number | null;
}

function normalizeProduct(p: Product): Product {
  return {
    ...p,
    published: p.published !== false,
  };
}

function readAdminProducts(): Product[] {
  try {
    const raw = localStorage.getItem(ADMIN_PRODUCTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Product[];
    return Array.isArray(parsed) ? parsed.map(normalizeProduct) : [];
  } catch {
    return [];
  }
}

/**
 * Full catalog merge: seed collection + admin-managed products.
 * Admin entries override seed products with the same id.
 */
function getAllCatalogProducts(): Product[] {
  const seed = seedProducts.map(normalizeProduct);
  const admin = typeof window !== 'undefined' ? readAdminProducts() : [];

  const byId = new Map<string, Product>();
  for (const p of seed) byId.set(p.id, p);
  for (const p of admin) byId.set(p.id, normalizeProduct(p));

  return Array.from(byId.values());
}

/** Storefront-only: published products, unlimited length. */
export function getPublishedProducts(): Product[] {
  return getAllCatalogProducts().filter((p) => p.published !== false);
}

export function applyFilters(
  list: Product[],
  { category, q, sort = 'featured' }: Omit<ShopQuery, 'page' | 'pageSize'>
): Product[] {
  let result = [...list];

  if (category && category !== 'All') {
    result = result.filter((p) => p.category === category);
  }

  if (q?.trim()) {
    const query = q.trim().toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.tags?.some((t) => t.includes(query)) ||
        p.description.toLowerCase().includes(query)
    );
  }

  switch (sort) {
    case 'price-asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'name':
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'bestsellers':
      result.sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller));
      break;
    case 'discount':
      result.sort((a, b) => b.discount - a.discount);
      break;
    default:
      result.sort((a, b) => {
        const feat = Number(b.featured) - Number(a.featured);
        if (feat !== 0) return feat;
        const aTime = a.createdAt || a.id;
        const bTime = b.createdAt || b.id;
        return bTime.localeCompare(aTime);
      });
  }

  return result;
}

/**
 * Paginated shop query — does NOT load the entire catalog into the UI.
 * Replace internals with Firestore cursor pagination when admin is live.
 */
export async function fetchShopPage(
  query: ShopQuery,
  customProducts?: Product[]
): Promise<ShopPageResult> {
  const pageSize = query.pageSize ?? PAGE_SIZE;
  const page = Math.max(0, query.page);

  // Simulate network latency for skeleton UX (lightweight)
  await new Promise((r) => setTimeout(r, page === 0 ? 150 : 100));

  const baseProducts =
    customProducts && customProducts.length > 0
      ? customProducts
      : getPublishedProducts();

  const filtered = applyFilters(baseProducts, query);
  const total = filtered.length;
  const start = page * pageSize;
  const items = filtered.slice(start, start + pageSize);
  const hasMore = start + items.length < total;

  return {
    items,
    page,
    pageSize,
    total,
    hasMore,
    nextPage: hasMore ? page + 1 : null,
  };
}

/** Single product lookup (published only for storefront). */
export function getPublishedProductById(id: string): Product | undefined {
  return getPublishedProducts().find((p) => p.id === id);
}

/** Related products from the full published catalog (unlimited pool). */
export function getRelatedPublishedProducts(product: Product, limit = 4): Product[] {
  const pool = getPublishedProducts();
  return pool
    .filter((p) => p.id !== product.id && p.category === product.category)
    .concat(pool.filter((p) => p.id !== product.id && p.category !== product.category))
    .slice(0, limit);
}

/**
 * Admin helpers — ready for dashboard integration.
 * Writing here automatically surfaces on Shop (if published).
 */
export function adminUpsertProduct(product: Product): Product {
  const next = normalizeProduct({
    ...product,
    updatedAt: new Date().toISOString(),
    createdAt: product.createdAt || new Date().toISOString(),
  });
  const admin = readAdminProducts();
  const idx = admin.findIndex((p) => p.id === next.id);
  if (idx >= 0) admin[idx] = next;
  else admin.push(next);
  localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(admin));
  return next;
}

export function adminSetPublished(productId: string, published: boolean): void {
  const existing =
    getAllCatalogProducts().find((p) => p.id === productId) ||
    readAdminProducts().find((p) => p.id === productId);
  if (!existing) return;
  adminUpsertProduct({ ...existing, published });
}

export function adminDeleteProduct(productId: string): void {
  const admin = readAdminProducts().filter((p) => p.id !== productId);
  // Tombstone seed products as unpublished via admin override
  const seed = seedProducts.find((p) => p.id === productId);
  if (seed) {
    admin.push(normalizeProduct({ ...seed, published: false }));
  }
  localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(admin));
}

export const SHOP_PAGE_SIZE = PAGE_SIZE;

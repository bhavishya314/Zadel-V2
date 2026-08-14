import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton, ProductSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import {
  SHOP_PAGE_SIZE,
  fetchShopPage,
  getPublishedProducts,
  type ShopSortKey,
} from '../lib/productCatalog';
import { subscribeToProducts, subscribeToCategories } from '../lib/firebase';
import type { Category, Product } from '../lib/types';
import { getOptimizedImageUrl } from '../lib/cloudinary';

export default function Shop() {
  const [params, setParams] = useSearchParams();

  const [availableCategories, setAvailableCategories] = useState<string[]>(['All']);

  /** Subscribe to real-time Firestore categories */
  useEffect(() => {
    const unsubscribe = subscribeToCategories((cats) => {
      if (cats && cats.length > 0) {
        setAvailableCategories(['All', ...cats.map((c) => c.name)]);
      } else {
        setAvailableCategories(['All']);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const category = (params.get('category') as Category | 'All') || 'All';
  const q = params.get('q') || '';
  const sort = (params.get('sort') as ShopSortKey) || 'featured';

  const categoryScrollerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [canPrevCategory, setCanPrevCategory] = useState(false);
  const [canNextCategory, setCanNextCategory] = useState(false);

  /** All published products from Firestore / catalog */
  const [allCatalogProducts, setAllCatalogProducts] = useState<Product[]>([]);

  /** Accumulated products from infinite scroll — no fixed cap */
  const [items, setItems] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const requestIdRef = useRef(0);
  const loadingMoreRef = useRef(false);

  /** Subscribe to real-time Firestore updates for published products */
  useEffect(() => {
    const unsubscribe = subscribeToProducts((firestoreProducts) => {
      if (firestoreProducts && firestoreProducts.length > 0) {
        const mapped: Product[] = firestoreProducts
          .filter((fp) => fp.published !== false)
          .map((fp) => ({
            id: fp.id,
            name: fp.name,
            price: fp.price,
            originalPrice: fp.originalPrice,
            discount: fp.discount,
            category: fp.category as Category,
            description: fp.description,
            sizes: fp.sizes,
            images: fp.images,
            featured: Boolean(fp.featured),
            bestSeller: Boolean(fp.bestSeller),
            published: fp.published !== false,
            createdAt: fp.createdAt,
            updatedAt: fp.updatedAt,
            tags: fp.tags,
          }));
        setAllCatalogProducts(mapped);
      } else {
        setAllCatalogProducts([]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const updateCategoryArrows = useCallback(() => {
    const el = categoryScrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const left = el.scrollLeft;
    setCanPrevCategory(left > 4);
    setCanNextCategory(maxScroll > 4 && left < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = categoryScrollerRef.current;
    if (!el) return;

    updateCategoryArrows();

    const onScroll = () => updateCategoryArrows();
    el.addEventListener('scroll', onScroll, { passive: true });

    const ro = new ResizeObserver(() => updateCategoryArrows());
    ro.observe(el);
    window.addEventListener('resize', updateCategoryArrows);

    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
      window.removeEventListener('resize', updateCategoryArrows);
    };
  }, [updateCategoryArrows]);

  const scrollCategories = (direction: -1 | 1) => {
    const el = categoryScrollerRef.current;
    if (!el) return;
    const firstPill = el.querySelector<HTMLElement>('[data-category-pill]');
    const styles = window.getComputedStyle(el);
    const gap = parseFloat(styles.columnGap || styles.gap || '8') || 8;
    const amount = firstPill ? firstPill.offsetWidth + gap : el.clientWidth * 0.55;
    el.scrollBy({ left: direction * amount * 2, behavior: 'smooth' });
  };

  /** Reset + load first page whenever filters or products change */
  useEffect(() => {
    const reqId = ++requestIdRef.current;
    setInitialLoading(true);
    setItems([]);
    setPage(0);
    setHasMore(true);
    loadingMoreRef.current = false;

    void (async () => {
      const result = await fetchShopPage(
        {
          category,
          q,
          sort,
          page: 0,
          pageSize: SHOP_PAGE_SIZE,
        },
        allCatalogProducts
      );
      if (reqId !== requestIdRef.current) return;
      setItems(result.items);
      setHasMore(result.hasMore);
      setPage(0);
      setTotal(result.total);
      setInitialLoading(false);
    })();
  }, [category, q, sort, allCatalogProducts]);

  /** Preload above-the-fold shop product images in parallel */
  useEffect(() => {
    if (items.length > 0) {
      const top4 = items.slice(0, 4);
      const head = document.head;
      const links: HTMLLinkElement[] = [];

      top4.forEach((p) => {
        const raw = p.images?.[0];
        if (raw) {
          const url = getOptimizedImageUrl(raw, { width: 600 });
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = url;
          (link as any).fetchPriority = 'high';
          head.appendChild(link);
          links.push(link);
        }
      });

      return () => {
        links.forEach((l) => {
          if (head.contains(l)) head.removeChild(l);
        });
      };
    }
  }, [items]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore || initialLoading) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;
    const reqId = requestIdRef.current;

    try {
      const result = await fetchShopPage(
        {
          category,
          q,
          sort,
          page: nextPage,
          pageSize: SHOP_PAGE_SIZE,
        },
        allCatalogProducts
      );
      if (reqId !== requestIdRef.current) return;

      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const appended = result.items.filter((p) => !seen.has(p.id));
        return [...prev, ...appended];
      });
      setHasMore(result.hasMore);
      setPage(nextPage);
      setTotal(result.total);
    } finally {
      if (reqId === requestIdRef.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [category, q, sort, page, hasMore, initialLoading, allCatalogProducts]);

  /** Infinite scroll sentinel */
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || initialLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { root: null, rootMargin: '280px 0px', threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, initialLoading, hasMore]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'All') {
      if (key === 'category' && (!value || value === 'All')) next.delete('category');
      else if (key === 'sort' && (!value || value === 'featured')) next.delete('sort');
      else if (key === 'q' && !value) next.delete('q');
      else if (value) next.set(key, value);
      else next.delete(key);
    } else {
      next.set(key, value);
    }
    next.delete('min');
    next.delete('max');
    setParams(next, { replace: true });
  };

  const clearFilters = () => {
    setParams({}, { replace: true });
  };

  const hasActiveFilters =
    (category && category !== 'All') || !!q || (sort && sort !== 'featured');

  return (
    <div className="pt-24 md:pt-28">
      <div className="mx-auto max-w-7xl px-5 pb-20 md:px-8 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-7 text-center md:mb-9"
        >
          <p className="mb-3 text-[11px] font-medium tracking-[0.3em] text-zadel-gold uppercase">
            Collection
          </p>
          <h1 className="font-display text-4xl tracking-wide text-foreground md:text-5xl">Shop</h1>
        </motion.div>

        {/* Toolbar */}
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-xl xl:max-w-2xl">
            <button
              type="button"
              aria-label="Previous categories"
              disabled={!canPrevCategory}
              onClick={() => scrollCategories(-1)}
              className={`icon-btn absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/15 bg-zadel-black/80 text-foreground backdrop-blur-md lg:flex ${
                canPrevCategory
                  ? 'left-0 -translate-x-1/2 opacity-100 hover:border-zadel-gold/50 hover:text-zadel-gold'
                  : 'left-0 -translate-x-1/2 cursor-not-allowed opacity-30'
              }`}
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>

            <button
              type="button"
              aria-label="Next categories"
              disabled={!canNextCategory}
              onClick={() => scrollCategories(1)}
              className={`icon-btn absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/15 bg-zadel-black/80 text-foreground backdrop-blur-md lg:flex ${
                canNextCategory
                  ? 'right-0 translate-x-1/2 opacity-100 hover:border-zadel-gold/50 hover:text-zadel-gold'
                  : 'right-0 translate-x-1/2 cursor-not-allowed opacity-30'
              }`}
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>

            <div
              ref={categoryScrollerRef}
              className="category-carousel flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-smooth lg:snap-none lg:overflow-x-hidden lg:px-5"
            >
              {availableCategories.map((c) => {
                const active = (c === 'All' && (!category || category === 'All')) || category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    data-category-pill
                    onClick={() => updateParam('category', c === 'All' ? null : c)}
                    className={`chip-luxury shrink-0 snap-start rounded-full px-4 py-2 text-[11px] tracking-[0.15em] uppercase ${
                      active
                        ? 'bg-zadel-gold font-semibold text-zadel-ink shadow-[0_4px_14px_rgba(196,165,116,0.25)]'
                        : 'border border-foreground/20 font-medium text-foreground/80 hover:border-foreground/40 hover:text-foreground'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="appearance-none rounded-full border border-foreground/10 bg-zadel-surface/40 px-4 py-2.5 pr-8 text-[11px] tracking-wider text-foreground/70 uppercase outline-none"
            >
              <option value="featured">Featured</option>
              <option value="bestsellers">Best Sellers</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="discount">Highest Discount</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] tracking-[0.15em] text-zadel-gold uppercase transition hover:text-foreground"
            >
              Clear filters
            </button>
          </div>
        )}

        {initialLoading ? (
          <ProductGridSkeleton count={SHOP_PAGE_SIZE} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No pieces found"
            description="Try adjusting your filters or search terms to discover more of the collection."
            actionLabel="Reset filters"
            onAction={clearFilters}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
              {items.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} priority={i < 4} />
              ))}
            </div>

            {/* Infinite scroll sentinel + elegant skeletons */}
            <div ref={loadMoreRef} className="mt-10" aria-hidden={!hasMore}>
              {loadingMore && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ProductSkeleton key={`more-skel-${i}`} />
                  ))}
                </div>
              )}
            </div>

            {!hasMore && total > 0 && (
              <p className="mt-12 text-center text-[11px] tracking-[0.2em] text-foreground/30 uppercase">
                End of collection
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

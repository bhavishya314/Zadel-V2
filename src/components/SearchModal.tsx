import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatINR } from '../lib/products';
import { getPublishedProducts } from '../lib/productCatalog';
import { getOptimizedImageUrl } from '../lib/cloudinary';

export default function SearchModal() {
  const { isSearchOpen, setSearchOpen } = useStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    if (isSearchOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSearchOpen, setSearchOpen]);

  const results = useMemo(() => {
    const catalog = getPublishedProducts();
    const q = query.trim().toLowerCase();
    if (!q) return catalog.slice(0, 6);
    return catalog.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.includes(q)) ||
        p.description.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/80 px-4 pt-[12vh] backdrop-blur-md"
          onClick={() => setSearchOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-foreground/10 bg-zadel-elevated shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-foreground/5 px-5 py-4">
              <Search size={18} className="text-zadel-gold" strokeWidth={1.5} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pieces, categories..."
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/30"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-foreground/40 transition hover:text-foreground"
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto py-2">
              {results.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-foreground/40">
                  No pieces match “{query}”
                </p>
              ) : (
                results.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-4 px-5 py-3 transition hover:bg-foreground/5"
                  >
                    <img
                      src={getOptimizedImageUrl(product.images?.[0] || '/images/placeholder.svg', { width: 150 })}
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/placeholder.svg';
                      }}
                      className="h-14 w-11 rounded-md object-cover bg-black"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{product.name}</p>
                      <p className="text-xs text-foreground/40">{product.category}</p>
                    </div>
                    <span className="text-sm text-zadel-gold">{formatINR(product.price)}</span>
                  </Link>
                ))
              )}
            </div>

            <div className="border-t border-foreground/5 px-5 py-3">
              <Link
                to={query ? `/shop?q=${encodeURIComponent(query)}` : '/shop'}
                onClick={() => setSearchOpen(false)}
                className="text-[11px] tracking-[0.18em] text-foreground/45 uppercase transition hover:text-zadel-gold"
              >
                View all results →
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

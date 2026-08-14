import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatINR } from '../lib/products';
import { getPublishedProducts } from '../lib/productCatalog';
import { getOptimizedImageUrl } from '../lib/cloudinary';
import EmptyState from './EmptyState';

export default function WishlistDrawer() {
  const { isWishlistOpen, setWishlistOpen, wishlist, toggleWishlist } = useStore();
  const items = getPublishedProducts().filter((p) => wishlist.includes(p.id));

  return (
    <AnimatePresence>
      {isWishlistOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            onClick={() => setWishlistOpen(false)}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l border-foreground/5 bg-zadel-elevated"
          >
            <div className="flex items-center justify-between border-b border-foreground/5 px-6 py-5">
              <h2 className="font-display text-xl tracking-wide text-foreground">Wishlist</h2>
              <button
                type="button"
                onClick={() => setWishlistOpen(false)}
                className="flex h-9 w-9 items-center justify-center text-foreground/60 transition hover:text-foreground"
                aria-label="Close wishlist"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <EmptyState
                  icon={Heart}
                  title="Wishlist is empty"
                  description="Save pieces you love and revisit them anytime."
                  actionLabel="Explore Shop"
                  actionTo="/shop"
                  onAction={() => setWishlistOpen(false)}
                />
              ) : (
                <ul className="divide-y divide-foreground/5 px-6">
                  {items.map((product) => (
                    <li key={product.id} className="flex gap-4 py-5">
                      <Link
                        to={`/product/${product.id}`}
                        onClick={() => setWishlistOpen(false)}
                        className="h-28 w-22 shrink-0 overflow-hidden rounded-lg bg-zadel-surface"
                      >
                        <img
                          src={getOptimizedImageUrl(product.images?.[0] || '/images/placeholder.svg', { width: 200 })}
                          alt={product.name}
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/images/placeholder.svg';
                          }}
                          className="h-full w-full object-cover bg-black"
                        />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              to={`/product/${product.id}`}
                              onClick={() => setWishlistOpen(false)}
                              className="font-display text-base text-foreground transition hover:text-zadel-gold"
                            >
                              {product.name}
                            </Link>
                            <p className="mt-1 text-sm text-foreground/70">{formatINR(product.price)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleWishlist(product.id)}
                            className="text-zadel-gold transition hover:text-foreground"
                            aria-label="Remove from wishlist"
                          >
                            <Heart size={18} fill="currentColor" />
                          </button>
                        </div>
                        <Link
                          to={`/product/${product.id}`}
                          onClick={() => setWishlistOpen(false)}
                          className="mt-auto self-start text-[11px] tracking-[0.15em] text-foreground/50 uppercase transition hover:text-zadel-gold"
                        >
                          View product →
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

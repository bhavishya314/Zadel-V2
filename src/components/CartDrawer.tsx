import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatINR } from '../lib/products';
import EmptyState from './EmptyState';

import { getOptimizedImageUrl } from '../lib/cloudinary';

export default function CartDrawer() {
  const {
    isCartOpen,
    setCartOpen,
    setCheckoutOpen,
    cart,
    cartTotal,
    updateQuantity,
    removeFromCart,
  } = useStore();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l border-foreground/5 bg-zadel-elevated shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-foreground/5 px-6 py-5">
              <h2 className="font-display text-xl tracking-wide text-foreground">Your Bag</h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="flex h-9 w-9 items-center justify-center text-foreground/60 transition hover:text-foreground"
                aria-label="Close cart"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="Your bag is empty"
                  description="Discover pieces crafted for quiet luxury and add them to your bag."
                  actionLabel="Shop Collection"
                  actionTo="/shop"
                  onAction={() => setCartOpen(false)}
                />
              ) : (
                <ul className="divide-y divide-foreground/5 px-6">
                  {cart.map((item) => (
                    <li key={`${item.product.id}-${item.size}`} className="flex gap-4 py-5">
                      <Link
                        to={`/product/${item.product.id}`}
                        onClick={() => setCartOpen(false)}
                        className="h-28 w-22 shrink-0 overflow-hidden rounded-lg bg-zadel-surface"
                      >
                        <img
                          src={getOptimizedImageUrl(item.product.images?.[0] || '/images/placeholder.svg', { width: 200 })}
                          alt={item.product.name}
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
                              to={`/product/${item.product.id}`}
                              onClick={() => setCartOpen(false)}
                              className="font-display text-base text-foreground transition hover:text-zadel-gold"
                            >
                              {item.product.name}
                            </Link>
                            <p className="mt-1 text-xs text-foreground/40">Size {item.size}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id, item.size)}
                            className="text-foreground/30 transition hover:text-foreground"
                            aria-label="Remove"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="flex items-center rounded-full border border-foreground/10">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.product.id, item.size, item.quantity - 1)
                              }
                              className="flex h-8 w-8 items-center justify-center text-foreground/60 hover:text-foreground"
                              aria-label="Decrease"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center text-sm text-foreground">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.product.id, item.size, item.quantity + 1)
                              }
                              className="flex h-8 w-8 items-center justify-center text-foreground/60 hover:text-foreground"
                              aria-label="Increase"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {formatINR(item.product.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-foreground/5 px-6 py-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-foreground/50">Subtotal</span>
                  <span className="font-display text-xl text-foreground">{formatINR(cartTotal)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                  className="btn-luxury w-full rounded-full bg-zadel-gold py-3.5 text-[11px] font-semibold tracking-[0.18em] text-zadel-ink uppercase transition hover:bg-zadel-gold-light"
                >
                  Pay Online
                </button>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="mt-3 w-full py-2 text-[11px] tracking-[0.18em] text-foreground/50 uppercase transition hover:text-foreground"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

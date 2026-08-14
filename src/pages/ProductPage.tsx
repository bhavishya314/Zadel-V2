import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Heart, Minus, Plus, ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import ProductReviews from '../components/ProductReviews';
import FadeImage from '../components/FadeImage';
import { formatINR } from '../lib/products';
import {
  getPublishedProductById,
  getRelatedPublishedProducts,
} from '../lib/productCatalog';
import { getProduct, getDefaultSizesForCategory } from '../lib/firebase';
import { useStore } from '../context/StoreContext';
import { luxuryEase } from '../lib/motion';
import type { Category, Product } from '../lib/types';
import { getOptimizedImageUrl } from '../lib/cloudinary';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useStore();

  const [product, setProduct] = useState<Product | undefined>(() =>
    id ? getPublishedProductById(id) : undefined
  );
  const [loading, setLoading] = useState<boolean>(true);

  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    if (!id) {
      setProduct(undefined);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function loadFirestoreProduct() {
      try {
        const fp = await getProduct(id);
        if (!isMounted) return;

        if (fp) {
          if (fp.published === false) {
            setProduct(undefined);
          } else {
            const mapped: Product = {
              id: fp.id,
              name: fp.name,
              price: fp.price,
              originalPrice: fp.originalPrice,
              discount: fp.discount,
              category: fp.category as Category,
              description: fp.description,
              sizes:
                Array.isArray(fp.sizes) && fp.sizes.length > 0
                  ? fp.sizes
                  : getDefaultSizesForCategory(fp.category),
              images: fp.images,
              featured: Boolean(fp.featured),
              bestSeller: Boolean(fp.bestSeller),
              published: fp.published !== false,
              stock: typeof fp.stock === 'number' ? fp.stock : fp.inStock ? 10 : 0,
              createdAt: fp.createdAt,
              updatedAt: fp.updatedAt,
              tags: fp.tags,
            };
            setProduct(mapped);
          }
        } else {
          // Fall back to local catalog product if document not in Firestore
          const fallback = getPublishedProductById(id);
          setProduct(fallback);
        }
      } catch (err) {
        console.error('Error loading product from Firestore:', err);
        const fallback = getPublishedProductById(id);
        setProduct(fallback);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFirestoreProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (product) {
      setSize('');
      setQty(1);
      setActiveImage(0);
      setSizeError(false);

      // Preload primary product image immediately with high priority
      if (product.images && product.images.length > 0) {
        const head = document.head;
        const url = getOptimizedImageUrl(product.images[0], { width: 1000 });
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        (link as any).fetchPriority = 'high';
        head.appendChild(link);
        return () => {
          if (head.contains(link)) head.removeChild(link);
        };
      }
    }
  }, [product?.id]);

  const related = useMemo(
    () => (product ? getRelatedPublishedProducts(product) : []),
    [product]
  );

  if (loading && !product) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-24 text-center">
        <p className="text-sm tracking-widest text-foreground/45 uppercase animate-pulse">
          Loading collection piece...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-24 text-center">
        <h1 className="font-display text-3xl text-foreground">Piece not found</h1>
        <p className="mt-3 text-sm text-foreground/45">This item may have left the collection.</p>
        <Link
          to="/shop"
          className="btn-luxury mt-8 rounded-full bg-zadel-gold px-8 py-3 text-[11px] font-semibold tracking-[0.2em] text-zadel-ink uppercase"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const wished = isInWishlist(product.id);
  const rawImages =
    product.images && product.images.length > 0 && product.images.some(Boolean)
      ? product.images.filter(Boolean)
      : ['/images/placeholder.svg'];

  const images =
    rawImages.length > 1
      ? rawImages
      : [rawImages[0], rawImages[0], rawImages[0]];

  const ensureSize = () => {
    if (!size) {
      setSizeError(true);
      return false;
    }
    return true;
  };

  const handleAdd = () => {
    if (!ensureSize()) return;
    addToCart(product, size, qty);
  };

  return (
    <div className="pt-20 md:pt-24">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-16">
        <nav className="mb-8 text-xs tracking-wide text-foreground/35">
          <Link to="/" className="hover:text-foreground/60">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-foreground/60">
            Shop
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground/60">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: luxuryEase }}
          >
            <div className="relative overflow-hidden rounded-2xl bg-zadel-surface">
              <div className="aspect-[3/4]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: luxuryEase }}
                    className="h-full w-full"
                  >
                    <FadeImage
                      src={getOptimizedImageUrl(images[activeImage], { width: 1000 })}
                      alt={product.name}
                      priority={true}
                      className="h-full w-full object-cover"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`overflow-hidden rounded-xl border-2 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    activeImage === i
                      ? 'border-zadel-gold opacity-100'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="aspect-[3/4] bg-black">
                    <img
                      src={getOptimizedImageUrl(src, { width: 300 })}
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/placeholder.svg';
                      }}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: luxuryEase }}
            className="flex flex-col lg:pt-4"
          >
            <p className="text-[11px] tracking-[0.25em] text-zadel-gold uppercase">
              {product.category}
            </p>
            <h1 className="mt-3 font-display text-3xl tracking-wide text-foreground md:text-4xl lg:text-5xl">
              {product.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="font-display text-2xl text-foreground">{formatINR(product.price)}</span>
              {product.originalPrice > product.price && (
                <>
                  <span className="text-lg text-foreground/30 line-through">
                    {formatINR(product.originalPrice)}
                  </span>
                  <span className="rounded-full bg-zadel-gold/15 px-2.5 py-1 text-[11px] font-medium tracking-wider text-zadel-gold">
                    {product.discount}% OFF
                  </span>
                </>
              )}
            </div>

            <p className="mt-8 text-sm leading-relaxed text-foreground/50">{product.description}</p>

            {/* Sizes */}
            <div className="mt-10">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] tracking-[0.2em] text-foreground/50 uppercase">Select Size</p>
                {sizeError && (
                  <p className="text-xs text-red-400">Please select a size</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(product.sizes && product.sizes.length > 0
                  ? product.sizes
                  : getDefaultSizesForCategory(product.category)
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSize(s);
                      setSizeError(false);
                    }}
                    className={`chip-luxury min-w-[3rem] rounded-lg border px-4 py-2.5 text-sm ${
                      size === s
                        ? 'border-zadel-gold bg-zadel-gold text-zadel-ink'
                        : 'border-foreground/15 text-foreground/70 hover:border-foreground/40'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] tracking-[0.2em] text-foreground/50 uppercase">Quantity</p>
                {typeof product.stock === 'number' && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        product.stock > 0 ? 'bg-emerald-500' : 'bg-red-400'
                      }`}
                    />
                    <span className="text-foreground/60">
                      {product.stock > 0
                        ? `In Stock (${product.stock} available)`
                        : 'Out of Stock'}
                    </span>
                  </div>
                )}
              </div>
              <div className="inline-flex items-center rounded-full border border-foreground/15">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-11 w-11 items-center justify-center text-foreground/60 hover:text-foreground"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center text-sm text-foreground">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(10, q + 1))}
                  className="flex h-11 w-11 items-center justify-center text-foreground/60 hover:text-foreground"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAdd}
                className="btn-luxury inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-zadel-solid py-3.5 text-[11px] font-semibold tracking-[0.2em] text-zadel-on-solid uppercase hover:bg-zadel-gold hover:text-zadel-ink"
              >
                <ShoppingBag size={16} strokeWidth={1.75} />
                Add to Cart
              </button>
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`icon-btn inline-flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-full border sm:self-auto ${
                  wished
                    ? 'border-zadel-gold bg-zadel-gold text-zadel-ink'
                    : 'border-foreground/15 text-foreground/70 hover:border-zadel-gold hover:text-zadel-gold'
                }`}
                aria-label="Wishlist"
              >
                <Heart size={18} fill={wished ? 'currentColor' : 'none'} strokeWidth={1.5} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="mt-10 self-start text-[11px] tracking-[0.15em] text-foreground/40 uppercase transition hover:text-zadel-gold"
            >
              ← Continue shopping
            </button>
          </motion.div>
        </div>

        <ProductReviews productId={product.id} />

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-24 md:mt-32">
            <div className="mb-10">
              <p className="mb-2 text-[11px] tracking-[0.3em] text-zadel-gold uppercase">
                You may also like
              </p>
              <h2 className="font-display text-3xl tracking-wide text-foreground">Related Pieces</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

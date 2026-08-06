import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '../lib/types';
import { formatINR } from '../lib/products';
import { useStore } from '../context/StoreContext';
import { luxuryEase } from '../lib/motion';
import FadeImage from './FadeImage';

interface Props {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: Props) {
  const { toggleWishlist, isInWishlist } = useStore();
  const wished = isInWishlist(product.id);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay: (index % 4) * 0.07, ease: luxuryEase }}
      className="group"
    >
      <div className="product-card-media relative overflow-hidden rounded-xl bg-zadel-surface">
        <Link to={`/product/${product.id}`} className="block aspect-[3/4] overflow-hidden">
          <FadeImage
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="product-card-img h-full w-full object-cover"
          />
        </Link>

        {product.discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-medium tracking-wider text-zadel-gold backdrop-blur-sm">
            −{product.discount}%
          </span>
        )}

        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          className={`wishlist-float icon-btn absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm ${
            wished
              ? 'bg-zadel-gold text-zadel-ink opacity-100'
              : 'is-idle bg-black/60 text-white hover:bg-zadel-gold hover:text-zadel-ink'
          }`}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={15} fill={wished ? 'currentColor' : 'none'} strokeWidth={1.5} />
        </button>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden">
          <Link
            to={`/product/${product.id}`}
            className="btn-luxury pointer-events-auto flex w-full items-center justify-center rounded-lg bg-zadel-solid/95 py-2.5 text-[11px] font-medium tracking-[0.18em] text-zadel-ink uppercase backdrop-blur-sm hover:bg-zadel-gold"
          >
            View
          </Link>
        </div>
      </div>

      <div className="mt-4 space-y-1.5 px-0.5">
        <p className="text-[10px] tracking-[0.2em] text-foreground/40 uppercase">{product.category}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="font-display text-lg tracking-wide text-foreground transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-zadel-gold">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-foreground">{formatINR(product.price)}</span>
          {product.originalPrice > product.price && (
            <span className="text-sm text-foreground/35 line-through">
              {formatINR(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

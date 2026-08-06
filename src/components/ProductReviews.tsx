import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star } from 'lucide-react';
import {
  INITIAL_VISIBLE_REVIEWS,
  LOAD_MORE_PAGE_SIZE,
  fetchProductReviews,
  submitProductReview,
  type ProductReview,
  type ProductReviewSummary,
} from '../lib/productReviews';
import { useStore } from '../context/StoreContext';

interface Props {
  productId: string;
}

function StarRating({
  value,
  size = 16,
  interactive = false,
  onChange,
}: {
  value: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const display = interactive && hover > 0 ? hover : value;

  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => interactive && setHover(0)}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`${value} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const filled = starValue <= Math.round(display);
        if (!interactive) {
          return (
            <Star
              key={starValue}
              size={size}
              className={filled ? 'fill-zadel-gold text-zadel-gold' : 'text-foreground/20'}
              strokeWidth={1.5}
            />
          );
        }
        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(starValue)}
            onFocus={() => setHover(starValue)}
            onClick={() => onChange?.(starValue)}
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-foreground/5"
          >
            <Star
              size={size + 4}
              className={
                filled
                  ? 'fill-zadel-gold text-zadel-gold'
                  : 'text-foreground/25 hover:text-zadel-gold/60'
              }
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}

function ReviewCard({ review, index }: { review: ProductReview; index: number }) {
  const initials = review.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.25) }}
      className="rounded-2xl border border-foreground/5 bg-zadel-surface/30 p-5 md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zadel-gold/25 text-[11px] tracking-wider text-zadel-gold">
            {initials}
          </div>
          <div>
            <p className="text-sm text-foreground">{review.name}</p>
            <p className="text-xs text-foreground/30">
              {new Date(review.date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <StarRating value={review.rating} size={14} />
      </div>
      {review.title && (
        <p className="mt-4 font-display text-lg tracking-wide text-foreground">{review.title}</p>
      )}
      <p className={`text-sm leading-relaxed text-foreground/55 ${review.title ? 'mt-2' : 'mt-4'}`}>
        {review.text}
      </p>
    </motion.li>
  );
}

export default function ProductReviews({ productId }: Props) {
  const { showToast } = useStore();

  /** Full collection for this productId only */
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ProductReviewSummary>({
    productId,
    averageRating: 0,
    totalReviews: 0,
  });
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_REVIEWS);
  const [loading, setLoading] = useState(true);

  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  const loadReviews = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const payload = await fetchProductReviews(id);
      // Guard against stale responses when navigating between products quickly
      if (payload.productId !== id) return;
      setReviews(payload.reviews);
      setSummary(payload.summary);
      setVisibleCount(INITIAL_VISIBLE_REVIEWS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setExpanded(false);
    setName('');
    setRating(0);
    setTitle('');
    setText('');
    void loadReviews(productId);
  }, [productId, loadReviews]);

  const visibleReviews = useMemo(
    () => reviews.slice(0, visibleCount),
    [reviews, visibleCount]
  );

  const hasMore = visibleCount < reviews.length;

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_PAGE_SIZE, reviews.length));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter your name');
      return;
    }
    if (rating < 1) {
      showToast('Please select a star rating');
      return;
    }
    if (!text.trim()) {
      showToast('Please write your review');
      return;
    }

    const created = await submitProductReview({
      productId,
      name: name.trim(),
      rating,
      title: title.trim() || undefined,
      text: text.trim(),
    });

    // Prepend to this product's list only; refresh summary from product-scoped set
    setReviews((prev) => {
      const next = [created, ...prev.filter((r) => r.productId === productId)];
      const total = next.reduce((sum, r) => sum + r.rating, 0);
      setSummary({
        productId,
        averageRating: Math.round((total / next.length) * 10) / 10,
        totalReviews: next.length,
      });
      return next;
    });

    setVisibleCount((prev) => Math.max(prev, INITIAL_VISIBLE_REVIEWS));
    setName('');
    setRating(0);
    setTitle('');
    setText('');
    setExpanded(false);
    showToast('Thank you — your review has been added');
  };

  const { averageRating, totalReviews } = summary;

  return (
    <section className="mt-16 border-t border-foreground/5 pt-14 md:mt-20 md:pt-16">
      <div className="mb-8 md:mb-10">
        <h2 className="font-display text-3xl tracking-wide text-foreground md:text-4xl">
          Customer Reviews
        </h2>

        {!loading && totalReviews === 0 ? (
          <div className="mt-6 flex flex-col items-start gap-3">
            <StarRating value={0} size={18} />
            <p className="font-display text-xl text-foreground/80">No reviews yet.</p>
            <p className="text-sm text-foreground/40">
              Be the first to share your experience.
            </p>
          </div>
        ) : (
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <StarRating value={averageRating} size={18} />
            <span className="font-display text-2xl text-foreground">
              {totalReviews === 0 ? '0.0' : averageRating.toFixed(1)}
            </span>
            <span className="text-sm text-foreground/40">
              {totalReviews} Review{totalReviews === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      <div className="mb-10">
        <p className="mb-4 text-[11px] font-medium tracking-[0.25em] text-zadel-gold uppercase">
          Write a Review
        </p>

        <div className="overflow-hidden rounded-2xl border border-foreground/8 bg-zadel-surface/40">
          {!expanded && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="w-full px-5 py-5 text-left text-sm text-foreground/35 transition hover:bg-foreground/[0.03] hover:text-foreground/50 md:px-7 md:py-6"
            >
              Share your experience with this product...
            </button>
          )}

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="review-form"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <form onSubmit={onSubmit} className="space-y-5 px-5 py-6 md:px-7 md:py-8">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-foreground/70">Share your experience with this product</p>
                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      className="text-[11px] tracking-[0.15em] text-foreground/35 uppercase transition hover:text-foreground/70"
                    >
                      Close
                    </button>
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] tracking-[0.15em] text-foreground/40 uppercase">
                      Your Name *
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-foreground/10 bg-zadel-black/40 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-foreground/25 focus:border-zadel-gold/40"
                      placeholder="Name"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] tracking-[0.15em] text-foreground/40 uppercase">
                      Rating *
                    </label>
                    <StarRating value={rating} interactive size={18} onChange={setRating} />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] tracking-[0.15em] text-foreground/40 uppercase">
                      Review Title{' '}
                      <span className="normal-case tracking-normal text-foreground/25">(Optional)</span>
                    </label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-xl border border-foreground/10 bg-zadel-black/40 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-foreground/25 focus:border-zadel-gold/40"
                      placeholder="Sum up your experience"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] tracking-[0.15em] text-foreground/40 uppercase">
                      Your Review *
                    </label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={4}
                      className="w-full resize-none rounded-xl border border-foreground/10 bg-zadel-black/40 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-foreground/25 focus:border-zadel-gold/40"
                      placeholder="Share your experience with this product..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-luxury rounded-full bg-zadel-gold px-8 py-3 text-[11px] font-semibold tracking-[0.2em] text-zadel-ink uppercase hover:bg-zadel-gold-light"
                  >
                    Submit Review
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {visibleReviews.length > 0 && (
        <>
          <ul className="flex flex-col gap-4">
            {visibleReviews.map((review, i) => (
              <ReviewCard key={review.id} review={review} index={i} />
            ))}
          </ul>

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                className="btn-luxury rounded-full border border-foreground/15 px-8 py-3 text-[11px] font-medium tracking-[0.2em] text-foreground/70 uppercase hover:border-zadel-gold/50 hover:text-zadel-gold"
              >
                Load More Reviews
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

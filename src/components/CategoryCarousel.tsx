import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { categories } from '../lib/products';
import { luxuryEase } from '../lib/motion';
import FadeImage from './FadeImage';

export default function CategoryCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const left = el.scrollLeft;
    setCanPrev(left > 4);
    setCanNext(left < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateArrows();

    const onScroll = () => updateArrows();
    el.addEventListener('scroll', onScroll, { passive: true });

    const ro = new ResizeObserver(() => updateArrows());
    ro.observe(el);

    window.addEventListener('resize', updateArrows);

    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows]);

  const scrollByCard = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>('[data-category-card]');
    if (!firstCard) return;

    const styles = window.getComputedStyle(el);
    const gap = parseFloat(styles.columnGap || styles.gap || '20') || 20;
    const amount = firstCard.offsetWidth + gap;

    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Previous categories"
        disabled={!canPrev}
        onClick={() => scrollByCard(-1)}
        className={`icon-btn absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/15 bg-zadel-black/70 text-foreground backdrop-blur-md lg:flex ${
          canPrev
            ? 'left-0 -translate-x-1/2 opacity-100 hover:border-zadel-gold/50 hover:text-zadel-gold'
            : 'left-0 -translate-x-1/2 cursor-not-allowed opacity-30'
        }`}
      >
        <ChevronLeft size={20} strokeWidth={1.5} />
      </button>

      <button
        type="button"
        aria-label="Next categories"
        disabled={!canNext}
        onClick={() => scrollByCard(1)}
        className={`icon-btn absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/15 bg-zadel-black/70 text-foreground backdrop-blur-md lg:flex ${
          canNext
            ? 'right-0 translate-x-1/2 opacity-100 hover:border-zadel-gold/50 hover:text-zadel-gold'
            : 'right-0 translate-x-1/2 cursor-not-allowed opacity-30'
        }`}
      >
        <ChevronRight size={20} strokeWidth={1.5} />
      </button>

      <div
        ref={scrollerRef}
        className="category-carousel flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth pb-1 md:gap-5 lg:snap-none lg:overflow-x-hidden"
      >
        {categories.map((cat, i) => (
          <motion.div
            key={cat.name}
            data-category-card
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(i * 0.08, 0.32), duration: 0.55, ease: luxuryEase }}
            className="w-[calc((100%-0.75rem)/1.2)] shrink-0 snap-start sm:w-[calc((100%-0.75rem)/1.2)] md:w-[calc((100%-2.5rem)/2.5)] lg:w-[calc((100%-2.5rem)/3)] xl:w-[calc((100%-3.75rem)/4)]"
          >
            <Link
              to={`/shop?category=${encodeURIComponent(cat.name)}`}
              className="group relative block aspect-[4/5] overflow-hidden rounded-xl shadow-none transition-shadow duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            >
              <FadeImage
                src={cat.image}
                alt={cat.name}
                loading="lazy"
                draggable={false}
                className="category-card-img h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="category-card-title font-display text-xl tracking-wide text-white group-hover:text-white">
                  {cat.name}
                </p>
                <p className="mt-1 text-xs text-white/50 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-zadel-gold">
                  {cat.description}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

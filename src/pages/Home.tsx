import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import SectionHeading from '../components/SectionHeading';
import CategoryCarousel from '../components/CategoryCarousel';
import FadeImage from '../components/FadeImage';
import { getPublishedProducts } from '../lib/productCatalog';
import { getProducts, subscribeToSettings } from '../lib/firebase';
import type { Category, Product } from '../lib/types';
import { heroChild, heroCta, heroParent, luxuryEase } from '../lib/motion';
import { getOptimizedImageUrl } from '../lib/cloudinary';

export default function Home() {
  const [products, setProducts] = useState<Product[]>(() => getPublishedProducts());
  const [heroBg, setHeroBg] = useState<string>('/images/placeholder-hero.svg');
  const [heroBrandText, setHeroBrandText] = useState<string>('ZADEL');
  const [heroHeadline, setHeroHeadline] = useState<string>('Quiet luxury.');
  const [heroHeadlineLine2, setHeroHeadlineLine2] = useState<string>('Endlessly worn.');
  const [heroCtaText, setHeroCtaText] = useState<string>('Shop Collection');
  const [heroCtaLink, setHeroCtaLink] = useState<string>('/shop');

  const optimizedHeroBg = getOptimizedImageUrl(heroBg, { width: 1600 });

  // Preload hero image and above-the-fold product images immediately & in parallel
  useEffect(() => {
    const head = document.head;
    const preloadLinks: HTMLLinkElement[] = [];

    // Preload Hero image with high priority
    if (optimizedHeroBg && optimizedHeroBg !== '/images/placeholder-hero.svg') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = optimizedHeroBg;
      (link as any).fetchPriority = 'high';
      head.appendChild(link);
      preloadLinks.push(link);
    }

    // Preload top 4 featured product images in parallel
    const topFeatured = products.filter((p) => p.published !== false && p.featured).slice(0, 4);
    topFeatured.forEach((p) => {
      const raw = p.images?.[0];
      if (raw) {
        const url = getOptimizedImageUrl(raw, { width: 600 });
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        (link as any).fetchPriority = 'high';
        head.appendChild(link);
        preloadLinks.push(link);
      }
    });

    return () => {
      preloadLinks.forEach((l) => {
        if (head.contains(l)) head.removeChild(l);
      });
    };
  }, [optimizedHeroBg, products]);

  useEffect(() => {
    const unsub = subscribeToSettings((settings) => {
      if (settings.heroImage) {
        setHeroBg(settings.heroImage);
      } else if (settings.heroImages && settings.heroImages.length > 0) {
        setHeroBg(settings.heroImages[0]);
      } else {
        setHeroBg('/images/placeholder-hero.svg');
      }

      if (settings.heroBrandText) setHeroBrandText(settings.heroBrandText);
      if (settings.heroHeadline) setHeroHeadline(settings.heroHeadline);
      if (settings.heroHeadlineLine2 !== undefined) setHeroHeadlineLine2(settings.heroHeadlineLine2);
      if (settings.heroCtaText) setHeroCtaText(settings.heroCtaText);
      if (settings.heroCtaLink) setHeroCtaLink(settings.heroCtaLink);
    });

    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadFirestoreProducts() {
      try {
        const firestoreData = await getProducts();
        if (!isMounted) return;

        if (firestoreData && firestoreData.length > 0) {
          const mappedProducts: Product[] = firestoreData.map((fp) => ({
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
          setProducts(mappedProducts);
        }
      } catch (err) {
        console.error('Failed to fetch products from Firestore:', err);
      }
    }

    loadFirestoreProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter only published products
  const publishedProducts = products.filter((p) => p.published !== false);

  const featured = publishedProducts.filter((p) => p.featured).slice(0, 4);
  const bestSellers = publishedProducts.filter((p) => p.bestSeller).slice(0, 4);

  const shopMore = [...publishedProducts].sort((a, b) => {
    const order = ['Women', 'Men', 'Outerwear', 'Accessories'] as const;
    const catDiff = order.indexOf(a.category) - order.indexOf(b.category);
    if (catDiff !== 0) return catDiff;
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      {/* Hero */}
      <section className="hero-overlay relative flex h-[52vh] items-center overflow-hidden md:h-[60vh] lg:h-[70vh]">
        <div className="absolute inset-0">
          <FadeImage
            src={optimizedHeroBg}
            alt="Zadel luxury fashion"
            priority={true}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zadel-black via-zadel-black/55 to-zadel-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-zadel-black/50 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zadel-black via-zadel-black/70 to-transparent md:h-32" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-center px-5 py-10 md:px-8 md:py-12">
          <motion.div
            variants={heroParent}
            initial="hidden"
            animate="visible"
            className="flex max-w-2xl flex-col items-center text-center"
          >
            <motion.p
              variants={heroChild}
              className="mb-5 font-display text-2xl tracking-[0.4em] text-white md:mb-6 md:text-3xl lg:text-4xl"
            >
              {heroBrandText}
            </motion.p>
            <motion.h1
              variants={heroChild}
              className="font-display text-4xl leading-[1.08] tracking-wide text-white sm:text-5xl md:text-5xl lg:text-6xl"
            >
              {heroHeadline}
              {heroHeadlineLine2 && (
                <>
                  <br />
                  <span className="text-white/70">{heroHeadlineLine2}</span>
                </>
              )}
            </motion.h1>
            <motion.div variants={heroCta} className="mt-8 md:mt-10">
              <Link
                to={heroCtaLink}
                className="btn-luxury inline-flex items-center gap-2 rounded-full bg-zadel-gold px-6 py-2.5 text-[10px] font-semibold tracking-[0.22em] text-zadel-ink uppercase md:px-7 md:py-3 md:text-[11px]"
              >
                {heroCtaText}
                <ArrowRight size={13} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-5 pt-12 pb-20 md:px-8 md:pt-16 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: luxuryEase }}
          className="mb-8 flex flex-col items-center gap-3 text-center md:mb-10 md:gap-4"
        >
          <h2 className="whitespace-nowrap font-display text-[1.85rem] leading-none tracking-wide text-foreground sm:text-[2.25rem] md:text-[2.75rem]">
            Featured Collections
          </h2>
          <Link
            to="/shop"
            className="text-[11px] font-medium tracking-[0.22em] text-foreground/60 uppercase transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-zadel-gold"
          >
            View All →
          </Link>
        </motion.div>
        <div className="mx-auto grid max-w-6xl grid-cols-2 justify-items-stretch gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} priority={true} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-zadel-surface/30 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeading eyebrow="Explore" title="Shop by Category" align="center" />
          <CategoryCarousel />
        </div>
      </section>

      {/* Best Sellers */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: luxuryEase }}
          className="mb-8 flex flex-col items-center gap-3 text-center md:mb-10 md:gap-4"
        >
          <h2 className="whitespace-nowrap font-display text-[1.85rem] leading-none tracking-wide text-foreground sm:text-[2.25rem] md:text-[2.75rem]">
            Best Sellers
          </h2>
          <Link
            to="/shop?sort=bestsellers"
            className="text-[11px] font-medium tracking-[0.22em] text-foreground/60 uppercase transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-zadel-gold"
          >
            Shop Bestsellers →
          </Link>
        </motion.div>
        <div className="mx-auto grid max-w-6xl grid-cols-2 justify-items-stretch gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {bestSellers.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} priority={false} />
          ))}
        </div>
      </section>

      {/* Shop More */}
      <section className="border-t border-foreground/5 bg-zadel-surface/20">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: luxuryEase }}
            className="mb-8 flex flex-col items-center text-center md:mb-10"
          >
            <h2 className="whitespace-nowrap font-display text-[1.85rem] leading-none tracking-wide text-foreground sm:text-[2.25rem] md:text-[2.75rem]">
              Shop More
            </h2>
          </motion.div>

          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {shopMore.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} priority={false} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08, ease: luxuryEase }}
            className="mt-14 flex justify-center md:mt-16"
          >
            <Link
              to="/shop"
              className="btn-luxury inline-flex items-center gap-2 rounded-full bg-zadel-gold px-8 py-3.5 text-[11px] font-semibold tracking-[0.22em] text-zadel-ink uppercase"
            >
              View All Products
              <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

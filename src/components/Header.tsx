import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Heart, Menu, Moon, Search, ShoppingBag, Sun, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { luxuryEase, navFade } from '../lib/motion';
import { subscribeToSettings } from '../lib/firebase';

const links = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const {
    cartCount,
    wishlistCount,
    setCartOpen,
    setSearchOpen,
    setWishlistOpen,
  } = useStore();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [brandName, setBrandName] = useState('ZADEL');
  const [brandLogo, setBrandLogo] = useState('');
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = subscribeToSettings((data) => {
      setBrandName(data.brandName || data.storeName || 'ZADEL');
      setBrandLogo(data.logo || '');
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const solidHeader = scrolled || mobileOpen || theme === 'light';

  return (
    <motion.header
      variants={navFade}
      initial="hidden"
      animate="visible"
      className={`theme-surface fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        solidHeader
          ? 'border-b border-foreground/5 bg-zadel-black/95 backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
        <button
          type="button"
          className="icon-btn flex h-10 w-10 items-center justify-center text-foreground/80 hover:text-zadel-gold md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="relative flex h-5 w-5 items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mobileOpen ? 'close' : 'menu'}
                initial={{ opacity: 0, rotate: -40, scale: 0.85 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 40, scale: 0.85 }}
                transition={{ duration: 0.22, ease: luxuryEase }}
                className="absolute"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </motion.span>
            </AnimatePresence>
          </span>
        </button>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `text-[11px] font-medium tracking-[0.22em] uppercase transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isActive ? 'text-zadel-gold' : 'text-foreground/70 hover:text-foreground'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Center Brand Logo / Name */}
        <Link
          to="/"
          className="flex items-center justify-center transition-opacity hover:opacity-85 my-auto"
        >
          {brandLogo ? (
            <img
              src={brandLogo}
              alt={brandName}
              className="h-7 md:h-9 max-w-[140px] md:max-w-[200px] object-contain"
            />
          ) : (
            <span className="font-display text-xl md:text-2xl font-bold tracking-[0.2em] text-foreground uppercase">
              {brandName}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="icon-btn flex h-10 w-10 items-center justify-center text-foreground/75 hover:text-zadel-gold"
            aria-label="Search"
          >
            <Search size={18} strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="icon-btn hidden h-10 w-10 items-center justify-center text-foreground/75 hover:text-zadel-gold md:flex"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
                transition={{ duration: 0.25, ease: luxuryEase }}
                className="flex"
              >
                {theme === 'dark' ? (
                  <Sun size={18} strokeWidth={1.5} />
                ) : (
                  <Moon size={18} strokeWidth={1.5} />
                )}
              </motion.span>
            </AnimatePresence>
          </button>

          <button
            type="button"
            onClick={() => setWishlistOpen(true)}
            className="icon-btn relative flex h-10 w-10 items-center justify-center text-foreground/75 hover:text-zadel-gold"
            aria-label="Wishlist"
          >
            <Heart size={18} strokeWidth={1.5} />
            <AnimatePresence>
              {wishlistCount > 0 && (
                <motion.span
                  key={wishlistCount}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.22, ease: luxuryEase }}
                  className="count-badge absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-zadel-gold px-1 text-[10px] font-semibold text-zadel-ink"
                >
                  {wishlistCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="icon-btn relative flex h-10 w-10 items-center justify-center text-foreground/75 hover:text-zadel-gold"
            aria-label="Cart"
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.22, ease: luxuryEase }}
                  className="count-badge absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-zadel-gold px-1 text-[10px] font-semibold text-zadel-ink"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: luxuryEase }}
              className="fixed inset-0 top-16 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.32, ease: luxuryEase }}
              className="theme-surface relative z-50 border-t border-foreground/5 bg-zadel-black md:hidden"
            >
              <nav className="flex flex-col px-6 py-8">
                {links.map((link, i) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.35, ease: luxuryEase }}
                  >
                    <NavLink
                      to={link.to}
                      end={link.to === '/'}
                      className={({ isActive }) =>
                        `block border-b border-foreground/5 py-4 text-sm tracking-[0.2em] uppercase transition-colors duration-300 ${
                          isActive ? 'text-zadel-gold' : 'text-foreground/80'
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + links.length * 0.05, duration: 0.35, ease: luxuryEase }}
                >
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="icon-btn mt-2 flex w-full items-center justify-between border-b border-foreground/5 py-4 text-sm tracking-[0.2em] text-foreground/80 uppercase hover:text-zadel-gold"
                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    {theme === 'dark' ? (
                      <Sun size={18} strokeWidth={1.5} />
                    ) : (
                      <Moon size={18} strokeWidth={1.5} />
                    )}
                  </button>
                </motion.div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

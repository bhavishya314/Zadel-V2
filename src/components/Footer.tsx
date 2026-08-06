import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { luxuryEase } from '../lib/motion';
import {
  getContactSettings,
  hasValue,
  type ContactInformation,
} from '../lib/contactSettings';
import { subscribeToContact } from '../lib/firebase';

export default function Footer() {
  const [settings, setSettings] = useState<ContactInformation>(() =>
    getContactSettings()
  );

  useEffect(() => {
    const unsubscribe = subscribeToContact((firestoreContact) => {
      let instaUrl = firestoreContact.instagram || '';
      if (
        instaUrl &&
        !instaUrl.startsWith('http://') &&
        !instaUrl.startsWith('https://')
      ) {
        instaUrl = `https://instagram.com/${instaUrl.replace(/^@/, '')}`;
      }

      setSettings({
        instagramUrl: instaUrl,
        whatsappNumber:
          firestoreContact.whatsappNumber || firestoreContact.whatsapp || '',
        storeAddress:
          firestoreContact.storeAddress || firestoreContact.address || '',
        phoneNumber:
          firestoreContact.phoneNumber || firestoreContact.phone || '',
        emailAddress:
          firestoreContact.supportEmail || firestoreContact.email || '',
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <motion.footer
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: luxuryEase }}
      className="theme-surface border-t border-foreground/5 bg-zadel-black"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <h4 className="mb-5 text-[11px] font-medium tracking-[0.25em] text-zadel-gold uppercase">
              Navigate
            </h4>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'Home' },
                { to: '/shop', label: 'Shop' },
                { to: '/contact', label: 'Contact' },
              ].map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-foreground/55 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-[11px] font-medium tracking-[0.25em] text-zadel-gold uppercase">
              Collections
            </h4>
            <ul className="space-y-3">
              {['Men', 'Women', 'Outerwear', 'Accessories'].map((c) => (
                <li key={c}>
                  <Link
                    to={`/shop?category=${encodeURIComponent(c)}`}
                    className="text-sm text-foreground/55 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-foreground"
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-[11px] font-medium tracking-[0.25em] text-zadel-gold uppercase">
              Contact
            </h4>
            <ul className="space-y-4 text-sm text-foreground/55">
              {hasValue(settings.storeAddress) && (
                <li className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-zadel-gold/80" />
                  <span className="whitespace-pre-line">{settings.storeAddress}</span>
                </li>
              )}
              {hasValue(settings.phoneNumber) && (
                <li className="flex items-center gap-3">
                  <Phone size={16} className="shrink-0 text-zadel-gold/80" />
                  <span>{settings.phoneNumber}</span>
                </li>
              )}
              {hasValue(settings.emailAddress) && (
                <li className="flex items-center gap-3">
                  <Mail size={16} className="shrink-0 text-zadel-gold/80" />
                  <span>{settings.emailAddress}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-foreground/5 pt-8 sm:flex-row">
          <p className="text-xs tracking-wide text-foreground/35">
            © {new Date().getFullYear()} Zadel. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-foreground/35">
            <span className="cursor-default transition-colors duration-300 hover:text-foreground/60">
              Privacy
            </span>
            <span className="cursor-default transition-colors duration-300 hover:text-foreground/60">
              Terms
            </span>
            <span className="cursor-default transition-colors duration-300 hover:text-foreground/60">
              Shipping
            </span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}

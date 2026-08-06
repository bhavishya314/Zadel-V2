import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import {
  buildWhatsAppLink,
  getContactSettings,
  hasValue,
  type ContactInformation,
} from '../lib/contactSettings';
import { subscribeToContact } from '../lib/firebase';

export default function Contact() {
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

  const cards = useMemo(() => {
    const items: Array<{
      key: string;
      icon: typeof Instagram;
      title: string;
      body: string;
      action?: { label: string; href: string };
    }> = [];

    if (hasValue(settings.instagramUrl)) {
      items.push({
        key: 'instagram',
        icon: Instagram,
        title: 'DM us on Instagram',
        body: "Have a question? Send us a message on Instagram and we'll get back to you.",
        action: {
          label: 'Open Instagram',
          href: settings.instagramUrl,
        },
      });
    }

    if (hasValue(settings.whatsappNumber)) {
      items.push({
        key: 'whatsapp',
        icon: MessageCircle,
        title: 'Chat with us on WhatsApp',
        body: 'Need quick assistance? Start a conversation directly on WhatsApp.',
        action: {
          label: 'Chat on WhatsApp',
          href: buildWhatsAppLink(settings.whatsappNumber),
        },
      });
    }

    if (hasValue(settings.storeAddress)) {
      items.push({
        key: 'address',
        icon: MapPin,
        title: 'Visit Our Store',
        body: settings.storeAddress,
      });
    }

    if (hasValue(settings.phoneNumber)) {
      items.push({
        key: 'phone',
        icon: Phone,
        title: 'Call Us',
        body: settings.phoneNumber,
      });
    }

    if (hasValue(settings.emailAddress)) {
      items.push({
        key: 'email',
        icon: Mail,
        title: 'Email Us',
        body: settings.emailAddress,
      });
    }

    return items;
  }, [settings]);

  return (
    <div className="pt-20 md:pt-24">
      <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
        <div className="mb-14 text-center md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-3 text-[11px] font-medium tracking-[0.3em] text-zadel-gold uppercase">
              Connect
            </p>
            <h1 className="font-display text-4xl tracking-wide text-foreground md:text-5xl">Contact</h1>
            <p className="mx-auto mt-4 max-w-md text-sm text-foreground/45">
              Styling advice, orders, or atelier appointments — we are here.
            </p>
          </motion.div>
        </div>

        {cards.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-foreground/40"
          >
            Contact details will appear here once published in Website Settings.
          </motion.p>
        ) : (
          <div className="flex flex-col gap-5">
            {cards.map((card, i) => {
              const Icon = card.icon;
              const isExternal =
                card.action?.href.startsWith('http') ||
                card.action?.href.startsWith('https');

              return (
                <motion.article
                  key={card.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.06 }}
                  className="contact-action rounded-2xl border border-foreground/5 bg-zadel-surface/40 p-6 md:p-8"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <div className="contact-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-foreground/10 text-zadel-gold">
                        <Icon size={20} strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-display text-xl tracking-wide text-foreground md:text-2xl">
                          {card.title}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-foreground/50 whitespace-pre-line">
                          {card.body}
                        </p>
                      </div>
                    </div>

                    {card.action &&
                      (card.key === 'instagram' || card.key === 'whatsapp') && (
                        <a
                          href={card.action.href}
                          target={isExternal ? '_blank' : undefined}
                          rel={isExternal ? 'noopener noreferrer' : undefined}
                          className="btn-luxury inline-flex shrink-0 items-center justify-center self-start rounded-full bg-zadel-gold px-6 py-2.5 text-[10px] font-semibold tracking-[0.2em] text-zadel-ink uppercase hover:bg-zadel-gold-light sm:self-center"
                        >
                          {card.action.label}
                        </a>
                      )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

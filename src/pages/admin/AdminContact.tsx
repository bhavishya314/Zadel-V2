import React, { useEffect, useState } from 'react';
import { Mail, ShieldCheck } from 'lucide-react';
import { getContactSettings, ContactInformation } from '../../lib/contactSettings';
import { subscribeToContact } from '../../lib/firebase';

export default function AdminContact() {
  const [settings, setSettings] = useState<ContactInformation | null>(() =>
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zadel-gold">
            <Mail className="h-3.5 w-3.5" />
            <span>Admin Management</span>
          </div>
          <h1 className="font-display text-3xl text-foreground">
            Contact & Support
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-emerald-950/50 border border-emerald-800/40 px-3 py-1.5 text-xs text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span>Protected Route: /admin/contact</span>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-zadel-elevated p-6 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-300">
          Active Store Contact Channels
        </h2>
        {settings && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-neutral-500 block">WhatsApp Number</span>
              <span className="font-mono text-foreground font-medium">{settings.whatsappNumber}</span>
            </div>
            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-neutral-500 block">Support Email</span>
              <span className="font-mono text-foreground font-medium">{settings.emailAddress}</span>
            </div>
            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-neutral-500 block">Phone Number</span>
              <span className="font-mono text-foreground font-medium">{settings.phoneNumber}</span>
            </div>
            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-neutral-500 block">Boutique Address</span>
              <span className="text-foreground font-medium">{settings.storeAddress}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

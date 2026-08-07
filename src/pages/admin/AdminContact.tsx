import React, { useEffect, useState } from 'react';
import { Mail, ShieldCheck, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { subscribeToContact, updateContact } from '../../lib/firebase';
import type { FirestoreContact } from '../../lib/types';
import AdminToast, { ToastMessage } from '../../components/AdminToast';

export default function AdminContact() {
  const [contactData, setContactData] = useState<FirestoreContact | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [instagram, setInstagram] = useState('');
  const [operatingHours, setOperatingHours] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Toast state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const unsubscribe = subscribeToContact((firestoreContact) => {
      setContactData(firestoreContact);
      setWhatsapp(firestoreContact.whatsappNumber || firestoreContact.whatsapp || '');
      setEmail(firestoreContact.supportEmail || firestoreContact.email || '');
      setPhone(firestoreContact.phoneNumber || firestoreContact.phone || '');
      setAddress(firestoreContact.storeAddress || firestoreContact.address || '');
      setInstagram(firestoreContact.instagram || '');
      setOperatingHours(firestoreContact.operatingHours || '');
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSaveContactInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      await updateContact({
        id: contactData?.id || 'general',
        whatsapp,
        whatsappNumber: whatsapp,
        email,
        supportEmail: email,
        phone,
        phoneNumber: phone,
        address,
        storeAddress: address,
        instagram,
        operatingHours,
      });

      addToast('success', 'Boutique contact details updated successfully.');
    } catch (err) {
      console.error('Error updating contact information:', err);
      setErrorMsg('Failed to update contact information in Firestore.');
      addToast('error', 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zadel-gold">
            <Mail className="h-3.5 w-3.5" />
            <span>Admin Management</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-foreground">
            Contact & Support Settings
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 px-3 py-2 text-xs text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span className="hidden sm:inline">Synced with Firestore</span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-neutral-400 flex items-center justify-center gap-3 rounded-2xl border border-neutral-800 bg-zadel-elevated">
          <Loader2 className="h-5 w-5 animate-spin text-zadel-gold" />
          <span>Loading contact details from Firestore...</span>
        </div>
      ) : (
        <form onSubmit={handleSaveContactInfo} className="space-y-6">
          <div className="rounded-2xl border border-neutral-800 bg-zadel-elevated p-5 sm:p-6 space-y-6">
            <div className="border-b border-neutral-800 pb-4">
              <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-300">
                Boutique Customer Touchpoints
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Updates saved here immediately update the website footer, contact drawer, and support channels.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-950/60 border border-red-800/50 text-red-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block mb-1.5 font-medium text-neutral-300">
                  WhatsApp Support Number
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-neutral-200 font-mono focus:border-zadel-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-medium text-neutral-300">
                  Concierge Support Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. concierge@zadel.com"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-neutral-200 font-mono focus:border-zadel-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-medium text-neutral-300">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-neutral-200 font-mono focus:border-zadel-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-medium text-neutral-300">
                  Instagram Handle / URL
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="e.g. https://instagram.com/zadel.official"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-neutral-200 font-mono focus:border-zadel-gold focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-1.5 font-medium text-neutral-300">
                  Boutique Flagship Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 740 Madison Avenue, New York, NY 10065"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-neutral-200 focus:border-zadel-gold focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-1.5 font-medium text-neutral-300">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                  placeholder="e.g. Mon-Sat: 10am - 7pm EST"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-neutral-200 focus:border-zadel-gold focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-zadel-gold text-black font-semibold text-xs px-6 py-2.5 rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer shadow-lg"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? 'Saving Changes...' : 'Save Contact Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Lock,
  Globe,
  Save,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToSettings, updateSettings } from '../../lib/firebase';
import type { FirestoreSettings } from '../../lib/types';

export default function AdminSettings() {
  const { user } = useAuth();

  const [settings, setSettings] = useState<FirestoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [brandName, setBrandName] = useState('');
  const [logo, setLogo] = useState('');

  // Saving states
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToSettings((data) => {
      setSettings(data);
      setBrandName(data.brandName || data.storeName || 'ZADEL');
      setLogo(data.logo || '');
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const finalBrandName = brandName.trim() || 'ZADEL';
      await updateSettings({
        id: settings?.id || 'general',
        brandName: finalBrandName,
        storeName: finalBrandName,
        logo: logo.trim(),
      });
      setSuccessMsg('Website settings saved to Firestore.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error updating website settings:', err);
      setErrorMsg('Failed to update website settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zadel-gold">
            <SettingsIcon className="h-3.5 w-3.5" />
            <span>Admin Management</span>
          </div>
          <h1 className="font-display text-3xl text-foreground">
            System Settings
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-emerald-950/50 border border-emerald-800/40 px-3 py-1.5 text-xs text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span>Synced with Firestore</span>
        </div>
      </div>

      {/* Website Settings Form Card */}
      <div className="rounded-xl border border-neutral-800 bg-zadel-elevated p-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <Globe className="h-4 w-4 text-zadel-gold" />
            <span>Website Branding Settings</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Configure global website branding settings stored directly in Firestore.
          </p>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-zadel-gold" />
            <span>Loading website settings from Firestore...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {successMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-800/50 text-red-300 rounded-lg">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 font-medium text-neutral-300">
                  Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. ZADEL"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:border-zadel-gold focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Primary name displayed across the website.
                </p>
              </div>

              <div>
                <label className="block mb-1.5 font-medium text-neutral-300">
                  Logo URL
                </label>
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="https://example.com/logo.png or asset path"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:border-zadel-gold focus:outline-none font-mono text-[11px]"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Custom image logo URL or asset path.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-zadel-gold text-black font-medium px-5 py-2 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer text-xs"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Security Governance Configuration */}
      <div className="rounded-xl border border-neutral-800 bg-zadel-elevated p-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <Lock className="h-4 w-4 text-zadel-gold" />
            <span>Security Governance Configuration</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Current system restrictions enforced by Firebase Auth & Firestore rules.
          </p>
        </div>

        <div className="divide-y divide-neutral-800 text-xs">
          <div className="py-3 flex items-center justify-between">
            <span className="text-neutral-300">Single Administrator Governance</span>
            <span className="text-emerald-400 font-mono">Enabled</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-neutral-300">Admins Collection Firestore Rule Validation</span>
            <span className="text-emerald-400 font-mono">Active</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-neutral-300">Session Local Persistence</span>
            <span className="text-emerald-400 font-mono">Persistent</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-neutral-300">Active Admin Email</span>
            <span className="font-mono text-zadel-gold">{user?.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

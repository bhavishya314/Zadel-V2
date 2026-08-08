import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Save,
  Loader2,
  Upload,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  Star,
  Plus,
  Eye,
  Type,
  Link as LinkIcon,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToSettings, updateSettings } from '../../lib/firebase';
import {
  uploadHeroImageToStorage,
  deleteHeroImageFromStorage,
} from '../../lib/cloudinary';
import type { FirestoreSettings } from '../../lib/types';
import AdminConfirmModal from '../../components/AdminConfirmModal';
import AdminToast, { ToastMessage } from '../../components/AdminToast';

export default function AdminHero() {
  const { user } = useAuth();

  const [settings, setSettings] = useState<FirestoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Hero Fields
  const [heroImage, setHeroImage] = useState('');
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [heroBrandText, setHeroBrandText] = useState('ZADEL');
  const [heroHeadline, setHeroHeadline] = useState('Quiet luxury.');
  const [heroHeadlineLine2, setHeroHeadlineLine2] = useState('Endlessly worn.');
  const [heroCtaText, setHeroCtaText] = useState('Shop Collection');
  const [heroCtaLink, setHeroCtaLink] = useState('/shop');

  // Hero upload / replace / delete state
  const [uploadingHero, setUploadingHero] = useState(false);
  const [replacingHeroIndex, setReplacingHeroIndex] = useState<number | null>(null);
  const [deletingHeroIndex, setDeletingHeroIndex] = useState<number | null>(null);

  // Confirm delete hero modal state
  const [heroToDeleteIndex, setHeroToDeleteIndex] = useState<number | null>(null);

  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const heroReplaceInputRef = useRef<HTMLInputElement>(null);

  // Saving states
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToSettings((data) => {
      setSettings(data);
      const primaryHero = data.heroImage || (data.heroImages && data.heroImages.length > 0 ? data.heroImages[0] : '');
      setHeroImage(primaryHero);
      setHeroImages(
        Array.isArray(data.heroImages) && data.heroImages.length > 0
          ? data.heroImages
          : primaryHero
          ? [primaryHero]
          : []
      );
      setHeroBrandText(data.heroBrandText ?? 'ZADEL');
      setHeroHeadline(data.heroHeadline ?? 'Quiet luxury.');
      setHeroHeadlineLine2(data.heroHeadlineLine2 ?? 'Endlessly worn.');
      setHeroCtaText(data.heroCtaText ?? 'Shop Collection');
      setHeroCtaLink(data.heroCtaLink ?? '/shop');
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle Hero Upload
  const handleHeroFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingHero(true);
    setErrorMsg(null);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadHeroImageToStorage(files[i]);
        newUrls.push(url);
      }

      const updatedHeroImages = [...heroImages, ...newUrls];
      const primaryUrl = updatedHeroImages[0] || '';

      await updateSettings({
        id: settings?.id || 'general',
        heroImage: primaryUrl,
        heroImages: updatedHeroImages,
      });

      setHeroImage(primaryUrl);
      setHeroImages(updatedHeroImages);

      addToast('success', `${newUrls.length} Hero image(s) uploaded to Cloudinary.`);
    } catch (err) {
      console.error('Error uploading hero image(s):', err);
      setErrorMsg('Failed to upload hero image(s) to Cloudinary.');
      addToast('error', 'Failed to upload hero images.');
    } finally {
      setUploadingHero(false);
      if (heroFileInputRef.current) {
        heroFileInputRef.current.value = '';
      }
    }
  };

  // Trigger Replace Hero Image
  const triggerReplaceHero = (index: number) => {
    setReplacingHeroIndex(index);
    if (heroReplaceInputRef.current) {
      heroReplaceInputRef.current.value = '';
      heroReplaceInputRef.current.click();
    }
  };

  // Handle Replace Hero Image File
  const handleReplaceHeroFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (replacingHeroIndex === null) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const targetIndex = replacingHeroIndex;
    setUploadingHero(true);
    setErrorMsg(null);

    try {
      const oldUrl = heroImages[targetIndex];
      const newUrl = await uploadHeroImageToStorage(file);

      const updatedHeroImages = [...heroImages];
      updatedHeroImages[targetIndex] = newUrl;
      const primaryUrl = updatedHeroImages[0] || '';

      await updateSettings({
        id: settings?.id || 'general',
        heroImage: primaryUrl,
        heroImages: updatedHeroImages,
      });

      setHeroImage(primaryUrl);
      setHeroImages(updatedHeroImages);

      if (oldUrl && oldUrl !== newUrl) {
        deleteHeroImageFromStorage(oldUrl).catch(() => {});
      }

      addToast('success', 'Hero image replaced in Cloudinary and updated.');
    } catch (err) {
      console.error('Error replacing hero image:', err);
      setErrorMsg('Failed to replace hero image.');
      addToast('error', 'Failed to replace hero image.');
    } finally {
      setUploadingHero(false);
      setReplacingHeroIndex(null);
      if (heroReplaceInputRef.current) {
        heroReplaceInputRef.current.value = '';
      }
    }
  };

  // Handle Confirm Delete Hero Image
  const handleConfirmDeleteHero = async () => {
    if (heroToDeleteIndex === null) return;

    const index = heroToDeleteIndex;
    const targetUrl = heroImages[index];
    if (!targetUrl) return;

    setDeletingHeroIndex(index);
    setErrorMsg(null);

    try {
      const updatedHeroImages = heroImages.filter((_, i) => i !== index);
      const primaryUrl = updatedHeroImages[0] || '';

      await updateSettings({
        id: settings?.id || 'general',
        heroImage: primaryUrl,
        heroImages: updatedHeroImages,
      });

      setHeroImage(primaryUrl);
      setHeroImages(updatedHeroImages);

      await deleteHeroImageFromStorage(targetUrl);

      addToast('success', 'Hero image deleted from Cloudinary.');
      setHeroToDeleteIndex(null);
    } catch (err) {
      console.error('Error deleting hero image:', err);
      setErrorMsg('Failed to delete hero image.');
      addToast('error', 'Failed to delete hero image.');
    } finally {
      setDeletingHeroIndex(null);
    }
  };

  // Set Hero as Primary
  const handleSetPrimaryHero = async (index: number) => {
    if (index === 0) return;
    const selectedUrl = heroImages[index];
    const updatedHeroImages = [selectedUrl, ...heroImages.filter((_, i) => i !== index)];

    try {
      await updateSettings({
        id: settings?.id || 'general',
        heroImage: selectedUrl,
        heroImages: updatedHeroImages,
      });

      setHeroImage(selectedUrl);
      setHeroImages(updatedHeroImages);

      addToast('success', 'Primary Hero image updated! Homepage banner updated.');
    } catch (err) {
      console.error('Error setting primary hero image:', err);
      addToast('error', 'Failed to set primary hero image.');
    }
  };

  // Handle Form Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      await updateSettings({
        id: settings?.id || 'general',
        heroImage: heroImage.trim(),
        heroImages: heroImages,
        heroBrandText: heroBrandText.trim() || 'ZADEL',
        heroHeadline: heroHeadline.trim() || 'Quiet luxury.',
        heroHeadlineLine2: heroHeadlineLine2.trim(),
        heroCtaText: heroCtaText.trim() || 'Shop Collection',
        heroCtaLink: heroCtaLink.trim() || '/shop',
      });
      addToast('success', 'Hero section configuration saved to Firestore.');
    } catch (err) {
      console.error('Error updating hero settings:', err);
      setErrorMsg('Failed to update hero settings.');
      addToast('error', 'Failed to save hero configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={removeToast} />

      {/* Delete Hero Image Confirm Modal */}
      <AdminConfirmModal
        isOpen={heroToDeleteIndex !== null}
        title="Delete Hero Banner Image"
        description="Are you sure you want to delete this hero banner image from Cloudinary?"
        confirmText="Delete Banner"
        variant="danger"
        loading={deletingHeroIndex !== null}
        onConfirm={handleConfirmDeleteHero}
        onClose={() => setHeroToDeleteIndex(null)}
      />

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={heroFileInputRef}
        accept="image/*"
        multiple
        onChange={handleHeroFileUpload}
        className="hidden"
      />

      <input
        type="file"
        ref={heroReplaceInputRef}
        accept="image/*"
        onChange={handleReplaceHeroFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zadel-gold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Hero Banner Configuration</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-foreground">
            Edit Hero Section
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 px-3 py-2 text-xs text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span className="hidden sm:inline">Synced with Firestore & Cloudinary</span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-zadel-gold" />
          <span>Loading hero configuration from Firestore...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800/50 text-red-300 rounded-lg text-xs">
              {errorMsg}
            </div>
          )}

          {/* Hero Live Preview Component */}
          <div className="rounded-xl border border-neutral-800 bg-zadel-elevated p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-neutral-200 font-medium text-xs uppercase tracking-wider">
                <Eye className="h-4 w-4 text-zadel-gold" />
                <span>Live Hero Preview</span>
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Real-time Storefront Visual</span>
              </span>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-black h-64 sm:h-80 flex items-center justify-center text-center p-6">
              {/* Background image preview */}
              <div className="absolute inset-0">
                <img
                  src={heroImage || '/images/placeholder-hero.svg'}
                  alt="Hero Background Preview"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zadel-black via-zadel-black/55 to-zadel-black/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-zadel-black/50 to-transparent" />
              </div>

              {/* Dynamic text overlay */}
              <div className="relative z-10 max-w-lg space-y-3">
                <p className="font-display text-lg tracking-[0.4em] text-white uppercase sm:text-2xl">
                  {heroBrandText || 'ZADEL'}
                </p>
                <h2 className="font-display text-2xl leading-tight tracking-wide text-white sm:text-3xl lg:text-4xl">
                  {heroHeadline || 'Quiet luxury.'}
                  {heroHeadlineLine2 && (
                    <>
                      <br />
                      <span className="text-white/70">{heroHeadlineLine2}</span>
                    </>
                  )}
                </h2>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-zadel-gold px-5 py-2 text-[10px] font-semibold tracking-[0.2em] text-zadel-ink uppercase">
                    {heroCtaText || 'Shop Collection'}
                    <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Background Image Management */}
          <div className="rounded-xl border border-neutral-800 bg-zadel-elevated p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-neutral-200 font-medium text-xs uppercase tracking-wider">
                <ImageIcon className="h-4 w-4 text-zadel-gold" />
                <span>Hero Background Image</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                  Cloudinary Upload
                </span>
                <button
                  type="button"
                  onClick={() => heroFileInputRef.current?.click()}
                  disabled={uploadingHero}
                  className="flex items-center gap-1.5 bg-zadel-gold text-black px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:bg-amber-400 transition-colors disabled:opacity-50"
                >
                  {uploadingHero ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  <span>Upload Image</span>
                </button>
              </div>
            </div>

            {heroImages.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {heroImages.map((imgUrl, index) => {
                  const isPrimary = index === 0 || imgUrl === heroImage;
                  const isDeleting = deletingHeroIndex === index;
                  const isReplacing = replacingHeroIndex === index;

                  return (
                    <div
                      key={imgUrl + index}
                      className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border transition-colors ${
                        isPrimary
                          ? 'bg-neutral-900/90 border-zadel-gold/40'
                          : 'bg-neutral-900/40 border-neutral-800'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="relative h-28 w-full md:w-52 rounded-md border border-neutral-800 bg-neutral-950 overflow-hidden shrink-0">
                        <img
                          src={imgUrl}
                          alt={`Hero Banner ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {isPrimary && (
                          <span className="absolute top-2 left-2 flex items-center gap-1 bg-zadel-gold text-black text-[10px] font-semibold px-2 py-0.5 rounded shadow">
                            <Star className="h-3 w-3 fill-black" />
                            <span>Primary Hero</span>
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-200 text-xs">
                            Hero Background #{index + 1}
                          </span>
                          {isPrimary && (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Active on Homepage</span>
                            </span>
                          )}
                        </div>
                        <p
                          className="text-[11px] text-neutral-500 font-mono truncate"
                          title={imgUrl}
                        >
                          {imgUrl}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryHero(index)}
                            className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-zadel-gold border border-zadel-gold/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          >
                            <Star className="h-3.5 w-3.5" />
                            <span>Set as Primary</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => triggerReplaceHero(index)}
                          disabled={uploadingHero || isDeleting}
                          className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isReplacing && uploadingHero ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-zadel-gold" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5 text-zadel-gold" />
                          )}
                          <span>Replace</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setHeroToDeleteIndex(index)}
                          disabled={uploadingHero || isDeleting}
                          className="flex items-center gap-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-400 border border-red-900/60 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-900/40 p-6 text-center space-y-3">
                <ImageIcon className="h-8 w-8 text-zadel-gold mx-auto" />
                <div>
                  <p className="font-medium text-neutral-300 text-xs">No Hero Images Uploaded</p>
                  <p className="text-[11px] text-neutral-500">
                    Upload hero background image to Cloudinary or paste a direct image URL below
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => heroFileInputRef.current?.click()}
                    disabled={uploadingHero}
                    className="inline-flex items-center gap-2 bg-zadel-gold text-black font-medium text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    {uploadingHero ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>{uploadingHero ? 'Uploading to Cloudinary...' : 'Upload Hero Image'}</span>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block mb-1.5 font-medium text-neutral-300 text-xs">
                Direct Hero Image URL (Optional fallback)
              </label>
              <input
                type="text"
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
                placeholder="https://res.cloudinary.com/... or /images/..."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:border-zadel-gold focus:outline-none font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Hero Content Text Configuration */}
          <div className="rounded-xl border border-neutral-800 bg-zadel-elevated p-5 sm:p-6 space-y-4">
            <div className="border-b border-neutral-800 pb-3 flex items-center gap-2 text-neutral-200 font-medium text-xs uppercase tracking-wider">
              <Type className="h-4 w-4 text-zadel-gold" />
              <span>Hero Text Content & Typography</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block mb-1.5 font-medium text-neutral-300">
                  Small Hero Brand Text
                </label>
                <input
                  type="text"
                  required
                  value={heroBrandText}
                  onChange={(e) => setHeroBrandText(e.target.value)}
                  placeholder="e.g. ZADEL"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:border-zadel-gold focus:outline-none font-display uppercase tracking-widest"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Small tracking label displayed above the main headline (default: ZADEL).
                </p>
              </div>

              <div>
                <label className="block mb-1.5 font-medium text-neutral-300">
                  Main Hero Headline (Line 1)
                </label>
                <input
                  type="text"
                  required
                  value={heroHeadline}
                  onChange={(e) => setHeroHeadline(e.target.value)}
                  placeholder="e.g. Quiet luxury."
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:border-zadel-gold focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Primary high-impact title text (default: Quiet luxury.).
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block mb-1.5 font-medium text-neutral-300">
                  Main Hero Headline Subtitle (Line 2)
                </label>
                <input
                  type="text"
                  value={heroHeadlineLine2}
                  onChange={(e) => setHeroHeadlineLine2(e.target.value)}
                  placeholder="e.g. Endlessly worn."
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:border-zadel-gold focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Secondary line rendered below main headline with elegant 70% opacity (default: Endlessly worn.).
                </p>
              </div>
            </div>
          </div>

          {/* Hero CTA Configuration */}
          <div className="rounded-xl border border-neutral-800 bg-zadel-elevated p-5 sm:p-6 space-y-4">
            <div className="border-b border-neutral-800 pb-3 flex items-center gap-2 text-neutral-200 font-medium text-xs uppercase tracking-wider">
              <LinkIcon className="h-4 w-4 text-zadel-gold" />
              <span>CTA Button Configuration</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block mb-1.5 font-medium text-neutral-300">
                  CTA Button Label
                </label>
                <input
                  type="text"
                  required
                  value={heroCtaText}
                  onChange={(e) => setHeroCtaText(e.target.value)}
                  placeholder="e.g. Shop Collection"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:border-zadel-gold focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Text displayed on the luxury gold button (default: Shop Collection).
                </p>
              </div>

              <div>
                <label className="block mb-1.5 font-medium text-neutral-300">
                  CTA Button Link URL
                </label>
                <input
                  type="text"
                  required
                  value={heroCtaLink}
                  onChange={(e) => setHeroCtaLink(e.target.value)}
                  placeholder="e.g. /shop"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:border-zadel-gold focus:outline-none font-mono"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Target relative or external route (default: /shop).
                </p>
              </div>
            </div>
          </div>

          {/* Form Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || uploadingHero}
              className="flex items-center gap-2 bg-zadel-gold text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer text-xs"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? 'Saving Changes...' : 'Save Hero Section'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

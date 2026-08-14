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
  Eye,
  Type,
  Link as LinkIcon,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Monitor,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToSettings, updateSettings } from '../../lib/firebase';
import {
  uploadHeroImageToStorage,
  deleteHeroImageFromStorage,
  getOptimizedImageUrl,
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

  // Hero Image Fields
  const [heroImage, setHeroImage] = useState(''); // Desktop / Laptop banner (16:9)
  const [heroMobileImage, setHeroMobileImage] = useState(''); // Mobile banner (4:5)

  // Hero Content Fields
  const [heroBrandText, setHeroBrandText] = useState('ZADEL');
  const [heroHeadline, setHeroHeadline] = useState('Quiet luxury.');
  const [heroHeadlineLine2, setHeroHeadlineLine2] = useState('Endlessly worn.');
  const [heroCtaText, setHeroCtaText] = useState('Shop Collection');
  const [heroCtaLink, setHeroCtaLink] = useState('/shop');

  // Preview device toggle: 'desktop' | 'mobile'
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Uploading / replacing states
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [replacingType, setReplacingType] = useState<'desktop' | 'mobile' | null>(null);
  const [deletingType, setDeletingType] = useState<'desktop' | 'mobile' | null>(null);

  // Delete modal state
  const [deleteConfirmType, setDeleteConfirmType] = useState<'desktop' | 'mobile' | null>(null);

  // File Input Refs
  const desktopFileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);
  const desktopReplaceInputRef = useRef<HTMLInputElement>(null);
  const mobileReplaceInputRef = useRef<HTMLInputElement>(null);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToSettings((data) => {
      setSettings(data);
      const desktop = data.heroImage || (data.heroImages && data.heroImages.length > 0 ? data.heroImages[0] : '');
      setHeroImage(desktop);
      setHeroMobileImage(data.heroMobileImage || '');

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

  // Handle Desktop Banner Upload
  const handleDesktopUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingDesktop(true);
    setErrorMsg(null);

    try {
      const file = files[0];
      const url = await uploadHeroImageToStorage(file);

      const updatedHeroImages = [url, heroMobileImage].filter(Boolean);

      await updateSettings({
        id: settings?.id || 'general',
        heroImage: url,
        heroImages: updatedHeroImages,
      });

      setHeroImage(url);
      addToast('success', 'Desktop banner (16:9) uploaded and saved.');
    } catch (err) {
      console.error('Error uploading desktop hero banner:', err);
      setErrorMsg('Failed to upload desktop hero banner to Cloudinary.');
      addToast('error', 'Failed to upload desktop banner.');
    } finally {
      setUploadingDesktop(false);
      if (desktopFileInputRef.current) {
        desktopFileInputRef.current.value = '';
      }
    }
  };

  // Handle Desktop Banner Replace
  const handleDesktopReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingDesktop(true);
    setReplacingType('desktop');
    setErrorMsg(null);

    try {
      const oldUrl = heroImage;
      const file = files[0];
      const newUrl = await uploadHeroImageToStorage(file);

      const updatedHeroImages = [newUrl, heroMobileImage].filter(Boolean);

      await updateSettings({
        id: settings?.id || 'general',
        heroImage: newUrl,
        heroImages: updatedHeroImages,
      });

      setHeroImage(newUrl);

      if (oldUrl && oldUrl !== newUrl) {
        deleteHeroImageFromStorage(oldUrl).catch(() => {});
      }

      addToast('success', 'Desktop banner replaced and synced with Cloudinary.');
    } catch (err) {
      console.error('Error replacing desktop hero banner:', err);
      setErrorMsg('Failed to replace desktop banner.');
      addToast('error', 'Failed to replace desktop banner.');
    } finally {
      setUploadingDesktop(false);
      setReplacingType(null);
      if (desktopReplaceInputRef.current) {
        desktopReplaceInputRef.current.value = '';
      }
    }
  };

  // Handle Mobile Banner Upload
  const handleMobileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMobile(true);
    setErrorMsg(null);

    try {
      const file = files[0];
      const url = await uploadHeroImageToStorage(file);

      const updatedHeroImages = [heroImage, url].filter(Boolean);

      await updateSettings({
        id: settings?.id || 'general',
        heroMobileImage: url,
        heroImages: updatedHeroImages,
      });

      setHeroMobileImage(url);
      addToast('success', 'Mobile banner (4:5) uploaded and saved.');
    } catch (err) {
      console.error('Error uploading mobile hero banner:', err);
      setErrorMsg('Failed to upload mobile hero banner to Cloudinary.');
      addToast('error', 'Failed to upload mobile banner.');
    } finally {
      setUploadingMobile(false);
      if (mobileFileInputRef.current) {
        mobileFileInputRef.current.value = '';
      }
    }
  };

  // Handle Mobile Banner Replace
  const handleMobileReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMobile(true);
    setReplacingType('mobile');
    setErrorMsg(null);

    try {
      const oldUrl = heroMobileImage;
      const file = files[0];
      const newUrl = await uploadHeroImageToStorage(file);

      const updatedHeroImages = [heroImage, newUrl].filter(Boolean);

      await updateSettings({
        id: settings?.id || 'general',
        heroMobileImage: newUrl,
        heroImages: updatedHeroImages,
      });

      setHeroMobileImage(newUrl);

      if (oldUrl && oldUrl !== newUrl) {
        deleteHeroImageFromStorage(oldUrl).catch(() => {});
      }

      addToast('success', 'Mobile banner replaced and synced with Cloudinary.');
    } catch (err) {
      console.error('Error replacing mobile hero banner:', err);
      setErrorMsg('Failed to replace mobile banner.');
      addToast('error', 'Failed to replace mobile banner.');
    } finally {
      setUploadingMobile(false);
      setReplacingType(null);
      if (mobileReplaceInputRef.current) {
        mobileReplaceInputRef.current.value = '';
      }
    }
  };

  // Handle Confirm Delete Banner
  const handleConfirmDelete = async () => {
    if (!deleteConfirmType) return;

    const isDesktop = deleteConfirmType === 'desktop';
    const targetUrl = isDesktop ? heroImage : heroMobileImage;

    setDeletingType(deleteConfirmType);
    setErrorMsg(null);

    try {
      if (isDesktop) {
        const updatedHeroImages = [heroMobileImage].filter(Boolean);
        await updateSettings({
          id: settings?.id || 'general',
          heroImage: '',
          heroImages: updatedHeroImages,
        });
        setHeroImage('');
      } else {
        const updatedHeroImages = [heroImage].filter(Boolean);
        await updateSettings({
          id: settings?.id || 'general',
          heroMobileImage: '',
          heroImages: updatedHeroImages,
        });
        setHeroMobileImage('');
      }

      if (targetUrl) {
        await deleteHeroImageFromStorage(targetUrl);
      }

      addToast('success', `${isDesktop ? 'Desktop' : 'Mobile'} banner removed.`);
      setDeleteConfirmType(null);
    } catch (err) {
      console.error('Error deleting hero banner:', err);
      setErrorMsg('Failed to delete hero banner.');
      addToast('error', 'Failed to delete banner.');
    } finally {
      setDeletingType(null);
    }
  };

  // Handle Complete Form Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const desktopClean = heroImage.trim();
      const mobileClean = heroMobileImage.trim();
      const heroList = [desktopClean, mobileClean].filter(Boolean);

      await updateSettings({
        id: settings?.id || 'general',
        heroImage: desktopClean,
        heroMobileImage: mobileClean,
        heroImages: heroList,
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

  // Active preview image based on previewDevice toggle
  const activePreviewImage =
    previewDevice === 'mobile'
      ? (heroMobileImage || heroImage || '/images/placeholder-hero.svg')
      : (heroImage || '/images/placeholder-hero.svg');

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={removeToast} />

      {/* Delete Banner Confirm Modal */}
      <AdminConfirmModal
        isOpen={deleteConfirmType !== null}
        title={`Delete ${deleteConfirmType === 'desktop' ? 'Desktop (16:9)' : 'Mobile (4:5)'} Banner`}
        description={`Are you sure you want to remove this ${
          deleteConfirmType === 'desktop' ? 'desktop' : 'mobile'
        } banner image from Cloudinary?`}
        confirmText="Delete Banner"
        variant="danger"
        loading={deletingType !== null}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmType(null)}
      />

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={desktopFileInputRef}
        accept="image/*"
        onChange={handleDesktopUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={desktopReplaceInputRef}
        accept="image/*"
        onChange={handleDesktopReplace}
        className="hidden"
      />
      <input
        type="file"
        ref={mobileFileInputRef}
        accept="image/*"
        onChange={handleMobileUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={mobileReplaceInputRef}
        accept="image/*"
        onChange={handleMobileReplace}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zadel-gold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Hero Banner System</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-foreground mt-0.5">
            Edit Hero Section
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/40 dark:bg-emerald-950/50 border border-emerald-800/40 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Synced with Cloudinary & Responsive Picture</span>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-zadel-gold" />
          <span>Loading hero configuration from Firestore...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 dark:bg-red-950/60 border border-red-800/50 text-red-600 dark:text-red-300 rounded-lg text-xs">
              {errorMsg}
            </div>
          )}

          {/* Live Hero Preview with Responsive Switcher */}
          <div className="rounded-xl border border-border bg-zadel-elevated p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2 text-foreground font-medium text-xs uppercase tracking-wider">
                <Eye className="h-4 w-4 text-zadel-gold" />
                <span>Responsive Live Preview</span>
              </div>

              {/* Device Preview Switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-muted/60 dark:bg-neutral-900/80 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    previewDevice === 'desktop'
                      ? 'bg-zadel-gold text-black shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  <span>Desktop (16:9)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    previewDevice === 'mobile'
                      ? 'bg-zadel-gold text-black shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Mobile (4:5)</span>
                </button>
              </div>
            </div>

            {/* Preview Frame */}
            <div className="flex justify-center bg-black/5 dark:bg-black/30 rounded-xl p-4 sm:p-6 border border-dashed border-border/70">
              <div
                className={`relative overflow-hidden rounded-xl border border-border bg-black transition-all duration-300 flex items-center justify-center text-center p-6 ${
                  previewDevice === 'desktop'
                    ? 'w-full aspect-16/9 max-h-[380px]'
                    : 'w-full max-w-[320px] aspect-4/5'
                }`}
              >
                {/* Background Image Preview */}
                <div className="absolute inset-0">
                  <img
                    src={activePreviewImage}
                    alt="Hero Live Preview"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zadel-black via-zadel-black/55 to-zadel-black/30" />
                  <div className="absolute inset-0 bg-gradient-to-r from-zadel-black/50 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zadel-black to-transparent" />
                </div>

                {/* Badge Indicator */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-black/70 backdrop-blur-xs text-white/90 border border-white/10 px-2 py-0.5 rounded-full text-[10px]">
                  {previewDevice === 'desktop' ? (
                    <Monitor className="h-3 w-3 text-zadel-gold" />
                  ) : (
                    <Smartphone className="h-3 w-3 text-zadel-gold" />
                  )}
                  <span>
                    {previewDevice === 'desktop'
                      ? 'Desktop Banner Preview'
                      : heroMobileImage
                      ? 'Mobile Banner Preview'
                      : 'Mobile Preview (Fallback to Desktop)'}
                  </span>
                </div>

                {/* Dynamic text overlay */}
                <div className="relative z-10 max-w-lg space-y-2.5 px-2">
                  <p className="font-display text-base sm:text-xl tracking-[0.4em] text-white uppercase">
                    {heroBrandText || 'ZADEL'}
                  </p>
                  <h2 className="font-display text-xl sm:text-3xl leading-tight tracking-wide text-white">
                    {heroHeadline || 'Quiet luxury.'}
                    {heroHeadlineLine2 && (
                      <>
                        <br />
                        <span className="text-white/70">{heroHeadlineLine2}</span>
                      </>
                    )}
                  </h2>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-zadel-gold px-4 py-1.5 text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] text-zadel-ink uppercase">
                      {heroCtaText || 'Shop Collection'}
                      <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground px-1">
              <Info className="h-3.5 w-3.5 text-zadel-gold shrink-0" />
              <span>
                The customer website automatically renders the 16:9 banner on laptops/desktops and
                seamlessly switches to the 4:5 portrait banner on smartphones.
              </span>
            </div>
          </div>

          {/* TWO SEPARATE BANNER UPLOAD CARDS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. DESKTOP / LAPTOP BANNER (16:9) */}
            <div className="rounded-xl border border-border bg-zadel-elevated p-5 sm:p-6 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2 text-foreground font-medium text-xs uppercase tracking-wider">
                    <Monitor className="h-4 w-4 text-zadel-gold" />
                    <span>Desktop / Laptop Banner</span>
                  </div>
                  <span className="text-[10px] font-semibold text-zadel-gold bg-zadel-gold/10 border border-zadel-gold/30 px-2 py-0.5 rounded-full">
                    Ratio 16:9 (Recommended)
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Primary banner displayed on desktops, laptops, and large tablets. Recommended size:{' '}
                  <strong className="text-foreground">1920 × 1080 px</strong>.
                </p>

                {heroImage ? (
                  <div className="space-y-3">
                    {/* 16:9 Image Preview Frame */}
                    <div className="relative aspect-16/9 w-full rounded-lg border border-border bg-black/40 overflow-hidden group">
                      <img
                        src={heroImage}
                        alt="Desktop Hero Banner"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/80 backdrop-blur-xs text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-800/40">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Active on Desktop</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => desktopReplaceInputRef.current?.click()}
                        disabled={uploadingDesktop}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground border border-border px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {uploadingDesktop && replacingType === 'desktop' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-zadel-gold" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5 text-zadel-gold" />
                        )}
                        <span>Replace Desktop Banner</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmType('desktop')}
                        disabled={uploadingDesktop}
                        className="flex items-center justify-center gap-1.5 bg-red-950/20 dark:bg-red-950/60 hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-800/40 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center space-y-3">
                    <ImageIcon className="h-8 w-8 text-zadel-gold mx-auto" />
                    <div>
                      <p className="font-medium text-foreground text-xs">No Desktop Banner Uploaded</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Recommended: 1920 × 1080 px (16:9 ratio)
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => desktopFileInputRef.current?.click()}
                        disabled={uploadingDesktop}
                        className="inline-flex items-center gap-2 bg-zadel-gold text-black font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-amber-400 transition-colors disabled:opacity-50 shadow-xs"
                      >
                        {uploadingDesktop ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        <span>{uploadingDesktop ? 'Uploading...' : 'Upload Desktop (16:9)'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border/60">
                <label className="block mb-1 font-medium text-foreground text-xs">
                  Direct Desktop Image URL
                </label>
                <input
                  type="text"
                  value={heroImage}
                  onChange={(e) => setHeroImage(e.target.value)}
                  placeholder="https://res.cloudinary.com/... or /images/..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-zadel-gold focus:outline-none font-mono text-[11px]"
                />
              </div>
            </div>

            {/* 2. MOBILE BANNER (4:5) */}
            <div className="rounded-xl border border-border bg-zadel-elevated p-5 sm:p-6 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2 text-foreground font-medium text-xs uppercase tracking-wider">
                    <Smartphone className="h-4 w-4 text-zadel-gold" />
                    <span>Mobile Banner</span>
                  </div>
                  <span className="text-[10px] font-semibold text-zadel-gold bg-zadel-gold/10 border border-zadel-gold/30 px-2 py-0.5 rounded-full">
                    Ratio 4:5 (Recommended)
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Vertical banner optimized for smartphone viewports. Recommended size:{' '}
                  <strong className="text-foreground">1080 × 1350 px</strong> (portrait).
                </p>

                {heroMobileImage ? (
                  <div className="space-y-3">
                    {/* 4:5 Image Preview Frame */}
                    <div className="relative aspect-4/5 max-h-[220px] w-auto mx-auto rounded-lg border border-border bg-black/40 overflow-hidden group">
                      <img
                        src={heroMobileImage}
                        alt="Mobile Hero Banner"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/80 backdrop-blur-xs text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-800/40">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Active on Mobile</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => mobileReplaceInputRef.current?.click()}
                        disabled={uploadingMobile}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground border border-border px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {uploadingMobile && replacingType === 'mobile' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-zadel-gold" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5 text-zadel-gold" />
                        )}
                        <span>Replace Mobile Banner</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmType('mobile')}
                        disabled={uploadingMobile}
                        className="flex items-center justify-center gap-1.5 bg-red-950/20 dark:bg-red-950/60 hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-800/40 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center space-y-3">
                    <Smartphone className="h-8 w-8 text-zadel-gold mx-auto" />
                    <div>
                      <p className="font-medium text-foreground text-xs">No Mobile Banner Uploaded</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Optional: If empty, mobile screens automatically use the Desktop Banner
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => mobileFileInputRef.current?.click()}
                        disabled={uploadingMobile}
                        className="inline-flex items-center gap-2 bg-zadel-gold text-black font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-amber-400 transition-colors disabled:opacity-50 shadow-xs"
                      >
                        {uploadingMobile ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        <span>{uploadingMobile ? 'Uploading...' : 'Upload Mobile (4:5)'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border/60">
                <label className="block mb-1 font-medium text-foreground text-xs">
                  Direct Mobile Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={heroMobileImage}
                  onChange={(e) => setHeroMobileImage(e.target.value)}
                  placeholder="https://res.cloudinary.com/... or /images/..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-zadel-gold focus:outline-none font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Hero Content Text Configuration */}
          <div className="rounded-xl border border-border bg-zadel-elevated p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="border-b border-border pb-3 flex items-center gap-2 text-foreground font-medium text-xs uppercase tracking-wider">
              <Type className="h-4 w-4 text-zadel-gold" />
              <span>Hero Text Content & Typography</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block mb-1.5 font-medium text-foreground">
                  Small Hero Brand Text
                </label>
                <input
                  type="text"
                  required
                  value={heroBrandText}
                  onChange={(e) => setHeroBrandText(e.target.value)}
                  placeholder="e.g. ZADEL"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-zadel-gold focus:outline-none font-display uppercase tracking-widest"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Small tracking label displayed above the main headline (default: ZADEL).
                </p>
              </div>

              <div>
                <label className="block mb-1.5 font-medium text-foreground">
                  Main Hero Headline (Line 1)
                </label>
                <input
                  type="text"
                  required
                  value={heroHeadline}
                  onChange={(e) => setHeroHeadline(e.target.value)}
                  placeholder="e.g. Quiet luxury."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-zadel-gold focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Primary high-impact title text (default: Quiet luxury.).
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block mb-1.5 font-medium text-foreground">
                  Main Hero Headline Subtitle (Line 2)
                </label>
                <input
                  type="text"
                  value={heroHeadlineLine2}
                  onChange={(e) => setHeroHeadlineLine2(e.target.value)}
                  placeholder="e.g. Endlessly worn."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-zadel-gold focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Secondary line rendered below main headline with elegant opacity (default: Endlessly worn.).
                </p>
              </div>
            </div>
          </div>

          {/* Hero CTA Configuration */}
          <div className="rounded-xl border border-border bg-zadel-elevated p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="border-b border-border pb-3 flex items-center gap-2 text-foreground font-medium text-xs uppercase tracking-wider">
              <LinkIcon className="h-4 w-4 text-zadel-gold" />
              <span>CTA Button Configuration</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block mb-1.5 font-medium text-foreground">
                  CTA Button Label
                </label>
                <input
                  type="text"
                  required
                  value={heroCtaText}
                  onChange={(e) => setHeroCtaText(e.target.value)}
                  placeholder="e.g. Shop Collection"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-zadel-gold focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Text displayed on the luxury gold button (default: Shop Collection).
                </p>
              </div>

              <div>
                <label className="block mb-1.5 font-medium text-foreground">
                  CTA Button Link URL
                </label>
                <input
                  type="text"
                  required
                  value={heroCtaLink}
                  onChange={(e) => setHeroCtaLink(e.target.value)}
                  placeholder="e.g. /shop"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-zadel-gold focus:outline-none font-mono"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Target relative or external route (default: /shop).
                </p>
              </div>
            </div>
          </div>

          {/* Form Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || uploadingDesktop || uploadingMobile}
              className="flex items-center gap-2 bg-zadel-gold text-black font-semibold px-6 py-2.5 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer text-xs shadow-xs"
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

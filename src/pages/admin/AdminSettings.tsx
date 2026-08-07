import React, { useEffect, useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Lock,
  Globe,
  Save,
  CheckCircle2,
  Loader2,
  Upload,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  Star,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToSettings,
  updateSettings,
  uploadBrandLogoToStorage,
  deleteBrandLogoFromStorage,
  uploadHeroImageToStorage,
  deleteHeroImageFromStorage,
} from '../../lib/firebase';
import type { FirestoreSettings } from '../../lib/types';
import AdminConfirmModal from '../../components/AdminConfirmModal';
import AdminToast, { ToastMessage } from '../../components/AdminToast';

export default function AdminSettings() {
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

  // Form Fields
  const [brandName, setBrandName] = useState('');
  const [logo, setLogo] = useState('');

  // Hero Banner state
  const [heroImage, setHeroImage] = useState('');
  const [heroImages, setHeroImages] = useState<string[]>([]);

  // Logo upload / replace state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deletingLogo, setDeletingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirm delete logo modal state
  const [isDeleteLogoConfirmOpen, setIsDeleteLogoConfirmOpen] = useState(false);

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
      setBrandName(data.brandName || data.storeName || 'ZADEL');
      setLogo(data.logo || '');
      setHeroImage(data.heroImage || (data.heroImages && data.heroImages.length > 0 ? data.heroImages[0] : ''));
      setHeroImages(
        Array.isArray(data.heroImages) && data.heroImages.length > 0
          ? data.heroImages
          : data.heroImage
          ? [data.heroImage]
          : []
      );
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle Logo Upload / Replace
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingLogo(true);
    setErrorMsg(null);

    try {
      const oldLogoUrl = logo;
      const downloadUrl = await uploadBrandLogoToStorage(file);

      const finalBrandName = brandName.trim() || 'ZADEL';
      await updateSettings({
        id: settings?.id || 'general',
        brandName: finalBrandName,
        storeName: finalBrandName,
        logo: downloadUrl,
      });

      setLogo(downloadUrl);

      if (oldLogoUrl && oldLogoUrl !== downloadUrl) {
        deleteBrandLogoFromStorage(oldLogoUrl).catch(() => {});
      }

      addToast('success', 'Brand Logo uploaded to Firebase Storage and saved!');
    } catch (err) {
      console.error('Error uploading brand logo:', err);
      setErrorMsg('Failed to upload logo to Firebase Storage.');
      addToast('error', 'Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle Logo Delete Confirm
  const handleConfirmDeleteLogo = async () => {
    if (!logo) return;

    setDeletingLogo(true);
    setErrorMsg(null);

    try {
      const targetUrl = logo;

      const finalBrandName = brandName.trim() || 'ZADEL';
      await updateSettings({
        id: settings?.id || 'general',
        brandName: finalBrandName,
        storeName: finalBrandName,
        logo: '',
      });

      setLogo('');
      await deleteBrandLogoFromStorage(targetUrl);

      addToast('success', 'Brand Logo deleted from Firebase Storage and Firestore.');
      setIsDeleteLogoConfirmOpen(false);
    } catch (err) {
      console.error('Error deleting brand logo:', err);
      setErrorMsg('Failed to delete brand logo.');
      addToast('error', 'Failed to delete logo.');
    } finally {
      setDeletingLogo(false);
    }
  };

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

      addToast('success', `${newUrls.length} Hero image(s) uploaded to Firebase Storage.`);
    } catch (err) {
      console.error('Error uploading hero image(s):', err);
      setErrorMsg('Failed to upload hero image(s) to Firebase Storage.');
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

      addToast('success', 'Hero image replaced in Firebase Storage and updated.');
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

      addToast('success', 'Hero image deleted from Firebase Storage.');
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
      const finalBrandName = brandName.trim() || 'ZADEL';
      await updateSettings({
        id: settings?.id || 'general',
        brandName: finalBrandName,
        storeName: finalBrandName,
        logo: logo.trim(),
        heroImage: heroImage.trim(),
        heroImages: heroImages,
      });
      addToast('success', 'Website branding and settings saved to Firestore.');
    } catch (err) {
      console.error('Error updating website settings:', err);
      setErrorMsg('Failed to update website settings.');
      addToast('error', 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={removeToast} />

      {/* Delete Logo Confirm Modal */}
      <AdminConfirmModal
        isOpen={isDeleteLogoConfirmOpen}
        title="Delete Brand Logo"
        description="Are you sure you want to permanently delete the brand logo from Firebase Storage? The website header will fall back to standard typography."
        confirmText="Delete Logo"
        variant="danger"
        loading={deletingLogo}
        onConfirm={handleConfirmDeleteLogo}
        onClose={() => setIsDeleteLogoConfirmOpen(false)}
      />

      {/* Delete Hero Image Confirm Modal */}
      <AdminConfirmModal
        isOpen={heroToDeleteIndex !== null}
        title="Delete Hero Banner Image"
        description="Are you sure you want to delete this hero banner image from Firebase Storage?"
        confirmText="Delete Banner"
        variant="danger"
        loading={deletingHeroIndex !== null}
        onConfirm={handleConfirmDeleteHero}
        onClose={() => setHeroToDeleteIndex(null)}
      />

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleLogoFileChange}
        className="hidden"
      />

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
            <SettingsIcon className="h-3.5 w-3.5" />
            <span>Admin Management</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-foreground">
            System & Media Settings
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 px-3 py-2 text-xs text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span className="hidden sm:inline">Synced with Firestore</span>
        </div>
      </div>

      {/* Website Settings Form Card */}
      <div className="rounded-xl border border-neutral-800 bg-zadel-elevated p-5 sm:p-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-300 flex items-center gap-2">
            <Globe className="h-4 w-4 text-zadel-gold" />
            <span>Website Branding & Media Settings</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Manage global store name, brand logo, and hero banner images stored in Firebase Storage and Firestore.
          </p>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-zadel-gold" />
            <span>Loading website settings from Firestore...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6 text-xs">
            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-800/50 text-red-300 rounded-lg">
                {errorMsg}
              </div>
            )}

            {/* Brand Logo Upload / Replace / Delete Management Card */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                <div className="flex items-center gap-2 text-neutral-200 font-medium">
                  <ImageIcon className="h-4 w-4 text-zadel-gold" />
                  <span>Brand Logo Management</span>
                </div>
                <span className="text-[10px] font-mono uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                  Firebase Storage
                </span>
              </div>

              {logo ? (
                /* Current Logo Preview & Actions */
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-lg bg-neutral-900/80 border border-neutral-800">
                  <div className="relative flex items-center justify-center h-20 w-44 rounded-md border border-neutral-800 bg-neutral-950 p-2 overflow-hidden shrink-0">
                    <img
                      src={logo}
                      alt="Current Brand Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="font-medium text-neutral-200">Active Brand Logo</p>
                    <p className="text-[11px] text-neutral-500 font-mono truncate" title={logo}>
                      {logo}
                    </p>
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1 pt-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Live on customer website header in real-time</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo || deletingLogo}
                      className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {uploadingLogo ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-zadel-gold" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5 text-zadel-gold" />
                      )}
                      <span>{uploadingLogo ? 'Uploading...' : 'Replace Logo'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsDeleteLogoConfirmOpen(true)}
                      disabled={uploadingLogo || deletingLogo}
                      className="flex items-center gap-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-400 border border-red-900/60 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty Logo Dropzone / Upload Area */
                <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-900/40 p-6 text-center space-y-3">
                  <Upload className="h-8 w-8 text-zadel-gold mx-auto" />
                  <div>
                    <p className="font-medium text-neutral-300">No Brand Logo Uploaded</p>
                    <p className="text-[11px] text-neutral-500">
                      Upload a logo image (.png, .svg, .webp, .jpg) to Firebase Storage
                    </p>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="inline-flex items-center gap-2 bg-zadel-gold text-black font-medium text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-amber-400 transition-colors disabled:opacity-50"
                    >
                      {uploadingLogo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>{uploadingLogo ? 'Uploading to Firebase Storage...' : 'Upload Brand Logo'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hero Image Management Section */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-900 pb-3">
                <div className="flex items-center gap-2 text-neutral-200 font-medium">
                  <ImageIcon className="h-4 w-4 text-zadel-gold" />
                  <span>Hero Banner Image Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                    Firebase Storage
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
                    <span>Upload Hero Image</span>
                  </button>
                </div>
              </div>

              {heroImages.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-neutral-400">
                    Managed hero images synced in real-time. The primary image is displayed on the homepage hero banner.
                  </p>

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
                              <span className="font-medium text-neutral-200">
                                Hero Image #{index + 1}
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

                          {/* Action Buttons */}
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
                </div>
              ) : (
                /* Empty Hero Dropzone */
                <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-900/40 p-6 text-center space-y-3">
                  <ImageIcon className="h-8 w-8 text-zadel-gold mx-auto" />
                  <div>
                    <p className="font-medium text-neutral-300">No Hero Banner Images Uploaded</p>
                    <p className="text-[11px] text-neutral-500">
                      Upload high-resolution banner images to Firebase Storage to display on the customer homepage
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
                      <span>{uploadingHero ? 'Uploading to Firebase Storage...' : 'Upload Hero Image'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

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
                  Logo URL (Manual or Storage URL)
                </label>
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="https://firebasestorage.googleapis.com/... or asset path"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:border-zadel-gold focus:outline-none font-mono text-[11px]"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Direct Firebase Storage download URL or external image link.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving || uploadingLogo || deletingLogo || uploadingHero}
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
            <span className="text-neutral-300">Firebase Storage Brand Logo Uploads</span>
            <span className="text-emerald-400 font-mono">Active</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <span className="text-neutral-300">Firebase Storage Hero Banner Uploads</span>
            <span className="text-emerald-400 font-mono">Active</span>
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

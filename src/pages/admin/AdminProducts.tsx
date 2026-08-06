import React, { useEffect, useState, useRef } from 'react';
import {
  Package,
  ShieldCheck,
  Upload,
  Trash2,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Plus,
  Pencil,
  CheckCircle2,
  Loader2,
  ImageIcon,
  X,
  Save,
} from 'lucide-react';
import {
  subscribeToProducts,
  updateProduct,
  addProduct,
  deleteProduct,
  uploadProductImageToStorage,
  deleteProductImageFromStorage,
} from '../../lib/firebase';
import type { FirestoreProduct } from '../../lib/types';

export default function AdminProducts() {
  const [productsList, setProductsList] = useState<FirestoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Active product being edited / having images managed
  const [selectedProduct, setSelectedProduct] = useState<FirestoreProduct | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string | null>(null);

  // General product modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FirestoreProduct | null>(null);

  // Product form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Men');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formDescription, setFormDescription] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // Success / Error alerts
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savingImages, setSavingImages] = useState(false);

  // File input refs
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
      setProductsList(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync selected product images when selectedProduct changes
  const openImageManager = (product: FirestoreProduct) => {
    setSelectedProduct(product);
    setImages(product.images || []);
    setAlertMsg(null);
    setErrorMsg(null);
  };

  const closeImageManager = () => {
    if (uploading || savingImages) return;
    setSelectedProduct(null);
    setImages([]);
    setAlertMsg(null);
    setErrorMsg(null);
  };

  // Upload multiple images to Firebase Storage
  const handleMultipleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedProduct) return;

    setUploading(true);
    setErrorMsg(null);
    setAlertMsg(null);

    const uploadedUrls: string[] = [];
    const total = files.length;

    try {
      for (let i = 0; i < total; i++) {
        const file = files[i];
        setUploadProgressMsg(`Uploading image ${i + 1} of ${total} to Firebase Storage...`);
        const url = await uploadProductImageToStorage(file, selectedProduct.id);
        uploadedUrls.push(url);
      }

      const updatedList = [...images, ...uploadedUrls];
      setImages(updatedList);
      setAlertMsg(`Successfully uploaded ${total} image(s) to Firebase Storage.`);
    } catch (err) {
      console.error('Error uploading images:', err);
      setErrorMsg('Failed to upload image(s). Please try again.');
    } finally {
      setUploading(false);
      setUploadProgressMsg(null);
      if (multipleFileInputRef.current) {
        multipleFileInputRef.current.value = '';
      }
    }
  };

  // Trigger replace file input for specific index
  const triggerReplace = (index: number) => {
    setReplacingIndex(index);
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.click();
    }
  };

  // Handle replace image at specific index
  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || replacingIndex === null || !selectedProduct) return;

    const file = files[0];
    const indexToReplace = replacingIndex;

    setUploading(true);
    setErrorMsg(null);
    setAlertMsg(null);
    setUploadProgressMsg('Uploading replacement image to Firebase Storage...');

    try {
      const oldUrl = images[indexToReplace];
      const newUrl = await uploadProductImageToStorage(file, selectedProduct.id);

      const updatedList = [...images];
      updatedList[indexToReplace] = newUrl;
      setImages(updatedList);

      // Optionally clean up old storage object
      deleteProductImageFromStorage(oldUrl).catch(() => {});

      setAlertMsg('Image replaced successfully with Firebase Storage image.');
    } catch (err) {
      console.error('Error replacing image:', err);
      setErrorMsg('Failed to replace image.');
    } finally {
      setUploading(false);
      setUploadProgressMsg(null);
      setReplacingIndex(null);
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = '';
      }
    }
  };

  // Delete image at index
  const handleDeleteImage = (index: number) => {
    const targetUrl = images[index];
    const updatedList = images.filter((_, i) => i !== index);
    setImages(updatedList);
    setAlertMsg('Image removed. Click "Save Images to Firestore" to apply changes.');

    // Attempt cleanup if firebase storage URL
    deleteProductImageFromStorage(targetUrl).catch(() => {});
  };

  // Reorder images
  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const updated = [...images];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setImages(updated);
  };

  // Save image array to Firestore
  const handleSaveImagesToFirestore = async () => {
    if (!selectedProduct) return;

    setSavingImages(true);
    setErrorMsg(null);
    setAlertMsg(null);

    try {
      await updateProduct(selectedProduct.id, {
        images: images,
      });

      setAlertMsg('Image gallery saved to Firestore! Customer website updated automatically.');
      setTimeout(() => {
        setAlertMsg(null);
      }, 4000);
    } catch (err) {
      console.error('Error saving product images:', err);
      setErrorMsg('Failed to save images to Firestore.');
    } finally {
      setSavingImages(false);
    }
  };

  // Product CRUD Modals
  const openAddProductModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Men');
    setFormPrice(4999);
    setFormDescription('');
    setIsProductModalOpen(true);
  };

  const handleSaveProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formName.trim(),
          title: formName.trim(),
          category: formCategory,
          price: formPrice,
          description: formDescription.trim(),
        });
      } else {
        await addProduct({
          name: formName.trim(),
          title: formName.trim(),
          subtitle: formCategory,
          category: formCategory,
          price: formPrice,
          description: formDescription.trim(),
          images: ['/images/placeholder.svg'],
          inStock: true,
          published: true,
        });
      }
      setIsProductModalOpen(false);
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zadel-gold">
            <Package className="h-3.5 w-3.5" />
            <span>Admin Management</span>
          </div>
          <h1 className="font-display text-3xl text-foreground">
            Product Catalog & Image Gallery
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openAddProductModal}
            className="flex items-center gap-2 bg-zadel-gold text-black font-medium text-xs px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
          </button>
          <div className="flex items-center gap-2 rounded-lg bg-emerald-950/50 border border-emerald-800/40 px-3 py-1.5 text-xs text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Synced with Firestore</span>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="rounded-xl border border-neutral-800 bg-zadel-elevated overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center text-xs text-neutral-400">
          <span>Catalog Items ({productsList.length})</span>
          <span className="font-mono text-neutral-500">
            Firebase Storage Image Upload Enabled
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-zadel-gold" />
            <span>Loading products from Firestore...</span>
          </div>
        ) : productsList.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400 space-y-3">
            <p>No products found in Firestore.</p>
            <button
              type="button"
              onClick={openAddProductModal}
              className="inline-flex items-center gap-2 bg-zadel-gold text-black px-4 py-2 rounded-lg font-medium text-xs hover:bg-amber-400"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Product</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {productsList.map((product) => (
              <div
                key={product.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-neutral-900/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <img
                      src={
                        product.images && product.images.length > 0
                          ? product.images[0]
                          : '/images/placeholder.svg'
                      }
                      alt={product.name || product.title}
                      className="h-14 w-14 rounded-lg object-cover bg-neutral-900 border border-neutral-800 shrink-0"
                    />
                    {product.images && product.images.length > 1 && (
                      <span className="absolute -bottom-1 -right-1 bg-zadel-gold text-black text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-black">
                        +{product.images.length - 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {product.name || product.title}
                    </h3>
                    <p className="text-xs text-neutral-400 capitalize">
                      {product.category} • {product.images?.length || 0} image(s)
                    </p>
                  </div>
                </div>

                <div className="sm:ml-auto flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-left sm:text-right">
                    <span className="text-sm font-mono font-medium text-zadel-gold">
                      ${product.price.toLocaleString()}
                    </span>
                    <span className="block text-[10px] text-neutral-500 uppercase">
                      {product.stock > 0 || product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openImageManager(product)}
                      className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-zadel-gold" />
                      <span>Manage Images</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden input for Replacing Image */}
      <input
        type="file"
        ref={replaceFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleReplaceFile}
      />

      {/* Image Manager Modal / Workspace */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-3xl rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zadel-gold">
                  Firebase Storage Gallery
                </span>
                <h2 className="font-display text-xl text-foreground">
                  Product Images: {selectedProduct.name || selectedProduct.title}
                </h2>
                <p className="text-xs text-neutral-400">
                  Upload multiple images to Firebase Storage, replace, reorder, or delete.
                </p>
              </div>
              <button
                type="button"
                onClick={closeImageManager}
                className="text-neutral-400 hover:text-neutral-200 p-1 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Alert Messages */}
            {alertMsg && (
              <div className="p-3 text-xs bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{alertMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 text-xs bg-red-950/60 border border-red-800/50 text-red-300 rounded-lg">
                {errorMsg}
              </div>
            )}

            {/* Upload Area */}
            <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 p-6 text-center space-y-3">
              <Upload className="h-8 w-8 text-zadel-gold mx-auto" />
              <div>
                <p className="text-xs font-medium text-neutral-200">
                  Upload Multiple Images to Firebase Storage
                </p>
                <p className="text-[11px] text-neutral-500">
                  Select one or more image files (.jpg, .png, .webp, .svg)
                </p>
              </div>

              <div>
                <input
                  type="file"
                  multiple
                  ref={multipleFileInputRef}
                  accept="image/*"
                  onChange={handleMultipleFilesUpload}
                  disabled={uploading}
                  className="hidden"
                  id="multi-image-input"
                />
                <label
                  htmlFor="multi-image-input"
                  className={`inline-flex items-center gap-2 bg-zadel-gold text-black font-medium text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-amber-400 transition-colors ${
                    uploading ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>{uploading ? 'Uploading...' : 'Choose Multiple Files'}</span>
                </label>
              </div>

              {uploadProgressMsg && (
                <p className="text-xs text-zadel-gold animate-pulse">{uploadProgressMsg}</p>
              )}
            </div>

            {/* Image Grid / Reordering List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-300">
                  Gallery Images ({images.length})
                </h3>
                <span className="text-[11px] text-neutral-500">
                  Use arrows to reorder • First image is primary thumbnail
                </span>
              </div>

              {images.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 border border-neutral-800 rounded-xl bg-neutral-950/40">
                  No images uploaded yet. Use the button above to upload images to Firebase Storage.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((url, idx) => (
                    <div
                      key={`${url}-${idx}`}
                      className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 space-y-3 relative group"
                    >
                      {/* Image Preview */}
                      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800">
                        <img
                          src={url}
                          alt={`Product image ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 bg-black/80 text-zadel-gold text-[10px] font-mono px-2 py-0.5 rounded-md border border-neutral-700">
                          #{idx + 1} {idx === 0 ? '(Primary)' : ''}
                        </span>
                      </div>

                      {/* Action Controls: Replace, Delete, Reorder */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => triggerReplace(idx)}
                            disabled={uploading}
                            className="flex-1 flex items-center justify-center gap-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 py-1 px-2 rounded text-[11px] transition-colors"
                            title="Replace image"
                          >
                            <RefreshCw className="h-3 w-3 text-zadel-gold" />
                            <span>Replace</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteImage(idx)}
                            disabled={uploading}
                            className="flex items-center justify-center bg-red-950/50 hover:bg-red-900/60 text-red-400 border border-red-900/50 p-1 rounded text-[11px] transition-colors"
                            title="Delete image"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Reorder Left / Right */}
                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-neutral-900">
                          <button
                            type="button"
                            disabled={idx === 0 || uploading}
                            onClick={() => handleMoveImage(idx, idx - 1)}
                            className="flex-1 flex items-center justify-center gap-1 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-neutral-400 py-1 rounded text-[10px] border border-neutral-800"
                            title="Move Image Left/Up"
                          >
                            <ArrowLeft className="h-3 w-3" />
                            <span>Move Left</span>
                          </button>

                          <button
                            type="button"
                            disabled={idx === images.length - 1 || uploading}
                            onClick={() => handleMoveImage(idx, idx + 1)}
                            className="flex-1 flex items-center justify-center gap-1 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-neutral-400 py-1 rounded text-[10px] border border-neutral-800"
                            title="Move Image Right/Down"
                          >
                            <span>Move Right</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer / Save to Firestore Button */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
              <button
                type="button"
                onClick={closeImageManager}
                disabled={savingImages || uploading}
                className="px-4 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleSaveImagesToFirestore}
                disabled={savingImages || uploading}
                className="flex items-center gap-2 bg-zadel-gold text-black font-medium text-xs px-5 py-2 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {savingImages ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{savingImages ? 'Saving to Firestore...' : 'Save Image URLs to Firestore'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-display text-lg text-foreground">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-200 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProductForm} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-medium text-neutral-300">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Silk Evening Gown"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:border-zadel-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-medium text-neutral-300">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:border-zadel-gold focus:outline-none"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Outerwear">Outerwear</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-medium text-neutral-300">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:border-zadel-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-medium text-neutral-300">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Product description..."
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:border-zadel-gold focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="flex items-center gap-2 bg-zadel-gold text-black font-medium px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors cursor-pointer"
                >
                  {savingProduct && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


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
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Star,
  Flame,
  Sparkles,
  IndianRupee,
  Percent,
} from 'lucide-react';
import {
  subscribeToProducts,
  updateProduct,
  addProduct,
  deleteProduct,
} from '../../lib/firebase';
import {
  uploadProductImageToStorage,
  deleteProductImageFromStorage,
} from '../../lib/cloudinary';
import type { FirestoreProduct } from '../../lib/types';
import AdminConfirmModal from '../../components/AdminConfirmModal';
import AdminToast, { ToastMessage } from '../../components/AdminToast';

export default function AdminProducts() {
  const [productsList, setProductsList] = useState<FirestoreProduct[]>([]);
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

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Active product image management modal
  const [selectedProduct, setSelectedProduct] = useState<FirestoreProduct | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string | null>(null);

  // General product modal (Add / Edit)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FirestoreProduct | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Men');
  const [formMrp, setFormMrp] = useState<number>(0);
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formDescription, setFormDescription] = useState('');
  const [formInStock, setFormInStock] = useState(true);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formBestSeller, setFormBestSeller] = useState(false);
  const [formNewArrival, setFormNewArrival] = useState(false);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [uploadingFormImages, setUploadingFormImages] = useState(false);
  const [formImageProgressMsg, setFormImageProgressMsg] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Pending Actions State
  const [togglingStockId, setTogglingStockId] = useState<string | null>(null);
  const [togglingAttributeId, setTogglingAttributeId] = useState<string | null>(null);
  const [savingImages, setSavingImages] = useState(false);

  // Attribute counts across all products
  const featuredCount = productsList.filter((p) => p.featured).length;
  const bestSellerCount = productsList.filter((p) => p.bestSeller).length;
  const newArrivalCount = productsList.filter((p) => p.newArrival).length;

  // Confirm Delete Modal State
  const [productToDelete, setProductToDelete] = useState<FirestoreProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  // File input refs
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const formFileInputRef = useRef<HTMLInputElement>(null);
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

  // Filtered products list
  const filteredProducts = productsList.filter((prod) => {
    const nameMatch =
      (prod.name || prod.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch =
      selectedCategoryFilter === 'All' ||
      prod.category.toLowerCase() === selectedCategoryFilter.toLowerCase();
    return nameMatch && categoryMatch;
  });

  // Toggle Stock Status
  const handleToggleStock = async (product: FirestoreProduct) => {
    setTogglingStockId(product.id);
    const newStockState = !product.inStock;
    try {
      await updateProduct(product.id, {
        inStock: newStockState,
        stock: newStockState ? 10 : 0,
      });
      addToast(
        'success',
        `Stock status for "${product.name || product.title}" updated to ${
          newStockState ? 'In Stock' : 'Out of Stock'
        }.`
      );
    } catch (err) {
      console.error('Error toggling stock:', err);
      addToast('error', 'Failed to update stock status in Firestore.');
    } finally {
      setTogglingStockId(null);
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (product: FirestoreProduct) => {
    const isFeatured = Boolean(product.featured);
    if (!isFeatured && featuredCount >= 4) {
      addToast('error', 'Maximum 4 Featured products allowed.');
      return;
    }

    setTogglingAttributeId(`${product.id}-featured`);
    try {
      await updateProduct(product.id, {
        featured: !isFeatured,
      });
      addToast(
        'success',
        `"${product.name || product.title}" is ${!isFeatured ? 'now Featured' : 'no longer Featured'}.`
      );
    } catch (err) {
      console.error('Error toggling featured:', err);
      addToast('error', 'Failed to update Featured status in Firestore.');
    } finally {
      setTogglingAttributeId(null);
    }
  };

  // Toggle Best Seller
  const handleToggleBestSeller = async (product: FirestoreProduct) => {
    const isBestSeller = Boolean(product.bestSeller);
    if (!isBestSeller && bestSellerCount >= 4) {
      addToast('error', 'Maximum 4 Best Seller products allowed.');
      return;
    }

    setTogglingAttributeId(`${product.id}-bestseller`);
    try {
      await updateProduct(product.id, {
        bestSeller: !isBestSeller,
      });
      addToast(
        'success',
        `"${product.name || product.title}" is ${!isBestSeller ? 'now a Best Seller' : 'no longer a Best Seller'}.`
      );
    } catch (err) {
      console.error('Error toggling best seller:', err);
      addToast('error', 'Failed to update Best Seller status in Firestore.');
    } finally {
      setTogglingAttributeId(null);
    }
  };

  // Toggle New Arrival
  const handleToggleNewArrival = async (product: FirestoreProduct) => {
    const isNewArrival = Boolean(product.newArrival);

    setTogglingAttributeId(`${product.id}-newarrival`);
    try {
      await updateProduct(product.id, {
        newArrival: !isNewArrival,
      });
      addToast(
        'success',
        `"${product.name || product.title}" is ${!isNewArrival ? 'now a New Arrival' : 'no longer a New Arrival'}.`
      );
    } catch (err) {
      console.error('Error toggling new arrival:', err);
      addToast('error', 'Failed to update New Arrival status in Firestore.');
    } finally {
      setTogglingAttributeId(null);
    }
  };

  // Open Image Manager Workspace
  const openImageManager = (product: FirestoreProduct) => {
    setSelectedProduct(product);
    setImages(product.images || []);
  };

  const closeImageManager = () => {
    if (uploading || savingImages) return;
    setSelectedProduct(null);
    setImages([]);
  };

  // Upload multiple images to Cloudinary
  const handleMultipleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedProduct) return;

    setUploading(true);

    const uploadedUrls: string[] = [];
    const total = files.length;

    try {
      for (let i = 0; i < total; i++) {
        const file = files[i];
        setUploadProgressMsg(`Uploading image ${i + 1} of ${total} to Cloudinary...`);
        const url = await uploadProductImageToStorage(file, selectedProduct.id);
        uploadedUrls.push(url);
      }

      const updatedList = [...images, ...uploadedUrls];
      setImages(updatedList);
      addToast('success', `Uploaded ${total} image(s) to Cloudinary.`);
    } catch (err) {
      console.error('Error uploading images:', err);
      addToast('error', 'Failed to upload image(s). Please try again.');
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
    setUploadProgressMsg('Uploading replacement image to Cloudinary...');

    try {
      const oldUrl = images[indexToReplace];
      const newUrl = await uploadProductImageToStorage(file, selectedProduct.id);

      const updatedList = [...images];
      updatedList[indexToReplace] = newUrl;
      setImages(updatedList);

      deleteProductImageFromStorage(oldUrl).catch(() => {});
      addToast('success', 'Image replaced in Cloudinary.');
    } catch (err) {
      console.error('Error replacing image:', err);
      addToast('error', 'Failed to replace image.');
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
    addToast('info', 'Image removed. Click "Save to Firestore" to apply changes.');
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

    try {
      await updateProduct(selectedProduct.id, {
        images: images,
      });

      addToast('success', 'Image gallery saved to Firestore! Website updated instantly.');
    } catch (err) {
      console.error('Error saving product images:', err);
      addToast('error', 'Failed to save image changes to Firestore.');
    } finally {
      setSavingImages(false);
    }
  };

  // Form Image Upload Handlers
  const handleFormFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFormImages(true);
    const uploadedUrls: string[] = [];
    const total = files.length;

    try {
      for (let i = 0; i < total; i++) {
        const file = files[i];
        setFormImageProgressMsg(`Uploading image ${i + 1} of ${total} to Cloudinary...`);
        const url = await uploadProductImageToStorage(file, editingProduct ? editingProduct.id : 'new-product');
        uploadedUrls.push(url);
      }
      setFormImages((prev) => [...prev, ...uploadedUrls]);
      addToast('success', `Uploaded ${total} image(s) to Cloudinary.`);
    } catch (err) {
      console.error('Error uploading form image(s):', err);
      addToast('error', 'Failed to upload image(s) to Cloudinary.');
    } finally {
      setUploadingFormImages(false);
      setFormImageProgressMsg(null);
      if (formFileInputRef.current) {
        formFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFormImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveFormImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= formImages.length) return;
    const updated = [...formImages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setFormImages(updated);
  };

  // Product Add / Edit Modal Controls
  const openAddProductModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Men');
    setFormMrp(5999);
    setFormPrice(4999);
    setFormDescription('');
    setFormInStock(true);
    setFormFeatured(false);
    setFormBestSeller(false);
    setFormNewArrival(false);
    setFormImages([]);
    setFormError(null);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: FirestoreProduct) => {
    setEditingProduct(prod);
    setFormName(prod.name || prod.title || '');
    setFormCategory(prod.category || 'Men');
    const existingMrp = prod.originalPrice || prod.mrp || prod.price || 0;
    const existingPrice = prod.price || 0;
    setFormMrp(existingMrp);
    setFormPrice(existingPrice);
    setFormDescription(prod.description || '');
    setFormInStock(prod.inStock ?? true);
    setFormFeatured(Boolean(prod.featured));
    setFormBestSeller(Boolean(prod.bestSeller));
    setFormNewArrival(Boolean(prod.newArrival));
    setFormImages(prod.images || []);
    setFormError(null);
    setIsProductModalOpen(true);
  };

  const handleSaveProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Product name is required.');
      return;
    }

    const mrpVal = Math.max(0, Number(formMrp) || 0);
    const priceVal = Math.max(0, Number(formPrice) || 0);

    if (mrpVal < 0 || priceVal < 0) {
      setFormError('Actual MRP and Store Selling Price cannot be negative.');
      return;
    }

    if (priceVal > mrpVal) {
      setFormError(`Store Selling Price (₹${priceVal.toLocaleString()}) cannot exceed Actual MRP (₹${mrpVal.toLocaleString()}).`);
      return;
    }

    // Auto-calculate Discount % rounded to a whole number: ((Actual MRP - Store Price) / Actual MRP) * 100
    const calculatedDiscount =
      mrpVal > 0 && priceVal <= mrpVal
        ? Math.round(((mrpVal - priceVal) / mrpVal) * 100)
        : 0;

    // Validate limits for Featured and Best Seller
    if (formFeatured) {
      const otherFeaturedCount = productsList.filter(
        (p) => p.featured && p.id !== editingProduct?.id
      ).length;
      if (otherFeaturedCount >= 4) {
        setFormError('Maximum 4 Featured products allowed.');
        addToast('error', 'Maximum 4 Featured products allowed.');
        return;
      }
    }

    if (formBestSeller) {
      const otherBestSellerCount = productsList.filter(
        (p) => p.bestSeller && p.id !== editingProduct?.id
      ).length;
      if (otherBestSellerCount >= 4) {
        setFormError('Maximum 4 Best Seller products allowed.');
        addToast('error', 'Maximum 4 Best Seller products allowed.');
        return;
      }
    }

    setSavingProduct(true);
    setFormError(null);

    const finalImages = formImages.length > 0 ? formImages : ['/images/placeholder.svg'];

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formName.trim(),
          title: formName.trim(),
          category: formCategory,
          price: priceVal,
          originalPrice: mrpVal,
          mrp: mrpVal,
          discount: calculatedDiscount,
          discountPercentage: calculatedDiscount,
          description: formDescription.trim(),
          images: finalImages,
          inStock: formInStock,
          stock: formInStock ? 10 : 0,
          featured: formFeatured,
          bestSeller: formBestSeller,
          newArrival: formNewArrival,
        });
        addToast('success', `Product "${formName.trim()}" updated successfully with pricing (${calculatedDiscount}% discount).`);
      } else {
        await addProduct({
          name: formName.trim(),
          title: formName.trim(),
          subtitle: formCategory,
          category: formCategory,
          price: priceVal,
          originalPrice: mrpVal,
          mrp: mrpVal,
          discount: calculatedDiscount,
          discountPercentage: calculatedDiscount,
          description: formDescription.trim(),
          images: finalImages,
          inStock: formInStock,
          stock: formInStock ? 10 : 0,
          featured: formFeatured,
          bestSeller: formBestSeller,
          newArrival: formNewArrival,
          published: true,
        });
        addToast('success', `Product "${formName.trim()}" created successfully with pricing (${calculatedDiscount}% discount).`);
      }
      setIsProductModalOpen(false);
    } catch (err) {
      console.error('Error saving product:', err);
      setFormError('Failed to save product to Firestore. Please try again.');
      addToast('error', 'Failed to save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  // Confirm Delete Product
  const confirmDeleteProduct = (prod: FirestoreProduct) => {
    setProductToDelete(prod);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    setDeletingProduct(true);
    try {
      await deleteProduct(productToDelete.id);
      addToast('success', `Product "${productToDelete.name || productToDelete.title}" deleted.`);
      setProductToDelete(null);
    } catch (err) {
      console.error('Error deleting product:', err);
      addToast('error', 'Failed to delete product from Firestore.');
    } finally {
      setDeletingProduct(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={removeToast} />

      {/* Confirmation Modal */}
      <AdminConfirmModal
        isOpen={!!productToDelete}
        title="Delete Product"
        description={`Are you sure you want to permanently delete "${
          productToDelete?.name || productToDelete?.title
        }" from the catalog? This action cannot be undone.`}
        confirmText="Delete Product"
        variant="danger"
        loading={deletingProduct}
        onConfirm={handleConfirmDelete}
        onClose={() => setProductToDelete(null)}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zadel-gold">
            <Package className="h-3.5 w-3.5" />
            <span>Admin Management</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-foreground">
            Product Catalog & Image Gallery
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openAddProductModal}
            className="flex items-center gap-2 bg-zadel-gold text-black font-medium text-xs px-4 py-2 rounded-xl hover:bg-amber-400 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
          </button>
          <div className="flex items-center gap-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 px-3 py-2 text-xs text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Synced with Firestore</span>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zadel-elevated border border-neutral-800 p-3.5 rounded-xl">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search products by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-9 pr-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:border-zadel-gold focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-500 shrink-0" />
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 focus:border-zadel-gold focus:outline-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Outerwear">Outerwear</option>
            <option value="Accessories">Accessories</option>
          </select>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="rounded-xl border border-neutral-800 bg-zadel-elevated overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-neutral-300">Catalog Items ({filteredProducts.length} of {productsList.length})</span>
            <span className="text-neutral-600 hidden sm:inline">•</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono border flex items-center gap-1 ${
              featuredCount >= 4 ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 font-semibold' : 'bg-neutral-900 border-neutral-800 text-neutral-400'
            }`}>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              Featured: {featuredCount}/4 {featuredCount >= 4 ? '(Max)' : ''}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono border flex items-center gap-1 ${
              bestSellerCount >= 4 ? 'bg-orange-950/60 border-orange-500/60 text-orange-300 font-semibold' : 'bg-neutral-900 border-neutral-800 text-neutral-400'
            }`}>
              <Flame className="h-3 w-3 fill-orange-400 text-orange-400" />
              Best Seller: {bestSellerCount}/4 {bestSellerCount >= 4 ? '(Max)' : ''}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono border bg-neutral-900 border-neutral-800 text-neutral-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-purple-400" />
              New Arrivals: {newArrivalCount}
            </span>
          </div>
          <span className="font-mono text-neutral-500 text-[11px]">
            Real-time Firestore & Storage Gallery Sync
          </span>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-400 flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-zadel-gold" />
            <span>Loading product catalog from Firestore...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center text-xs text-neutral-400 space-y-3">
            <Package className="h-10 w-10 text-neutral-600 mx-auto stroke-1" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-300">
                {searchTerm || selectedCategoryFilter !== 'All'
                  ? 'No matching products found'
                  : 'No products in catalog'}
              </p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {searchTerm || selectedCategoryFilter !== 'All'
                  ? 'Try clearing your search keyword or switching category filters.'
                  : 'Get started by creating your first luxury product item.'}
              </p>
            </div>
            {searchTerm || selectedCategoryFilter !== 'All' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategoryFilter('All');
                }}
                className="inline-flex items-center gap-2 border border-neutral-800 bg-neutral-900 text-neutral-300 px-4 py-2 rounded-lg font-medium text-xs hover:text-foreground"
              >
                <span>Clear Filters</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openAddProductModal}
                className="inline-flex items-center gap-2 bg-zadel-gold text-black px-4 py-2 rounded-lg font-medium text-xs hover:bg-amber-400"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Product</span>
              </button>
            )}
          </div>
        ) : (
          /* Products List */
          <div className="divide-y divide-neutral-800/80">
            {filteredProducts.map((product) => {
              const isToggling = togglingStockId === product.id;
              const inStock = product.inStock ?? true;

              return (
                <div
                  key={product.id}
                  className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-neutral-900/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="relative group shrink-0">
                      <img
                        src={
                          product.images && product.images.length > 0
                            ? product.images[0]
                            : '/images/placeholder.svg'
                        }
                        alt={product.name || product.title}
                        className="h-14 w-14 rounded-xl object-cover bg-neutral-900 border border-neutral-800"
                      />
                      {product.images && product.images.length > 1 && (
                        <span className="absolute -bottom-1 -right-1 bg-zadel-gold text-black text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-black shadow">
                          +{product.images.length - 1}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-foreground truncate">
                          {product.name || product.title}
                        </h3>
                        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded uppercase">
                          {product.category}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {product.description || 'No description provided.'}
                      </p>
                      {(() => {
                        const mrp = product.originalPrice || product.mrp || product.price || 0;
                        const price = product.price || 0;
                        const discount =
                          product.discount ??
                          (mrp > 0 && price <= mrp ? Math.round(((mrp - price) / mrp) * 100) : 0);

                        return (
                          <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-mono mt-1">
                            <span className="text-neutral-400">Gallery: {product.images?.length || 0} image(s)</span>
                            <span className="text-neutral-700">•</span>
                            <span className="text-neutral-200 font-semibold">Store Price: ₹{price.toLocaleString()}</span>
                            {mrp > price ? (
                              <>
                                <span className="text-neutral-500">MRP: <span className="line-through">₹{mrp.toLocaleString()}</span></span>
                                <span className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-1.5 py-0.2 rounded font-bold text-[10px]">
                                  {discount}% OFF
                                </span>
                              </>
                            ) : (
                              <span className="text-neutral-500">MRP: ₹{mrp.toLocaleString()}</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Right side controls & Badges */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-900">
                    {/* Featured Toggle Button */}
                    <button
                      type="button"
                      disabled={togglingAttributeId === `${product.id}-featured`}
                      onClick={() => handleToggleFeatured(product)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                        product.featured
                          ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 hover:bg-amber-900/70'
                          : featuredCount >= 4
                          ? 'bg-neutral-900/60 border-neutral-800/80 text-neutral-500 hover:text-neutral-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-amber-300 hover:border-neutral-700'
                      }`}
                      title={
                        product.featured
                          ? 'Featured (Click to unselect)'
                          : featuredCount >= 4
                          ? 'Maximum 4 Featured products allowed.'
                          : 'Click to select Featured'
                      }
                    >
                      {togglingAttributeId === `${product.id}-featured` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                      ) : (
                        <Star className={`h-3.5 w-3.5 ${product.featured ? 'fill-amber-400 text-amber-400' : 'text-neutral-500'}`} />
                      )}
                      <span>Featured</span>
                    </button>

                    {/* Best Seller Toggle Button */}
                    <button
                      type="button"
                      disabled={togglingAttributeId === `${product.id}-bestseller`}
                      onClick={() => handleToggleBestSeller(product)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                        product.bestSeller
                          ? 'bg-orange-950/60 border-orange-500/60 text-orange-300 hover:bg-orange-900/70'
                          : bestSellerCount >= 4
                          ? 'bg-neutral-900/60 border-neutral-800/80 text-neutral-500 hover:text-neutral-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-orange-300 hover:border-neutral-700'
                      }`}
                      title={
                        product.bestSeller
                          ? 'Best Seller (Click to unselect)'
                          : bestSellerCount >= 4
                          ? 'Maximum 4 Best Seller products allowed.'
                          : 'Click to select Best Seller'
                      }
                    >
                      {togglingAttributeId === `${product.id}-bestseller` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-400" />
                      ) : (
                        <Flame className={`h-3.5 w-3.5 ${product.bestSeller ? 'fill-orange-400 text-orange-400' : 'text-neutral-500'}`} />
                      )}
                      <span>Best Seller</span>
                    </button>

                    {/* New Arrival Toggle Button */}
                    <button
                      type="button"
                      disabled={togglingAttributeId === `${product.id}-newarrival`}
                      onClick={() => handleToggleNewArrival(product)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                        product.newArrival
                          ? 'bg-purple-950/60 border-purple-500/60 text-purple-300 hover:bg-purple-900/70'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-purple-300 hover:border-neutral-700'
                      }`}
                      title={
                        product.newArrival
                          ? 'New Arrival (ON) - Click to turn OFF'
                          : 'Click to turn ON New Arrival'
                      }
                    >
                      {togglingAttributeId === `${product.id}-newarrival` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
                      ) : (
                        <Sparkles className={`h-3.5 w-3.5 ${product.newArrival ? 'fill-purple-400 text-purple-400' : 'text-neutral-500'}`} />
                      )}
                      <span>New Arrival</span>
                    </button>

                    {/* Stock Toggle Button */}
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleToggleStock(product)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                        inStock
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                      title="Toggle Stock Availability"
                    >
                      {isToggling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-zadel-gold" />
                      ) : inStock ? (
                        <ToggleRight className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-neutral-500" />
                      )}
                      <span>{inStock ? 'In Stock' : 'Out of Stock'}</span>
                    </button>

                    {/* Manage Images Button */}
                    <button
                      type="button"
                      onClick={() => openImageManager(product)}
                      className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-zadel-gold" />
                      <span className="hidden sm:inline">Gallery</span>
                    </button>

                    {/* Edit Product Button */}
                    <button
                      type="button"
                      onClick={() => openEditProductModal(product)}
                      className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-zadel-gold hover:bg-neutral-900 transition-colors cursor-pointer"
                      title="Edit Product Details"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    {/* Delete Product Button */}
                    <button
                      type="button"
                      onClick={() => confirmDeleteProduct(product)}
                      className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
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

      {/* Image Manager Modal Workspace */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zadel-gold">
                  Cloudinary Gallery
                </span>
                <h2 className="font-display text-xl text-foreground">
                  Product Images: {selectedProduct.name || selectedProduct.title}
                </h2>
                <p className="text-xs text-neutral-400">
                  Upload multiple images to Cloudinary, replace, reorder, or delete.
                </p>
              </div>
              <button
                type="button"
                onClick={closeImageManager}
                disabled={uploading || savingImages}
                className="text-neutral-400 hover:text-neutral-200 p-1 rounded-md disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Multiple File Upload Area */}
            <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 p-6 text-center space-y-3">
              <Upload className="h-8 w-8 text-zadel-gold mx-auto" />
              <div>
                <p className="text-xs font-medium text-neutral-200">
                  Upload Multiple Images to Cloudinary
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
                  className={`inline-flex items-center gap-2 bg-zadel-gold text-black font-medium text-xs px-4 py-2 rounded-xl cursor-pointer hover:bg-amber-400 transition-colors ${
                    uploading ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>{uploading ? 'Uploading to Cloudinary...' : 'Choose Multiple Files'}</span>
                </label>
              </div>

              {uploadProgressMsg && (
                <p className="text-xs text-zadel-gold animate-pulse">{uploadProgressMsg}</p>
              )}
            </div>

            {/* Gallery Grid */}
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
                  No images uploaded yet. Use the button above to upload images to Cloudinary.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((url, idx) => (
                    <div
                      key={`${url}-${idx}`}
                      className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 space-y-3 relative group"
                    >
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

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => triggerReplace(idx)}
                            disabled={uploading || savingImages}
                            className="flex-1 flex items-center justify-center gap-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 py-1.5 px-2 rounded-lg text-[11px] transition-colors disabled:opacity-50"
                            title="Replace image"
                          >
                            <RefreshCw className="h-3 w-3 text-zadel-gold" />
                            <span>Replace</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteImage(idx)}
                            disabled={uploading || savingImages}
                            className="flex items-center justify-center bg-red-950/50 hover:bg-red-900/60 text-red-400 border border-red-900/50 p-1.5 rounded-lg text-[11px] transition-colors disabled:opacity-50"
                            title="Delete image"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-neutral-900">
                          <button
                            type="button"
                            disabled={idx === 0 || uploading || savingImages}
                            onClick={() => handleMoveImage(idx, idx - 1)}
                            className="flex-1 flex items-center justify-center gap-1 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-neutral-400 py-1 rounded text-[10px] border border-neutral-800"
                            title="Move Image Left"
                          >
                            <ArrowLeft className="h-3 w-3" />
                            <span>Left</span>
                          </button>

                          <button
                            type="button"
                            disabled={idx === images.length - 1 || uploading || savingImages}
                            onClick={() => handleMoveImage(idx, idx + 1)}
                            className="flex-1 flex items-center justify-center gap-1 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 text-neutral-400 py-1 rounded text-[10px] border border-neutral-800"
                            title="Move Image Right"
                          >
                            <span>Right</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
              <button
                type="button"
                onClick={closeImageManager}
                disabled={savingImages || uploading}
                className="px-4 py-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs disabled:opacity-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleSaveImagesToFirestore}
                disabled={savingImages || uploading}
                className="flex items-center gap-2 bg-zadel-gold text-black font-medium text-xs px-5 py-2 rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {savingImages ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{savingImages ? 'Saving to Firestore...' : 'Save Gallery to Firestore'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-display text-lg text-foreground">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                type="button"
                onClick={() => !savingProduct && setIsProductModalOpen(false)}
                disabled={savingProduct}
                className="text-neutral-400 hover:text-neutral-200 p-1 rounded-md disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-950/60 border border-red-800/50 text-red-300 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

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

              {/* Product Pricing Structure */}
              <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/80 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                  <span className="font-semibold text-neutral-200 text-xs flex items-center gap-1.5">
                    <IndianRupee className="h-4 w-4 text-zadel-gold" />
                    Product Pricing Structure
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Discount % = ((MRP - Store Price) / MRP) × 100
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Actual MRP */}
                  <div>
                    <label className="block mb-1 font-medium text-neutral-300 text-[11px]">
                      Actual MRP (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={formMrp}
                      onChange={(e) => setFormMrp(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="e.g. 5999"
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-200 focus:border-zadel-gold focus:outline-none font-mono"
                    />
                  </div>

                  {/* Store Selling Price */}
                  <div>
                    <label className="block mb-1 font-medium text-neutral-300 text-[11px]">
                      Store Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="e.g. 4999"
                      className={`w-full rounded-lg border bg-neutral-900 px-3 py-2 text-neutral-200 focus:outline-none font-mono ${
                        formPrice > formMrp && formMrp > 0
                          ? 'border-rose-500/80 focus:border-rose-500'
                          : 'border-neutral-800 focus:border-zadel-gold'
                      }`}
                    />
                  </div>

                  {/* Auto-Calculated Discount % */}
                  <div>
                    <label className="block mb-1 font-medium text-neutral-300 text-[11px]">
                      Discount %
                    </label>
                    <div className="w-full rounded-lg border border-emerald-900/60 bg-emerald-950/40 px-3 py-2 flex items-center justify-between font-mono text-emerald-300">
                      <span className="font-bold text-sm">
                        {formMrp > 0 && formPrice <= formMrp
                          ? `${Math.round(((formMrp - formPrice) / formMrp) * 100)}%`
                          : '0%'}
                      </span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-900/60 border border-emerald-700/60 px-1.5 py-0.5 rounded uppercase tracking-wider font-sans font-semibold">
                        Auto
                      </span>
                    </div>
                  </div>
                </div>

                {/* Formula Breakdown & Summary */}
                <div className="text-[11px] text-neutral-400 bg-neutral-900/90 border border-neutral-800/80 rounded-lg p-2.5 flex items-center justify-between">
                  <div className="space-y-0.5 w-full">
                    <div className="flex items-center gap-2">
                      <span>MRP: <strong className="text-neutral-200">₹{formMrp.toLocaleString()}</strong></span>
                      <span>→</span>
                      <span>Store Price: <strong className="text-zadel-gold">₹{formPrice.toLocaleString()}</strong></span>
                    </div>
                    {formMrp > 0 && formPrice < formMrp ? (
                      <p className="text-emerald-400 text-[10px]">
                        Customer saves ₹{(formMrp - formPrice).toLocaleString()} ({Math.round(((formMrp - formPrice) / formMrp) * 100)}% discount applied)
                      </p>
                    ) : formMrp > 0 && formPrice > formMrp ? (
                      <p className="text-rose-400 text-[10px] font-semibold">
                        ❌ Store Selling Price cannot exceed Actual MRP (₹{formMrp.toLocaleString()}).
                      </p>
                    ) : (
                      <p className="text-neutral-500 text-[10px]">
                        No discount applied (Selling price equals MRP).
                      </p>
                    )}
                  </div>
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

              {/* Image Upload Area for Add/Edit Product */}
              <div>
                <label className="block mb-1.5 font-medium text-neutral-300">
                  Product Images (Cloudinary Upload)
                </label>
                <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 p-4 text-center space-y-2">
                  <input
                    type="file"
                    multiple
                    ref={formFileInputRef}
                    accept="image/*"
                    onChange={handleFormFileUpload}
                    disabled={uploadingFormImages || savingProduct}
                    className="hidden"
                    id="form-product-image-input"
                  />
                  <label
                    htmlFor="form-product-image-input"
                    className={`inline-flex items-center gap-2 bg-zadel-gold text-black font-medium text-xs px-3.5 py-2 rounded-xl cursor-pointer hover:bg-amber-400 transition-colors ${
                      uploadingFormImages || savingProduct ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {uploadingFormImages ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>{uploadingFormImages ? 'Uploading to Cloudinary...' : 'Upload Images from Device'}</span>
                  </label>
                  <p className="text-[11px] text-neutral-500">
                    Select multiple images (.png, .jpg, .webp). First image is primary thumbnail.
                  </p>
                  {formImageProgressMsg && (
                    <p className="text-[11px] text-zadel-gold animate-pulse">{formImageProgressMsg}</p>
                  )}
                </div>

                {/* Uploaded Images Preview List */}
                {formImages.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium">
                      <span>Gallery Preview ({formImages.length})</span>
                      <span className="text-[10px] text-neutral-500">#1 is Primary</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {formImages.map((url, idx) => (
                        <div
                          key={`${url}-${idx}`}
                          className="relative aspect-square rounded-lg bg-neutral-950 border border-neutral-800 overflow-hidden group"
                        >
                          <img
                            src={url}
                            alt={`Product image ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1 left-1 bg-black/80 text-zadel-gold text-[9px] font-mono px-1.5 py-0.5 rounded border border-neutral-700">
                            #{idx + 1} {idx === 0 ? 'Primary' : ''}
                          </span>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveFormImage(idx, idx - 1)}
                                className="p-1 bg-neutral-800 text-neutral-200 rounded hover:bg-neutral-700"
                                title="Move left"
                              >
                                <ArrowLeft className="h-3 w-3" />
                              </button>
                            )}
                            {idx < formImages.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveFormImage(idx, idx + 1)}
                                className="p-1 bg-neutral-800 text-neutral-200 rounded hover:bg-neutral-700"
                                title="Move right"
                              >
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveFormImage(idx)}
                              className="p-1 bg-red-950/80 text-red-300 rounded hover:bg-red-900 border border-red-800"
                              title="Remove image"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Product Badges & Flags */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <label className="block font-medium text-neutral-300 text-xs">
                  Product Flags & Highlights
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Featured */}
                  <div
                    className={`p-3 rounded-xl border transition-colors ${
                      formFeatured
                        ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="formFeaturedCheck"
                        className="flex items-center gap-1.5 cursor-pointer font-medium text-xs"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            formFeatured ? 'text-amber-400 fill-amber-400' : 'text-neutral-500'
                          }`}
                        />
                        <span>Featured</span>
                      </label>
                      <input
                        type="checkbox"
                        id="formFeaturedCheck"
                        checked={formFeatured}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            const otherFeatured = productsList.filter(
                              (p) => p.featured && p.id !== editingProduct?.id
                            ).length;
                            if (otherFeatured >= 4) {
                              addToast('error', 'Maximum 4 Featured products allowed.');
                              setFormError('Maximum 4 Featured products allowed.');
                              return;
                            }
                          }
                          setFormError(null);
                          setFormFeatured(checked);
                        }}
                        className="h-4 w-4 rounded border-neutral-800 text-amber-500 focus:ring-amber-500 bg-neutral-950 cursor-pointer"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-1">
                      Max 4 allowed ({productsList.filter((p) => p.featured && p.id !== editingProduct?.id).length}/4 active)
                    </p>
                  </div>

                  {/* Best Seller */}
                  <div
                    className={`p-3 rounded-xl border transition-colors ${
                      formBestSeller
                        ? 'bg-orange-950/30 border-orange-500/50 text-orange-200'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="formBestSellerCheck"
                        className="flex items-center gap-1.5 cursor-pointer font-medium text-xs"
                      >
                        <Flame
                          className={`h-4 w-4 ${
                            formBestSeller ? 'text-orange-400 fill-orange-400' : 'text-neutral-500'
                          }`}
                        />
                        <span>Best Seller</span>
                      </label>
                      <input
                        type="checkbox"
                        id="formBestSellerCheck"
                        checked={formBestSeller}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            const otherBestSeller = productsList.filter(
                              (p) => p.bestSeller && p.id !== editingProduct?.id
                            ).length;
                            if (otherBestSeller >= 4) {
                              addToast('error', 'Maximum 4 Best Seller products allowed.');
                              setFormError('Maximum 4 Best Seller products allowed.');
                              return;
                            }
                          }
                          setFormError(null);
                          setFormBestSeller(checked);
                        }}
                        className="h-4 w-4 rounded border-neutral-800 text-orange-500 focus:ring-orange-500 bg-neutral-950 cursor-pointer"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-1">
                      Max 4 allowed ({productsList.filter((p) => p.bestSeller && p.id !== editingProduct?.id).length}/4 active)
                    </p>
                  </div>

                  {/* New Arrival */}
                  <div
                    className={`p-3 rounded-xl border transition-colors ${
                      formNewArrival
                        ? 'bg-purple-950/30 border-purple-500/50 text-purple-200'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="formNewArrivalCheck"
                        className="flex items-center gap-1.5 cursor-pointer font-medium text-xs"
                      >
                        <Sparkles
                          className={`h-4 w-4 ${
                            formNewArrival ? 'text-purple-400 fill-purple-400' : 'text-neutral-500'
                          }`}
                        />
                        <span>New Arrival</span>
                      </label>
                      <input
                        type="checkbox"
                        id="formNewArrivalCheck"
                        checked={formNewArrival}
                        onChange={(e) => setFormNewArrival(e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-800 text-purple-500 focus:ring-purple-500 bg-neutral-950 cursor-pointer"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-1">
                      ON/OFF toggle (No limit)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="inStockCheck"
                  checked={formInStock}
                  onChange={(e) => setFormInStock(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-800 text-zadel-gold focus:ring-zadel-gold bg-neutral-950 cursor-pointer"
                />
                <label htmlFor="inStockCheck" className="text-neutral-300 font-medium cursor-pointer text-xs">
                  Available in Stock
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  disabled={savingProduct || uploadingFormImages}
                  className="px-4 py-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct || uploadingFormImages}
                  className="flex items-center gap-2 bg-zadel-gold text-black font-medium px-5 py-2 rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingProduct && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{savingProduct ? 'Saving...' : 'Save Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

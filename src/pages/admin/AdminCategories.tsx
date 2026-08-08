import React, { useEffect, useState, useRef } from 'react';
import {
  Layers,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Search,
  AlertCircle,
  FolderOpen,
  Upload,
  RefreshCw,
  Eye,
} from 'lucide-react';
import {
  subscribeToCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from '../../lib/firebase';
import { uploadCategoryImageToCloudinary } from '../../lib/cloudinary';
import type { FirestoreCategory } from '../../lib/types';
import { slugify } from '../../lib/categoryService';
import AdminConfirmModal from '../../components/AdminConfirmModal';
import AdminToast, { ToastMessage } from '../../components/AdminToast';

export default function AdminCategories() {
  const [categoriesList, setCategoriesList] = useState<FirestoreCategory[]>([]);
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

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FirestoreCategory | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageProgressMsg, setImageProgressMsg] = useState<string | null>(null);
  const categoryFileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confirm Delete State
  const [categoryToDelete, setCategoryToDelete] = useState<FirestoreCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToCategories((data) => {
      setCategoriesList(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImage('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: FirestoreCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImage(cat.image || '');
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting || uploadingImage) return;
    setIsModalOpen(false);
    setEditingCategory(null);
    setError(null);
    if (categoryFileInputRef.current) {
      categoryFileInputRef.current.value = '';
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(slugify(val));
    }
  };

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingImage(true);
    setImageProgressMsg('Uploading category image to Cloudinary...');

    try {
      const url = await uploadCategoryImageToCloudinary(file);
      setImage(url);
      addToast('success', 'Category image uploaded to Cloudinary!');
    } catch (err) {
      console.error('Error uploading category image:', err);
      addToast('error', 'Failed to upload category image.');
    } finally {
      setUploadingImage(false);
      setImageProgressMsg(null);
      if (categoryFileInputRef.current) {
        categoryFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setImage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const finalSlug = slug.trim() || slugify(name);

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          slug: finalSlug,
          description: description.trim(),
          image: image.trim(),
        });
        addToast('success', `Category "${name.trim()}" updated successfully.`);
      } else {
        await addCategory({
          name: name.trim(),
          slug: finalSlug,
          description: description.trim(),
          image: image.trim() || '/images/placeholder-category.svg',
        });
        addToast('success', `Category "${name.trim()}" created successfully.`);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving category:', err);
      setError('Failed to save category to Firestore. Please try again.');
      addToast('error', 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setDeletingCategory(true);
    try {
      await deleteCategory(categoryToDelete.id);
      addToast('success', `Category "${categoryToDelete.name}" deleted.`);
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      addToast('error', 'Failed to delete category.');
    } finally {
      setDeletingCategory(false);
    }
  };

  const filteredCategories = categoriesList.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={removeToast} />

      {/* Confirmation Modal */}
      <AdminConfirmModal
        isOpen={!!categoryToDelete}
        title="Delete Category"
        description={`Are you sure you want to delete category "${categoryToDelete?.name}"? Products assigned to this category will not be removed, but category navigation links may be affected.`}
        confirmText="Delete Category"
        variant="danger"
        loading={deletingCategory}
        onConfirm={handleConfirmDelete}
        onClose={() => setCategoryToDelete(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zadel-gold">
            <Layers className="h-3.5 w-3.5" />
            <span>Admin Management</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-foreground">Categories</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-2 bg-zadel-gold text-black font-medium text-xs px-4 py-2 rounded-xl hover:bg-amber-400 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
          <div className="flex items-center gap-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 px-3 py-2 text-xs text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Synced with Firestore</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Search categories by name or slug..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-9 pr-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:border-zadel-gold focus:outline-none"
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

      {/* Categories Card / Grid */}
      <div className="rounded-xl border border-neutral-800 bg-zadel-elevated overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center text-xs text-neutral-400">
          <span>Active Categories ({filteredCategories.length})</span>
          <span className="font-mono text-neutral-500 text-[11px]">Firestore Collection</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-400 flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-zadel-gold" />
            <span>Loading categories from Firestore...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400 space-y-3">
            <FolderOpen className="h-10 w-10 text-neutral-600 mx-auto stroke-1" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-300">
                {searchTerm ? 'No matching categories found' : 'No categories available'}
              </p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {searchTerm
                  ? 'Try searching for another keyword.'
                  : 'Add categories to organize your luxury collection.'}
              </p>
            </div>
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center gap-2 border border-neutral-800 bg-neutral-900 text-neutral-300 px-4 py-2 rounded-lg font-medium text-xs hover:text-foreground"
              >
                <span>Clear Search</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-2 bg-zadel-gold text-black px-4 py-2 rounded-lg font-medium text-xs hover:bg-amber-400"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Category</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-4 space-y-3 flex flex-col justify-between hover:border-neutral-700 transition-colors"
              >
                <div className="space-y-2">
                  {cat.image && (
                    <div className="h-28 w-full rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800 mb-2">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-sm text-foreground truncate">
                      {cat.name}
                    </h3>
                    <span className="text-[10px] font-mono text-zadel-gold bg-zadel-gold/10 border border-zadel-gold/20 px-2 py-0.5 rounded">
                      /{cat.slug}
                    </span>
                  </div>
                  {cat.description && (
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(cat)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-xs text-neutral-300 hover:text-zadel-gold hover:border-neutral-700 transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryToDelete(cat)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-xs text-neutral-400 hover:text-red-400 hover:bg-red-950/40 hover:border-red-900/50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-display text-lg text-foreground">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting || uploadingImage}
                className="text-neutral-400 hover:text-neutral-200 p-1 rounded-md disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800/50 text-red-300 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-medium text-neutral-300">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Evening Wear"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:border-zadel-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-neutral-300">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. evening-wear"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 font-mono placeholder-neutral-600 focus:border-zadel-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-neutral-300">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief category description..."
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:border-zadel-gold focus:outline-none"
                />
              </div>

              {/* Category Image Upload / View / Replace / Remove Area */}
              <div>
                <label className="block mb-1.5 font-medium text-neutral-300">
                  Category Image (Cloudinary)
                </label>

                <input
                  type="file"
                  ref={categoryFileInputRef}
                  accept="image/*"
                  onChange={handleCategoryImageUpload}
                  disabled={uploadingImage || submitting}
                  className="hidden"
                  id="category-image-input"
                />

                {image ? (
                  /* View, Replace, Remove Image Card */
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-black border border-neutral-800 shrink-0 group">
                        <img
                          src={image}
                          alt="Category Preview"
                          className="w-full h-full object-cover"
                        />
                        <a
                          href={image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                          title="View Full Image"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-neutral-200 truncate" title={image}>
                          {image}
                        </p>
                        <span className="inline-block mt-0.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2 py-0.5 rounded">
                          Cloudinary Secure URL
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-800/80">
                      <label
                        htmlFor="category-image-input"
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium py-1.5 px-3 rounded-lg cursor-pointer transition-colors ${
                          uploadingImage || submitting ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {uploadingImage ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        <span>{uploadingImage ? 'Uploading...' : 'Replace Image'}</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={uploadingImage || submitting}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-900/60 text-xs font-medium py-1.5 px-3 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove Image</span>
                      </button>
                    </div>

                    {imageProgressMsg && (
                      <p className="text-[11px] text-zadel-gold animate-pulse text-center">{imageProgressMsg}</p>
                    )}
                  </div>
                ) : (
                  /* Upload Dropzone when no image */
                  <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 p-4 text-center space-y-2">
                    <label
                      htmlFor="category-image-input"
                      className={`inline-flex items-center gap-2 bg-zadel-gold text-black font-medium text-xs px-3.5 py-2 rounded-xl cursor-pointer hover:bg-amber-400 transition-colors ${
                        uploadingImage || submitting ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      {uploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>{uploadingImage ? 'Uploading to Cloudinary...' : 'Select Image from Device'}</span>
                    </label>
                    <p className="text-[11px] text-neutral-500">
                      Select an image file (.png, .jpg, .webp, .svg) from device
                    </p>
                    {imageProgressMsg && (
                      <p className="text-[11px] text-zadel-gold animate-pulse">{imageProgressMsg}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting || uploadingImage}
                  className="px-4 py-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="flex items-center gap-2 bg-zadel-gold text-black font-medium px-5 py-2 rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{submitting ? 'Saving...' : 'Save Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

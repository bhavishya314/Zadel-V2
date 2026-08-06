import React, { useEffect, useState } from 'react';
import { Layers, ShieldCheck, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import {
  subscribeToCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from '../../lib/firebase';
import type { FirestoreCategory } from '../../lib/types';
import { slugify } from '../../lib/categoryService';

export default function AdminCategories() {
  const [categoriesList, setCategoriesList] = useState<FirestoreCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FirestoreCategory | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    if (submitting) return;
    setIsModalOpen(false);
    setEditingCategory(null);
    setError(null);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(slugify(val));
    }
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
      } else {
        await addCategory({
          name: name.trim(),
          slug: finalSlug,
          description: description.trim(),
          image: image.trim() || '/images/placeholder-category.svg',
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving category:', err);
      setError('Failed to save category to Firestore. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteCategory(id);
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zadel-gold">
            <Layers className="h-3.5 w-3.5" />
            <span>Admin Management</span>
          </div>
          <h1 className="font-display text-3xl text-foreground">Categories</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-2 bg-zadel-gold text-black font-medium text-xs px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
          <div className="flex items-center gap-2 rounded-lg bg-emerald-950/50 border border-emerald-800/40 px-3 py-1.5 text-xs text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Synced with Firestore</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-zadel-gold" />
          <span>Loading categories from Firestore...</span>
        </div>
      ) : categoriesList.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-zadel-elevated p-8 text-center space-y-3">
          <p className="text-sm text-neutral-300">No categories found in Firestore.</p>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-zadel-gold text-black text-xs font-medium px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create First Category</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriesList.map((cat) => (
            <div
              key={cat.id}
              className="rounded-xl border border-neutral-800 bg-zadel-elevated p-5 space-y-3 flex flex-col justify-between group hover:border-neutral-700 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-display text-lg text-foreground">{cat.name}</span>
                  <span className="text-[10px] uppercase tracking-wider font-mono bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-zadel-gold shrink-0">
                    {cat.slug}
                  </span>
                </div>
                {cat.description && (
                  <p className="text-xs text-neutral-400 leading-relaxed">{cat.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-neutral-800/60 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(cat)}
                  className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors text-xs flex items-center gap-1"
                  title="Edit Category"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Edit</span>
                </button>
                <button
                  type="button"
                  disabled={deletingId === cat.id}
                  onClick={() => handleDelete(cat.id)}
                  className="p-1.5 rounded-md hover:bg-red-950/60 text-neutral-400 hover:text-red-400 transition-colors text-xs flex items-center gap-1 disabled:opacity-50"
                  title="Delete Category"
                >
                  {deletingId === cat.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  <span className="text-[11px]">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-display text-lg text-foreground">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-neutral-400 hover:text-neutral-200 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 text-xs bg-red-950/60 border border-red-800/50 text-red-300 rounded-lg">
                {error}
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
                  placeholder="e.g. Footwear"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:border-zadel-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-neutral-300">
                  Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. footwear"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:border-zadel-gold focus:outline-none font-mono text-[11px]"
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
                  placeholder="Brief description of this collection..."
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:border-zadel-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-neutral-300">
                  Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="/images/placeholder-category.svg"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:border-zadel-gold focus:outline-none font-mono text-[11px]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-zadel-gold text-black font-medium px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


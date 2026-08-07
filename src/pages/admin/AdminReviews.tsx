import React, { useEffect, useState } from 'react';
import {
  Star,
  ShieldCheck,
  MessageSquare,
  Trash2,
  Loader2,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { ProductReview } from '../../lib/productReviews';
import { subscribeToAllReviews, deleteReview } from '../../lib/firebase';
import AdminConfirmModal from '../../components/AdminConfirmModal';
import AdminToast, { ToastMessage } from '../../components/AdminToast';

export default function AdminReviews() {
  const [reviewsList, setReviewsList] = useState<ProductReview[]>([]);
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
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('All');

  // Confirm Delete State
  const [reviewToDelete, setReviewToDelete] = useState<ProductReview | null>(null);
  const [deletingReview, setDeletingReview] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAllReviews((firestoreReviews) => {
      const mapped: ProductReview[] = firestoreReviews.map((r) => ({
        id: r.id,
        productId: r.productId,
        name: r.name || r.author || 'Anonymous',
        rating: typeof r.rating === 'number' ? r.rating : 5,
        title: r.title || undefined,
        text: r.text || r.review || r.comment || '',
        date:
          r.date ||
          (r.createdAt ? r.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
        createdAt: r.createdAt,
      }));
      setReviewsList(mapped);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return;

    setDeletingReview(true);
    try {
      await deleteReview(reviewToDelete.id);
      addToast('success', 'Customer review deleted successfully.');
      setReviewToDelete(null);
    } catch (err) {
      console.error('Error deleting review:', err);
      addToast('error', 'Failed to delete review from Firestore.');
    } finally {
      setDeletingReview(false);
    }
  };

  const filteredReviews = reviewsList.filter((rev) => {
    const textMatch =
      rev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rev.title && rev.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const ratingMatch =
      selectedRatingFilter === 'All' || rev.rating === Number(selectedRatingFilter);
    return textMatch && ratingMatch;
  });

  return (
    <div className="space-y-6">
      <AdminToast toasts={toasts} onDismiss={removeToast} />

      {/* Confirmation Modal */}
      <AdminConfirmModal
        isOpen={!!reviewToDelete}
        title="Delete Customer Review"
        description={`Are you sure you want to delete the review submitted by "${reviewToDelete?.name}"?`}
        confirmText="Delete Review"
        variant="danger"
        loading={deletingReview}
        onConfirm={handleConfirmDelete}
        onClose={() => setReviewToDelete(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zadel-gold">
            <Star className="h-3.5 w-3.5" />
            <span>Admin Moderation</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-foreground">
            Customer Reviews
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 px-3 py-2 text-xs text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span className="hidden sm:inline">Synced with Firestore</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zadel-elevated border border-neutral-800 p-3.5 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search reviews by reviewer name or comment..."
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

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-500 shrink-0" />
          <select
            value={selectedRatingFilter}
            onChange={(e) => setSelectedRatingFilter(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 focus:border-zadel-gold focus:outline-none cursor-pointer"
          >
            <option value="All">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Reviews List Card */}
      <div className="rounded-xl border border-neutral-800 bg-zadel-elevated overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center text-xs text-neutral-400">
          <span>Submitted Reviews ({filteredReviews.length} of {reviewsList.length})</span>
          <span className="font-mono text-neutral-500 text-[11px]">Firestore Moderation Log</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-400 flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-zadel-gold" />
            <span>Loading customer reviews...</span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400 space-y-3">
            <MessageSquare className="h-10 w-10 text-neutral-600 mx-auto stroke-1" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-300">
                {searchTerm || selectedRatingFilter !== 'All'
                  ? 'No reviews match your filters'
                  : 'No customer reviews submitted yet'}
              </p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {searchTerm || selectedRatingFilter !== 'All'
                  ? 'Try clearing search or rating filters.'
                  : 'Customer reviews will appear here once submitted on product pages.'}
              </p>
            </div>
            {(searchTerm || selectedRatingFilter !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRatingFilter('All');
                }}
                className="inline-flex items-center gap-2 border border-neutral-800 bg-neutral-900 text-neutral-300 px-4 py-2 rounded-lg font-medium text-xs hover:text-foreground"
              >
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {filteredReviews.map((review) => (
              <div key={review.id} className="p-5 space-y-3 hover:bg-neutral-900/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{review.name}</span>
                    {review.productId && (
                      <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                        Product: {review.productId}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-zadel-gold">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < review.rating ? 'fill-zadel-gold text-zadel-gold' : 'text-neutral-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {review.title && (
                  <h4 className="text-xs font-semibold text-neutral-200">{review.title}</h4>
                )}
                <p className="text-xs text-neutral-300 leading-relaxed">{review.text}</p>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-900">
                  <div className="text-[10px] text-neutral-500 font-mono">{review.date}</div>
                  <button
                    type="button"
                    onClick={() => setReviewToDelete(review)}
                    className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-400 transition-colors px-2.5 py-1 rounded-lg border border-neutral-800 hover:border-red-900/50 hover:bg-red-950/40 cursor-pointer"
                    title="Delete Review"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Review</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

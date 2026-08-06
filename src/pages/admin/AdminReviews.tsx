import React, { useEffect, useState } from 'react';
import { Star, ShieldCheck, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { ProductReview } from '../../lib/productReviews';
import { subscribeToAllReviews, deleteReview } from '../../lib/firebase';

export default function AdminReviews() {
  const [reviewsList, setReviewsList] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteReview(id);
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Failed to delete review.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zadel-gold">
            <Star className="h-3.5 w-3.5" />
            <span>Admin Management</span>
          </div>
          <h1 className="font-display text-3xl text-foreground">
            Customer Reviews
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-emerald-950/50 border border-emerald-800/40 px-3 py-1.5 text-xs text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span>Synced with Firestore</span>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-zadel-elevated">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center text-xs text-neutral-400">
          <span>Submitted Reviews ({reviewsList.length})</span>
          <span className="font-mono text-neutral-500">Moderation Log</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-zadel-gold" />
            <span>Loading reviews from Firestore...</span>
          </div>
        ) : reviewsList.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <MessageSquare className="h-8 w-8 text-neutral-600 mx-auto" />
            <p className="text-xs text-neutral-400">No customer reviews have been submitted yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {reviewsList.map((review) => (
              <div key={review.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{review.name}</span>
                    {review.productId && (
                      <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                        Product: {review.productId}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-zadel-gold">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-zadel-gold text-zadel-gold' : 'text-neutral-700'}`}
                      />
                    ))}
                  </div>
                </div>
                {review.title && <h4 className="text-xs font-medium text-neutral-200">{review.title}</h4>}
                <p className="text-xs text-neutral-300 leading-relaxed">{review.text}</p>
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[10px] text-neutral-500 font-mono">{review.date}</div>
                  <button
                    type="button"
                    disabled={deletingId === review.id}
                    onClick={() => handleDelete(review.id)}
                    className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-950/40 disabled:opacity-50"
                    title="Delete Review"
                  >
                    {deletingId === review.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span>Delete</span>
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


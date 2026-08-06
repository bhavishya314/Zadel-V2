/**
 * Product Reviews — frontend data layer
 *
 * Shape mirrors a future Firestore structure:
 *   products/{productId}/reviews/{reviewId}
 *   products/{productId} → { averageRating, totalReviews }
 *
 * Products start with zero reviews until a real customer submits one.
 */

import { addReview, getProductReviews } from './firebase';

export interface ProductReview {
  id: string;
  productId: string;
  name: string;
  rating: number;
  title?: string;
  text: string;
  date: string;
  createdAt?: string;
}

export interface ProductReviewSummary {
  productId: string;
  averageRating: number;
  totalReviews: number;
}

export interface ProductReviewsPayload {
  productId: string;
  reviews: ProductReview[];
  summary: ProductReviewSummary;
}

const sessionReviews: ProductReview[] = [];

function sortByLatest(reviews: ProductReview[]): ProductReview[] {
  return [...reviews].sort((a, b) => {
    const aTime = a.createdAt || a.date;
    const bTime = b.createdAt || b.date;
    return bTime.localeCompare(aTime);
  });
}

function reviewsForProductId(productId: string): ProductReview[] {
  return sortByLatest(sessionReviews.filter((r) => r.productId === productId));
}

function computeReviewSummary(
  productId: string,
  reviews: ProductReview[]
): ProductReviewSummary {
  if (reviews.length === 0) {
    return { productId, averageRating: 0, totalReviews: 0 };
  }
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = Math.round((total / reviews.length) * 10) / 10;
  return {
    productId,
    averageRating,
    totalReviews: reviews.length,
  };
}

export async function fetchProductReviews(
  productId: string
): Promise<ProductReviewsPayload> {
  try {
    const firestoreReviews = await getProductReviews(productId);
    const mapped: ProductReview[] = firestoreReviews.map((r) => ({
      id: r.id,
      productId: r.productId || productId,
      name: r.name || r.author || 'Anonymous',
      rating: typeof r.rating === 'number' ? r.rating : 5,
      title: r.title || undefined,
      text: r.text || r.review || r.comment || '',
      date:
        r.date ||
        (r.createdAt ? r.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
      createdAt: r.createdAt,
    }));

    return {
      productId,
      reviews: mapped,
      summary: computeReviewSummary(productId, mapped),
    };
  } catch (err) {
    console.error('Failed to fetch reviews from Firestore:', err);
    const reviews = reviewsForProductId(productId);
    return {
      productId,
      reviews,
      summary: computeReviewSummary(productId, reviews),
    };
  }
}

export interface SubmitReviewInput {
  productId: string;
  name: string;
  rating: number;
  title?: string;
  text: string;
}

export async function submitProductReview(
  input: SubmitReviewInput
): Promise<ProductReview> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const isoStr = now.toISOString();

  let reviewId = `local-${now.getTime()}`;

  try {
    const firestoreResult = await addReview({
      productId: input.productId,
      rating: input.rating,
      review: input.text.trim(),
      comment: input.text.trim(),
      text: input.text.trim(),
      name: input.name.trim(),
      author: input.name.trim(),
      title: input.title?.trim() || '',
      date: dateStr,
      createdAt: isoStr,
    });
    if (firestoreResult && firestoreResult.id) {
      reviewId = firestoreResult.id;
    }
  } catch (err) {
    console.error('Failed to save review to Firestore:', err);
  }

  const review: ProductReview = {
    id: reviewId,
    productId: input.productId,
    name: input.name.trim(),
    rating: input.rating,
    title: input.title?.trim() || undefined,
    text: input.text.trim(),
    date: dateStr,
    createdAt: isoStr,
  };
  sessionReviews.push(review);
  return review;
}


export const INITIAL_VISIBLE_REVIEWS = 4;
export const LOAD_MORE_PAGE_SIZE = 4;

import {
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { FirestoreReview } from './types';

const REVIEWS_COLLECTION = 'reviews';

export interface AddReviewInput {
  productId: string;
  rating: number;
  review: string;
  id?: string;
  createdAt?: string;
  author?: string;
  name?: string;
  title?: string;
  comment?: string;
  text?: string;
  verified?: boolean;
  date?: string;
}

/**
 * Add a review for a specific product to Firestore
 */
export async function addReview(
  input: AddReviewInput | Partial<FirestoreReview>
): Promise<FirestoreReview> {
  if (!input.productId) {
    throw new Error('productId is required to add a review');
  }

  const now = new Date().toISOString();
  const reviewText = input.review || input.comment || input.text || '';
  const authorName = input.author || input.name || 'Anonymous';

  const payload: Omit<FirestoreReview, 'id'> = {
    productId: input.productId,
    rating: typeof input.rating === 'number' ? input.rating : 5,
    review: reviewText,
    createdAt: input.createdAt || now,
    author: authorName,
    name: authorName,
    title: input.title || '',
    comment: reviewText,
    text: reviewText,
    verified: input.verified !== false,
    date: input.date || now.slice(0, 10),
  };

  if (input.id) {
    const docRef = doc(db, REVIEWS_COLLECTION, input.id);
    await setDoc(docRef, payload, { merge: true });
    return { id: input.id, ...payload };
  } else {
    const colRef = collection(db, REVIEWS_COLLECTION);
    const docRef = await addDoc(colRef, payload);
    return { id: docRef.id, ...payload };
  }
}

/**
 * Get all reviews that belong only to a specific product
 */
export async function getProductReviews(
  productId: string
): Promise<FirestoreReview[]> {
  if (!productId) return [];

  const colRef = collection(db, REVIEWS_COLLECTION);
  const q = query(colRef, where('productId', '==', productId));
  const snapshot = await getDocs(q);

  const reviews: FirestoreReview[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const reviewText = data.review || data.comment || data.text || '';
    const authorName = data.author || data.name || 'Anonymous';

    reviews.push({
      id: docSnap.id,
      productId: data.productId || productId,
      rating: typeof data.rating === 'number' ? data.rating : 5,
      review: reviewText,
      createdAt: data.createdAt || new Date().toISOString(),
      author: authorName,
      name: authorName,
      title: data.title || '',
      comment: reviewText,
      text: reviewText,
      verified: data.verified !== false,
      date:
        data.date ||
        (data.createdAt
          ? data.createdAt.slice(0, 10)
          : new Date().toISOString().slice(0, 10)),
    });
  });

  // Sort by createdAt descending (newest first)
  return reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Get all reviews across all products from Firestore
 */
export async function getAllReviews(): Promise<FirestoreReview[]> {
  const colRef = collection(db, REVIEWS_COLLECTION);
  const snapshot = await getDocs(colRef);

  const reviews: FirestoreReview[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const reviewText = data.review || data.comment || data.text || '';
    const authorName = data.author || data.name || 'Anonymous';

    reviews.push({
      id: docSnap.id,
      productId: data.productId || '',
      rating: typeof data.rating === 'number' ? data.rating : 5,
      review: reviewText,
      createdAt: data.createdAt || new Date().toISOString(),
      author: authorName,
      name: authorName,
      title: data.title || '',
      comment: reviewText,
      text: reviewText,
      verified: data.verified !== false,
      date:
        data.date ||
        (data.createdAt
          ? data.createdAt.slice(0, 10)
          : new Date().toISOString().slice(0, 10)),
    });
  });

  return reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Delete a review by ID from Firestore
 */
export async function deleteReview(id: string): Promise<void> {
  if (!id) return;
  const docRef = doc(db, REVIEWS_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Subscribe to all reviews in real-time from Firestore
 */
export function subscribeToAllReviews(
  callback: (reviews: FirestoreReview[]) => void
): Unsubscribe {
  const colRef = collection(db, REVIEWS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const reviews: FirestoreReview[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const reviewText = data.review || data.comment || data.text || '';
        const authorName = data.author || data.name || 'Anonymous';

        reviews.push({
          id: docSnap.id,
          productId: data.productId || '',
          rating: typeof data.rating === 'number' ? data.rating : 5,
          review: reviewText,
          createdAt: data.createdAt || new Date().toISOString(),
          author: authorName,
          name: authorName,
          title: data.title || '',
          comment: reviewText,
          text: reviewText,
          verified: data.verified !== false,
          date:
            data.date ||
            (data.createdAt
              ? data.createdAt.slice(0, 10)
              : new Date().toISOString().slice(0, 10)),
        });
      });

      callback(reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    },
    (error) => {
      console.error('Error subscribing to reviews:', error);
    }
  );
}


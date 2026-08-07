import {
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import type { FirestoreCategory } from './types';

const CATEGORIES_COLLECTION = 'categories';

/**
 * Default categories seed
 */
export const DEFAULT_CATEGORIES: Array<Omit<FirestoreCategory, 'id'>> = [
  {
    name: 'Men',
    slug: 'men',
    description: 'Tailored essentials',
    image: '/images/placeholder-category.svg',
    itemCount: 0,
  },
  {
    name: 'Women',
    slug: 'women',
    description: 'Refined silhouettes',
    image: '/images/placeholder-category.svg',
    itemCount: 0,
  },
  {
    name: 'Outerwear',
    slug: 'outerwear',
    description: 'Seasonal layers',
    image: '/images/placeholder-category.svg',
    itemCount: 0,
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Finishing pieces',
    image: '/images/placeholder-category.svg',
    itemCount: 0,
  },
];

/**
 * Helper to generate URL-safe slug from name if not explicitly provided
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * Seed initial categories if collection is empty
 */
export async function seedInitialCategoriesIfEmpty(): Promise<void> {
  try {
    const colRef = collection(db, CATEGORIES_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      const now = new Date().toISOString();
      for (const cat of DEFAULT_CATEGORIES) {
        const docRef = doc(db, CATEGORIES_COLLECTION, cat.slug);
        await setDoc(docRef, {
          ...cat,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  } catch (err) {
    console.error('Error seeding initial categories:', err);
  }
}

/**
 * Add a new category to Firestore
 */
export async function addCategory(
  categoryData: Partial<FirestoreCategory>
): Promise<FirestoreCategory> {
  const now = new Date().toISOString();
  const name = categoryData.name?.trim() || 'Uncategorized';
  const slug = categoryData.slug?.trim() || slugify(name);

  const payload: Omit<FirestoreCategory, 'id'> = {
    name,
    slug,
    createdAt: categoryData.createdAt || now,
    description: categoryData.description || '',
    image: categoryData.image || '/images/placeholder-category.svg',
    itemCount: typeof categoryData.itemCount === 'number' ? categoryData.itemCount : 0,
    updatedAt: now,
  };

  const docId = categoryData.id || slug;
  const docRef = doc(db, CATEGORIES_COLLECTION, docId);
  await setDoc(docRef, payload, { merge: true });
  return { id: docId, ...payload };
}

/**
 * Update an existing category in Firestore
 */
export async function updateCategory(
  id: string,
  categoryData: Partial<FirestoreCategory>
): Promise<void> {
  if (!id) throw new Error('Category ID is required for update');
  const docRef = doc(db, CATEGORIES_COLLECTION, id);
  const now = new Date().toISOString();

  const { id: _ignoreId, ...rest } = categoryData;
  const updates: Record<string, unknown> = {
    ...rest,
    updatedAt: now,
  };

  if (rest.name && !rest.slug) {
    updates.slug = slugify(rest.name);
  }

  await setDoc(docRef, updates, { merge: true });
}

/**
 * Delete a category from Firestore by ID
 */
export async function deleteCategory(id: string): Promise<void> {
  if (!id) throw new Error('Category ID is required for deletion');
  const docRef = doc(db, CATEGORIES_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Get all categories from Firestore
 */
export async function getCategories(): Promise<FirestoreCategory[]> {
  const colRef = collection(db, CATEGORIES_COLLECTION);
  let snapshot = await getDocs(colRef);

  if (snapshot.empty) {
    await seedInitialCategoriesIfEmpty();
    snapshot = await getDocs(colRef);
  }

  const categories: FirestoreCategory[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    categories.push({
      id: docSnap.id,
      name: data.name || 'Uncategorized',
      slug: data.slug || slugify(data.name || docSnap.id),
      createdAt: data.createdAt || new Date().toISOString(),
      description: data.description || '',
      image: data.image || '',
      itemCount: typeof data.itemCount === 'number' ? data.itemCount : 0,
      updatedAt: data.updatedAt,
    });
  });

  return categories;
}

/**
 * Real-time subscription to categories in Firestore
 */
export function subscribeToCategories(
  callback: (categories: FirestoreCategory[]) => void
): Unsubscribe {
  const colRef = collection(db, CATEGORIES_COLLECTION);
  let isSeeding = false;

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty && !isSeeding) {
        isSeeding = true;
        await seedInitialCategoriesIfEmpty();
        return;
      }

      const list: FirestoreCategory[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name || 'Uncategorized',
          slug: data.slug || slugify(data.name || docSnap.id),
          createdAt: data.createdAt || new Date().toISOString(),
          description: data.description || '',
          image: data.image || '',
          itemCount: typeof data.itemCount === 'number' ? data.itemCount : 0,
          updatedAt: data.updatedAt,
        });
      });

      callback(list);
    },
    (error) => {
      console.error('Error listening to categories:', error);
      handleFirestoreError(error, OperationType.GET, CATEGORIES_COLLECTION);
    }
  );
}


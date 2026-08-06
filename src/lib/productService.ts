import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { FirestoreProduct } from './types';
import { products as initialProducts } from './products';

const PRODUCTS_COLLECTION = 'products';

/**
 * Seed initial products if collection is empty in Firestore
 */
export async function seedInitialProductsIfEmpty(): Promise<void> {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      const now = new Date().toISOString();
      for (const p of initialProducts) {
        const docRef = doc(db, PRODUCTS_COLLECTION, p.id);
        await setDoc(docRef, {
          images: p.images && p.images.length > 0 ? p.images : ['/images/placeholder.svg'],
          name: p.name,
          title: p.name,
          subtitle: p.category,
          description: p.description,
          price: p.price,
          originalPrice: p.originalPrice,
          discount: p.discount,
          category: p.category,
          sizes: p.sizes,
          stock: 10,
          inStock: true,
          featured: p.featured,
          bestSeller: p.bestSeller,
          published: true,
          tags: p.tags,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  } catch (err) {
    console.error('Error seeding initial products:', err);
  }
}

/**
 * Add a new product to Firestore
 */
export async function addProduct(
  productData: Partial<FirestoreProduct>
): Promise<FirestoreProduct> {
  const now = new Date().toISOString();

  const payload: Omit<FirestoreProduct, 'id'> = {
    images: Array.isArray(productData.images) ? productData.images : [],
    name: productData.name || 'Untitled Product',
    description: productData.description || '',
    price: typeof productData.price === 'number' ? productData.price : 0,
    originalPrice:
      typeof productData.originalPrice === 'number'
        ? productData.originalPrice
        : typeof productData.price === 'number'
        ? productData.price
        : 0,
    discount: typeof productData.discount === 'number' ? productData.discount : 0,
    category: productData.category || 'Uncategorized',
    sizes: Array.isArray(productData.sizes) ? productData.sizes : [],
    stock: typeof productData.stock === 'number' ? productData.stock : 0,
    featured: Boolean(productData.featured),
    bestSeller: Boolean(productData.bestSeller),
    published: productData.published !== false,
    createdAt: productData.createdAt || now,
    updatedAt: productData.updatedAt || now,
    ...(productData.title ? { title: productData.title } : {}),
    ...(productData.subtitle ? { subtitle: productData.subtitle } : {}),
    ...(productData.tags ? { tags: productData.tags } : {}),
  };

  if (productData.id) {
    const docRef = doc(db, PRODUCTS_COLLECTION, productData.id);
    await setDoc(docRef, payload, { merge: true });
    return { id: productData.id, ...payload };
  } else {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const docRef = await addDoc(colRef, payload);
    return { id: docRef.id, ...payload };
  }
}

/**
 * Update an existing product in Firestore
 */
export async function updateProduct(
  id: string,
  productData: Partial<FirestoreProduct>
): Promise<void> {
  if (!id) throw new Error('Product ID is required for update');
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  const now = new Date().toISOString();

  const { id: _ignoreId, ...rest } = productData;
  const updates = {
    ...rest,
    updatedAt: productData.updatedAt || now,
  };

  await setDoc(docRef, updates, { merge: true });
}

/**
 * Delete a product from Firestore by ID
 */
export async function deleteProduct(id: string): Promise<void> {
  if (!id) throw new Error('Product ID is required for deletion');
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Get all products from Firestore
 */
export async function getProducts(): Promise<FirestoreProduct[]> {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  const snapshot = await getDocs(colRef);

  const products: FirestoreProduct[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    products.push({
      id: docSnap.id,
      images: Array.isArray(data.images) ? data.images : [],
      name: data.name || data.title || 'Untitled Product',
      description: data.description || '',
      price: typeof data.price === 'number' ? data.price : 0,
      originalPrice:
        typeof data.originalPrice === 'number'
          ? data.originalPrice
          : typeof data.price === 'number'
          ? data.price
          : 0,
      discount: typeof data.discount === 'number' ? data.discount : 0,
      category: data.category || 'Uncategorized',
      sizes: Array.isArray(data.sizes) ? data.sizes : [],
      stock: typeof data.stock === 'number' ? data.stock : data.inStock ? 10 : 0,
      featured: Boolean(data.featured),
      bestSeller: Boolean(data.bestSeller),
      published: data.published !== false,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      title: data.title,
      subtitle: data.subtitle,
      inStock: data.inStock,
      tags: data.tags,
    });
  });

  return products;
}

/**
 * Get a single product by ID from Firestore
 */
export async function getProduct(id: string): Promise<FirestoreProduct | null> {
  if (!id) return null;
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    images: Array.isArray(data.images) ? data.images : [],
    name: data.name || data.title || 'Untitled Product',
    description: data.description || '',
    price: typeof data.price === 'number' ? data.price : 0,
    originalPrice:
      typeof data.originalPrice === 'number'
        ? data.originalPrice
        : typeof data.price === 'number'
        ? data.price
        : 0,
    discount: typeof data.discount === 'number' ? data.discount : 0,
    category: data.category || 'Uncategorized',
    sizes: Array.isArray(data.sizes) ? data.sizes : [],
    stock: typeof data.stock === 'number' ? data.stock : data.inStock ? 10 : 0,
    featured: Boolean(data.featured),
    bestSeller: Boolean(data.bestSeller),
    published: data.published !== false,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    title: data.title,
    subtitle: data.subtitle,
    inStock: data.inStock,
    tags: data.tags,
  };
}

/**
 * Real-time listener for products collection in Firestore
 */
export function subscribeToProducts(
  callback: (products: FirestoreProduct[]) => void
): Unsubscribe {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  let isSeeding = false;

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty && !isSeeding) {
        isSeeding = true;
        await seedInitialProductsIfEmpty();
        return;
      }

      const products: FirestoreProduct[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        products.push({
          id: docSnap.id,
          images: Array.isArray(data.images) ? data.images : [],
          name: data.name || data.title || 'Untitled Product',
          description: data.description || '',
          price: typeof data.price === 'number' ? data.price : 0,
          originalPrice:
            typeof data.originalPrice === 'number'
              ? data.originalPrice
              : typeof data.price === 'number'
              ? data.price
              : 0,
          discount: typeof data.discount === 'number' ? data.discount : 0,
          category: data.category || 'Uncategorized',
          sizes: Array.isArray(data.sizes) ? data.sizes : [],
          stock: typeof data.stock === 'number' ? data.stock : data.inStock ? 10 : 0,
          featured: Boolean(data.featured),
          bestSeller: Boolean(data.bestSeller),
          published: data.published !== false,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          title: data.title,
          subtitle: data.subtitle,
          inStock: data.inStock,
          tags: data.tags,
        });
      });
      callback(products);
    },
    (error) => {
      console.error('Error listening to Firestore products:', error);
    }
  );
}

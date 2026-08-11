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
import { db, handleFirestoreError, OperationType } from './firebase';
import type { FirestoreProduct } from './types';
import { products as initialProducts } from './products';

const PRODUCTS_COLLECTION = 'products';

export function getDefaultSizesForCategory(category?: string): string[] {
  const cat = (category || '').toLowerCase();
  if (cat.includes('women')) return ['XS', 'S', 'M', 'L'];
  if (cat.includes('men')) return ['S', 'M', 'L', 'XL'];
  if (cat.includes('outerwear')) return ['S', 'M', 'L', 'XL'];
  if (cat.includes('accessory') || cat.includes('accessories')) return ['S', 'M', 'L'];
  return ['S', 'M', 'L', 'XL'];
}

/**
 * Helper to parse and normalize a product document from Firestore
 */
export function parseProductDoc(id: string, data: any): FirestoreProduct {
  const rawPrice = typeof data.price === 'number' ? data.price : 0;
  const rawMrp =
    typeof data.originalPrice === 'number'
      ? data.originalPrice
      : typeof data.mrp === 'number'
      ? data.mrp
      : rawPrice;

  const mrp = Math.max(0, rawMrp);
  const price = Math.max(0, Math.min(rawPrice, mrp));

  const autoDiscount =
    mrp > 0 && price <= mrp
      ? Math.round(((mrp - price) / mrp) * 100)
      : 0;

  const discount =
    typeof data.discount === 'number'
      ? Math.round(data.discount)
      : typeof data.discountPercentage === 'number'
      ? Math.round(data.discountPercentage)
      : autoDiscount;

  let parsedSizes: string[] = [];
  if (Array.isArray(data.sizes) && data.sizes.length > 0) {
    parsedSizes = data.sizes.map((s: any) => String(s).trim()).filter(Boolean);
  } else if (typeof data.sizes === 'string' && data.sizes.trim()) {
    parsedSizes = data.sizes.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  if (parsedSizes.length === 0) {
    parsedSizes = getDefaultSizesForCategory(data.category);
  }

  return {
    id,
    images: Array.isArray(data.images) ? data.images : [],
    name: data.name || data.title || 'Untitled Product',
    description: data.description || '',
    price,
    originalPrice: mrp,
    mrp,
    discount,
    discountPercentage: discount,
    category: data.category || 'Uncategorized',
    sizes: parsedSizes,
    stock: typeof data.stock === 'number' ? data.stock : data.inStock ? 10 : 0,
    featured: Boolean(data.featured),
    bestSeller: Boolean(data.bestSeller),
    newArrival: Boolean(data.newArrival),
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
        const mrp = p.originalPrice || p.price;
        const discount = mrp > 0 && p.price <= mrp ? Math.round(((mrp - p.price) / mrp) * 100) : 0;
        await setDoc(docRef, {
          images: p.images && p.images.length > 0 ? p.images : ['/images/placeholder.svg'],
          name: p.name,
          title: p.name,
          subtitle: p.category,
          description: p.description,
          price: p.price,
          originalPrice: mrp,
          mrp: mrp,
          discount: discount,
          discountPercentage: discount,
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

  const rawPrice = typeof productData.price === 'number' ? productData.price : 0;
  const rawMrp =
    typeof productData.originalPrice === 'number'
      ? productData.originalPrice
      : typeof productData.mrp === 'number'
      ? productData.mrp
      : rawPrice;

  const mrp = Math.max(0, rawMrp);
  const price = Math.max(0, Math.min(rawPrice, mrp));

  const calculatedDiscount =
    mrp > 0 && price <= mrp
      ? Math.round(((mrp - price) / mrp) * 100)
      : 0;

  const discount =
    typeof productData.discount === 'number'
      ? Math.round(productData.discount)
      : typeof productData.discountPercentage === 'number'
      ? Math.round(productData.discountPercentage)
      : calculatedDiscount;

  let addSizes: string[] = [];
  if (Array.isArray(productData.sizes) && productData.sizes.length > 0) {
    addSizes = productData.sizes.map((s: any) => String(s).trim()).filter(Boolean);
  } else if (typeof productData.sizes === 'string' && (productData.sizes as string).trim()) {
    addSizes = (productData.sizes as string).split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (addSizes.length === 0) {
    addSizes = getDefaultSizesForCategory(productData.category);
  }

  const payload: Omit<FirestoreProduct, 'id'> = {
    images: Array.isArray(productData.images) ? productData.images : [],
    name: productData.name || 'Untitled Product',
    description: productData.description || '',
    price,
    originalPrice: mrp,
    mrp,
    discount,
    discountPercentage: discount,
    category: productData.category || 'Uncategorized',
    sizes: addSizes,
    stock: typeof productData.stock === 'number' ? productData.stock : 0,
    featured: Boolean(productData.featured),
    bestSeller: Boolean(productData.bestSeller),
    newArrival: Boolean(productData.newArrival),
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

  let rawPrice = rest.price;
  let rawMrp = rest.originalPrice ?? rest.mrp;
  let discount = rest.discount ?? rest.discountPercentage;

  if (typeof rawMrp === 'number') rawMrp = Math.max(0, rawMrp);
  if (typeof rawPrice === 'number') rawPrice = Math.max(0, rawPrice);

  if ((typeof rawPrice === 'number' || typeof rawMrp === 'number') && typeof discount !== 'number') {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const existing = docSnap.data();
      if (typeof rawPrice !== 'number') rawPrice = existing.price || 0;
      if (typeof rawMrp !== 'number') rawMrp = existing.originalPrice ?? existing.mrp ?? rawPrice;
    }
  }

  const mrp = typeof rawMrp === 'number' ? Math.max(0, rawMrp) : undefined;
  const price =
    typeof rawPrice === 'number' && typeof mrp === 'number'
      ? Math.max(0, Math.min(rawPrice, mrp))
      : typeof rawPrice === 'number'
      ? Math.max(0, rawPrice)
      : undefined;

  if (typeof mrp === 'number' && typeof price === 'number') {
    discount = mrp > 0 && price <= mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;
  } else if (typeof discount === 'number') {
    discount = Math.round(discount);
  }

  const updates: Record<string, any> = {
    ...rest,
    updatedAt: productData.updatedAt || now,
  };

  if (typeof mrp === 'number') {
    updates.originalPrice = mrp;
    updates.mrp = mrp;
  }
  if (typeof price === 'number') {
    updates.price = price;
  }
  if (typeof discount === 'number') {
    updates.discount = discount;
    updates.discountPercentage = discount;
  }

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
    products.push(parseProductDoc(docSnap.id, docSnap.data()));
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

  return parseProductDoc(docSnap.id, docSnap.data());
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
        products.push(parseProductDoc(docSnap.id, docSnap.data()));
      });
      callback(products);
    },
    (error) => {
      console.error('Error listening to Firestore products:', error);
      handleFirestoreError(error, OperationType.GET, PRODUCTS_COLLECTION);
    }
  );
}

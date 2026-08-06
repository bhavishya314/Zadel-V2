import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';

export const db = (() => {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    }, databaseId);
  } catch {
    return getFirestore(app, databaseId);
  }
})();

export const storage = getStorage(app);

/**
 * Upload a product image file to Firebase Storage (or fallback to Data URL if storage throws CORS/network error)
 */
export async function uploadProductImageToStorage(
  file: File,
  productId: string = 'general'
): Promise<string> {
  try {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageRef = ref(storage, `products/${productId}/${timestamp}_${sanitizedName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (err) {
    console.warn('Firebase Storage upload failed or restricted, using Data URL fallback:', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Delete a product image from Firebase Storage if it's a firebase storage URL
 */
export async function deleteProductImageFromStorage(url: string): Promise<void> {
  if (!url || !url.includes('firebasestorage.googleapis.com')) return;
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Could not delete image from Firebase storage:', err);
  }
}

/**
 * Upload a brand logo file to Firebase Storage (with Data URL fallback)
 */
export async function uploadBrandLogoToStorage(file: File): Promise<string> {
  try {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageRef = ref(storage, `branding/logo_${timestamp}_${sanitizedName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (err) {
    console.warn('Firebase Storage logo upload failed, using Data URL fallback:', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Delete brand logo from Firebase Storage if it's a firebase storage URL
 */
export async function deleteBrandLogoFromStorage(url: string): Promise<void> {
  if (!url || !url.includes('firebasestorage.googleapis.com')) return;
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Could not delete brand logo from Firebase storage:', err);
  }
}

/**
 * Upload a hero banner image file to Firebase Storage (with Data URL fallback)
 */
export async function uploadHeroImageToStorage(file: File): Promise<string> {
  try {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageRef = ref(storage, `hero/${timestamp}_${sanitizedName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (err) {
    console.warn('Firebase Storage hero image upload failed, using Data URL fallback:', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Delete hero image from Firebase Storage if it's a firebase storage URL
 */
export async function deleteHeroImageFromStorage(url: string): Promise<void> {
  if (!url || !url.includes('firebasestorage.googleapis.com')) return;
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Could not delete hero image from Firebase storage:', err);
  }
}

// Ensure persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase persistence warning:', err);
});

export const ADMIN_CONFIG_REF = doc(db, 'system', 'admin_config');

export async function checkAdminExists(): Promise<boolean> {
  try {
    const snap = await getDoc(ADMIN_CONFIG_REF);
    if (snap.exists() && snap.data()?.adminExists) {
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error checking admin document:', err);
    return false;
  }
}

export async function verifyAdminUser(uid: string): Promise<boolean> {
  try {
    const adminDocRef = doc(db, 'admins', uid);
    const snap = await getDoc(adminDocRef);
    return snap.exists();
  } catch (err) {
    console.error('Error verifying admin document:', err);
    return false;
  }
}

export async function saveAdminDocument(uid: string, email: string): Promise<void> {
  const createdAt = new Date().toISOString();

  // Save to admins collection
  const adminDocRef = doc(db, 'admins', uid);
  await setDoc(adminDocRef, {
    uid,
    email,
    createdAt,
  });

  // Mark admin creation in system config to block future registrations
  await setDoc(ADMIN_CONFIG_REF, {
    adminExists: true,
    adminEmail: email,
    adminUid: uid,
    createdAt,
  });
}

// Deprecated alias for backwards compatibility
export const markAdminCreated = saveAdminDocument;

// Re-export Product Firestore CRUD service functions
export {
  addProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProduct,
  subscribeToProducts,
} from './productService';

// Re-export Category Firestore CRUD service functions
export {
  addCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  subscribeToCategories,
} from './categoryService';

// Re-export Settings and Contact Firestore service functions
export {
  getSettings,
  updateSettings,
  subscribeToSettings,
  getContact,
  updateContact,
  subscribeToContact,
} from './settingsContactService';

// Re-export Review Firestore service functions
export {
  addReview,
  getProductReviews,
  getAllReviews,
  deleteReview,
  subscribeToAllReviews,
} from './reviewService';


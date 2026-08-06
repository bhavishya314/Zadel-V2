import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
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


import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  memoryLocalCache,
  memoryLruGarbageCollector,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
} from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };
import {
  uploadProductImageToCloudinary,
  deleteImageFromCloudinary,
  uploadBrandLogoToCloudinary,
  uploadHeroImageToCloudinary,
} from './cloudinary';

const configToUse = {
  apiKey: firebaseConfig?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: firebaseConfig?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseConfig?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseConfig?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseConfig?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseConfig?.appId || import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: firebaseConfig?.measurementId || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  firestoreDatabaseId: firebaseConfig?.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)',
};

const app = getApps().length ? getApp() : initializeApp(configToUse);
export const auth = getAuth(app);

const databaseId = configToUse.firestoreDatabaseId && configToUse.firestoreDatabaseId !== '(default)'
  ? configToUse.firestoreDatabaseId
  : undefined;

export const db = (() => {
  try {
    return initializeFirestore(
      app,
      {
        localCache: memoryLocalCache({ garbageCollector: memoryLruGarbageCollector() }),
        experimentalAutoDetectLongPolling: true,
      },
      databaseId
    );
  } catch {
    return getFirestore(app, databaseId);
  }
})();

export const analytics = typeof window !== 'undefined'
  ? isSupported().then((yes) => (yes ? getAnalytics(app) : null)).catch(() => null)
  : null;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errStr = error instanceof Error ? error.message : String(error);
  // Gracefully filter out harmless tab close or IndexedDB closing/hidden browser lifecycle messages
  if (
    errStr.toLowerCase().includes('closing') ||
    errStr.toLowerCase().includes('hidden') ||
    errStr.toLowerCase().includes('closed')
  ) {
    return;
  }

  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: errStr,
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'system', 'admin_config'));
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('offline') || msg.includes('closing') || msg.includes('hidden')) {
        console.warn('Firebase connection notice:', error.message);
      }
    }
  }
}
if (typeof window !== 'undefined') {
  testConnection();
}

// Re-export Cloudinary upload functions
export {
  uploadToCloudinary,
  uploadProductImageToCloudinary as uploadProductImageToStorage,
  deleteImageFromCloudinary as deleteProductImageFromStorage,
  uploadBrandLogoToCloudinary as uploadBrandLogoToStorage,
  deleteImageFromCloudinary as deleteBrandLogoFromStorage,
  uploadHeroImageToCloudinary as uploadHeroImageToStorage,
  deleteImageFromCloudinary as deleteHeroImageFromStorage,
} from './cloudinary';

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
    handleFirestoreError(err, OperationType.GET, 'system/admin_config');
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
  getDefaultSizesForCategory,
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

// Re-export Order Firestore service functions
export {
  subscribeToOrders,
  updateOrderStatus,
  deleteOrder,
} from './orderService';



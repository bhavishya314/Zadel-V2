import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import type { FirestoreSettings, FirestoreContact } from './types';

const SETTINGS_COLLECTION = 'settings';
const CONTACT_COLLECTION = 'contact';
const DEFAULT_DOC_ID = 'general';

/**
 * Retrieve global store settings from Firestore
 */
export async function getSettings(): Promise<FirestoreSettings> {
  const docRef = doc(db, SETTINGS_COLLECTION, DEFAULT_DOC_ID);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      brandName: data.brandName || data.storeName || 'ZADEL',
      storeName: data.storeName || data.brandName || 'ZADEL',
      logo: data.logo || '',
      heroImage: data.heroImage || '',
      heroMobileImage: data.heroMobileImage || '',
      heroImages: Array.isArray(data.heroImages) ? data.heroImages : (data.heroImage ? [data.heroImage] : []),
      heroBrandText: data.heroBrandText ?? 'ZADEL',
      heroHeadline: data.heroHeadline ?? 'Quiet luxury.',
      heroHeadlineLine2: data.heroHeadlineLine2 ?? 'Endlessly worn.',
      heroCtaText: data.heroCtaText ?? 'Shop Collection',
      heroCtaLink: data.heroCtaLink ?? '/shop',
      currency: data.currency || 'INR',
      taxRate: typeof data.taxRate === 'number' ? data.taxRate : 0,
      freeShippingThreshold:
        typeof data.freeShippingThreshold === 'number'
          ? data.freeShippingThreshold
          : 150,
      enableReviews: data.enableReviews !== false,
      maintenanceMode: Boolean(data.maintenanceMode),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  }

  // Fallback check if settings exist under any other document ID
  const colRef = collection(db, SETTINGS_COLLECTION);
  const snapshot = await getDocs(colRef);
  if (!snapshot.empty) {
    const firstDoc = snapshot.docs[0];
    const data = firstDoc.data();
    return {
      id: firstDoc.id,
      brandName: data.brandName || data.storeName || 'ZADEL',
      storeName: data.storeName || data.brandName || 'ZADEL',
      logo: data.logo || '',
      heroImage: data.heroImage || '',
      heroMobileImage: data.heroMobileImage || '',
      heroImages: Array.isArray(data.heroImages) ? data.heroImages : (data.heroImage ? [data.heroImage] : []),
      heroBrandText: data.heroBrandText ?? 'ZADEL',
      heroHeadline: data.heroHeadline ?? 'Quiet luxury.',
      heroHeadlineLine2: data.heroHeadlineLine2 ?? 'Endlessly worn.',
      heroCtaText: data.heroCtaText ?? 'Shop Collection',
      heroCtaLink: data.heroCtaLink ?? '/shop',
      currency: data.currency || 'INR',
      taxRate: typeof data.taxRate === 'number' ? data.taxRate : 0,
      freeShippingThreshold:
        typeof data.freeShippingThreshold === 'number'
          ? data.freeShippingThreshold
          : 150,
      enableReviews: data.enableReviews !== false,
      maintenanceMode: Boolean(data.maintenanceMode),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  }

  // Default initial settings object
  return {
    id: DEFAULT_DOC_ID,
    brandName: 'ZADEL',
    storeName: 'ZADEL',
    logo: '',
    heroImage: '',
    heroMobileImage: '',
    heroImages: [],
    heroBrandText: 'ZADEL',
    heroHeadline: 'Quiet luxury.',
    heroHeadlineLine2: 'Endlessly worn.',
    heroCtaText: 'Shop Collection',
    heroCtaLink: '/shop',
    currency: 'INR',
    taxRate: 0,
    freeShippingThreshold: 150,
    enableReviews: true,
    maintenanceMode: false,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update global store settings in Firestore
 */
export async function updateSettings(
  settingsData: Partial<FirestoreSettings>
): Promise<FirestoreSettings> {
  const docId = settingsData.id || DEFAULT_DOC_ID;
  const docRef = doc(db, SETTINGS_COLLECTION, docId);
  const now = new Date().toISOString();

  const brandName = settingsData.brandName || settingsData.storeName || 'ZADEL';
  const storeName = settingsData.storeName || settingsData.brandName || 'ZADEL';

  const updates: Record<string, any> = {
    brandName,
    storeName,
    logo: settingsData.logo !== undefined ? settingsData.logo : '',
    currency: settingsData.currency || 'INR',
    taxRate: typeof settingsData.taxRate === 'number' ? settingsData.taxRate : 0,
    freeShippingThreshold:
      typeof settingsData.freeShippingThreshold === 'number'
        ? settingsData.freeShippingThreshold
        : 150,
    enableReviews: settingsData.enableReviews !== false,
    maintenanceMode: Boolean(settingsData.maintenanceMode),
    updatedAt: now,
  };

  if (settingsData.heroImage !== undefined) {
    updates.heroImage = settingsData.heroImage;
  }
  if (settingsData.heroMobileImage !== undefined) {
    updates.heroMobileImage = settingsData.heroMobileImage;
  }
  if (settingsData.heroImages !== undefined) {
    updates.heroImages = settingsData.heroImages;
  }
  if (settingsData.heroBrandText !== undefined) {
    updates.heroBrandText = settingsData.heroBrandText;
  }
  if (settingsData.heroHeadline !== undefined) {
    updates.heroHeadline = settingsData.heroHeadline;
  }
  if (settingsData.heroHeadlineLine2 !== undefined) {
    updates.heroHeadlineLine2 = settingsData.heroHeadlineLine2;
  }
  if (settingsData.heroCtaText !== undefined) {
    updates.heroCtaText = settingsData.heroCtaText;
  }
  if (settingsData.heroCtaLink !== undefined) {
    updates.heroCtaLink = settingsData.heroCtaLink;
  }

  await setDoc(docRef, updates, { merge: true });
  return { id: docId, ...updates };
}

/**
 * Real-time subscription to store settings in Firestore
 */
export function subscribeToSettings(
  callback: (settings: FirestoreSettings) => void
): Unsubscribe {
  const docRef = doc(db, SETTINGS_COLLECTION, DEFAULT_DOC_ID);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          id: docSnap.id,
          brandName: data.brandName || data.storeName || 'ZADEL',
          storeName: data.storeName || data.brandName || 'ZADEL',
          logo: data.logo || '',
          heroImage: data.heroImage || '',
          heroMobileImage: data.heroMobileImage || '',
          heroImages: Array.isArray(data.heroImages) ? data.heroImages : (data.heroImage ? [data.heroImage] : []),
          heroBrandText: data.heroBrandText ?? 'ZADEL',
          heroHeadline: data.heroHeadline ?? 'Quiet luxury.',
          heroHeadlineLine2: data.heroHeadlineLine2 ?? 'Endlessly worn.',
          heroCtaText: data.heroCtaText ?? 'Shop Collection',
          heroCtaLink: data.heroCtaLink ?? '/shop',
          currency: data.currency || 'INR',
          taxRate: typeof data.taxRate === 'number' ? data.taxRate : 0,
          freeShippingThreshold:
            typeof data.freeShippingThreshold === 'number'
              ? data.freeShippingThreshold
              : 150,
          enableReviews: data.enableReviews !== false,
          maintenanceMode: Boolean(data.maintenanceMode),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      } else {
        callback({
          id: DEFAULT_DOC_ID,
          brandName: 'ZADEL',
          storeName: 'ZADEL',
          logo: '',
          heroImage: '',
          heroMobileImage: '',
          heroImages: [],
          heroBrandText: 'ZADEL',
          heroHeadline: 'Quiet luxury.',
          heroHeadlineLine2: 'Endlessly worn.',
          heroCtaText: 'Shop Collection',
          heroCtaLink: '/shop',
          currency: 'INR',
          taxRate: 0,
          freeShippingThreshold: 150,
          enableReviews: true,
          maintenanceMode: false,
          updatedAt: new Date().toISOString(),
        });
      }
    },
    (error) => {
      console.error('Error listening to settings doc:', error);
      handleFirestoreError(error, OperationType.GET, SETTINGS_COLLECTION);
    }
  );
}

/**
 * Retrieve store contact information from Firestore
 */
export async function getContact(): Promise<FirestoreContact> {
  const docRef = doc(db, CONTACT_COLLECTION, DEFAULT_DOC_ID);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      whatsapp: data.whatsapp ?? data.whatsappNumber ?? '',
      whatsappNumber: data.whatsappNumber ?? data.whatsapp ?? '',
      instagram: data.instagram ?? data.instagramUrl ?? '',
      phone: data.phone ?? data.phoneNumber ?? '',
      phoneNumber: data.phoneNumber ?? data.phone ?? '',
      email: data.email ?? data.supportEmail ?? data.emailAddress ?? '',
      supportEmail: data.supportEmail ?? data.email ?? data.emailAddress ?? '',
      address: data.address ?? data.storeAddress ?? '',
      storeAddress: data.storeAddress ?? data.address ?? '',
      operatingHours: data.operatingHours ?? '',
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  }

  // Fallback check if contact document exists under another doc ID
  const colRef = collection(db, CONTACT_COLLECTION);
  const snapshot = await getDocs(colRef);
  if (!snapshot.empty) {
    const firstDoc = snapshot.docs[0];
    const data = firstDoc.data();
    return {
      id: firstDoc.id,
      whatsapp: data.whatsapp ?? data.whatsappNumber ?? '',
      whatsappNumber: data.whatsappNumber ?? data.whatsapp ?? '',
      instagram: data.instagram ?? data.instagramUrl ?? '',
      phone: data.phone ?? data.phoneNumber ?? '',
      phoneNumber: data.phoneNumber ?? data.phone ?? '',
      email: data.email ?? data.supportEmail ?? data.emailAddress ?? '',
      supportEmail: data.supportEmail ?? data.email ?? data.emailAddress ?? '',
      address: data.address ?? data.storeAddress ?? '',
      storeAddress: data.storeAddress ?? data.address ?? '',
      operatingHours: data.operatingHours ?? '',
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  }

  // Default contact info
  return {
    id: DEFAULT_DOC_ID,
    whatsapp: '+1 (555) 019-2834',
    whatsappNumber: '+1 (555) 019-2834',
    instagram: 'https://instagram.com/zadel.official',
    phone: '+1 (555) 019-2834',
    phoneNumber: '+1 (555) 019-2834',
    email: 'concierge@zadel.com',
    supportEmail: 'concierge@zadel.com',
    address: '740 Madison Avenue, New York, NY 10065',
    storeAddress: '740 Madison Avenue, New York, NY 10065',
    operatingHours: 'Mon-Sat: 10am - 7pm EST',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Real-time subscription to store contact information in Firestore
 */
export function subscribeToContact(
  callback: (contact: FirestoreContact) => void
): Unsubscribe {
  const docRef = doc(db, CONTACT_COLLECTION, DEFAULT_DOC_ID);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          id: docSnap.id,
          whatsapp: data.whatsapp ?? data.whatsappNumber ?? '',
          whatsappNumber: data.whatsappNumber ?? data.whatsapp ?? '',
          instagram: data.instagram ?? data.instagramUrl ?? '',
          phone: data.phone ?? data.phoneNumber ?? '',
          phoneNumber: data.phoneNumber ?? data.phone ?? '',
          email: data.email ?? data.supportEmail ?? data.emailAddress ?? '',
          supportEmail: data.supportEmail ?? data.email ?? data.emailAddress ?? '',
          address: data.address ?? data.storeAddress ?? '',
          storeAddress: data.storeAddress ?? data.address ?? '',
          operatingHours: data.operatingHours ?? '',
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      } else {
        callback({
          id: DEFAULT_DOC_ID,
          whatsapp: '+1 (555) 019-2834',
          whatsappNumber: '+1 (555) 019-2834',
          instagram: 'https://instagram.com/zadel.official',
          phone: '+1 (555) 019-2834',
          phoneNumber: '+1 (555) 019-2834',
          email: 'concierge@zadel.com',
          supportEmail: 'concierge@zadel.com',
          address: '740 Madison Avenue, New York, NY 10065',
          storeAddress: '740 Madison Avenue, New York, NY 10065',
          operatingHours: 'Mon-Sat: 10am - 7pm EST',
          updatedAt: new Date().toISOString(),
        });
      }
    },
    (error) => {
      console.error('Error listening to contact doc:', error);
      handleFirestoreError(error, OperationType.GET, CONTACT_COLLECTION);
    }
  );
}

/**
 * Update store contact information in Firestore
 */
export async function updateContact(
  contactData: Partial<FirestoreContact>
): Promise<FirestoreContact> {
  const docId = contactData.id || DEFAULT_DOC_ID;
  const docRef = doc(db, CONTACT_COLLECTION, docId);
  const now = new Date().toISOString();

  const whatsapp = contactData.whatsapp || contactData.whatsappNumber || '';
  const phone = contactData.phone || contactData.phoneNumber || '';
  const email = contactData.email || contactData.supportEmail || '';
  const address = contactData.address || contactData.storeAddress || '';

  const updates: Omit<FirestoreContact, 'id'> = {
    whatsapp,
    whatsappNumber: whatsapp,
    instagram: contactData.instagram || '',
    phone,
    phoneNumber: phone,
    email,
    supportEmail: email,
    address,
    storeAddress: address,
    operatingHours: contactData.operatingHours || '',
    updatedAt: now,
  };

  await setDoc(docRef, updates, { merge: true });
  return { id: docId, ...updates };
}

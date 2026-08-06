/**
 * Website Settings → Contact Information
 *
 * Shape mirrors the Admin Dashboard / Firestore document:
 *   websiteSettings/contactInformation
 *
 * When Firestore is connected, replace getContactSettings() with a live fetch.
 * Empty / missing fields are omitted from the customer-facing Contact page.
 */

export interface ContactInformation {
  instagramUrl: string;
  whatsappNumber: string;
  storeAddress: string;
  phoneNumber: string;
  emailAddress: string;
}

/** Admin-configured defaults (Website Settings / Contact Information). */
const DEFAULT_CONTACT_INFORMATION: ContactInformation = {
  instagramUrl: 'https://instagram.com/zadel.official',
  whatsappNumber: '7470558303',
  storeAddress: '12 Atelier Lane, Colaba, Mumbai 400001',
  phoneNumber: '7470558303',
  emailAddress: 'hello@zadel.in',
};

const STORAGE_KEY = 'zadel-website-settings-contact';

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readStoredSettings(): Partial<ContactInformation> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ContactInformation>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Resolve contact settings as the Admin Dashboard would publish them.
 * localStorage overrides simulate live Website Settings updates.
 */
export function getContactSettings(): ContactInformation {
  const stored = typeof window !== 'undefined' ? readStoredSettings() : null;

  return {
    instagramUrl: normalize(stored?.instagramUrl) || DEFAULT_CONTACT_INFORMATION.instagramUrl,
    whatsappNumber: normalize(stored?.whatsappNumber) || DEFAULT_CONTACT_INFORMATION.whatsappNumber,
    storeAddress: normalize(stored?.storeAddress) || DEFAULT_CONTACT_INFORMATION.storeAddress,
    phoneNumber: normalize(stored?.phoneNumber) || DEFAULT_CONTACT_INFORMATION.phoneNumber,
    emailAddress: normalize(stored?.emailAddress) || DEFAULT_CONTACT_INFORMATION.emailAddress,
  };
}

/** True when a setting has a real admin-provided value. */
export function hasValue(value: string | undefined | null): boolean {
  return Boolean(value && value.trim());
}

/**
 * Normalize a phone/WhatsApp number for wa.me.
 * Indian 10-digit numbers get a leading 91 country code.
 */
export function normalizeWhatsAppDigits(whatsappNumber: string): string {
  let digits = whatsappNumber.replace(/\D/g, '');
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  return digits;
}

/** WhatsApp deep link from an admin-configured number (optional prefilled message). */
export function buildWhatsAppLink(whatsappNumber: string, message?: string): string {
  const digits = normalizeWhatsAppDigits(whatsappNumber);
  if (!digits) return '#';
  if (message && message.trim()) {
    return `https://wa.me/${digits}?text=${encodeURIComponent(message.trim())}`;
  }
  return `https://wa.me/${digits}`;
}

/** Active WhatsApp number from Website Settings (admin-overridable). */
export function getWhatsAppNumber(): string {
  return getContactSettings().whatsappNumber;
}

/** Persist contact settings (Admin Dashboard write path). */
export function saveContactSettings(settings: Partial<ContactInformation>): ContactInformation {
  const next: ContactInformation = {
    ...getContactSettings(),
    ...Object.fromEntries(
      Object.entries(settings).map(([k, v]) => [k, normalize(v)])
    ),
  } as ContactInformation;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

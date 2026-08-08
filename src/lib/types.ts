export type Category = 'Men' | 'Women' | 'Outerwear' | 'Accessories';

/**
 * Product interface for storefront and catalog usage
 */
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  mrp?: number;
  discount: number;
  discountPercentage?: number;
  category: Category;
  description: string;
  sizes: string[];
  images: string[];
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  tags?: string[];
  stock?: number;
  /** Admin publish flag — unpublished products never appear on the storefront */
  published?: boolean;
  /** ISO timestamp for admin sort / newest first */
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

/* ==========================================================================
   Firestore Backend Models & Collection Interfaces
   ========================================================================== */

/**
 * Model for `products` collection document in Firestore
 */
export interface FirestoreProduct {
  id: string;
  images: string[];
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  mrp?: number;
  discount: number;
  discountPercentage?: number;
  category: string;
  sizes: string[];
  stock: number;
  featured: boolean;
  bestSeller: boolean;
  newArrival?: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  /** Legacy or optional fields */
  title?: string;
  subtitle?: string;
  inStock?: boolean;
  tags?: string[];
}

/**
 * Model for `categories` collection document in Firestore
 */
export interface FirestoreCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Model for `settings` collection document in Firestore
 */
export interface FirestoreSettings {
  id: string;
  brandName?: string;
  storeName?: string;
  logo?: string;
  heroImage?: string;
  heroImages?: string[];
  heroBrandText?: string;
  heroHeadline?: string;
  heroHeadlineLine2?: string;
  heroCtaText?: string;
  heroCtaLink?: string;
  currency?: string;
  taxRate?: number;
  freeShippingThreshold?: number;
  enableReviews?: boolean;
  maintenanceMode?: boolean;
  updatedAt?: string;
}

/**
 * Model for `contact` collection document in Firestore
 */
export interface FirestoreContact {
  id: string;
  whatsapp?: string;
  whatsappNumber?: string;
  instagram?: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  supportEmail?: string;
  address?: string;
  storeAddress?: string;
  operatingHours?: string;
  updatedAt?: string;
}

/**
 * Model for `reviews` collection document in Firestore
 */
export interface FirestoreReview {
  id: string;
  productId: string;
  rating: number;
  review: string;
  createdAt: string;
  author?: string;
  name?: string;
  title?: string;
  comment?: string;
  text?: string;
  verified?: boolean;
  date?: string;
}

/**
 * Model for `admins` collection document in Firestore
 */
export interface FirestoreAdmin {
  uid: string;
  email: string;
  createdAt: string;
}

/**
 * Model for `system/admin_config` document in Firestore
 */
export interface FirestoreAdminConfig {
  adminExists: boolean;
  adminEmail: string;
  adminUid?: string;
  createdAt?: string;
}

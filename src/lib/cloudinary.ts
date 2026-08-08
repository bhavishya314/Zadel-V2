/**
 * Cloudinary Unsigned Upload Service
 * Cloud Name: vbtfdaax
 * Unsigned Upload Preset: Zadel V2
 */

const CLOUD_NAME = 'vbtfdaax';
const UPLOAD_PRESET = 'Zadel V2';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadResponse {
  asset_id?: string;
  public_id: string;
  version?: number;
  width?: number;
  height?: number;
  format?: string;
  resource_type?: string;
  created_at?: string;
  bytes?: number;
  type?: string;
  url: string;
  secure_url: string;
}

/**
 * Upload a File object directly to Cloudinary using Unsigned Upload API
 */
export async function uploadToCloudinary(file: File, folder?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  if (folder) {
    formData.append('folder', folder);
  }

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = `Cloudinary upload failed with status ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.error?.message) {
        errorMsg = errData.error.message;
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errorMsg);
  }

  const data: CloudinaryUploadResponse = await response.json();
  if (!data.secure_url) {
    throw new Error('Cloudinary upload response missing secure_url');
  }

  return data.secure_url;
}

/**
 * Upload product image to Cloudinary
 */
export async function uploadProductImageToCloudinary(
  file: File,
  productId: string = 'general'
): Promise<string> {
  return uploadToCloudinary(file, `products/${productId}`);
}

/**
 * Upload brand logo to Cloudinary
 */
export async function uploadBrandLogoToCloudinary(file: File): Promise<string> {
  return uploadToCloudinary(file, 'branding');
}

/**
 * Upload category image to Cloudinary
 */
export async function uploadCategoryImageToCloudinary(file: File): Promise<string> {
  return uploadToCloudinary(file, 'categories');
}

/**
 * Upload hero banner image to Cloudinary
 */
export async function uploadHeroImageToCloudinary(file: File): Promise<string> {
  return uploadToCloudinary(file, 'hero');
}

/**
 * Image deletion reference handler
 */
export async function deleteImageFromCloudinary(url: string): Promise<void> {
  console.log('Image reference removed from database:', url);
}

// Aliases for compatibility
export const uploadProductImageToStorage = uploadProductImageToCloudinary;
export const uploadBrandLogoToStorage = uploadBrandLogoToCloudinary;
export const uploadHeroImageToStorage = uploadHeroImageToCloudinary;
export const deleteProductImageFromStorage = deleteImageFromCloudinary;
export const deleteBrandLogoFromStorage = deleteImageFromCloudinary;
export const deleteHeroImageFromStorage = deleteImageFromCloudinary;

/**
 * Transforms Cloudinary image URLs to use automatic format (f_auto), automatic quality (q_auto),
 * and an optional max width constraint for massive performance gains.
 */
export function getOptimizedImageUrl(
  url?: string,
  options: { width?: number; quality?: number; crop?: string } = {}
): string {
  if (!url || typeof url !== 'string') return '';

  // Non-Cloudinary URLs or local SVGs/placeholders returned as is
  if (!url.includes('cloudinary.com') && !url.includes('res.cloudinary.com')) {
    return url;
  }

  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;

  const prefix = url.substring(0, uploadIndex + 8);
  const suffix = url.substring(uploadIndex + 8);

  // If transformations like f_auto or q_auto already present, return unchanged
  if (suffix.startsWith('f_auto') || suffix.startsWith('q_auto')) {
    return url;
  }

  const quality = options.quality ? `q_${options.quality}` : 'q_auto';
  const width = options.width ? `,w_${options.width}` : '';
  const crop = options.crop ? `,c_${options.crop}` : '';

  return `${prefix}f_auto,${quality}${width}${crop}/${suffix}`;
}


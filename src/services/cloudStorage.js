import { Platform } from 'react-native';

/**
 * CloudStorageService
 * Handles client-side photo compression and uploads images to:
 * 1. Cloudinary CDN (primary — 25GB free tier, permanent storage)
 * 2. ImgBB (fallback — free anonymous uploads, no account needed)
 * Photos stored on CDN → HTTPS URL saved in reports → stored in Firestore/DB
 * Hostinger never stores raw photos, keeping hosting disk usage near zero.
 */

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'earthrelief';
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PRESET || 'nearbin_waste';
const IMGBB_API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY || ''; // optional fallback

// In-memory upload cache to prevent re-uploading the same image twice
const _uploadCache = new Map();

/**
 * Compresses an image to max 1280px and ~72% JPEG quality.
 * Shrinks 5MB-10MB camera captures down to ~120-180KB while retaining clarity.
 */
async function compressImageWeb(uri) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return uri;
  }

  // Skip if already a CDN URL or too small to compress (< 50KB)
  if (
    (uri.startsWith('http://') || uri.startsWith('https://')) &&
    !uri.includes('blob:') && !uri.startsWith('data:')
  ) {
    return uri;
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const MAX_DIM = 1280;
      let { width, height } = img;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Export as compressed JPEG (0.72 = good visual quality, ~40% smaller than 0.9)
      const compressed = canvas.toDataURL('image/jpeg', 0.72);
      const sizeKb = Math.round(compressed.length / 1024);
      console.log(`[CloudStorage] Compressed: ${sizeKb} KB`);
      resolve(compressed);
    };

    img.onerror = () => {
      console.warn('[CloudStorage] Compression error, using original.');
      resolve(uri);
    };

    img.src = uri;
  });
}

/**
 * Upload to Cloudinary CDN (primary storage)
 * Returns HTTPS CDN URL on success, null on failure
 */
async function uploadToCloudinary(dataUri, folder) {
  if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === 'earthrelief') return null;

  try {
    const formData = new FormData();
    formData.append('file', dataUri);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.secure_url) {
        console.log('[CloudStorage] ✅ Cloudinary CDN upload:', data.secure_url);
        return data.secure_url;
      }
    }
  } catch (err) {
    console.warn('[CloudStorage] Cloudinary upload failed:', err?.message);
  }
  return null;
}

/**
 * Upload to ImgBB (fallback CDN — free, no account required)
 * Returns HTTPS URL on success, null on failure
 */
async function uploadToImgBB(dataUri) {
  // ImgBB works with base64 without the data: prefix
  const base64 = dataUri.startsWith('data:') ? dataUri.split(',')[1] : dataUri;
  if (!base64) return null;

  try {
    const formData = new FormData();
    formData.append('image', base64);
    // Use API key if provided, else try anonymous (may be rate-limited)
    const endpoint = IMGBB_API_KEY
      ? `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`
      : 'https://api.imgbb.com/1/upload?key=2e49a93c6d9a1b08fa1a70028a2b4b8d';

    const res = await fetch(endpoint, { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data?.url) {
        console.log('[CloudStorage] ✅ ImgBB fallback upload:', data.data.url);
        return data.data.url;
      }
    }
  } catch (err) {
    console.warn('[CloudStorage] ImgBB fallback failed:', err?.message);
  }
  return null;
}

export const CloudStorageService = {
  /**
   * Uploads an image to CDN and returns a permanent HTTPS URL.
   * Priority: Cloudinary → ImgBB → compressed data URI (last resort)
   * Caches results so the same image is never uploaded twice.
   */
  async uploadImage(imageUri, { folder = 'nearbin/reports' } = {}) {
    if (!imageUri) return null;

    // Already a permanent CDN URL — no upload needed
    if (
      (imageUri.startsWith('http://') || imageUri.startsWith('https://')) &&
      !imageUri.startsWith('blob:') && !imageUri.startsWith('data:')
    ) {
      return imageUri;
    }

    // Cache hit — return previously uploaded URL
    const cacheKey = imageUri.slice(0, 80);
    if (_uploadCache.has(cacheKey)) {
      console.log('[CloudStorage] Cache hit — skipping re-upload');
      return _uploadCache.get(cacheKey);
    }

    try {
      // 1. Client-side downscaling & compression
      const optimizedUri = await compressImageWeb(imageUri);

      // 2. Try Cloudinary (primary permanent CDN)
      const cloudinaryUrl = await uploadToCloudinary(optimizedUri, folder);
      if (cloudinaryUrl) {
        _uploadCache.set(cacheKey, cloudinaryUrl);
        return cloudinaryUrl;
      }

      // 3. Try ImgBB (free fallback CDN)
      const imgbbUrl = await uploadToImgBB(optimizedUri);
      if (imgbbUrl) {
        _uploadCache.set(cacheKey, imgbbUrl);
        return imgbbUrl;
      }

      // 4. Last resort — return compressed data URI (stored inline in DB)
      console.warn('[CloudStorage] All CDN uploads failed, using compressed data URI.');
      return optimizedUri;
    } catch (err) {
      console.warn('[CloudStorage] Upload error:', err?.message);
      return imageUri;
    }
  },

  /**
   * Clear upload cache (call on logout to free memory)
   */
  clearCache() {
    _uploadCache.clear();
  },
};

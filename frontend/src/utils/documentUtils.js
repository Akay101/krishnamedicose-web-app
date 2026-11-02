/**
 * Utility functions for resolving document download / preview URLs
 * and formatting file sizes.
 */

/**
 * Resolves a document URL to an absolute URL accessible by the browser.
 * Handles both remote cloud URLs (Cloudflare R2, S3, external storage)
 * and relative local disk uploads (/uploads/services/...).
 *
 * @param {string} url - The document URL stored in the database
 * @returns {string} - Fully qualified URL for browser access
 */
export const resolveDocumentUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Already an absolute URL (R2 bucket, CDN, or external)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Relative path: resolve against backend origin (stripping /api)
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const backendOrigin = apiBase.replace(/\/api\/?$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${backendOrigin}${cleanPath}`;
};

/**
 * Formats a file size in bytes to a clean human-readable representation.
 *
 * @param {number|string} bytes - File size in bytes
 * @returns {string} - Formatted string (e.g. "12.4 MB", "450 KB", "1.2 GB")
 */
export const formatFileSize = (bytes) => {
  const num = Number(bytes);
  if (!num || isNaN(num) || num <= 0) return '';

  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  return `${(num / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

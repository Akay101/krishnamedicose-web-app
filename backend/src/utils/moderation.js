/**
 * Shared rules for member listings (jobs, doctor chambers) that need admin verification.
 */

// Visible to the public: approved, or legacy documents created before moderation existed
const PUBLIC_LISTING_FILTER = { moderationStatus: { $nin: ['pending', 'rejected'] } };

const isPubliclyVisible = (doc) => !doc?.moderationStatus || doc.moderationStatus === 'approved';

// Uploaded images must come from our own storage (never arbitrary third-party URLs)
const ownStoragePrefixes = () =>
  [
    process.env.R2_PUBLIC_URL && `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/services/`,
    process.env.R2_BUCKET_NAME && `https://${process.env.R2_BUCKET_NAME}.r2.dev/services/`,
    '/uploads/services/'
  ].filter(Boolean);

const sanitizeListingImages = (images, max = 6) => {
  if (!Array.isArray(images)) return [];
  const prefixes = ownStoragePrefixes();
  return images
    .map((u) => (typeof u === 'string' ? u.trim() : ''))
    .filter((u) => u && !u.includes('..') && /\.(jpe?g|png|webp)$/i.test(u) && prefixes.some((p) => u.startsWith(p)))
    .slice(0, max);
};

// Fields an owner may change without the listing needing a fresh review
const NON_CONTENT_KEYS = new Set(['status']);
const touchesContent = (body = {}) => Object.keys(body).some((k) => !NON_CONTENT_KEYS.has(k));

module.exports = { PUBLIC_LISTING_FILTER, isPubliclyVisible, sanitizeListingImages, touchesContent };

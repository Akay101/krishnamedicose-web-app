const crypto = require('crypto');

/**
 * Escape user input before embedding it in a RegExp / $regex query.
 * Prevents ReDoS and regex-injection via search boxes.
 */
const escapeRegex = (value) =>
  String(value ?? '')
    .slice(0, 100)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Escape a value for safe interpolation inside HTML email templates.
 */
const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

/**
 * Only allow http(s), mailto, tel and site-relative URLs.
 * Blocks javascript:, data:, vbscript: and protocol-relative tricks.
 */
const isSafeUrl = (value, { allowRelative = true } = {}) => {
  if (typeof value !== 'string') return false;
  const url = value.trim();
  if (!url) return true;
  if (allowRelative && url.startsWith('/') && !url.startsWith('//')) return true;
  if (allowRelative && url.startsWith('#')) return true;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const sanitizeUrl = (value, options) => (isSafeUrl(value, options) ? String(value).trim() : '');

const URL_KEY_PATTERN = /(url|href|link|image|images|src|photo|logo|avatar)$/i;

/**
 * Deep-clean admin-managed CMS content: strips prototype keys, bounds sizes,
 * and neutralises unsafe URLs in any url/href/image-like field.
 */
const sanitizeContentTree = (node, key = '', depth = 0) => {
  if (depth > 8) return null;
  if (typeof node === 'string') {
    const trimmed = node.slice(0, 5000);
    if (URL_KEY_PATTERN.test(key)) return sanitizeUrl(trimmed);
    return trimmed;
  }
  if (typeof node === 'number' || typeof node === 'boolean' || node === null) return node;
  if (Array.isArray(node)) {
    return node.slice(0, 100).map((item) => sanitizeContentTree(item, key, depth + 1));
  }
  if (typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node).slice(0, 200)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype' || k.startsWith('$')) continue;
      out[k] = sanitizeContentTree(v, k, depth + 1);
    }
    return out;
  }
  return null;
};

/** Cryptographically secure numeric code (default 6 digits). */
const randomNumericCode = (digits = 6) =>
  crypto.randomInt(10 ** (digits - 1), 10 ** digits).toString();

/** Cryptographically secure opaque identifier. */
const randomToken = (bytes = 24) => crypto.randomBytes(bytes).toString('hex');

/** Keyed hash for OTP / activation codes so they are never stored in plain text. */
const hashSecret = (value) =>
  crypto
    .createHmac('sha256', process.env.OTP_SECRET || process.env.JWT_SECRET || 'km-otp-secret')
    .update(String(value).trim())
    .digest('hex');

/** Constant-time comparison of two hex digests. */
const safeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

/** Truncate & coerce untrusted text input. */
const cleanText = (value, max = 500) =>
  typeof value === 'string' || typeof value === 'number'
    ? String(value).replace(/<[^>]*>?/gm, '').trim().slice(0, max)
    : '';

module.exports = {
  escapeRegex,
  escapeHtml,
  isSafeUrl,
  sanitizeUrl,
  sanitizeContentTree,
  randomNumericCode,
  randomToken,
  hashSecret,
  safeEqual,
  cleanText,
};

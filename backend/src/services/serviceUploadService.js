const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Ensure local services upload directory exists as fallback
const LOCAL_SERVICES_UPLOAD_DIR = path.join(__dirname, '../../uploads/services');
if (!fs.existsSync(LOCAL_SERVICES_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_SERVICES_UPLOAD_DIR, { recursive: true });
}

// Check R2 configuration
const isR2Configured = Boolean(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME
);

let s3Client = null;
if (isR2Configured) {
  try {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  } catch (err) {
    console.warn('R2 Client initialization failed, using local storage fallback:', err.message);
  }
}

// The stored extension is derived from the verified MIME type, never from the client filename
const MIME_EXTENSION = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf'
};
const ALLOWED_MIME_TYPES = Object.keys(MIME_EXTENSION);

const MAGIC_CHECKS = {
  '.jpg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  '.png': (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  '.webp': (b) => b.slice(0, 4).toString('ascii') === 'RIFF' && b.slice(8, 12).toString('ascii') === 'WEBP',
  '.pdf': (b) => b.slice(0, 5).toString('ascii') === '%PDF-'
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid document format. Only JPG, PNG, WEBP, and PDF files are allowed.'), false);
    }
  }
});

/**
 * Upload a document or license file. Attempts Cloudflare R2 first; falls back to local disk.
 */
const uploadDocument = async (file) => {
  if (!file) throw new Error('No file provided');

  // Trust the bytes, not the browser label: phones often save JPEGs as ".png".
  // The stored extension comes from the detected format, which must be on the allow-list.
  const buffer = file.buffer;
  const ext =
    buffer && buffer.length >= 12
      ? Object.keys(MAGIC_CHECKS).find((candidate) => MAGIC_CHECKS[candidate](buffer))
      : undefined;
  if (!ext) {
    throw new Error('File content does not match an allowed JPG, PNG, WEBP or PDF document.');
  }
  const detectedMime = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf' }[ext];
  file.mimetype = detectedMime;
  const safeName = path
    .basename(file.originalname, path.extname(file.originalname))
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 25);
  const uniqueKey = `services/docs/${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safeName}${ext}`;

  if (isR2Configured && s3Client) {
    try {
      const params = {
        Bucket: process.env.R2_BUCKET_NAME,
        Key: uniqueKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      await s3Client.send(new PutObjectCommand(params));
      const publicUrl = process.env.R2_PUBLIC_URL
        ? `${process.env.R2_PUBLIC_URL}/${uniqueKey}`
        : `https://${process.env.R2_BUCKET_NAME}.r2.dev/${uniqueKey}`;

      return {
        url: publicUrl,
        key: uniqueKey,
        filename: file.originalname,
        mimeType: file.mimetype,
        storage: 'r2'
      };
    } catch (r2Error) {
      console.warn('R2 upload failed, proceeding to local disk storage fallback:', r2Error.message);
    }
  }

  // Fallback to local disk
  const localFileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safeName}${ext}`;
  const localFilePath = path.join(LOCAL_SERVICES_UPLOAD_DIR, localFileName);
  fs.writeFileSync(localFilePath, file.buffer);

  return {
    url: `/uploads/services/${localFileName}`,
    key: `local-services/${localFileName}`,
    filename: file.originalname,
    mimeType: file.mimetype,
    storage: 'local'
  };
};

module.exports = {
  upload,
  uploadDocument
};

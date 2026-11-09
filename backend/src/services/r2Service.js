const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const crypto = require('crypto');

// SVG is intentionally excluded: it can carry executable script
const MIME_EXTENSION = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'audio/mpeg': '.mp3'
};
const ALLOWED_MIME_TYPES = Object.keys(MIME_EXTENSION);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only images, PDFs, and MP3 audio are allowed.`), false);
    }
  }
});

const uploadToR2 = async (file) => {
  const ext = MIME_EXTENSION[file.mimetype] || '.bin';
  const safeBaseName = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
  const fileKey = `assets/${crypto.randomUUID()}-${safeBaseName}${ext}`;
  
  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return {
      url: `${process.env.R2_PUBLIC_URL}/${fileKey}`, // Assuming public bucket access is configured
      key: fileKey
    };
  } catch (error) {
    console.error('R2 Upload error:', error);
    throw error;
  }
};

const deleteFromR2 = async (key) => {
  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.error('R2 Delete error:', error);
    throw error;
  }
};

module.exports = { upload, uploadToR2, deleteFromR2 };

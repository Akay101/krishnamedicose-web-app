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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const uploadToR2 = async (file) => {
  const fileKey = `assets/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
  
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

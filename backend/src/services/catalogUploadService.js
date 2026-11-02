const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Ensure local uploads directory exists
const LOCAL_SERVICES_UPLOAD_DIR = path.join(__dirname, '../../uploads/services');
if (!fs.existsSync(LOCAL_SERVICES_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_SERVICES_UPLOAD_DIR, { recursive: true });
}

// R2 Storage Configuration
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
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      }
    });
  } catch (err) {
    console.warn('R2 Client initialization failed for catalog upload, fallback to local disk:', err.message);
  }
}

// Whitelisted MIME types and their strictly allowed file extensions
const ALLOWED_MIME_MAP = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/csv': ['.csv'],
  'text/plain': ['.csv', '.txt'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/jpg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp']
};

// Dangerous file extensions strictly rejected under all circumstances
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.bin', '.js', '.mjs', '.ts',
  '.php', '.phtml', '.php3', '.php4', '.php5', '.phps',
  '.py', '.pyc', '.pyo', '.rb', '.pl', '.cgi', '.asp', '.aspx', '.jsp',
  '.html', '.htm', '.xhtml', '.svg', '.xml', '.vbs', '.wsf', '.jar',
  '.war', '.msi', '.dll', '.so', '.dylib', '.com', '.scr', '.hta', '.cpl'
]);

// Memory storage for inspection before writing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB maximum for large catalogs and documents
  },
  fileFilter: (req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();

    // Check dangerous extensions
    if (DANGEROUS_EXTENSIONS.has(rawExt)) {
      return cb(new Error('Executable and script file uploads are strictly prohibited.'), false);
    }

    // Check if filename has double extensions (e.g. file.pdf.exe)
    const baseWithoutExt = path.basename(file.originalname, rawExt);
    if (baseWithoutExt.includes('.')) {
      const secondaryExt = path.extname(baseWithoutExt).toLowerCase();
      if (DANGEROUS_EXTENSIONS.has(secondaryExt)) {
        return cb(new Error('Invalid double file extension detected.'), false);
      }
    }

    // Whitelist check
    if (!ALLOWED_MIME_MAP[mime] || !ALLOWED_MIME_MAP[mime].includes(rawExt)) {
      return cb(
        new Error(
          'Invalid file type. Allowed formats: PDF (.pdf), Word (.doc, .docx), Excel (.xls, .xlsx, .csv), and Images (.jpg, .png, .webp).'
        ),
        false
      );
    }

    cb(null, true);
  }
});

/**
 * Deep Sanitary and Magic Byte Verification
 */
const verifyFileSanitary = (buffer, mimeType, ext) => {
  if (!buffer || buffer.length === 0) {
    throw new Error('Uploaded file is empty.');
  }

  // 1. Magic bytes verification for known formats
  if (mimeType === 'application/pdf' || ext === '.pdf') {
    // PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46 0x2D)
    const pdfHeader = buffer.slice(0, 5).toString('ascii');
    if (!pdfHeader.startsWith('%PDF-')) {
      throw new Error('Corrupted or invalid PDF header. Please upload a genuine PDF file.');
    }
  } else if (mimeType.includes('jpeg') || mimeType.includes('jpg') || ext === '.jpg' || ext === '.jpeg') {
    // JPEG magic bytes: FF D8 FF
    if (buffer.length < 3 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
      throw new Error('Corrupted or invalid JPEG image header.');
    }
  } else if (mimeType.includes('png') || ext === '.png') {
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer.length < 8 ||
      buffer[0] !== 0x89 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x4e ||
      buffer[3] !== 0x47 ||
      buffer[4] !== 0x0d ||
      buffer[5] !== 0x0a ||
      buffer[6] !== 0x1a ||
      buffer[7] !== 0x0a
    ) {
      throw new Error('Corrupted or invalid PNG image header.');
    }
  } else if (ext === '.docx' || ext === '.xlsx') {
    // DOCX/XLSX are OpenXML ZIP packages, magic bytes: PK\x03\x04
    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
      throw new Error('Corrupted or invalid Microsoft Office document package.');
    }
  }

  // 2. Active script and payload signature scanner
  // Check the first 8KB of the buffer converted to string for dangerous embedded tags
  const headerInspectionString = buffer.slice(0, Math.min(buffer.length, 8192)).toString('latin1');
  const dangerousSignatures = [
    /<script[\s>]/i,
    /javascript:/i,
    /<\?php/i,
    /<%[\s=]/i,
    /eval\s*\(/i,
    /base64_decode/i,
    /system\s*\(/i,
    /shell_exec/i,
    /passthru/i,
    /\/bin\/sh/i,
    /\/bin\/bash/i,
    /<html[\s>]/i,
    /<body[\s>]/i
  ];

  for (const sig of dangerousSignatures) {
    if (sig.test(headerInspectionString)) {
      throw new Error('File rejected: Potential executable code or script signature detected.');
    }
  }

  return true;
};

/**
 * Upload verified and sanitized file to R2 or local disk storage
 */
const uploadSanitizedDocument = async (file, folder = 'catalogs') => {
  if (!file) throw new Error('No file provided for upload.');

  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = (file.mimetype || '').toLowerCase();

  // Run sanitary and security verification
  verifyFileSanitary(file.buffer, mimeType, ext);

  // Sanitize filename: strip non-alphanumeric, limit length
  const rawBaseName = path.basename(file.originalname, ext);
  const cleanBaseName = rawBaseName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 35) || 'document';
  const uniqueId = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
  const safeFileName = `${uniqueId}-${cleanBaseName}${ext}`;
  const uniqueKey = `services/${folder}/${safeFileName}`;

  // Upload to R2 if available
  if (isR2Configured && s3Client) {
    try {
      const params = {
        Bucket: process.env.R2_BUCKET_NAME,
        Key: uniqueKey,
        Body: file.buffer,
        ContentType: mimeType,
        ContentDisposition: `inline; filename="${cleanBaseName}${ext}"`
      };

      await s3Client.send(new PutObjectCommand(params));
      const publicUrl = process.env.R2_PUBLIC_URL
        ? `${process.env.R2_PUBLIC_URL}/${uniqueKey}`
        : `https://${process.env.R2_BUCKET_NAME}.r2.dev/${uniqueKey}`;

      return {
        url: publicUrl,
        key: uniqueKey,
        filename: safeFileName,
        originalName: file.originalname,
        mimeType,
        size: file.size,
        storage: 'r2'
      };
    } catch (r2Err) {
      console.warn('R2 upload failed, proceeding with local disk fallback:', r2Err.message);
    }
  }

  // Local disk fallback
  const localFilePath = path.join(LOCAL_SERVICES_UPLOAD_DIR, safeFileName);
  fs.writeFileSync(localFilePath, file.buffer);

  return {
    url: `/uploads/services/${safeFileName}`,
    key: `local-services/${safeFileName}`,
    filename: safeFileName,
    originalName: file.originalname,
    mimeType,
    size: file.size,
    storage: 'local'
  };
};

module.exports = {
  upload,
  uploadSanitizedDocument,
  verifyFileSanitary
};

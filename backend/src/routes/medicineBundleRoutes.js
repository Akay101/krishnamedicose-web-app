const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const BundlePurchase = require('../models/BundlePurchase');
const { 
  sendBundlePurchaseConfirmation, 
  sendBundleAdminNotification,
  sendBundleOtpEmail,
  sendBundleUpdateNotification
} = require('../services/emailService');
const { authMiddleware } = require('../middleware/authMiddleware');

const isProduction = process.env.NODE_ENV === 'production';
const CASHFREE_BASE_URL = isProduction 
  ? 'https://api.cashfree.com/pg' 
  : 'https://sandbox.cashfree.com/pg';

// Get Config Details (Amount & Link)
router.get('/config', (req, res) => {
  const amount = Number(process.env.BUNDLE_AMOUNT || 999);
  const link = process.env.BUNDLE_LINK || 'https://drive.google.com';
  res.status(200).json({ amount, link });
});

// Create Cashfree Order
router.post('/create-order', async (req, res) => {
  const { name, email, mobile } = req.body;
  if (!name || !email || !mobile) {
    return res.status(400).json({ message: 'Name, email, and mobile number are required' });
  }

  const amount = Number(process.env.BUNDLE_AMOUNT || 999);
  const orderId = 'order_bundle_' + Date.now();

  const origin = req.headers.referer || req.headers.origin || 'http://localhost:5173';
  // Strip trailing slash if present
  let returnUrl = `${origin.replace(/\/$/, '')}/medicine-data/verify-payment?order_id={order_id}`;

  // Cashfree production API strictly requires HTTPS return_url
  if (isProduction && returnUrl.startsWith('http://')) {
    returnUrl = returnUrl.replace(/^http:\/\//, 'https://');
  }

  // Attempt Cashfree order creation first
  try {
    const cashfreeResponse = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: 'cust_' + Date.now(),
          customer_name: name,
          customer_email: email,
          customer_phone: mobile
        },
        order_meta: {
          return_url: returnUrl
        }
      })
    });

    const cashfreeData = await cashfreeResponse.json();

    if (cashfreeResponse.ok && cashfreeData.payment_session_id) {
      // Save pending purchase record
      const purchase = new BundlePurchase({
        orderId,
        name,
        email,
        mobile,
        amount,
        paymentStatus: 'pending'
      });
      await purchase.save();

      return res.status(200).json({
        gateway: 'CASHFREE',
        orderId,
        paymentSessionId: cashfreeData.payment_session_id,
        amount,
        isProduction
      });
    } else {
      console.warn('Cashfree order creation rejected/unsupported. Initiating Instamojo fallback...', cashfreeData);
      throw new Error(cashfreeData.message || 'Cashfree gateway unavailable');
    }
  } catch (cashfreeError) {
    console.error('Cashfree transaction initiation failed, falling back to Instamojo:', cashfreeError.message);

    // Fallback to Instamojo
    try {
      let instamojoReturnUrl = `${origin.replace(/\/$/, '')}/medicine-data/verify-payment`;
      
      const instamojoParams = new URLSearchParams();
      instamojoParams.append('amount', amount.toFixed(2));
      instamojoParams.append('purpose', 'Medicine Data Bundle');
      instamojoParams.append('buyer_name', name);
      instamojoParams.append('email', email.trim().toLowerCase());
      instamojoParams.append('phone', mobile);
      instamojoParams.append('redirect_url', instamojoReturnUrl);
      instamojoParams.append('send_email', 'false');
      instamojoParams.append('send_sms', 'false');
      instamojoParams.append('allow_repeated_payments', 'false');

      const INSTAMOJO_BASE_URL = isProduction
        ? 'https://www.instamojo.com/api/1.1'
        : 'https://test.instamojo.com/api/1.1';

      let instamojoResponse = await fetch(`${INSTAMOJO_BASE_URL}/payment-requests/`, {
        method: 'POST',
        headers: {
          'X-Api-Key': process.env.INSTAMOJO_PRIVATE_API_KEY,
          'X-Auth-Token': process.env.INSTAMOJO_PRIVATE_AUTH_TOKEN,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: instamojoParams.toString()
      });

      let instamojoData = await instamojoResponse.json();

      // If unauthorized or invalid token, automatically try the alternative (sandbox vs production) environment
      if (!instamojoResponse.ok && (instamojoData.message === 'Invalid Auth Token.' || instamojoData.message === 'Invalid API Key.' || instamojoResponse.status === 401)) {
        const ALT_BASE_URL = INSTAMOJO_BASE_URL.includes('test')
          ? 'https://www.instamojo.com/api/1.1'
          : 'https://test.instamojo.com/api/1.1';
        
        console.warn(`Instamojo credentials rejected on ${INSTAMOJO_BASE_URL}. Retrying request with alternative gateway URL: ${ALT_BASE_URL}`);
        
        const altResponse = await fetch(`${ALT_BASE_URL}/payment-requests/`, {
          method: 'POST',
          headers: {
            'X-Api-Key': process.env.INSTAMOJO_PRIVATE_API_KEY,
            'X-Auth-Token': process.env.INSTAMOJO_PRIVATE_AUTH_TOKEN,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: instamojoParams.toString()
        });

        const altData = await altResponse.json();
        if (altResponse.ok) {
          instamojoResponse = altResponse;
          instamojoData = altData;
        }
      }

      if (!instamojoResponse.ok) {
        console.error('Instamojo creation failure response:', instamojoData);
        return res.status(instamojoResponse.status || 500).json({
          message: 'Failed to initiate payment session with both Cashfree and Instamojo',
          cashfreeError: cashfreeError.message,
          instamojoError: instamojoData
        });
      }

      // Save pending purchase record with Instamojo request ID
      const purchase = new BundlePurchase({
        orderId: orderId,
        name,
        email,
        mobile,
        amount,
        paymentStatus: 'pending',
        cashfreeReferenceId: instamojoData.payment_request.id // Store Instamojo Payment Request ID
      });
      await purchase.save();

      return res.status(200).json({
        gateway: 'INSTAMOJO',
        orderId,
        paymentUrl: instamojoData.payment_request.longurl,
        amount
      });
    } catch (mojoErr) {
      console.error('Instamojo fallback initialization crashed:', mojoErr);
      return res.status(500).json({
        message: 'Both Cashfree and Instamojo payment gateways failed to initialize.',
        cashfreeError: cashfreeError.message,
        instamojoError: mojoErr.message
      });
    }
  }
});

// Verify Cashfree or Instamojo Payment
router.post('/verify-payment', async (req, res) => {
  const { orderId, paymentId, paymentRequestId } = req.body;
  if (!orderId && !paymentRequestId) {
    return res.status(400).json({ message: 'Order ID or Payment Request ID is required' });
  }

  // Handle Instamojo verification
  if (paymentRequestId) {
    try {
      const INSTAMOJO_BASE_URL = isProduction
        ? 'https://www.instamojo.com/api/1.1'
        : 'https://test.instamojo.com/api/1.1';

      let imResponse = await fetch(`${INSTAMOJO_BASE_URL}/payment-requests/${paymentRequestId}/`, {
        method: 'GET',
        headers: {
          'X-Api-Key': process.env.INSTAMOJO_PRIVATE_API_KEY,
          'X-Auth-Token': process.env.INSTAMOJO_PRIVATE_AUTH_TOKEN
        }
      });

      let imData = await imResponse.json();

      // If unauthorized, retry verification with the alternative environment URL
      if (!imResponse.ok && (imData.message === 'Invalid Auth Token.' || imData.message === 'Invalid API Key.' || imResponse.status === 401)) {
        const ALT_BASE_URL = INSTAMOJO_BASE_URL.includes('test')
          ? 'https://www.instamojo.com/api/1.1'
          : 'https://test.instamojo.com/api/1.1';

        console.warn(`Instamojo credentials rejected during verification on ${INSTAMOJO_BASE_URL}. Retrying with alternative URL: ${ALT_BASE_URL}`);

        const altResponse = await fetch(`${ALT_BASE_URL}/payment-requests/${paymentRequestId}/`, {
          method: 'GET',
          headers: {
            'X-Api-Key': process.env.INSTAMOJO_PRIVATE_API_KEY,
            'X-Auth-Token': process.env.INSTAMOJO_PRIVATE_AUTH_TOKEN
          }
        });

        const altData = await altResponse.json();
        if (altResponse.ok) {
          imResponse = altResponse;
          imData = altData;
        }
      }

      if (!imResponse.ok) {
        console.error('Instamojo verification error:', imData);
        return res.status(imResponse.status).json({
          message: 'Failed to verify payment status with Instamojo',
          error: imData
        });
      }

      const isPaid = imData.payment_request.status === 'Completed';
      const purchase = await BundlePurchase.findOne({ cashfreeReferenceId: paymentRequestId });

      if (!purchase) {
        return res.status(404).json({ message: 'Order record not found in system' });
      }

      if (isPaid) {
        let sessionId = purchase.activeSessionId;
        if (!sessionId) {
          sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
          purchase.activeSessionId = sessionId;
        }
        purchase.sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        let newlyPaid = false;
        if (purchase.paymentStatus !== 'paid') {
          purchase.paymentStatus = 'paid';
          purchase.paidAt = new Date();
          purchase.cashfreeReferenceId = paymentId || purchase.cashfreeReferenceId;
          newlyPaid = true;
        }
        await purchase.save();

        const token = jwt.sign(
          { purchaseId: purchase._id, email: purchase.email, sessionId },
          process.env.JWT_SECRET || 'krishna_medicose_secret_7788',
          { expiresIn: '1d' }
        );

        if (newlyPaid) {
          try {
            await sendBundlePurchaseConfirmation(purchase.email, {
              orderId: purchase.orderId,
              userName: purchase.name,
              amount: purchase.amount
            });
            await sendBundleAdminNotification({
              orderId: purchase.orderId,
              userName: purchase.name,
              userEmail: purchase.email,
              userMobile: purchase.mobile,
              amount: purchase.amount
            });
          } catch (mailErr) {
            console.error('Mail trigger failed:', mailErr);
          }
        }

        return res.status(200).json({ 
          status: 'SUCCESS', 
          purchase,
          token,
          user: {
            name: purchase.name,
            email: purchase.email
          }
        });
      } else {
        purchase.paymentStatus = 'failed';
        await purchase.save();
        return res.status(200).json({ status: 'FAILED', message: 'Payment was not successful' });
      }
    } catch (err) {
      console.error('Error verifying Instamojo payment:', err);
      return res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
  }

  // Handle Cashfree verification
  try {
    const cashfreeResponse = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      }
    });

    const cashfreeData = await cashfreeResponse.json();

    if (!cashfreeResponse.ok) {
      console.error('Cashfree verification error:', cashfreeData);
      return res.status(cashfreeResponse.status).json({
        message: 'Failed to verify payment status with Cashfree',
        error: cashfreeData
      });
    }

    const isPaid = cashfreeData.order_status === 'PAID';
    const purchase = await BundlePurchase.findOne({ orderId });

    if (!purchase) {
      return res.status(404).json({ message: 'Order record not found in system' });
    }

    if (isPaid) {
      // Auto login: generate session ID and JWT token on success
      let sessionId = purchase.activeSessionId;
      if (!sessionId) {
        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
        purchase.activeSessionId = sessionId;
      }
      purchase.sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      let newlyPaid = false;
      if (purchase.paymentStatus !== 'paid') {
        purchase.paymentStatus = 'paid';
        purchase.paidAt = new Date();
        purchase.cashfreeReferenceId = cashfreeData.cf_order_id || '';
        newlyPaid = true;
      }
      await purchase.save();

      // Sign the secure token (expires in 24 hours)
      const token = jwt.sign(
        { purchaseId: purchase._id, email: purchase.email, sessionId },
        process.env.JWT_SECRET || 'krishna_medicose_secret_7788',
        { expiresIn: '1d' }
      );

      if (newlyPaid) {
        // Trigger emails
        try {
          await sendBundlePurchaseConfirmation(purchase.email, {
            orderId: purchase.orderId,
            userName: purchase.name,
            amount: purchase.amount
          });
          await sendBundleAdminNotification({
            orderId: purchase.orderId,
            userName: purchase.name,
            userEmail: purchase.email,
            userMobile: purchase.mobile,
            amount: purchase.amount
          });
        } catch (mailErr) {
          console.error('Mail trigger failed:', mailErr);
        }
      }

      return res.status(200).json({ 
        status: 'SUCCESS', 
        purchase,
        token,
        user: {
          name: purchase.name,
          email: purchase.email
        }
      });
    } else {
      purchase.paymentStatus = 'failed';
      await purchase.save();
      return res.status(200).json({ status: 'FAILED', message: 'Payment was not successful' });
    }
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// Admin endpoint: List purchases
router.get('/purchases', authMiddleware, async (req, res) => {
  try {
    const purchases = await BundlePurchase.find({ paymentStatus: 'paid' }).sort({ createdAt: -1 });
    res.status(200).json(purchases);
  } catch (err) {
    console.error('Failed to fetch purchases:', err);
    res.status(500).json({ message: 'Failed to fetch purchases' });
  }
});

// Helper to parse CSV row
function parseCSVRow(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(v => v.replace(/^"|"$/g, '').trim());
}

// Helper to fuzzy map uploaded CSV headers to target fields
function autoMapHeaders(csvHeaders) {
  const keys = ['category', 'brandName', 'saltComposition', 'detailsUsage'];
  const mapping = {
    category: null,
    brandName: null,
    saltComposition: null,
    detailsUsage: null
  };

  const synonyms = {
    brandName: {
      high: ['productname', 'product', 'name', 'medicinename', 'medicine'],
      medium: ['brand', 'brandname', 'title']
    },
    saltComposition: {
      high: ['salt', 'activesalt', 'composition', 'activesaltcomposition', 'chemical', 'salts', 'activesalts', 'activeingredient'],
      medium: ['ingredient', 'ingredients']
    },
    detailsUsage: {
      high: ['details', 'usage', 'indications', 'usageindications', 'description', 'purpose', 'action', 'use', 'uses', 'indicative'],
      medium: []
    },
    category: {
      high: ['category', 'type', 'group', 'class', 'therapeuticclass', 'division', 'classification'],
      medium: []
    }
  };

  // Find the best matching CSV header for each target key
  keys.forEach(key => {
    let bestHeader = null;
    let bestScore = -1;

    csvHeaders.forEach(header => {
      const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      const keyNormalized = key.toLowerCase();

      let score = 0;
      if (normalized === keyNormalized) {
        score = 100;
      } else if (synonyms[key].high.includes(normalized)) {
        score = 90;
      } else if (synonyms[key].medium.includes(normalized)) {
        score = 70;
      } else if (normalized.includes(keyNormalized) || keyNormalized.includes(normalized)) {
        score = 40;
      } else {
        // Substring checks for synonym items
        const hasHighSynonymSubstring = synonyms[key].high.some(syn => normalized.includes(syn) || syn.includes(normalized));
        if (hasHighSynonymSubstring) {
          score = 30;
        } else {
          const hasMediumSynonymSubstring = synonyms[key].medium.some(syn => normalized.includes(syn) || syn.includes(normalized));
          if (hasMediumSynonymSubstring) {
            score = 20;
          }
        }
      }

      if (score > bestScore || (score === bestScore && bestHeader && header.length < bestHeader.length)) {
        bestScore = score;
        bestHeader = header;
      }
    });

    if (bestScore > 0) {
      mapping[key] = bestHeader;
    }
  });

  // Ensure unique source headers mapped to target keys
  const mapped = {}; // header -> { key, score }
  keys.forEach(key => {
    const header = mapping[key];
    if (header) {
      const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      let score = synonyms[key].high.includes(normalized) ? 90 : (synonyms[key].medium.includes(normalized) ? 70 : 20);
      if (normalized === key.toLowerCase()) score = 100;

      if (!mapped[header] || mapped[header].score < score) {
        mapped[header] = { key, score };
      }
    }
  });

  // Reset mapping and apply unique ones
  keys.forEach(k => { mapping[k] = null; });
  for (const header in mapped) {
    mapping[mapped[header].key] = header;
  }

  // Fallbacks: If some target keys are still unmapped, assign remaining unused headers
  const usedHeaders = Object.values(mapping).filter(Boolean);
  const unusedHeaders = csvHeaders.filter(h => !usedHeaders.includes(h));

  if (!mapping.brandName && unusedHeaders.length > 0) {
    mapping.brandName = unusedHeaders.shift();
  }
  if (!mapping.saltComposition && unusedHeaders.length > 0) {
    mapping.saltComposition = unusedHeaders.shift();
  }
  if (!mapping.detailsUsage && unusedHeaders.length > 0) {
    mapping.detailsUsage = unusedHeaders.shift();
  }
  if (!mapping.category && unusedHeaders.length > 0) {
    mapping.category = unusedHeaders.shift();
  }

  return mapping;
}

// 1. Request access OTP
router.post('/login', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email address is required' });
  }

  try {
    // Find a successful purchase for this email
    const purchase = await BundlePurchase.findOne({ 
      email: email.trim().toLowerCase(), 
      paymentStatus: 'paid' 
    });

    if (!purchase) {
      return res.status(404).json({ 
        message: 'No active purchase found for this email address. Please make a purchase first.' 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    purchase.otp = otp;
    purchase.otpExpiresAt = otpExpiresAt;
    await purchase.save();

    // Send the OTP via email
    await sendBundleOtpEmail(purchase.email, otp);

    res.status(200).json({ message: 'One-Time Password (OTP) sent to your email.' });
  } catch (err) {
    console.error('Secure login error:', err);
    res.status(500).json({ message: 'Failed to send OTP email', error: err.message });
  }
});

// 2. Verify OTP & generate single-session token
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const purchase = await BundlePurchase.findOne({ 
      email: email.trim().toLowerCase(), 
      paymentStatus: 'paid' 
    });

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase record not found' });
    }

    if (!purchase.otp || purchase.otp !== otp.trim() || !purchase.otpExpiresAt || purchase.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired One-Time Password (OTP).' });
    }

    // Clear OTP fields
    purchase.otp = undefined;
    purchase.otpExpiresAt = undefined;

    // Generate a unique session ID
    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    purchase.activeSessionId = sessionId;
    purchase.sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await purchase.save();

    // Sign a session JWT
    const token = jwt.sign(
      { purchaseId: purchase._id, email: purchase.email, sessionId },
      process.env.JWT_SECRET || 'krishna_medicose_secret_7788',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      token,
      user: {
        name: purchase.name,
        email: purchase.email
      }
    });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ message: 'OTP verification failed', error: err.message });
  }
});

// 3. Fetch Secure Medicine Data (Single Session Enforced)
router.get('/data', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. Authorization token missing.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'krishna_medicose_secret_7788');
    
    // Find the purchase record
    const purchase = await BundlePurchase.findById(decoded.purchaseId);
    if (!purchase || purchase.paymentStatus !== 'paid') {
      return res.status(401).json({ message: 'Invalid token or inactive purchase status.' });
    }

    // Enforce one session at a time
    if (purchase.activeSessionId !== decoded.sessionId) {
      return res.status(401).json({ 
        code: 'SESSION_EXPIRED', 
        message: 'You have been logged out because a new session was started on another device.' 
      });
    }

    // Read and parse CSV
    const csvPath = path.resolve(__dirname, '../../assets/medicineBundle.csv');
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ message: 'Medicine dataset file not found on server.' });
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split(/\r?\n/);
    const parsedData = [];
    const rawHeaders = lines[0] ? parseCSVRow(lines[0]).map(h => h.replace(/^--- | ---$/g, '').trim()) : [];
    const mapping = autoMapHeaders(rawHeaders);

    lines.forEach((line, index) => {
      if (index === 0 || !line.trim()) return;
      const row = parseCSVRow(line);
      
      const mappedRow = {
        'CATEGORY': mapping.category ? (row[rawHeaders.indexOf(mapping.category)] || '') : '',
        'BRAND NAME': mapping.brandName ? (row[rawHeaders.indexOf(mapping.brandName)] || '') : '',
        'SALT / COMPOSITION': mapping.saltComposition ? (row[rawHeaders.indexOf(mapping.saltComposition)] || '') : '',
        'DETAILS / USAGE': mapping.detailsUsage ? (row[rawHeaders.indexOf(mapping.detailsUsage)] || '') : ''
      };
      
      // Skip boundary comments or divider headers
      if (mappedRow['CATEGORY'] && mappedRow['CATEGORY'].startsWith('====') && !mappedRow['BRAND NAME']) {
        return;
      }
      parsedData.push(mappedRow);
    });

    // Handle Search and Pagination
    const searchQuery = (req.query.search || '').trim().toLowerCase();
    let filteredData = parsedData;

    if (searchQuery) {
      filteredData = parsedData.filter(item => {
        return (item['BRAND NAME'] || '').toLowerCase().includes(searchQuery) ||
               (item['SALT / COMPOSITION'] || '').toLowerCase().includes(searchQuery) ||
               (item['CATEGORY'] || '').toLowerCase().includes(searchQuery) ||
               (item['DETAILS / USAGE'] || '').toLowerCase().includes(searchQuery);
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedRows = filteredData.slice(startIndex, endIndex);
    const totalRows = filteredData.length;
    const totalPages = Math.ceil(totalRows / limit);

    res.status(200).json({
      data: paginatedRows,
      pagination: {
        page,
        limit,
        total: totalRows,
        pages: totalPages
      }
    });
  } catch (err) {
    console.error('Data fetch access error:', err);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session token invalid or expired. Please log in again.' });
    }
    res.status(500).json({ message: 'Failed to load secure data.', error: err.message });
  }
});

// Configure multer storage to write directly to backend/assets/medicineBundle.csv
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, '../../assets'));
  },
  filename: function (req, file, cb) {
    cb(null, 'medicineBundle.csv');
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Enforce CSV only
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'), false);
    }
  }
});

// 4. Admin endpoint: Get Bundle Analytics
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const paidPurchasesCount = await BundlePurchase.countDocuments({ paymentStatus: 'paid' });
    
    // Calculate total revenue
    const revenueStats = await BundlePurchase.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueStats[0]?.total || 0;

    // Count active sessions (activeSessionId is set AND sessionExpiresAt > now)
    const activeSessionsCount = await BundlePurchase.countDocuments({
      paymentStatus: 'paid',
      activeSessionId: { $ne: null },
      sessionExpiresAt: { $gt: new Date() }
    });

    res.status(200).json({
      totalPurchases: paidPurchasesCount,
      totalRevenue,
      activeSessions: activeSessionsCount
    });
  } catch (err) {
    console.error('Failed to load bundle analytics:', err);
    res.status(500).json({ message: 'Failed to load bundle analytics', error: err.message });
  }
});

// 5. Admin endpoint: Upload Updated CSV Dataset
router.post('/upload', authMiddleware, (req, res) => {
  upload.single('file')(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please select a CSV file to upload.' });
    }

    try {
      // Find all purchasers who paid
      const purchasers = await BundlePurchase.find({ paymentStatus: 'paid' });
      
      // Send notification emails in background
      purchasers.forEach(user => {
        sendBundleUpdateNotification(user.email, user.name).catch(mailErr => {
          console.error(`Failed to send update notification to ${user.email}:`, mailErr);
        });
      });

      res.status(200).json({ 
        message: 'Medicine dataset CSV successfully updated, and notifications sent to all customers!' 
      });
    } catch (dbErr) {
      console.error('Database query error during CSV upload update notification:', dbErr);
      res.status(500).json({ message: 'Dataset updated, but failed to fetch customers for notification.' });
    }
  });
});

module.exports = router;

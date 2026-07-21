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
  sendBundleUpdateNotification,
  sendBundleUpiRequestNotification,
  sendBundleActivationCodeEmail
} = require('../services/emailService');
const { authMiddleware } = require('../middleware/authMiddleware');

const https = require('https');
const isProduction = process.env.NODE_ENV === 'production';
const CASHFREE_BASE_URL = isProduction 
  ? 'https://api.cashfree.com/pg' 
  : 'https://sandbox.cashfree.com/pg';

// Helper to make raw HTTPS requests bypassing global fetch bugs
function httpsRequest({ url, method, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        ...headers,
        'Host': urlObj.hostname
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: async () => {
            try {
              return JSON.parse(responseBody);
            } catch (e) {
              return responseBody;
            }
          },
          text: async () => responseBody
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

// Get Config Details (Amount)
router.get('/config', (req, res) => {
  const amount = Number(process.env.BUNDLE_AMOUNT || 999);
  res.status(200).json({ amount });
});

// Create Bundle Registration (Disconnected Payment Gateway)
router.post('/create-order', async (req, res) => {
  const { name, email, mobile } = req.body;
  if (!name || !email || !mobile) {
    return res.status(400).json({ message: 'Name, email, and mobile number are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Check if user already exists
    let purchase = await BundlePurchase.findOne({ email: normalizedEmail });
    if (purchase) {
      if (purchase.paymentStatus === 'paid') {
        return res.status(400).json({ 
          message: 'This email is already registered and activated. Please switch to the Secure Login tab.' 
        });
      }
      
      // If purchase exists but pending, update details and generate new order ID
      purchase.name = name;
      purchase.mobile = mobile;
      purchase.orderId = 'order_bundle_' + Date.now();
      await purchase.save();
      
      return res.status(200).json({
        status: 'pending',
        orderId: purchase.orderId,
        email: purchase.email
      });
    }

    // Create new purchase record
    const orderId = 'order_bundle_' + Date.now();
    const amount = Number(process.env.BUNDLE_AMOUNT || 999);

    purchase = new BundlePurchase({
      orderId,
      name,
      email: normalizedEmail,
      mobile,
      amount,
      paymentStatus: 'pending'
    });
    await purchase.save();

    res.status(200).json({
      status: 'pending',
      orderId,
      email: purchase.email
    });
  } catch (err) {
    console.error('Error during bundle registration:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
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

      let imResponse = await httpsRequest({
        url: `${INSTAMOJO_BASE_URL}/payment-requests/${paymentRequestId}/`,
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

        const altResponse = await httpsRequest({
          url: `${ALT_BASE_URL}/payment-requests/${paymentRequestId}/`,
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
          process.env.JWT_SECRET,
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
    const cashfreeResponse = await httpsRequest({
      url: `${CASHFREE_BASE_URL}/orders/${orderId}`,
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
        process.env.JWT_SECRET,
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
    const purchases = await BundlePurchase.find({ 
      paymentStatus: { $in: ['paid', 'pending'] } 
    }).sort({ createdAt: -1 });
    res.status(200).json(purchases);
  } catch (err) {
    console.error('Failed to fetch purchases:', err);
    res.status(500).json({ message: 'Failed to fetch purchases' });
  }
});

// Submit UPI Verification Request
router.post('/verify-upi', async (req, res) => {
  const { orderId, utr } = req.body;
  if (!orderId || !utr) {
    return res.status(400).json({ message: 'Order ID and UTR reference code are required.' });
  }

  try {
    const purchase = await BundlePurchase.findOne({ orderId });
    if (!purchase) {
      return res.status(404).json({ message: 'Order details not found.' });
    }

    purchase.paymentStatus = 'pending_verification';
    purchase.cashfreeReferenceId = utr.trim();
    await purchase.save();

    // Trigger alert email to the admin
    try {
      await sendBundleUpiRequestNotification({
        orderId: purchase.orderId,
        userName: purchase.name,
        userEmail: purchase.email,
        userMobile: purchase.mobile,
        amount: purchase.amount,
        utr: utr.trim()
      });
    } catch (mailErr) {
      console.error('Admin UPI notification email failed to trigger:', mailErr);
    }

    res.status(200).json({ status: 'PENDING_VERIFICATION', message: 'Verification request submitted successfully.' });
  } catch (err) {
    console.error('Error submitting UPI UTR verification:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// Admin endpoint: Approve UPI Purchase Request
router.post('/approve-purchase', authMiddleware, async (req, res) => {
  const { purchaseId } = req.body;
  if (!purchaseId) {
    return res.status(400).json({ message: 'Purchase ID is required' });
  }

  try {
    const purchase = await BundlePurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase record not found.' });
    }

    if (purchase.paymentStatus === 'paid') {
      return res.status(200).json({ message: 'Purchase is already marked as paid.' });
    }

    let sessionId = purchase.activeSessionId;
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
      purchase.activeSessionId = sessionId;
    }
    purchase.sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    purchase.paymentStatus = 'paid';
    purchase.paidAt = new Date();
    await purchase.save();

    // Trigger emails to customer and admin
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
      console.error('Emails failed to trigger on UPI approval:', mailErr);
    }

    res.status(200).json({ message: 'Purchase approved and access emails sent.' });
  } catch (err) {
    console.error('Error approving UPI purchase:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// Admin endpoint: Reject UPI Purchase Request
router.post('/reject-purchase', authMiddleware, async (req, res) => {
  const { purchaseId } = req.body;
  if (!purchaseId) {
    return res.status(400).json({ message: 'Purchase ID is required' });
  }

  try {
    const purchase = await BundlePurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase record not found.' });
    }

    purchase.paymentStatus = 'failed';
    await purchase.save();

    res.status(200).json({ message: 'Purchase verification request rejected.' });
  } catch (err) {
    console.error('Error rejecting purchase request:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// Submit User Activation Code
router.post('/activate', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ message: 'Email and 6-digit activation code are required.' });
  }

  try {
    const purchase = await BundlePurchase.findOne({ 
      email: email.trim().toLowerCase(), 
      activationCode: code.trim() 
    });

    if (!purchase) {
      return res.status(400).json({ message: 'Invalid activation code.' });
    }

    let sessionId = purchase.activeSessionId;
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
      purchase.activeSessionId = sessionId;
    }
    purchase.sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    purchase.paymentStatus = 'paid';
    purchase.paidAt = new Date();
    await purchase.save();

    // Trigger access emails
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
      console.error('Access verification emails failed to trigger on activation:', mailErr);
    }

    const token = jwt.sign(
      { purchaseId: purchase._id, email: purchase.email, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({ 
      status: 'SUCCESS', 
      token,
      user: {
        name: purchase.name,
        email: purchase.email
      }
    });
  } catch (err) {
    console.error('Error verifying activation code:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// Admin endpoint: Generate Activation Code
router.post('/generate-activation-code', authMiddleware, async (req, res) => {
  const { purchaseId, sendEmail } = req.body;
  if (!purchaseId) {
    return res.status(400).json({ message: 'Purchase ID is required.' });
  }

  try {
    const purchase = await BundlePurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ message: 'User record not found.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    purchase.activationCode = code;
    await purchase.save();

    if (sendEmail) {
      try {
        await sendBundleActivationCodeEmail(purchase.email, purchase.name, code);
      } catch (mailErr) {
        console.error('Failed to email activation code to user:', mailErr);
      }
    }

    res.status(200).json({ 
      message: 'Activation code generated successfully.', 
      code 
    });
  } catch (err) {
    console.error('Error generating activation code:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// Admin endpoint: Activate Manually
router.post('/activate-manually', authMiddleware, async (req, res) => {
  const { purchaseId } = req.body;
  if (!purchaseId) {
    return res.status(400).json({ message: 'Purchase ID is required.' });
  }

  try {
    const purchase = await BundlePurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ message: 'User record not found.' });
    }

    purchase.paymentStatus = 'paid';
    purchase.paidAt = new Date();
    await purchase.save();

    // Trigger access emails
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
      console.error('Access verification emails failed to trigger on manual activation:', mailErr);
    }

    res.status(200).json({ message: 'User activated manually.' });
  } catch (err) {
    console.error('Error manually activating user:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// Admin endpoint: Deactivate User (Revokes access and resets status to pending)
router.post('/deactivate', authMiddleware, async (req, res) => {
  const { purchaseId } = req.body;
  if (!purchaseId) {
    return res.status(400).json({ message: 'Purchase ID is required.' });
  }

  try {
    const purchase = await BundlePurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ message: 'User record not found.' });
    }

    purchase.paymentStatus = 'pending';
    purchase.activeSessionId = null;
    purchase.sessionExpiresAt = null;
    await purchase.save();

    res.status(200).json({ message: 'User deactivated successfully. Access has been revoked.' });
  } catch (err) {
    console.error('Error deactivating user:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
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

// Helper to get parsed, filtered medicine data and unique categories list
function getMedicineData({ searchQuery, categoryQuery, brandNameQuery, saltQuery }) {
  const csvPath = path.resolve(__dirname, '../../assets/medicineBundle.csv');
  if (!fs.existsSync(csvPath)) {
    throw new Error('Medicine dataset file not found on server.');
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

  // Get unique categories list from entire parsed data
  const categories = Array.from(new Set(parsedData.map(item => item['CATEGORY']).filter(Boolean))).sort();

  let filteredData = parsedData;

  if (categoryQuery) {
    filteredData = filteredData.filter(item => 
      (item['CATEGORY'] || '').toLowerCase() === categoryQuery.toLowerCase()
    );
  }

  if (brandNameQuery) {
    filteredData = filteredData.filter(item => 
      (item['BRAND NAME'] || '').toLowerCase().includes(brandNameQuery.toLowerCase())
    );
  }

  if (saltQuery) {
    filteredData = filteredData.filter(item => 
      (item['SALT / COMPOSITION'] || '').toLowerCase().includes(saltQuery.toLowerCase())
    );
  }

  if (searchQuery) {
    filteredData = filteredData.filter(item => {
      return (item['BRAND NAME'] || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
             (item['SALT / COMPOSITION'] || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
             (item['CATEGORY'] || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
             (item['DETAILS / USAGE'] || '').toLowerCase().includes(searchQuery.toLowerCase());
    });
  }

  return { filteredData, categories };
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
      process.env.JWT_SECRET,
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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

    // Handle Search, Filtering and Pagination
    const searchQuery = (req.query.search || '');
    const categoryQuery = (req.query.category || '');
    const brandNameQuery = (req.query.brandName || '');
    const saltQuery = (req.query.saltComposition || '');

    const { filteredData, categories } = getMedicineData({
      searchQuery,
      categoryQuery,
      brandNameQuery,
      saltQuery
    });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedRows = filteredData.slice(startIndex, endIndex);
    const totalRows = filteredData.length;
    const totalPages = Math.ceil(totalRows / limit);

    res.status(200).json({
      data: paginatedRows,
      categories,
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

// 3.5 Admin Endpoint: Fetch Medicine Data with Filters (Protected by Admin Auth Middleware)
router.get('/admin/data', authMiddleware, async (req, res) => {
  try {
    // Handle Search, Filtering and Pagination
    const searchQuery = (req.query.search || '');
    const categoryQuery = (req.query.category || '');
    const brandNameQuery = (req.query.brandName || '');
    const saltQuery = (req.query.saltComposition || '');

    const { filteredData, categories } = getMedicineData({
      searchQuery,
      categoryQuery,
      brandNameQuery,
      saltQuery
    });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedRows = filteredData.slice(startIndex, endIndex);
    const totalRows = filteredData.length;
    const totalPages = Math.ceil(totalRows / limit);

    res.status(200).json({
      data: paginatedRows,
      categories,
      pagination: {
        page,
        limit,
        total: totalRows,
        pages: totalPages
      }
    });
  } catch (err) {
    console.error('Admin data fetch error:', err);
    res.status(500).json({ message: 'Failed to load dataset for preview.', error: err.message });
  }
});

// Public preview endpoint (no auth needed)
router.get('/preview', async (req, res) => {
  try {
    const csvPath = path.resolve(__dirname, '../../assets/data.csv');
    if (!fs.existsSync(csvPath)) {
      return res.status(200).json({
        data: [
          { 'CATEGORY': 'Antibiotics', 'BRAND NAME': 'AMOXICILLIN 500', 'SALT / COMPOSITION': 'Amoxicillin 500mg', 'DETAILS / USAGE': 'Used to treat bacterial infections' },
          { 'CATEGORY': 'Analgesics', 'BRAND NAME': 'PARACETAMOL 650', 'SALT / COMPOSITION': 'Paracetamol 650mg', 'DETAILS / USAGE': 'Pain relief and fever reduction' },
          { 'CATEGORY': 'Antacids', 'BRAND NAME': 'PANTOCID 40', 'SALT / COMPOSITION': 'Pantoprazole 40mg', 'DETAILS / USAGE': 'Acidity and stomach ulcer treatment' },
          { 'CATEGORY': 'Antiallergics', 'BRAND NAME': 'CETRIZINE 10', 'SALT / COMPOSITION': 'Cetirizine 10mg', 'DETAILS / USAGE': 'Allergy symptoms relief' },
          { 'CATEGORY': 'Antidiabetic', 'BRAND NAME': 'METFORMIN 500', 'SALT / COMPOSITION': 'Metformin 500mg', 'DETAILS / USAGE': 'Blood sugar level management' }
        ]
      });
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split(/\r?\n/);
    const parsedData = [];
    const rawHeaders = lines[0] ? parseCSVRow(lines[0]).map(h => h.replace(/^--- | ---$/g, '').trim()) : [];
    const mapping = autoMapHeaders(rawHeaders);

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const row = parseCSVRow(line);
      
      const mappedRow = {
        'CATEGORY': mapping.category ? (row[rawHeaders.indexOf(mapping.category)] || '') : '',
        'BRAND NAME': mapping.brandName ? (row[rawHeaders.indexOf(mapping.brandName)] || '') : '',
        'SALT / COMPOSITION': mapping.saltComposition ? (row[rawHeaders.indexOf(mapping.saltComposition)] || '') : '',
        'DETAILS / USAGE': mapping.detailsUsage ? (row[rawHeaders.indexOf(mapping.detailsUsage)] || '') : ''
      };

      if (mappedRow['CATEGORY'] && mappedRow['CATEGORY'].startsWith('====') && !mappedRow['BRAND NAME']) {
        continue;
      }
      parsedData.push(mappedRow);
      if (parsedData.length >= 5) break;
    }

    if (parsedData.length === 0) {
      parsedData.push(
        { 'CATEGORY': 'Antibiotics', 'BRAND NAME': 'AMOXICILLIN 500', 'SALT / COMPOSITION': 'Amoxicillin 500mg', 'DETAILS / USAGE': 'Used to treat bacterial infections' }
      );
    }

    res.status(200).json({ data: parsedData });
  } catch (err) {
    console.error('Error fetching preview data:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// Logout Session (Clears active session on database)
router.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const purchase = await BundlePurchase.findById(decoded.purchaseId);
    
    if (purchase) {
      purchase.activeSessionId = null;
      purchase.sessionExpiresAt = null;
      await purchase.save();
    }

    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
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

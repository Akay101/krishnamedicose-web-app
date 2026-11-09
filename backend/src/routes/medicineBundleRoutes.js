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
  sendBundleUpdateNotification,
  sendBundleUpiRequestNotification,
  sendBundleActivationCodeEmail
} = require('../services/emailService');
const { authMiddleware, checkPermission } = require('../middleware/authMiddleware');
const { serviceAuthMiddleware } = require('../middleware/serviceAuthMiddleware');
const { randomToken, randomNumericCode, hashSecret, safeEqual, cleanText } = require('../utils/security');

const https = require('https');
const isProduction = process.env.NODE_ENV === 'production';
const CASHFREE_BASE_URL = isProduction
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

// Admin panel operations on purchases require the "bundles" permission (root admin always passes)
const bundleAdmin = [authMiddleware, checkPermission('bundles')];

const ACTIVATION_MAX_ATTEMPTS = 5;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

// Where Cashfree may send the shopper back to after payment (prevents open redirects)
const RETURN_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://krishnamedicose.in',
  'https://www.krishnamedicose.in',
  ...(process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean)
];
const DEFAULT_RETURN_URL = 'https://krishnamedicose.in/medicine-data/verify-payment?order_id={order_id}';
const resolveReturnUrl = (candidate) => {
  if (typeof candidate !== 'string') return DEFAULT_RETURN_URL;
  try {
    const url = new URL(candidate.replace('{order_id}', 'ORDER'));
    if (RETURN_ORIGINS.includes(url.origin) && url.pathname === '/medicine-data/verify-payment') {
      return candidate;
    }
  } catch {
    /* fall through */
  }
  return DEFAULT_RETURN_URL;
};

// Unguessable identifiers (order IDs used to be timestamps and could be enumerated)
const newOrderId = () => `KMB_${Date.now().toString(36)}_${randomToken(8)}`;
const newSessionId = () => `sess_${randomToken(16)}`;

const signBundleToken = (purchase, sessionId) =>
  jwt.sign(
    { purchaseId: purchase._id, sessionId, type: 'bundle_session' },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

// A purchase belongs to the signed-in account if it is linked by id or (legacy) by email
const accountPurchaseQuery = (serviceUser, extra = {}) => ({
  $or: [{ serviceUserId: serviceUser._id }, { email: serviceUser.email }],
  ...extra
});

const findAccountPurchase = (serviceUser, extra = {}) =>
  BundlePurchase.findOne(accountPurchaseQuery(serviceUser, extra)).sort({ paidAt: -1, createdAt: -1 });

const requireMember = (req, res, next) => {
  if (!req.serviceUser) {
    return res.status(403).json({ message: 'Please sign in with your Krishna Medicose account.' });
  }
  next();
};

const memberAuth = [serviceAuthMiddleware, requireMember];

const publicPurchase = (p) =>
  p
    ? {
        orderId: p.orderId,
        bundleType: p.bundleType,
        amount: p.amount,
        paymentStatus: p.paymentStatus,
        paidAt: p.paidAt,
        createdAt: p.createdAt
      }
    : null;

const sendAccessEmails = async (purchase) => {
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
    console.error('Bundle access email failed:', mailErr);
  }
};

// Mark a purchase as paid exactly once
const markPaid = async (purchase, referenceId) => {
  const newlyPaid = purchase.paymentStatus !== 'paid';
  if (newlyPaid) {
    purchase.paymentStatus = 'paid';
    purchase.paidAt = new Date();
    if (referenceId) purchase.cashfreeReferenceId = referenceId;
  }
  await purchase.save();
  if (newlyPaid) await sendAccessEmails(purchase);
  return newlyPaid;
};

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

// Get Config Details (Amount & Cashfree Mode)
router.get('/config', (req, res) => {
  const amount = Number(process.env.BUNDLE_AMOUNT || 999);
  const studentAmount = Number(process.env.STUDENTS_BUNDLE_AMOUNT || 199);
  res.status(200).json({
    amount,
    studentAmount,
    cashfreeMode: isProduction ? 'production' : 'sandbox'
  });
});

/**
 * Current account's bundle status (centralized sign-in)
 * GET /api/medicine-bundle/me
 */
router.get('/me', memberAuth, async (req, res) => {
  try {
    const paid = await findAccountPurchase(req.serviceUser, { paymentStatus: 'paid' });
    const latest = paid || (await findAccountPurchase(req.serviceUser));
    res.json({ hasAccess: Boolean(paid), purchase: publicPurchase(latest) });
  } catch (err) {
    console.error('Bundle status error:', err);
    res.status(500).json({ message: 'Unable to load your bundle status.' });
  }
});

// Create Bundle Order for the signed-in account (Cashfree Gateway Flow)
router.post('/create-order', memberAuth, async (req, res) => {
  const { returnUrl, bundleType } = req.body;
  const account = req.serviceUser;

  const selectedBundleType = bundleType === 'student' ? 'student' : 'regular';
  const targetAmount = selectedBundleType === 'student'
    ? Number(process.env.STUDENTS_BUNDLE_AMOUNT || 199)
    : Number(process.env.BUNDLE_AMOUNT || 999);

  try {
    const alreadyPaid = await findAccountPurchase(account, { paymentStatus: 'paid' });
    if (alreadyPaid) {
      return res.status(400).json({ message: 'Your account already has active access to the Medicine Data bundle.' });
    }

    // Reuse the account's open order (if any) with a fresh, unguessable order ID
    let purchase = await findAccountPurchase(account, { paymentStatus: { $in: ['pending', 'failed'] } });
    if (!purchase) {
      purchase = new BundlePurchase({ paymentStatus: 'pending' });
    }
    purchase.orderId = newOrderId();
    purchase.serviceUserId = account._id;
    purchase.name = account.name;
    purchase.email = account.email;
    purchase.mobile = account.mobile;
    purchase.amount = targetAmount;
    purchase.bundleType = selectedBundleType;
    purchase.paymentStatus = 'pending';
    await purchase.save();

    let cashfreeSuccess = false;
    let paymentSessionId = '';

    if (process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY) {
      try {
        const cashfreeResponse = await httpsRequest({
          url: `${CASHFREE_BASE_URL}/orders`,
          method: 'POST',
          headers: {
            'x-client-id': process.env.CASHFREE_APP_ID,
            'x-client-secret': process.env.CASHFREE_SECRET_KEY,
            'x-api-version': '2023-08-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            order_id: purchase.orderId,
            order_amount: purchase.amount,
            order_currency: 'INR',
            customer_details: {
              customer_id: String(account._id),
              customer_name: purchase.name,
              customer_email: purchase.email,
              customer_phone: purchase.mobile
            },
            order_meta: {
              return_url: resolveReturnUrl(returnUrl)
            }
          })
        });

        const cashfreeData = await cashfreeResponse.json();

        if (cashfreeResponse.ok && cashfreeData && cashfreeData.payment_session_id) {
          paymentSessionId = cashfreeData.payment_session_id;
          purchase.paymentSessionId = paymentSessionId;
          await purchase.save();
          cashfreeSuccess = true;
        } else {
          console.error('Cashfree order creation returned non-ok status or missing session:', cashfreeData);
        }
      } catch (cfErr) {
        console.error('Failed to initiate Cashfree payment:', cfErr);
      }
    } else {
      console.warn('Cashfree credentials missing in environment variables. Falling back to manual flow.');
    }

    if (cashfreeSuccess) {
      return res.status(200).json({
        status: 'success',
        paymentSessionId,
        orderId: purchase.orderId,
        email: purchase.email
      });
    }
    return res.status(200).json({
      status: 'pending',
      orderId: purchase.orderId,
      email: purchase.email,
      error: 'Online payment gateway is not available right now. Please use UPI and submit your UTR for manual activation.'
    });
  } catch (err) {
    console.error('Error during bundle registration:', err);
    res.status(500).json({ message: 'Unable to create your order right now.' });
  }
});

// Verify Cashfree or Instamojo Payment (only for the signed-in owner of the order)
router.post('/verify-payment', memberAuth, async (req, res) => {
  const { orderId, paymentId, paymentRequestId } = req.body;
  if ((typeof orderId !== 'string' || !orderId) && (typeof paymentRequestId !== 'string' || !paymentRequestId)) {
    return res.status(400).json({ message: 'Order ID or Payment Request ID is required' });
  }

  const issueSession = async (purchase) => {
    purchase.activeSessionId = newSessionId();
    purchase.sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await purchase.save();
    return signBundleToken(purchase, purchase.activeSessionId);
  };

  // Handle Instamojo verification
  if (paymentRequestId) {
    if (!/^[a-zA-Z0-9]{8,64}$/.test(paymentRequestId)) {
      return res.status(400).json({ message: 'Invalid payment reference.' });
    }
    try {
      const purchase = await BundlePurchase.findOne(
        accountPurchaseQuery(req.serviceUser, { cashfreeReferenceId: paymentRequestId })
      );
      if (!purchase) {
        return res.status(404).json({ message: 'Order record not found for your account' });
      }

      const INSTAMOJO_BASE_URL = isProduction
        ? 'https://www.instamojo.com/api/1.1'
        : 'https://test.instamojo.com/api/1.1';

      const imResponse = await httpsRequest({
        url: `${INSTAMOJO_BASE_URL}/payment-requests/${paymentRequestId}/`,
        method: 'GET',
        headers: {
          'X-Api-Key': process.env.INSTAMOJO_PRIVATE_API_KEY,
          'X-Auth-Token': process.env.INSTAMOJO_PRIVATE_AUTH_TOKEN
        }
      });
      const imData = await imResponse.json();

      if (!imResponse.ok) {
        console.error('Instamojo verification error:', imData);
        return res.status(502).json({ message: 'Failed to verify payment status with Instamojo' });
      }

      const isPaid =
        imData.payment_request?.status === 'Completed' &&
        Number(imData.payment_request?.amount) >= Number(purchase.amount);

      if (isPaid) {
        await markPaid(purchase, typeof paymentId === 'string' ? paymentId.slice(0, 64) : undefined);
        const token = await issueSession(purchase);
        return res.status(200).json({
          status: 'SUCCESS',
          purchase: publicPurchase(purchase),
          token,
          user: { name: purchase.name, email: purchase.email }
        });
      }

      if (purchase.paymentStatus !== 'paid') {
        purchase.paymentStatus = 'failed';
        await purchase.save();
      }
      return res.status(200).json({ status: 'FAILED', message: 'Payment was not successful' });
    } catch (err) {
      console.error('Error verifying Instamojo payment:', err);
      return res.status(500).json({ message: 'Unable to verify payment right now.' });
    }
  }

  // Handle Cashfree verification
  try {
    const purchase = await BundlePurchase.findOne(accountPurchaseQuery(req.serviceUser, { orderId }));
    if (!purchase) {
      return res.status(404).json({ message: 'Order record not found for your account' });
    }

    const cashfreeResponse = await httpsRequest({
      url: `${CASHFREE_BASE_URL}/orders/${encodeURIComponent(orderId)}`,
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
      return res.status(502).json({ message: 'Failed to verify payment status with Cashfree' });
    }

    // Trust only the gateway: status, order id and amount must all match our record
    const isPaid =
      cashfreeData.order_status === 'PAID' &&
      cashfreeData.order_id === purchase.orderId &&
      Number(cashfreeData.order_amount) >= Number(purchase.amount);

    if (isPaid) {
      await markPaid(purchase, cashfreeData.cf_order_id ? String(cashfreeData.cf_order_id) : '');
      const token = await issueSession(purchase);
      return res.status(200).json({
        status: 'SUCCESS',
        purchase: publicPurchase(purchase),
        token,
        user: { name: purchase.name, email: purchase.email }
      });
    }

    if (purchase.paymentStatus !== 'paid') {
      purchase.paymentStatus = 'failed';
      await purchase.save();
    }
    return res.status(200).json({ status: 'FAILED', message: 'Payment was not successful' });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ message: 'Unable to verify payment right now.' });
  }
});

// Admin endpoint: List purchases
router.get('/purchases', bundleAdmin, async (req, res) => {
  try {
    const purchases = await BundlePurchase.find({
      paymentStatus: { $in: ['paid', 'pending', 'pending_verification'] }
    })
      .select('-otp -activationCode -activeSessionId')
      .sort({ createdAt: -1 });
    res.status(200).json(purchases);
  } catch (err) {
    console.error('Failed to fetch purchases:', err);
    res.status(500).json({ message: 'Failed to fetch purchases' });
  }
});

// Submit UPI Verification Request (signed-in owner of the order only)
router.post('/verify-upi', memberAuth, async (req, res) => {
  const { orderId } = req.body;
  const utr = cleanText(req.body.utr, 40);
  if (typeof orderId !== 'string' || !utr || !/^[A-Za-z0-9]{6,40}$/.test(utr)) {
    return res.status(400).json({ message: 'Order ID and a valid UTR reference code are required.' });
  }

  try {
    const purchase = await BundlePurchase.findOne(accountPurchaseQuery(req.serviceUser, { orderId }));
    if (!purchase) {
      return res.status(404).json({ message: 'Order details not found.' });
    }
    if (purchase.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'This order is already active.' });
    }

    purchase.paymentStatus = 'pending_verification';
    purchase.cashfreeReferenceId = utr;
    await purchase.save();

    try {
      await sendBundleUpiRequestNotification({
        orderId: purchase.orderId,
        userName: purchase.name,
        userEmail: purchase.email,
        userMobile: purchase.mobile,
        amount: purchase.amount,
        utr
      });
    } catch (mailErr) {
      console.error('Admin UPI notification email failed to trigger:', mailErr);
    }

    res.status(200).json({ status: 'PENDING_VERIFICATION', message: 'Verification request submitted successfully.' });
  } catch (err) {
    console.error('Error submitting UPI UTR verification:', err);
    res.status(500).json({ message: 'Unable to submit verification request.' });
  }
});

// Admin endpoint: Approve UPI Purchase Request
router.post('/approve-purchase', bundleAdmin, async (req, res) => {
  const { purchaseId } = req.body;
  if (typeof purchaseId !== 'string') {
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
    await markPaid(purchase);
    res.status(200).json({ message: 'Purchase approved and access emails sent.' });
  } catch (err) {
    console.error('Error approving UPI purchase:', err);
    res.status(500).json({ message: 'Unable to approve purchase.' });
  }
});

// Admin endpoint: Reject UPI Purchase Request
router.post('/reject-purchase', bundleAdmin, async (req, res) => {
  const { purchaseId } = req.body;
  if (typeof purchaseId !== 'string') {
    return res.status(400).json({ message: 'Purchase ID is required' });
  }
  try {
    const purchase = await BundlePurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase record not found.' });
    }
    purchase.paymentStatus = 'failed';
    purchase.activeSessionId = null;
    purchase.sessionExpiresAt = null;
    await purchase.save();
    res.status(200).json({ message: 'Purchase verification request rejected.' });
  } catch (err) {
    console.error('Error rejecting purchase request:', err);
    res.status(500).json({ message: 'Unable to reject purchase.' });
  }
});

// Redeem an admin-issued activation code on the signed-in account
router.post('/activate', memberAuth, async (req, res) => {
  const code = String(req.body.code || '').replace(/\D/g, '');
  if (code.length !== 6) {
    return res.status(400).json({ message: 'Please enter the 6-digit activation code.' });
  }

  try {
    const purchase = await BundlePurchase.findOne(
      accountPurchaseQuery(req.serviceUser, { activationCode: { $exists: true, $ne: null } })
    );
    if (!purchase) {
      return res.status(400).json({ message: 'Invalid activation code.' });
    }

    if ((purchase.activationAttempts || 0) >= ACTIVATION_MAX_ATTEMPTS) {
      purchase.activationCode = null;
      await purchase.save();
      return res.status(429).json({ message: 'Too many incorrect attempts. Please ask support for a new activation code.' });
    }

    if (!safeEqual(hashSecret(code), purchase.activationCode)) {
      purchase.activationAttempts = (purchase.activationAttempts || 0) + 1;
      await purchase.save();
      return res.status(400).json({ message: 'Invalid activation code.' });
    }

    // Single-use code
    purchase.activationCode = null;
    purchase.activationAttempts = 0;
    purchase.serviceUserId = req.serviceUser._id;
    await markPaid(purchase);

    purchase.activeSessionId = newSessionId();
    purchase.sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await purchase.save();

    res.status(200).json({
      status: 'SUCCESS',
      token: signBundleToken(purchase, purchase.activeSessionId),
      user: { name: purchase.name, email: purchase.email }
    });
  } catch (err) {
    console.error('Error verifying activation code:', err);
    res.status(500).json({ message: 'Unable to verify activation code.' });
  }
});

// Admin endpoint: Generate Activation Code
router.post('/generate-activation-code', bundleAdmin, async (req, res) => {
  const { purchaseId, sendEmail } = req.body;
  if (typeof purchaseId !== 'string') {
    return res.status(400).json({ message: 'Purchase ID is required.' });
  }
  try {
    const purchase = await BundlePurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ message: 'User record not found.' });
    }

    const code = randomNumericCode(6);
    purchase.activationCode = hashSecret(code); // stored hashed, shown to the admin once
    purchase.activationAttempts = 0;
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
    res.status(500).json({ message: 'Unable to generate activation code.' });
  }
});

// Admin endpoint: Activate Manually
router.post('/activate-manually', bundleAdmin, async (req, res) => {
  const { purchaseId } = req.body;
  if (typeof purchaseId !== 'string') {
    return res.status(400).json({ message: 'Purchase ID is required.' });
  }
  try {
    const purchase = await BundlePurchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ message: 'User record not found.' });
    }
    await markPaid(purchase);
    res.status(200).json({ message: 'User activated manually.' });
  } catch (err) {
    console.error('Error manually activating user:', err);
    res.status(500).json({ message: 'Unable to activate user.' });
  }
});

// Admin endpoint: Deactivate User (Revokes access and resets status to pending)
router.post('/deactivate', bundleAdmin, async (req, res) => {
  const { purchaseId } = req.body;
  if (typeof purchaseId !== 'string') {
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
    res.status(500).json({ message: 'Unable to deactivate user.' });
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


/**
 * Open a secure dataset session for the signed-in account.
 * Replaces the old separate e-mail OTP login: the account sign-in (password + OTP)
 * is the single gate. Starting a session on a new device ends the previous one.
 * POST /api/medicine-bundle/session
 */
router.post('/session', memberAuth, async (req, res) => {
  try {
    const purchase = await findAccountPurchase(req.serviceUser, { paymentStatus: 'paid' });
    if (!purchase) {
      return res.status(403).json({ code: 'NO_ACCESS', message: 'No active Medicine Data purchase on this account.' });
    }

    if (!purchase.serviceUserId) purchase.serviceUserId = req.serviceUser._id;
    purchase.activeSessionId = newSessionId();
    purchase.sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await purchase.save();

    res.status(200).json({
      token: signBundleToken(purchase, purchase.activeSessionId),
      user: { name: purchase.name, email: purchase.email },
      purchase: publicPurchase(purchase)
    });
  } catch (err) {
    console.error('Bundle session error:', err);
    res.status(500).json({ message: 'Unable to open a secure session.' });
  }
});

// Retired endpoints of the old standalone bundle login
router.post(['/login', '/verify-otp'], (req, res) =>
  res.status(410).json({ message: 'Please sign in with your Krishna Medicose account to access the Medicine Data bundle.' })
);

// Fetch Secure Medicine Data (Single Session Enforced)
router.get('/data', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. Authorization token missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'bundle_session') {
      return res.status(401).json({ message: 'Session token invalid or expired. Please log in again.' });
    }

    const purchase = await BundlePurchase.findById(decoded.purchaseId);
    if (!purchase || purchase.paymentStatus !== 'paid') {
      return res.status(401).json({ message: 'Invalid token or inactive purchase status.' });
    }

    // Enforce one session at a time
    if (!purchase.activeSessionId || purchase.activeSessionId !== decoded.sessionId) {
      return res.status(401).json({
        code: 'SESSION_EXPIRED',
        message: 'You have been logged out because a new session was started on another device.'
      });
    }

    const { filteredData, categories } = getMedicineData({
      searchQuery: cleanText(req.query.search, 100),
      categoryQuery: cleanText(req.query.category, 100),
      brandNameQuery: cleanText(req.query.brandName, 100),
      saltQuery: cleanText(req.query.saltComposition, 100)
    });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const startIndex = (page - 1) * limit;
    const paginatedRows = filteredData.slice(startIndex, startIndex + limit);
    const totalRows = filteredData.length;

    res.status(200).json({
      data: paginatedRows,
      categories,
      pagination: { page, limit, total: totalRows, pages: Math.ceil(totalRows / limit) }
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session token invalid or expired. Please log in again.' });
    }
    console.error('Data fetch access error:', err);
    res.status(500).json({ message: 'Failed to load secure data.' });
  }
});

// Admin Endpoint: Fetch Medicine Data with Filters
router.get('/admin/data', bundleAdmin, async (req, res) => {
  try {
    const { filteredData, categories } = getMedicineData({
      searchQuery: cleanText(req.query.search, 100),
      categoryQuery: cleanText(req.query.category, 100),
      brandNameQuery: cleanText(req.query.brandName, 100),
      saltQuery: cleanText(req.query.saltComposition, 100)
    });
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const startIndex = (page - 1) * limit;
    const totalRows = filteredData.length;
    res.status(200).json({
      data: filteredData.slice(startIndex, startIndex + limit),
      categories,
      pagination: { page, limit, total: totalRows, pages: Math.ceil(totalRows / limit) }
    });
  } catch (err) {
    console.error('Admin data fetch error:', err);
    res.status(500).json({ message: 'Failed to load dataset for preview.' });
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
    res.status(500).json({ message: 'Unable to load preview data.' });
  }
});


// Logout Session (Clears active session on database)
router.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      if (decoded.type === 'bundle_session') {
        await BundlePurchase.updateOne(
          { _id: decoded.purchaseId, activeSessionId: decoded.sessionId },
          { $set: { activeSessionId: null, sessionExpiresAt: null } }
        );
      }
    } catch {
      /* already expired - nothing to clear */
    }
  }
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
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
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
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
router.get('/analytics', bundleAdmin, async (req, res) => {
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
router.post('/upload', bundleAdmin, (req, res) => {
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

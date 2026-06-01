const express = require('express');
const router = express.Router();
const BundlePurchase = require('../models/BundlePurchase');
const { sendBundlePurchaseConfirmation, sendBundleAdminNotification } = require('../services/emailService');
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
  const returnUrl = `${origin.replace(/\/$/, '')}/medicine-data/verify-payment?order_id={order_id}`;

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

    if (!cashfreeResponse.ok) {
      console.error('Cashfree order creation error:', cashfreeData);
      return res.status(cashfreeResponse.status).json({
        message: 'Failed to initiate payment session with Cashfree',
        error: cashfreeData
      });
    }

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

    res.status(200).json({
      orderId,
      paymentSessionId: cashfreeData.payment_session_id,
      amount,
      isProduction
    });
  } catch (err) {
    console.error('Error creating bundle order:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// Verify Cashfree Payment
router.post('/verify-payment', async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ message: 'Order ID is required' });
  }

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
      if (purchase.paymentStatus !== 'paid') {
        purchase.paymentStatus = 'paid';
        purchase.paidAt = new Date();
        purchase.cashfreeReferenceId = cashfreeData.cf_order_id || '';
        await purchase.save();

        // Trigger emails
        try {
          await sendBundlePurchaseConfirmation(purchase.email, {
            orderId: purchase.orderId,
            userName: purchase.name,
            amount: purchase.amount,
            bundleLink: process.env.BUNDLE_LINK || 'https://drive.google.com'
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
        bundleLink: process.env.BUNDLE_LINK || 'https://drive.google.com'
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

module.exports = router;

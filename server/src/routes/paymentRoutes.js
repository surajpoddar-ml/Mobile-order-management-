import express from 'express';
import jwt from 'jsonwebtoken';
import { queryGet } from '../database/db.js';
import {
  createDynamicPaymentAttempt,
  getPaymentAttemptStatus,
  cancelPaymentAttempt,
  getUpiConfig
} from '../services/paymentService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mws_eagle_mobile_parts_super_secret_jwt_key_2026_auth_system';

/**
 * Optional token extraction helper (works for both logged-in users and guest/checkout sessions)
 */
const extractUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.id) {
        const user = await queryGet('SELECT * FROM users WHERE id = ?', [decoded.id]);
        if (user && user.accountStatus === 'Active') {
          return user;
        }
      }
    } catch (e) {
      // Token invalid or expired, continue as guest/Customer
    }
  }
  return null;
};

/**
 * 1. POST /api/payments/create-qr
 * Generates an order-specific dynamic UPI QR code with server-verified amount
 */
router.post('/create-qr', async (req, res) => {
  try {
    const { items, orderNumber } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items provided for payment calculation.'
      });
    }

    const user = await extractUser(req);
    const result = await createDynamicPaymentAttempt({
      items,
      user,
      orderNumber: orderNumber || null
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Dynamic UPI QR generation error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Unable to generate dynamic UPI QR payment.'
    });
  }
});

/**
 * 2. GET /api/payments/status/:paymentReference
 * Checks current status of a payment attempt
 */
router.get('/status/:paymentReference', async (req, res) => {
  try {
    const { paymentReference } = req.params;
    const payment = await getPaymentAttemptStatus(paymentReference);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment attempt not found.'
      });
    }

    return res.status(200).json({
      success: true,
      payment: {
        paymentReference: payment.paymentReference,
        orderNumber: payment.orderNumber,
        amount: payment.amount,
        currency: payment.currency,
        payeeUpiId: payment.payeeUpiId,
        payeeName: payment.payeeName,
        status: payment.status,
        expiresAt: payment.expiresAt,
        createdDate: payment.createdDate
      }
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment status.'
    });
  }
});

/**
 * 3. POST /api/payments/cancel
 * Cancels a pending payment session
 */
router.post('/cancel', async (req, res) => {
  try {
    const { paymentReference } = req.body;
    if (!paymentReference) {
      return res.status(400).json({ success: false, message: 'Payment reference is required.' });
    }

    const cancelled = await cancelPaymentAttempt(paymentReference);
    return res.status(200).json({
      success: true,
      cancelled,
      message: cancelled ? 'Payment attempt cancelled.' : 'Payment could not be cancelled or was already resolved.'
    });
  } catch (error) {
    console.error('Error cancelling payment attempt:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel payment attempt.' });
  }
});

/**
 * 4. GET /api/payments/config
 * Returns public verified UPI payee configuration
 */
router.get('/config', (req, res) => {
  const config = getUpiConfig();
  return res.status(200).json({
    success: true,
    payeeUpiId: config.payeeUpiId,
    payeeName: config.payeeName,
    currency: config.currency
  });
});

export default router;

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { queryAll, queryGet, queryRun } from '../database/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { createNotification } from '../services/notificationService.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mobile_parts_super_secret_jwt_key_2026_auth_system';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const paymentUploadDir = path.resolve(__dirname, '../../uploads/payments');

// Ensure payments upload directory exists
if (!fs.existsSync(paymentUploadDir)) {
  fs.mkdirSync(paymentUploadDir, { recursive: true });
}

// Multer storage for payment screenshot proofs
const paymentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, paymentUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const unique = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    cb(null, `proof_${cleanBase}_${unique}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /\.(jpg|jpeg|png|webp|gif|pdf)$/i;
  if (allowed.test(path.extname(file.originalname)) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, WEBP) are supported for payment screenshots.'));
  }
};

const upload = multer({
  storage: paymentStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
  fileFilter
});

/**
 * 0. Upload Payment Screenshot Proof
 */
router.post('/upload-payment-proof', verifyToken, upload.single('paymentProof'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No screenshot file uploaded.' });
    }
    const fileUrl = `/uploads/payments/${req.file.filename}`;
    return res.status(200).json({
      success: true,
      message: 'Payment screenshot uploaded successfully.',
      fileUrl,
      fileName: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload payment proof.' });
  }
});

/**
 * 1. Create a New Order
 * Requires user authentication via verifyToken middleware (Customer or Distributor)
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      district,
      city,
      state,
      postalCode,
      items,
      totalAmount,
      paymentMethod = 'Cash on Delivery',
      transactionId = null,
      paymentScreenshot = null,
      notes = ''
    } = req.body;

    // Check mandatory fields (including District)
    if (!customerName || !customerEmail || !customerPhone || !shippingAddress || !district || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order details (Full Name, Email, Phone, Delivery Address, District, and Items are required).'
      });
    }

    const isOnlinePayment = paymentMethod.includes('Online') || paymentMethod.includes('QR') || paymentMethod.includes('UPI');
    let paymentStatus = isOnlinePayment ? 'Pending Verification' : 'Pending (Cash on Delivery)';
    if (paymentMethod.includes('Wholesale Invoice')) {
      paymentStatus = 'Invoice Net 30';
    }

    const userId = req.user.userId;
    const userType = req.user.userType;
    const orderNumber = `MWS-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();
    const itemsJson = typeof items === 'string' ? items : JSON.stringify(items);

    const result = await queryRun(
      `INSERT INTO orders (
        orderNumber, userId, customerName, customerEmail, customerPhone, userType,
        shippingAddress, district, city, state, postalCode, items, totalAmount, paymentMethod,
        transactionId, paymentScreenshot, paymentStatus, orderStatus, notes, createdDate, updatedDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?)`,
      [
        orderNumber,
        userId,
        customerName.trim(),
        customerEmail.trim().toLowerCase(),
        customerPhone.trim(),
        userType,
        shippingAddress.trim(),
        district.trim(),
        city ? city.trim() : '',
        state ? state.trim() : '',
        postalCode ? postalCode.trim() : '',
        itemsJson,
        Number(totalAmount) || 0,
        paymentMethod,
        transactionId ? transactionId.trim() : null,
        paymentScreenshot || null,
        paymentStatus,
        notes || '',
        now,
        now
      ]
    );

    const createdOrder = await queryGet('SELECT * FROM orders WHERE id = ?', [result.lastID]);
    if (createdOrder) {
      try {
        createdOrder.items = JSON.parse(createdOrder.items);
      } catch (e) {}
    }

    // 1. Notify Admin of New Order (with deduplication)
    await createNotification({
      recipientId: 'ADMIN',
      recipientRole: 'Admin',
      title: `🛒 New Order: ${orderNumber}`,
      message: `${customerName} (${userType}) placed order for ₹${Number(totalAmount).toLocaleString()} via ${paymentMethod}.`,
      type: 'order_created',
      entityId: orderNumber,
      linkUrl: '/admin?tab=orders',
      dedupKey: `order_created_${orderNumber}_ADMIN`
    });

    // 2. Notify Customer or Distributor of Successful Placement
    await createNotification({
      recipientId: userId || customerEmail,
      recipientRole: userType,
      title: `Order Confirmed: ${orderNumber}`,
      message: `Your order for ₹${Number(totalAmount).toLocaleString()} has been received and is being prepared.`,
      type: 'order_created',
      entityId: orderNumber,
      linkUrl: userType === 'Distributor' ? '/distributor?tab=orders' : '/customer?tab=orders',
      dedupKey: `order_created_${orderNumber}_USER`
    });

    // 3. If online payment was used with proof, notify Admin to verify
    if (isOnlinePayment && (transactionId || paymentScreenshot)) {
      await createNotification({
        recipientId: 'ADMIN',
        recipientRole: 'Admin',
        title: `💳 Payment Proof Submitted`,
        message: `Payment proof received for ${orderNumber} (Txn ID: ${transactionId || 'Uploaded Screenshot'}). Requires approval.`,
        type: 'payment_submitted',
        entityId: orderNumber,
        linkUrl: '/admin?tab=orders',
        dedupKey: `payment_submitted_${orderNumber}_ADMIN`
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      orderNumber,
      order: createdOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ success: false, message: 'Failed to create order.' });
  }
});

/**
 * 2. Get My Orders (Logged-in user)
 */
router.get('/my-orders', verifyToken, async (req, res) => {
  try {
    const orders = await queryAll(
      'SELECT * FROM orders WHERE userId = ? OR customerEmail = ? ORDER BY id DESC',
      [req.user.userId, req.user.email]
    );

    const parsedOrders = orders.map(ord => {
      let items = [];
      try {
        items = JSON.parse(ord.items);
      } catch (e) {}
      return { ...ord, items };
    });

    return res.status(200).json({
      success: true,
      count: parsedOrders.length,
      orders: parsedOrders
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch your orders.' });
  }
});

/**
 * 3. Track Order by Order Number or Phone / Email (Public)
 */
router.get('/track/:query', async (req, res) => {
  try {
    const q = req.params.query.trim();
    const orders = await queryAll(
      'SELECT * FROM orders WHERE orderNumber = ? OR customerPhone = ? OR customerEmail = ? ORDER BY id DESC',
      [q, q, q.toLowerCase()]
    );

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No orders found matching this order number, phone, or email.'
      });
    }

    const parsed = orders.map(o => {
      let items = [];
      try {
        items = JSON.parse(o.items);
      } catch (e) {}
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        userType: o.userType,
        orderStatus: o.orderStatus,
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        createdDate: o.createdDate,
        shippingAddress: o.shippingAddress,
        items
      };
    });

    return res.status(200).json({
      success: true,
      orders: parsed
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    return res.status(500).json({ success: false, message: 'Failed to track order.' });
  }
});

/**
 * 4. Admin Endpoint: Get All Orders
 */
router.get('/admin/all', verifyToken, requireAdmin, async (req, res) => {
  try {
    const orders = await queryAll('SELECT * FROM orders ORDER BY id DESC');

    const parsedOrders = orders.map(ord => {
      let items = [];
      try {
        items = JSON.parse(ord.items);
      } catch (e) {}
      return { ...ord, items };
    });

    return res.status(200).json({
      success: true,
      count: parsedOrders.length,
      orders: parsedOrders
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch all orders.' });
  }
});

/**
 * 5. Admin Endpoint: Update Order Status & Payment Status
 */
router.put('/admin/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const validStatuses = ['Pending', 'Processing', 'Dispatched', 'Delivered', 'Cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const existing = await queryGet('SELECT * FROM orders WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const now = new Date().toISOString();
    const newStatus = status || existing.orderStatus;
    const newPaymentStatus = paymentStatus || existing.paymentStatus;

    await queryRun(
      'UPDATE orders SET orderStatus = ?, paymentStatus = ?, updatedDate = ? WHERE id = ?',
      [newStatus, newPaymentStatus, now, id]
    );

    const updatedOrder = await queryGet('SELECT * FROM orders WHERE id = ?', [id]);
    try {
      updatedOrder.items = JSON.parse(updatedOrder.items);
    } catch (e) {}

    // Notify customer/distributor of order status update if status changed
    if (status && status !== existing.orderStatus) {
      await createNotification({
        recipientId: existing.userId || existing.customerEmail,
        recipientRole: existing.userType,
        title: `📦 Order ${newStatus}`,
        message: `Your order ${existing.orderNumber} status has been updated to "${newStatus}".`,
        type: 'order_status',
        entityId: existing.orderNumber,
        linkUrl: existing.userType === 'Distributor' ? '/distributor?tab=orders' : '/customer?tab=orders',
        dedupKey: `order_status_${newStatus}_${existing.orderNumber}`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to "${newStatus}" successfully.`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
});

/**
 * 6. Admin Endpoint: Approve Online Payment Proof
 */
router.put('/admin/:id/approve-payment', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryGet('SELECT * FROM orders WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const now = new Date().toISOString();
    await queryRun(
      "UPDATE orders SET paymentStatus = 'Verified & Approved', orderStatus = 'Processing', updatedDate = ? WHERE id = ?",
      [now, id]
    );

    const updatedOrder = await queryGet('SELECT * FROM orders WHERE id = ?', [id]);
    try {
      updatedOrder.items = JSON.parse(updatedOrder.items);
    } catch (e) {}

    // Notify Customer / Distributor of approved payment
    await createNotification({
      recipientId: existing.userId || existing.customerEmail,
      recipientRole: existing.userType,
      title: `✅ Payment Verified & Approved`,
      message: `Your payment for order ${existing.orderNumber} has been verified and approved by Admin. Your order is now Processing.`,
      type: 'payment_approved',
      entityId: existing.orderNumber,
      linkUrl: existing.userType === 'Distributor' ? '/distributor?tab=orders' : '/customer?tab=orders',
      dedupKey: `payment_approved_${existing.orderNumber}`
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and approved! Order moved to Processing.',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error approving payment:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve payment.' });
  }
});

/**
 * 7. Admin Endpoint: Reject Online Payment Proof
 */
router.put('/admin/:id/reject-payment', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Invalid payment proof / transaction mismatch' } = req.body;
    const existing = await queryGet('SELECT * FROM orders WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const now = new Date().toISOString();
    await queryRun(
      "UPDATE orders SET paymentStatus = 'Payment Rejected', orderStatus = 'Cancelled', notes = ?, updatedDate = ? WHERE id = ?",
      [`Payment Rejected: ${reason}`, now, id]
    );

    const updatedOrder = await queryGet('SELECT * FROM orders WHERE id = ?', [id]);
    try {
      updatedOrder.items = JSON.parse(updatedOrder.items);
    } catch (e) {}

    // Notify Customer / Distributor of rejected payment
    await createNotification({
      recipientId: existing.userId || existing.customerEmail,
      recipientRole: existing.userType,
      title: `❌ Payment Proof Rejected`,
      message: `Payment proof for order ${existing.orderNumber} was rejected: "${reason}". The order has been cancelled.`,
      type: 'payment_rejected',
      entityId: existing.orderNumber,
      linkUrl: existing.userType === 'Distributor' ? '/distributor?tab=orders' : '/customer?tab=orders',
      dedupKey: `payment_rejected_${existing.orderNumber}_${Date.now()}`
    });

    return res.status(200).json({
      success: true,
      message: 'Payment rejected. Order marked as Cancelled.',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject payment.' });
  }
});

export default router;

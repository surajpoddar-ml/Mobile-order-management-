import express from 'express';
import { queryAll, queryGet, queryRun } from '../database/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mws_eagle_mobile_parts_super_secret_jwt_key_2026_auth_system';

/**
 * 1. Create a New Order
 * Accessible to authenticated users and guest checkouts
 */
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      city,
      state,
      postalCode,
      items,
      totalAmount,
      paymentMethod = 'Cash on Delivery',
      notes = ''
    } = req.body;

    if (!customerName || !customerEmail || !customerPhone || !shippingAddress || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order details (Name, Email, Phone, Address, and Items are required).'
      });
    }

    // Attempt to identify user session from token if present
    let userId = null;
    let userType = 'Customer';

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await queryGet('SELECT id, userId, userType, fullName FROM users WHERE id = ?', [decoded.id]);
        if (user) {
          userId = user.userId;
          userType = user.userType;
        }
      } catch (err) {
        // Continue as guest customer
      }
    }

    const orderNumber = `MWS-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();
    const itemsJson = typeof items === 'string' ? items : JSON.stringify(items);

    const result = await queryRun(
      `INSERT INTO orders (
        orderNumber, userId, customerName, customerEmail, customerPhone, userType,
        shippingAddress, city, state, postalCode, items, totalAmount, paymentMethod,
        orderStatus, notes, createdDate, updatedDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?)`,
      [
        orderNumber,
        userId,
        customerName.trim(),
        customerEmail.trim().toLowerCase(),
        customerPhone.trim(),
        userType,
        shippingAddress.trim(),
        city || '',
        state || '',
        postalCode || '',
        itemsJson,
        Number(totalAmount) || 0,
        paymentMethod,
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
 * 5. Admin Endpoint: Update Order Status
 */
router.put('/admin/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Processing', 'Dispatched', 'Delivered', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
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
    await queryRun('UPDATE orders SET orderStatus = ?, updatedDate = ? WHERE id = ?', [status, now, id]);

    const updatedOrder = await queryGet('SELECT * FROM orders WHERE id = ?', [id]);
    try {
      updatedOrder.items = JSON.parse(updatedOrder.items);
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: `Order status updated to "${status}" successfully.`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
});

export default router;

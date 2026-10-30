import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { queryGet, queryAll, queryRun } from '../database/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mobile_parts_super_secret_jwt_key_2026_auth_system';

/**
 * Robust date calculation helper for warranty expiration.
 * Correctly adds months or years and handles end-of-month adjustments.
 */
export const calculateWarrantyEndDate = (startDateStr, duration, unit = 'Months') => {
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) {
    throw new Error('Invalid start date provided.');
  }

  const end = new Date(start.getTime());
  const numDuration = parseInt(duration, 10);
  if (isNaN(numDuration) || numDuration <= 0) {
    throw new Error('Invalid warranty duration.');
  }

  const unitLower = String(unit).toLowerCase().trim();
  if (unitLower.startsWith('year')) {
    end.setFullYear(end.getFullYear() + numDuration);
  } else {
    // Months calculation
    const targetMonth = end.getMonth() + numDuration;
    const originalDate = end.getDate();
    end.setMonth(targetMonth);

    // Correct for month length differences (e.g. Oct 31 + 6 months -> Apr 30)
    if (end.getDate() !== originalDate) {
      end.setDate(0);
    }
  }

  return end.toISOString();
};

/**
 * Authoritative effective status calculation
 */
export const getEffectiveStatus = (warranty) => {
  if (!warranty) return 'Unknown';
  if (warranty.status === 'Suspended') return 'Suspended';
  if (warranty.status === 'Not Activated' || !warranty.warranty_start_date) {
    return 'Not Activated';
  }
  if (warranty.warranty_end_date) {
    const end = new Date(warranty.warranty_end_date);
    if (end.getTime() < Date.now()) {
      return 'Expired';
    }
  }
  return 'Active';
};

/**
 * Extract optional user from Bearer token
 */
const getOptionalUser = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) return null;
    const user = await queryGet('SELECT id, userId, fullName, email, userType FROM users WHERE id = ?', [decoded.id]);
    return user || null;
  } catch (err) {
    return null;
  }
};

/**
 * Mask sensitive email (e.g., j***n@example.com) for safe privacy presentation
 */
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '******';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(4, local.length - 2))}${local[local.length - 1]}@${domain}`;
};

// ============================================================================
// ============================= ADMIN ROUTER =================================
// ============================================================================

export const adminWarrantyRouter = express.Router();
adminWarrantyRouter.use(verifyToken, requireAdmin);

/**
 * POST /api/admin/warranties
 * Create a new Warranty QR record
 */
adminWarrantyRouter.post('/', async (req, res) => {
  try {
    const {
      productId,
      productCode,
      brand,
      model,
      warrantyType = 'Warranty',
      warrantyDuration,
      warrantyDurationUnit = 'Months',
      description,
      purchaseInfo,
      terms
    } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product selection is required.' });
    }

    const product = await queryGet('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Selected product not found.' });
    }

    const cleanProductCode = (productCode || '').trim();
    if (!cleanProductCode) {
      return res.status(400).json({ success: false, message: 'Serial number or unique product code is required.' });
    }

    // Duplicate check: Check if same product serial already has an active warranty
    const existingCode = await queryGet(
      'SELECT id, warranty_code, status FROM product_warranties WHERE product_code = ? AND status != "Expired"',
      [cleanProductCode]
    );
    if (existingCode) {
      return res.status(409).json({
        success: false,
        message: `A warranty record (${existingCode.warranty_code}) already exists for product serial "${cleanProductCode}".`
      });
    }

    const numDuration = parseInt(warrantyDuration, 10);
    if (isNaN(numDuration) || numDuration <= 0) {
      return res.status(400).json({ success: false, message: 'Warranty duration must be a positive number.' });
    }

    const cleanUnit = warrantyDurationUnit === 'Years' ? 'Years' : 'Months';
    const cleanType = warrantyType === 'Guarantee' ? 'Guarantee' : 'Warranty';

    // Cryptographically secure random token (48 hex chars)
    const warrantyToken = 'w_' + crypto.randomBytes(24).toString('hex');
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const warrantyCode = `MWS-WAR-${randomHex}`;

    const now = new Date().toISOString();

    const insertSql = `
      INSERT INTO product_warranties (
        warranty_token,
        warranty_code,
        product_id,
        product_code,
        product_name,
        product_sku,
        brand,
        model,
        warranty_type,
        warranty_duration,
        warranty_duration_unit,
        description,
        purchase_info,
        terms,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Not Activated', ?, ?)
    `;

    const result = await queryRun(insertSql, [
      warrantyToken,
      warrantyCode,
      product.id,
      cleanProductCode,
      product.name,
      product.sku || null,
      brand || product.brand || 'MWS Eagle',
      model || null,
      cleanType,
      numDuration,
      cleanUnit,
      description || product.description || null,
      purchaseInfo || null,
      terms || 'Standard MWS Eagle Official Warranty. Valid for manufacturing defects and operational failures. Physical breakage or liquid immersion voids warranty.',
      now,
      now
    ]);

    const createdRecord = await queryGet('SELECT * FROM product_warranties WHERE id = ?', [result.lastID]);

    return res.status(201).json({
      success: true,
      message: 'Product Warranty QR generated successfully.',
      warranty: {
        ...createdRecord,
        productImageUrl: product.imageUrl || null
      }
    });
  } catch (error) {
    console.error('Error creating warranty QR:', error);
    return res.status(500).json({ success: false, message: 'Failed to create warranty record.', error: error.message });
  }
});

/**
 * GET /api/admin/warranties
 * List warranty records with search, filter, and metrics
 */
adminWarrantyRouter.get('/', async (req, res) => {
  try {
    const { search = '', status = 'All', warrantyType = 'All', page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const whereClauses = [];
    const params = [];

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      whereClauses.push('(pw.product_name LIKE ? OR pw.warranty_code LIKE ? OR pw.product_code LIKE ? OR pw.product_sku LIKE ? OR pw.activated_by_name LIKE ?)');
      params.push(q, q, q, q, q);
    }

    if (status && status !== 'All') {
      if (status === 'Expired') {
        whereClauses.push('(pw.status = "Expired" OR (pw.warranty_end_date IS NOT NULL AND pw.warranty_end_date < ?))');
        params.push(new Date().toISOString());
      } else if (status === 'Active') {
        whereClauses.push('(pw.status = "Active" AND (pw.warranty_end_date IS NULL OR pw.warranty_end_date >= ?))');
        params.push(new Date().toISOString());
      } else {
        whereClauses.push('pw.status = ?');
        params.push(status);
      }
    }

    if (warrantyType && warrantyType !== 'All') {
      whereClauses.push('pw.warranty_type = ?');
      params.push(warrantyType);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = await queryGet(`SELECT COUNT(*) as total FROM product_warranties pw ${whereSql}`, params);
    const total = countRow ? countRow.total : 0;

    const listSql = `
      SELECT 
        pw.*,
        p.imageUrl as product_image,
        (SELECT COUNT(*) FROM warranty_scan_logs wsl WHERE wsl.warranty_id = pw.id) as scan_count,
        (SELECT MIN(scanned_at) FROM warranty_scan_logs wsl WHERE wsl.warranty_id = pw.id) as first_scan_date,
        (SELECT MAX(scanned_at) FROM warranty_scan_logs wsl WHERE wsl.warranty_id = pw.id) as last_scan_date
      FROM product_warranties pw
      LEFT JOIN products p ON pw.product_id = p.id
      ${whereSql}
      ORDER BY pw.id DESC
      LIMIT ? OFFSET ?
    `;

    const records = await queryAll(listSql, [...params, limitNum, offset]);

    const enriched = records.map(r => ({
      ...r,
      effectiveStatus: getEffectiveStatus(r)
    }));

    const metricsRow = await queryGet(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Active' AND (warranty_end_date IS NULL OR warranty_end_date >= NOW()) THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN status = 'Not Activated' THEN 1 ELSE 0 END) as not_activated_count,
        SUM(CASE WHEN status = 'Expired' OR (warranty_end_date IS NOT NULL AND warranty_end_date < NOW()) THEN 1 ELSE 0 END) as expired_count
      FROM product_warranties
    `);

    const scanCountRow = await queryGet('SELECT COUNT(*) as total_scans FROM warranty_scan_logs');

    return res.status(200).json({
      success: true,
      warranties: enriched,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      metrics: {
        total: metricsRow?.total || 0,
        active: metricsRow?.active_count || 0,
        notActivated: metricsRow?.not_activated_count || 0,
        expired: metricsRow?.expired_count || 0,
        totalScans: scanCountRow?.total_scans || 0
      }
    });
  } catch (error) {
    console.error('Error fetching admin warranties:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve warranty records.', error: error.message });
  }
});

/**
 * GET /api/admin/warranties/:id
 * Single warranty details
 */
adminWarrantyRouter.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const warranty = await queryGet(`
      SELECT 
        pw.*,
        p.imageUrl as product_image,
        p.category as product_category,
        u.userId as customer_uid,
        u.fullName as customer_full_name,
        u.email as customer_email,
        u.phoneNumber as customer_phone
      FROM product_warranties pw
      LEFT JOIN products p ON pw.product_id = p.id
      LEFT JOIN users u ON pw.activated_by_user_id = u.id
      WHERE pw.id = ?
    `, [id]);

    if (!warranty) {
      return res.status(404).json({ success: false, message: 'Warranty record not found.' });
    }

    const scans = await queryAll(`
      SELECT id, event_type, user_name, ip_address, user_agent, scanned_at 
      FROM warranty_scan_logs 
      WHERE warranty_id = ? 
      ORDER BY id DESC 
      LIMIT 100
    `, [id]);

    return res.status(200).json({
      success: true,
      warranty: {
        ...warranty,
        effectiveStatus: getEffectiveStatus(warranty),
        customer_masked_email: warranty.customer_email ? maskEmail(warranty.customer_email) : null
      },
      scans
    });
  } catch (error) {
    console.error('Error fetching warranty details:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve warranty details.' });
  }
});

/**
 * GET /api/admin/warranties/:id/scans
 * Scan history
 */
adminWarrantyRouter.get('/:id/scans', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const scans = await queryAll(`
      SELECT id, event_type, user_name, ip_address, user_agent, scanned_at 
      FROM warranty_scan_logs 
      WHERE warranty_id = ? 
      ORDER BY id DESC
    `, [id]);

    return res.status(200).json({ success: true, scans });
  } catch (error) {
    console.error('Error fetching scan history:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve scan history.' });
  }
});

/**
 * PATCH /api/admin/warranties/:id/status
 * Update status
 */
adminWarrantyRouter.patch('/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    const allowed = ['Active', 'Not Activated', 'Expired', 'Suspended'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided.' });
    }

    const existing = await queryGet('SELECT * FROM product_warranties WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Warranty record not found.' });
    }

    const now = new Date().toISOString();
    await queryRun('UPDATE product_warranties SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);

    return res.status(200).json({ success: true, message: `Warranty status updated to "${status}".` });
  } catch (error) {
    console.error('Error updating warranty status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update warranty status.' });
  }
});

/**
 * DELETE /api/admin/warranties/:id
 * Delete record
 */
adminWarrantyRouter.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = await queryGet('SELECT * FROM product_warranties WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Warranty record not found.' });
    }

    await queryRun('DELETE FROM warranty_scan_logs WHERE warranty_id = ?', [id]);
    await queryRun('DELETE FROM product_warranties WHERE id = ?', [id]);

    return res.status(200).json({ success: true, message: 'Warranty record deleted successfully.' });
  } catch (error) {
    console.error('Error deleting warranty record:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete warranty record.' });
  }
});

// ============================================================================
// ========================= CUSTOMER ROUTER ==================================
// ============================================================================

export const customerWarrantyRouter = express.Router();

/**
 * GET /api/warranties/verify/:token
 * Public QR verification endpoint
 */
customerWarrantyRouter.get('/verify/:token', async (req, res) => {
  try {
    const rawToken = (req.params.token || '').trim();
    if (!rawToken) {
      return res.status(400).json({ success: false, message: 'Invalid warranty verification token.' });
    }

    const warranty = await queryGet(`
      SELECT 
        pw.*,
        p.imageUrl as product_image,
        p.category as product_category
      FROM product_warranties pw
      LEFT JOIN products p ON pw.product_id = p.id
      WHERE pw.warranty_token = ?
    `, [rawToken]);

    if (!warranty) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Product QR. This QR code could not be verified by MWS Eagle.',
        invalid: true
      });
    }

    const optionalUser = await getOptionalUser(req);
    const now = new Date().toISOString();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    try {
      await queryRun(`
        INSERT INTO warranty_scan_logs (
          warranty_id, user_id, user_name, event_type, ip_address, user_agent, scanned_at, created_at
        ) VALUES (?, ?, ?, 'QR Scanned', ?, ?, ?, ?)
      `, [
        warranty.id,
        optionalUser ? optionalUser.id : null,
        optionalUser ? optionalUser.fullName : 'Guest Visitor',
        String(ip).slice(0, 99),
        String(userAgent).slice(0, 500),
        now,
        now
      ]);
    } catch (e) {
      console.warn('Scan logging notice:', e.message);
    }

    const effectiveStatus = getEffectiveStatus(warranty);
    const isOwner = optionalUser && warranty.activated_by_user_id === optionalUser.id;
    const isAlreadyActivated = effectiveStatus === 'Active' || effectiveStatus === 'Expired' || !!warranty.warranty_start_date;

    return res.status(200).json({
      success: true,
      verified: true,
      warranty: {
        warrantyToken: warranty.warranty_token,
        warrantyCode: warranty.warranty_code,
        productId: warranty.product_id,
        productName: warranty.product_name,
        productCode: warranty.product_code,
        productSku: warranty.product_sku,
        brand: warranty.brand,
        model: warranty.model,
        warrantyType: warranty.warranty_type,
        warrantyDuration: warranty.warranty_duration,
        warrantyDurationUnit: warranty.warranty_duration_unit,
        description: warranty.description,
        terms: warranty.terms,
        productImageUrl: warranty.product_image || null,
        status: effectiveStatus,
        createdAt: warranty.created_at,
        activatedAt: warranty.activated_at,
        warrantyStartDate: warranty.warranty_start_date,
        warrantyEndDate: warranty.warranty_end_date,
        isAlreadyActivated,
        isOwner,
        registeredOwnerMasked: isAlreadyActivated && warranty.activated_by_name ? `${warranty.activated_by_name.split(' ')[0]}***` : null
      }
    });
  } catch (error) {
    console.error('Error during warranty verification:', error);
    return res.status(500).json({ success: false, message: 'Server error during warranty verification.' });
  }
});

/**
 * POST /api/warranties/:token/scan
 * Explicit scan logger
 */
customerWarrantyRouter.post('/:token/scan', async (req, res) => {
  try {
    const rawToken = (req.params.token || '').trim();
    const warranty = await queryGet('SELECT id FROM product_warranties WHERE warranty_token = ?', [rawToken]);
    if (!warranty) {
      return res.status(404).json({ success: false, message: 'Warranty not found.' });
    }

    const optionalUser = await getOptionalUser(req);
    const now = new Date().toISOString();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    await queryRun(`
      INSERT INTO warranty_scan_logs (
        warranty_id, user_id, user_name, event_type, ip_address, user_agent, scanned_at, created_at
      ) VALUES (?, ?, ?, 'QR Scanned', ?, ?, ?, ?)
    `, [
      warranty.id,
      optionalUser ? optionalUser.id : null,
      optionalUser ? optionalUser.fullName : 'Guest Visitor',
      String(ip).slice(0, 99),
      String(userAgent).slice(0, 500),
      now,
      now
    ]);

    return res.status(200).json({ success: true, message: 'Scan recorded.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to record scan.' });
  }
});

/**
 * POST /api/warranties/:token/activate
 * Customer activates warranty
 */
customerWarrantyRouter.post('/:token/activate', verifyToken, async (req, res) => {
  try {
    const rawToken = (req.params.token || '').trim();
    if (!rawToken) {
      return res.status(400).json({ success: false, message: 'Invalid warranty token.' });
    }

    const warranty = await queryGet(`
      SELECT pw.*, p.imageUrl as product_image 
      FROM product_warranties pw
      LEFT JOIN products p ON pw.product_id = p.id
      WHERE pw.warranty_token = ?
    `, [rawToken]);

    if (!warranty) {
      return res.status(404).json({
        success: false,
        message: 'Invalid warranty token. Product warranty not found.'
      });
    }

    if (warranty.status === 'Active' || warranty.warranty_start_date) {
      return res.status(409).json({
        success: false,
        isAlreadyActivated: true,
        message: 'This product warranty has already been activated.',
        warranty: {
          warrantyCode: warranty.warranty_code,
          productName: warranty.product_name,
          warrantyStartDate: warranty.warranty_start_date,
          warrantyEndDate: warranty.warranty_end_date,
          status: getEffectiveStatus(warranty)
        }
      });
    }

    if (warranty.status === 'Suspended') {
      return res.status(403).json({
        success: false,
        message: 'This product warranty has been suspended by administration. Please contact support.'
      });
    }

    const now = new Date().toISOString();
    const startDate = now;
    const endDate = calculateWarrantyEndDate(startDate, warranty.warranty_duration, warranty.warranty_duration_unit);

    const updateSql = `
      UPDATE product_warranties SET 
        status = 'Active',
        activated_at = ?,
        warranty_start_date = ?,
        warranty_end_date = ?,
        activated_by_user_id = ?,
        activated_by_name = ?,
        activated_by_email = ?,
        updated_at = ?
      WHERE id = ?
    `;

    await queryRun(updateSql, [
      now,
      startDate,
      endDate,
      req.user.id,
      req.user.fullName || 'Valued Customer',
      req.user.email || '',
      now,
      warranty.id
    ]);

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    await queryRun(`
      INSERT INTO warranty_scan_logs (
        warranty_id, user_id, user_name, event_type, ip_address, user_agent, scanned_at, created_at
      ) VALUES (?, ?, ?, 'Warranty Activated', ?, ?, ?, ?)
    `, [
      warranty.id,
      req.user.id,
      req.user.fullName || 'Valued Customer',
      String(ip).slice(0, 99),
      String(userAgent).slice(0, 500),
      now,
      now
    ]);

    const updated = await queryGet('SELECT * FROM product_warranties WHERE id = ?', [warranty.id]);

    return res.status(200).json({
      success: true,
      message: '✓ Warranty Activated Successfully! Your warranty period has started from today.',
      warranty: {
        ...updated,
        productImageUrl: warranty.product_image || null,
        isOwner: true,
        effectiveStatus: 'Active'
      }
    });
  } catch (error) {
    console.error('Error activating warranty:', error);
    return res.status(500).json({ success: false, message: 'Failed to activate warranty. Please try again.' });
  }
});

/**
 * GET /api/my/warranties or /api/warranties/my
 * Customer's activated warranties
 */
customerWarrantyRouter.get('/my', verifyToken, async (req, res) => {
  try {
    const list = await queryAll(`
      SELECT 
        pw.*,
        p.imageUrl as product_image,
        p.category as product_category
      FROM product_warranties pw
      LEFT JOIN products p ON pw.product_id = p.id
      WHERE pw.activated_by_user_id = ?
      ORDER BY pw.activated_at DESC, pw.id DESC
    `, [req.user.id]);

    const enriched = list.map(item => ({
      ...item,
      effectiveStatus: getEffectiveStatus(item)
    }));

    return res.status(200).json({
      success: true,
      warranties: enriched
    });
  } catch (error) {
    console.error('Error fetching customer warranties:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve your warranties.' });
  }
});

export default customerWarrantyRouter;

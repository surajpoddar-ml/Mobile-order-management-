import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { queryAll, queryGet, queryRun } from '../database/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { notifyProductEvent } from '../services/notificationService.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mws_eagle_mobile_parts_super_secret_jwt_key_2026_auth_system';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads/products');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBaseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    cb(null, `${cleanBaseName}_${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpg|jpeg|png|webp|gif|svg|avif)$/i;
  const isExtAllowed = allowedExtensions.test(path.extname(file.originalname));
  const isMimeAllowed = file.mimetype.startsWith('image/');

  if (isExtAllowed || isMimeAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, WEBP, GIF, SVG) are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter
});

/**
 * 0. POST /api/products/upload
 * Upload Product Image File (Admin Only)
 */
router.post('/upload', verifyToken, requireAdmin, upload.single('imageFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }
    const relativeUrl = `/uploads/products/${req.file.filename}`;
    return res.status(200).json({
      success: true,
      message: 'Product image uploaded successfully!',
      url: relativeUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Product image upload error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Image upload failed.' });
  }
});

/**
 * Standard Price Calculation Helper
 * Final Price = Original Price - (Original Price * Discount Percentage / 100)
 */
export const calculateFinalPrice = (originalPrice, discount) => {
  const orig = Math.max(0, Number(originalPrice) || 0);
  const disc = Math.max(0, Math.min(100, Number(discount) || 0));
  const finalPrice = orig - (orig * (disc / 100));
  return Math.max(0, Math.round(finalPrice * 100) / 100);
};

export const calculateDiscountPercent = (originalPrice, finalPrice) => {
  const orig = Math.max(0, Number(originalPrice) || 0);
  const finalP = Math.max(0, Number(finalPrice) || 0);
  if (orig <= 0 || finalP >= orig) return 0;
  const disc = ((orig - finalP) / orig) * 100;
  return Math.max(0, Math.min(100, Math.round(disc * 10) / 10));
};

/**
 * 1. Role-Based Product Catalog & Admin Full Listing
 * - Customer: Only sees customer pricing & showOnCustomerPortal products. Distributor price & discount are NEVER leaked.
 * - Distributor: Only sees distributor pricing & showOnDistributorPortal products. Customer price & discount are NEVER leaked.
 * - Admin: Full access to all product attributes, dual pricing models, and visibility toggles.
 */
router.get('/', async (req, res) => {
  try {
    let userType = req.query.role || 'Customer';

    // Verify token if available
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await queryGet('SELECT * FROM users WHERE id = ?', [decoded.id]);
        if (user && user.accountStatus === 'Active') {
          userType = user.userType;
        }
      } catch (err) {
        // Fall back to query param role or 'Customer'
      }
    }

    const categoryParam = req.query.category;
    let whereCategory = '';
    const params = [];

    if (categoryParam && categoryParam !== 'All') {
      whereCategory = ' AND (category = ? OR category LIKE ?)';
      params.push(categoryParam, `%${categoryParam}%`);
    }

    let sql = '';

    if (userType === 'Customer') {
      // CUSTOMER ROLE: Strictly isolated pricing. NO distributor info in output!
      sql = `
        SELECT 
          id, 
          name, 
          category, 
          COALESCE(brand, 'MWS Eagle') as brand,
          sku, 
          description, 
          specifications,
          imageUrl, 
          inStock, 
          badge, 
          COALESCE(rating, 5.0) as rating, 
          COALESCE(reviewCount, 0) as reviewCount,
          COALESCE(productStatus, 'Active') as productStatus,
          customerPrice as price, 
          COALESCE(customerOriginalPrice, originalPrice, customerPrice) as originalPrice,
          COALESCE(customerDiscount, 0) as discount,
          customerPricingMode,
          showOnCustomerPortal
        FROM products 
        WHERE (showOnCustomerPortal = 1 OR (showOnCustomerPortal IS NULL AND targetVisibility IN ('Customer', 'Both')))
          AND COALESCE(productStatus, 'Active') = 'Active'
          ${whereCategory}
        ORDER BY id DESC
      `;
    } else if (userType === 'Distributor') {
      // DISTRIBUTOR ROLE: Strictly isolated wholesale pricing. NO customer info in output!
      sql = `
        SELECT 
          id, 
          name, 
          category, 
          COALESCE(brand, 'MWS Eagle') as brand,
          sku, 
          description, 
          specifications,
          imageUrl, 
          inStock, 
          badge, 
          COALESCE(rating, 5.0) as rating, 
          COALESCE(reviewCount, 0) as reviewCount,
          COALESCE(productStatus, 'Active') as productStatus,
          distributorPrice as price, 
          COALESCE(distributorOriginalPrice, originalPrice, distributorPrice) as originalPrice,
          COALESCE(distributorDiscount, 0) as discount,
          distributorPricingMode,
          showOnDistributorPortal
        FROM products 
        WHERE (showOnDistributorPortal = 1 OR (showOnDistributorPortal IS NULL AND targetVisibility IN ('Distributor', 'Both')))
          AND COALESCE(productStatus, 'Active') = 'Active'
          ${whereCategory}
        ORDER BY id DESC
      `;
    } else if (userType === 'Admin') {
      // ADMIN ROLE: Complete view of both portal sections
      sql = `
        SELECT 
          id, 
          name, 
          category, 
          COALESCE(brand, 'MWS Eagle') as brand,
          sku, 
          description, 
          specifications,
          imageUrl, 
          inStock, 
          badge, 
          COALESCE(rating, 5.0) as rating, 
          COALESCE(reviewCount, 0) as reviewCount,
          COALESCE(productStatus, 'Active') as productStatus,
          targetVisibility,
          customerPrice,
          COALESCE(customerOriginalPrice, originalPrice, customerPrice) as customerOriginalPrice,
          COALESCE(customerDiscount, 0) as customerDiscount,
          COALESCE(customerPricingMode, 'auto') as customerPricingMode,
          COALESCE(showOnCustomerPortal, 1) as showOnCustomerPortal,
          distributorPrice,
          COALESCE(distributorOriginalPrice, originalPrice, distributorPrice) as distributorOriginalPrice,
          COALESCE(distributorDiscount, 0) as distributorDiscount,
          COALESCE(distributorPricingMode, 'auto') as distributorPricingMode,
          COALESCE(showOnDistributorPortal, 1) as showOnDistributorPortal,
          customerPrice as price,
          COALESCE(customerOriginalPrice, originalPrice, customerPrice) as originalPrice
        FROM products 
        WHERE 1=1 ${whereCategory}
        ORDER BY id DESC
      `;
    } else {
      // Public / Guest -> Customer Retail View
      sql = `
        SELECT 
          id, 
          name, 
          category, 
          COALESCE(brand, 'MWS Eagle') as brand,
          sku, 
          description, 
          specifications,
          imageUrl, 
          inStock, 
          badge, 
          COALESCE(rating, 5.0) as rating, 
          COALESCE(reviewCount, 0) as reviewCount,
          COALESCE(productStatus, 'Active') as productStatus,
          customerPrice as price, 
          COALESCE(customerOriginalPrice, originalPrice, customerPrice) as originalPrice,
          COALESCE(customerDiscount, 0) as discount,
          customerPricingMode,
          showOnCustomerPortal
        FROM products 
        WHERE (showOnCustomerPortal = 1 OR (showOnCustomerPortal IS NULL AND targetVisibility IN ('Customer', 'Both')))
          AND COALESCE(productStatus, 'Active') = 'Active'
          ${whereCategory}
        ORDER BY id DESC
      `;
    }

    const products = await queryAll(sql, params);

    return res.status(200).json({
      success: true,
      userRole: userType,
      visibilityFilterApplied: userType === 'Admin' ? 'All (Admin Dual-Portal View)' : `${userType} Portal`,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error fetching visible products:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
});

/**
 * 2. Admin Endpoint: Create a Single Product with Two Portal Sections
 */
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      category,
      brand = 'MWS Eagle',
      sku,
      description = '',
      specifications = '',
      imageUrl = '',
      inStock = 1,
      badge = '',
      productStatus = 'Active',
      // Customer Portal Section
      showOnCustomerPortal = true,
      customerPricingMode = 'auto',
      customerOriginalPrice = 0,
      customerDiscount = 0,
      customerPrice = 0,
      // Distributor Portal Section
      showOnDistributorPortal = true,
      distributorPricingMode = 'auto',
      distributorOriginalPrice = 0,
      distributorDiscount = 0,
      distributorPrice = 0
    } = req.body;

    // 1. Common Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product Name is required.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required.' });
    }
    if (!sku || !sku.trim()) {
      return res.status(400).json({ success: false, message: 'SKU / Product Code is required.' });
    }

    // Check duplicate SKU
    const existingSku = await queryGet('SELECT id FROM products WHERE sku = ?', [sku.trim()]);
    if (existingSku) {
      return res.status(409).json({
        success: false,
        message: `A product with SKU "${sku.trim()}" already exists. SKU must be unique.`
      });
    }

    // 2. Pricing Validation & Calculations for Customer Portal
    const custOrig = Math.max(0, Number(customerOriginalPrice) || 0);
    const custDisc = Math.max(0, Math.min(100, Number(customerDiscount) || 0));
    let finalCustPrice = Math.max(0, Number(customerPrice) || 0);

    if (customerPricingMode === 'auto') {
      finalCustPrice = calculateFinalPrice(custOrig, custDisc);
    } else {
      // Manual mode: admin entered final price directly
      if (finalCustPrice < 0) {
        return res.status(400).json({ success: false, message: 'Customer Final Price cannot be negative.' });
      }
    }

    // 3. Pricing Validation & Calculations for Distributor Portal
    const distOrig = Math.max(0, Number(distributorOriginalPrice) || 0);
    const distDisc = Math.max(0, Math.min(100, Number(distributorDiscount) || 0));
    let finalDistPrice = Math.max(0, Number(distributorPrice) || 0);

    if (distributorPricingMode === 'auto') {
      finalDistPrice = calculateFinalPrice(distOrig, distDisc);
    } else {
      // Manual mode: admin entered distributor price directly
      if (finalDistPrice < 0) {
        return res.status(400).json({ success: false, message: 'Distributor Final Price cannot be negative.' });
      }
    }

    // 4. Portal Visibility Determination
    const showCust = showOnCustomerPortal === true || showOnCustomerPortal === 1 || showOnCustomerPortal === '1' ? 1 : 0;
    const showDist = showOnDistributorPortal === true || showOnDistributorPortal === 1 || showOnDistributorPortal === '1' ? 1 : 0;
    const targetVisibility = (showCust && showDist) ? 'Both' : (showCust ? 'Customer' : (showDist ? 'Distributor' : 'None'));

    const stockStatus = inStock === false || inStock === 0 || inStock === '0' ? 0 : 1;

    const result = await queryRun(
      `INSERT INTO products (
        name, category, brand, sku, description, specifications, imageUrl, inStock, badge, productStatus,
        showOnCustomerPortal, customerPricingMode, customerOriginalPrice, customerDiscount, customerPrice,
        showOnDistributorPortal, distributorPricingMode, distributorOriginalPrice, distributorDiscount, distributorPrice,
        targetVisibility, originalPrice
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        category.trim(),
        (brand || 'MWS Eagle').trim(),
        sku.trim(),
        description ? description.trim() : '',
        specifications ? specifications.trim() : '',
        imageUrl ? imageUrl.trim() : '',
        stockStatus,
        badge ? badge.trim() : '',
        productStatus || 'Active',
        showCust,
        customerPricingMode || 'auto',
        custOrig,
        custDisc,
        finalCustPrice,
        showDist,
        distributorPricingMode || 'auto',
        distOrig,
        distDisc,
        finalDistPrice,
        targetVisibility,
        custOrig || distOrig
      ]
    );

    const newProduct = await queryGet('SELECT * FROM products WHERE id = ?', [result.lastID]);

    // Dispatch real-time notifications to Customer, Distributor, and Admin
    try {
      await notifyProductEvent({ product: newProduct, eventType: 'created' });
    } catch (notifErr) {
      console.error('[ProductRoutes] Notification error on product creation:', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `Product "${name.trim()}" created successfully! Portal status: Customer (${showCust ? 'Active' : 'Hidden'}), Distributor (${showDist ? 'Active' : 'Hidden'}).`,
      product: newProduct
    });
  } catch (error) {
    console.error('Failed to create product:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create product.'
    });
  }
});

/**
 * 3. Admin Endpoint: Update Existing Single Product (Common Info & Dual Pricing)
 */
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryGet('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const {
      name,
      category,
      brand,
      sku,
      description,
      specifications,
      imageUrl,
      inStock,
      badge,
      productStatus,
      // Customer Portal Section
      showOnCustomerPortal,
      customerPricingMode,
      customerOriginalPrice,
      customerDiscount,
      customerPrice,
      // Distributor Portal Section
      showOnDistributorPortal,
      distributorPricingMode,
      distributorOriginalPrice,
      distributorDiscount,
      distributorPrice
    } = req.body;

    // Check SKU collision if SKU changed
    if (sku && sku.trim() !== existing.sku) {
      const duplicate = await queryGet('SELECT id FROM products WHERE sku = ? AND id != ?', [sku.trim(), id]);
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `SKU "${sku.trim()}" is already assigned to another product.`
        });
      }
    }

    // Customer Pricing Calculation
    const custMode = customerPricingMode !== undefined ? customerPricingMode : existing.customerPricingMode;
    const custOrig = customerOriginalPrice !== undefined ? Math.max(0, Number(customerOriginalPrice)) : existing.customerOriginalPrice;
    const custDisc = customerDiscount !== undefined ? Math.max(0, Math.min(100, Number(customerDiscount))) : existing.customerDiscount;
    let finalCustPrice = customerPrice !== undefined ? Math.max(0, Number(customerPrice)) : existing.customerPrice;

    if (custMode === 'auto') {
      finalCustPrice = calculateFinalPrice(custOrig, custDisc);
    }

    // Distributor Pricing Calculation
    const distMode = distributorPricingMode !== undefined ? distributorPricingMode : existing.distributorPricingMode;
    const distOrig = distributorOriginalPrice !== undefined ? Math.max(0, Number(distributorOriginalPrice)) : existing.distributorOriginalPrice;
    const distDisc = distributorDiscount !== undefined ? Math.max(0, Math.min(100, Number(distributorDiscount))) : existing.distributorDiscount;
    let finalDistPrice = distributorPrice !== undefined ? Math.max(0, Number(distributorPrice)) : existing.distributorPrice;

    if (distMode === 'auto') {
      finalDistPrice = calculateFinalPrice(distOrig, distDisc);
    }

    // Visibility toggles
    const showCust = showOnCustomerPortal !== undefined 
      ? (showOnCustomerPortal === true || showOnCustomerPortal === 1 || showOnCustomerPortal === '1' ? 1 : 0)
      : existing.showOnCustomerPortal;

    const showDist = showOnDistributorPortal !== undefined 
      ? (showOnDistributorPortal === true || showOnDistributorPortal === 1 || showOnDistributorPortal === '1' ? 1 : 0)
      : existing.showOnDistributorPortal;

    const targetVisibility = (showCust && showDist) ? 'Both' : (showCust ? 'Customer' : (showDist ? 'Distributor' : 'None'));

    await queryRun(
      `UPDATE products SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        brand = COALESCE(?, brand),
        sku = COALESCE(?, sku),
        description = COALESCE(?, description),
        specifications = COALESCE(?, specifications),
        imageUrl = COALESCE(?, imageUrl),
        inStock = COALESCE(?, inStock),
        badge = COALESCE(?, badge),
        productStatus = COALESCE(?, productStatus),
        showOnCustomerPortal = ?,
        customerPricingMode = ?,
        customerOriginalPrice = ?,
        customerDiscount = ?,
        customerPrice = ?,
        showOnDistributorPortal = ?,
        distributorPricingMode = ?,
        distributorOriginalPrice = ?,
        distributorDiscount = ?,
        distributorPrice = ?,
        targetVisibility = ?,
        originalPrice = ?
       WHERE id = ?`,
      [
        name !== undefined ? name.trim() : existing.name,
        category !== undefined ? category.trim() : existing.category,
        brand !== undefined ? brand.trim() : existing.brand,
        sku !== undefined ? sku.trim() : existing.sku,
        description !== undefined ? description.trim() : existing.description,
        specifications !== undefined ? specifications.trim() : existing.specifications,
        imageUrl !== undefined ? imageUrl.trim() : existing.imageUrl,
        inStock !== undefined ? (inStock ? 1 : 0) : existing.inStock,
        badge !== undefined ? badge.trim() : existing.badge,
        productStatus !== undefined ? productStatus : existing.productStatus,
        showCust,
        custMode,
        custOrig,
        custDisc,
        finalCustPrice,
        showDist,
        distMode,
        distOrig,
        distDisc,
        finalDistPrice,
        targetVisibility,
        custOrig || distOrig,
        id
      ]
    );

    const updated = await queryGet('SELECT * FROM products WHERE id = ?', [id]);

    // Dispatch real-time notifications on product update
    try {
      await notifyProductEvent({ product: updated, eventType: 'updated' });
    } catch (notifErr) {
      console.error('[ProductRoutes] Notification error on product update:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Product "${updated.name}" updated successfully.`,
      product: updated
    });
  } catch (error) {
    console.error('Failed to update product:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update product.'
    });
  }
});

/**
 * 4. Fast 1-Click Visibility Toggle (Admin)
 */
router.patch('/:id/visibility', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryGet('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const { showOnCustomerPortal, showOnDistributorPortal } = req.body;

    const showCust = showOnCustomerPortal !== undefined ? (showOnCustomerPortal ? 1 : 0) : existing.showOnCustomerPortal;
    const showDist = showOnDistributorPortal !== undefined ? (showOnDistributorPortal ? 1 : 0) : existing.showOnDistributorPortal;
    const targetVisibility = (showCust && showDist) ? 'Both' : (showCust ? 'Customer' : (showDist ? 'Distributor' : 'None'));

    await queryRun(
      'UPDATE products SET showOnCustomerPortal = ?, showOnDistributorPortal = ?, targetVisibility = ? WHERE id = ?',
      [showCust, showDist, targetVisibility, id]
    );

    const updated = await queryGet('SELECT * FROM products WHERE id = ?', [id]);

    // Dispatch notifications on visibility change
    try {
      await notifyProductEvent({ product: updated, eventType: 'visibility_changed' });
    } catch (notifErr) {
      console.error('[ProductRoutes] Notification error on visibility change:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Visibility updated for "${existing.name}": Customer (${showCust ? 'ON' : 'OFF'}), Distributor (${showDist ? 'ON' : 'OFF'})`,
      product: updated
    });
  } catch (error) {
    console.error('Failed to toggle visibility:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to toggle visibility.' });
  }
});

/**
 * 5. Fast 1-Click Stock Toggle (Admin)
 */
router.patch('/:id/stock', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryGet('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const newStock = existing.inStock ? 0 : 1;
    await queryRun('UPDATE products SET inStock = ? WHERE id = ?', [newStock, id]);
    const updated = await queryGet('SELECT * FROM products WHERE id = ?', [id]);

    // Dispatch notifications on stock status toggle
    try {
      await notifyProductEvent({ product: updated, eventType: 'stock_changed' });
    } catch (notifErr) {
      console.error('[ProductRoutes] Notification error on stock toggle:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Product "${existing.name}" is now marked ${newStock ? 'IN STOCK' : 'OUT OF STOCK'}.`,
      inStock: newStock
    });
  } catch (error) {
    console.error('Failed to toggle stock:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to toggle stock.' });
  }
});

/**
 * 6. Admin Endpoint: Delete Product
 */
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryGet('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    await queryRun('DELETE FROM products WHERE id = ?', [id]);

    // Dispatch notifications on product deletion
    try {
      await notifyProductEvent({ product: existing, eventType: 'deleted' });
    } catch (notifErr) {
      console.error('[ProductRoutes] Notification error on delete:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Product "${existing.name}" has been deleted.`
    });
  } catch (error) {
    console.error('Failed to delete product:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete product.'
    });
  }
});

export default router;

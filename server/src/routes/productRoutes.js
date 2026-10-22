import express from 'express';
import { queryAll, queryGet, queryRun } from '../database/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Require authenticated user (Customer, Distributor, or Admin)
router.use(verifyToken);

/**
 * 1. Product Visibility Endpoint
 * Filters products based on the authenticated user's role:
 * - Customer: sees 'Customer' and 'Both'
 * - Distributor: sees 'Distributor' and 'Both'
 * - Admin: sees all products with full visibility metadata
 */
router.get('/', async (req, res) => {
  try {
    const { userType } = req.user;
    let sql = '';
    const params = [];

    if (userType === 'Customer') {
      sql = "SELECT id, name, category, sku, customerPrice as price, targetVisibility, description, imageUrl, inStock FROM products WHERE targetVisibility IN ('Customer', 'Both') ORDER BY id DESC";
    } else if (userType === 'Distributor') {
      sql = "SELECT id, name, category, sku, distributorPrice as price, targetVisibility, description, imageUrl, inStock FROM products WHERE targetVisibility IN ('Distributor', 'Both') ORDER BY id DESC";
    } else if (userType === 'Admin') {
      sql = "SELECT id, name, category, sku, customerPrice, distributorPrice, targetVisibility, description, imageUrl, inStock FROM products ORDER BY id DESC";
    } else {
      return res.status(403).json({ success: false, message: 'Invalid role for product catalog.' });
    }

    const products = await queryAll(sql, params);

    return res.status(200).json({
      success: true,
      userRole: userType,
      visibilityFilterApplied: userType === 'Admin' ? 'All (Admin Full View)' : `${userType} + Both`,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error fetching visible products:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
});

/**
 * 2. Admin Endpoint: Create / Post a New Product
 * Allows Admin to designate Target Visibility ('Customer', 'Distributor', 'Both')
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      category,
      sku,
      customerPrice,
      distributorPrice,
      targetVisibility,
      description,
      imageUrl,
      inStock
    } = req.body;

    if (!name || !category || !sku || !targetVisibility) {
      return res.status(400).json({
        success: false,
        message: 'Product Name, Category, SKU, and Target Visibility are required.'
      });
    }

    const validVisibilities = ['Customer', 'Distributor', 'Both'];
    if (!validVisibilities.includes(targetVisibility)) {
      return res.status(400).json({
        success: false,
        message: 'Target Visibility must be one of: Customer, Distributor, or Both.'
      });
    }

    // Check duplicate SKU
    const existingSku = await queryGet('SELECT id FROM products WHERE sku = ?', [sku.trim()]);
    if (existingSku) {
      return res.status(409).json({
        success: false,
        message: `A product with SKU "${sku}" already exists.`
      });
    }

    const cPrice = customerPrice !== undefined ? Number(customerPrice) : 0;
    const dPrice = distributorPrice !== undefined ? Number(distributorPrice) : 0;
    const stockStatus = inStock === false || inStock === 0 ? 0 : 1;

    const result = await queryRun(
      `INSERT INTO products (
        name, category, sku, customerPrice, distributorPrice, targetVisibility, description, imageUrl, inStock
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        category.trim(),
        sku.trim(),
        cPrice,
        dPrice,
        targetVisibility,
        description ? description.trim() : '',
        imageUrl ? imageUrl.trim() : '',
        stockStatus
      ]
    );

    const newProduct = await queryGet('SELECT * FROM products WHERE id = ?', [result.lastID]);

    return res.status(201).json({
      success: true,
      message: `Product "${name}" successfully created with visibility: ${targetVisibility}`,
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
 * 3. Admin Endpoint: Update Existing Product
 */
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryGet('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    const {
      name,
      category,
      sku,
      customerPrice,
      distributorPrice,
      targetVisibility,
      description,
      imageUrl,
      inStock
    } = req.body;

    if (targetVisibility && !['Customer', 'Distributor', 'Both'].includes(targetVisibility)) {
      return res.status(400).json({
        success: false,
        message: 'Target Visibility must be Customer, Distributor, or Both.'
      });
    }

    // Check duplicate SKU if changed
    if (sku && sku !== existing.sku) {
      const duplicate = await queryGet('SELECT id FROM products WHERE sku = ? AND id != ?', [sku, id]);
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `SKU "${sku}" is already in use by another product.`
        });
      }
    }

    await queryRun(
      `UPDATE products SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        sku = COALESCE(?, sku),
        customerPrice = COALESCE(?, customerPrice),
        distributorPrice = COALESCE(?, distributorPrice),
        targetVisibility = COALESCE(?, targetVisibility),
        description = COALESCE(?, description),
        imageUrl = COALESCE(?, imageUrl),
        inStock = COALESCE(?, inStock)
       WHERE id = ?`,
      [
        name !== undefined ? name.trim() : existing.name,
        category !== undefined ? category.trim() : existing.category,
        sku !== undefined ? sku.trim() : existing.sku,
        customerPrice !== undefined ? Number(customerPrice) : existing.customerPrice,
        distributorPrice !== undefined ? Number(distributorPrice) : existing.distributorPrice,
        targetVisibility !== undefined ? targetVisibility : existing.targetVisibility,
        description !== undefined ? description.trim() : existing.description,
        imageUrl !== undefined ? imageUrl.trim() : existing.imageUrl,
        inStock !== undefined ? (inStock ? 1 : 0) : existing.inStock,
        id
      ]
    );

    const updated = await queryGet('SELECT * FROM products WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully!',
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
 * 4. Admin Endpoint: Delete Product
 */
router.delete('/:id', requireAdmin, async (req, res) => {
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

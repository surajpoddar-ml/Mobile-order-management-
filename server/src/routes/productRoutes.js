import express from 'express';
import { queryAll } from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Require authenticated user (Customer, Distributor, or Admin)
router.use(verifyToken);

/**
 * Product Visibility Foundation Endpoint
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
      sql = "SELECT id, name, category, sku, customerPrice as price, targetVisibility, description, inStock FROM products WHERE targetVisibility IN ('Customer', 'Both') ORDER BY name ASC";
    } else if (userType === 'Distributor') {
      sql = "SELECT id, name, category, sku, distributorPrice as price, targetVisibility, description, inStock FROM products WHERE targetVisibility IN ('Distributor', 'Both') ORDER BY name ASC";
    } else if (userType === 'Admin') {
      sql = "SELECT id, name, category, sku, customerPrice, distributorPrice, targetVisibility, description, inStock FROM products ORDER BY name ASC";
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

export default router;

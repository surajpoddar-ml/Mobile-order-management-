import express from 'express';
import { queryAll, queryGet, queryRun } from '../database/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mws_eagle_mobile_parts_super_secret_jwt_key_2026_auth_system';

/**
 * Helper to generate URL-friendly slug
 */
const slugify = (text) => {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * 1. GET /api/categories
 * Public / Authenticated catalog categories with dynamic product counts
 */
router.get('/', async (req, res) => {
  try {
    let isAdmin = false;

    // Check token if present
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await queryGet('SELECT userType, accountStatus FROM users WHERE id = ?', [decoded.id]);
        if (user && user.userType === 'Admin' && user.accountStatus === 'Active') {
          isAdmin = true;
        }
      } catch (err) {}
    }

    const includeInactive = req.query.includeInactive === 'true' || isAdmin;
    const statusWhere = includeInactive ? '' : "WHERE c.status = 'Active'";

    const sql = `
      SELECT 
        c.*,
        COUNT(p.id) as productCount,
        SUM(CASE WHEN (p.showOnCustomerPortal = 1 OR p.targetVisibility IN ('Customer', 'Both')) THEN 1 ELSE 0 END) as customerProductCount,
        SUM(CASE WHEN (p.showOnDistributorPortal = 1 OR p.targetVisibility IN ('Distributor', 'Both')) THEN 1 ELSE 0 END) as distributorProductCount
      FROM categories c
      LEFT JOIN products p ON LOWER(TRIM(p.category)) = LOWER(TRIM(c.name))
      ${statusWhere}
      GROUP BY c.id
      ORDER BY c.displayOrder ASC, c.name ASC
    `;

    const categories = await queryAll(sql);

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

/**
 * 2. POST /api/categories
 * Create new Category (Admin Only)
 */
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      slug: customSlug,
      imageUrl = '',
      icon = 'Package',
      description = '',
      status = 'Active',
      displayOrder = 0
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category Name is required.' });
    }

    const trimmedName = name.trim();
    const finalSlug = (customSlug && customSlug.trim()) ? slugify(customSlug) : slugify(trimmedName);

    // Check duplicate name
    const existingName = await queryGet('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)', [trimmedName]);
    if (existingName) {
      return res.status(409).json({
        success: false,
        message: `Category with name "${trimmedName}" already exists.`
      });
    }

    // Check duplicate slug
    const existingSlug = await queryGet('SELECT id FROM categories WHERE slug = ?', [finalSlug]);
    if (existingSlug) {
      return res.status(409).json({
        success: false,
        message: `Category with slug "${finalSlug}" already exists.`
      });
    }

    const now = new Date().toISOString();
    const validStatus = status === 'Inactive' ? 'Inactive' : 'Active';

    const result = await queryRun(
      `INSERT INTO categories (
        name, slug, imageUrl, icon, description, status, displayOrder, createdDate, updatedDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trimmedName,
        finalSlug,
        imageUrl ? imageUrl.trim() : '',
        icon || 'Package',
        description ? description.trim() : '',
        validStatus,
        Number(displayOrder) || 0,
        now,
        now
      ]
    );

    const newCategory = await queryGet('SELECT * FROM categories WHERE id = ?', [result.lastID]);

    return res.status(201).json({
      success: true,
      message: `Category "${trimmedName}" created successfully!`,
      category: { ...newCategory, productCount: 0 }
    });
  } catch (error) {
    console.error('Failed to create category:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create category.' });
  }
});

/**
 * 3. PUT /api/categories/:id
 * Edit existing Category (Admin Only)
 */
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryGet('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const {
      name,
      slug: customSlug,
      imageUrl,
      icon,
      description,
      status,
      displayOrder,
      syncProducts = true
    } = req.body;

    const trimmedName = name !== undefined ? name.trim() : existing.name;
    if (!trimmedName) {
      return res.status(400).json({ success: false, message: 'Category Name cannot be empty.' });
    }

    // If name changed, check uniqueness
    if (trimmedName.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await queryGet('SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?', [trimmedName, id]);
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Another category with name "${trimmedName}" already exists.`
        });
      }
    }

    const finalSlug = customSlug ? slugify(customSlug) : (trimmedName !== existing.name ? slugify(trimmedName) : existing.slug);
    const validStatus = status !== undefined ? (status === 'Inactive' ? 'Inactive' : 'Active') : existing.status;
    const now = new Date().toISOString();

    await queryRun(
      `UPDATE categories SET
        name = ?,
        slug = ?,
        imageUrl = COALESCE(?, imageUrl),
        icon = COALESCE(?, icon),
        description = COALESCE(?, description),
        status = ?,
        displayOrder = COALESCE(?, displayOrder),
        updatedDate = ?
       WHERE id = ?`,
      [
        trimmedName,
        finalSlug,
        imageUrl !== undefined ? imageUrl.trim() : existing.imageUrl,
        icon !== undefined ? icon : existing.icon,
        description !== undefined ? description.trim() : existing.description,
        validStatus,
        displayOrder !== undefined ? Number(displayOrder) : existing.displayOrder,
        now,
        id
      ]
    );

    // If category name changed, synchronize existing products assigned to this category
    if (syncProducts && trimmedName !== existing.name) {
      await queryRun('UPDATE products SET category = ? WHERE LOWER(TRIM(category)) = LOWER(TRIM(?))', [trimmedName, existing.name]);
    }

    const updated = await queryGet(`
      SELECT 
        c.*,
        COUNT(p.id) as productCount
      FROM categories c
      LEFT JOIN products p ON LOWER(TRIM(p.category)) = LOWER(TRIM(c.name))
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]);

    return res.status(200).json({
      success: true,
      message: `Category "${trimmedName}" updated successfully.`,
      category: updated
    });
  } catch (error) {
    console.error('Failed to update category:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update category.' });
  }
});

/**
 * 4. PATCH /api/categories/:id/status
 * 1-Click Fast Toggle Active / Inactive (Admin Only)
 */
router.patch('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryGet('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const { status } = req.body;
    const newStatus = status ? status : (existing.status === 'Active' ? 'Inactive' : 'Active');
    const now = new Date().toISOString();

    await queryRun('UPDATE categories SET status = ?, updatedDate = ? WHERE id = ?', [newStatus, now, id]);

    return res.status(200).json({
      success: true,
      message: `Category "${existing.name}" is now ${newStatus}.`,
      status: newStatus
    });
  } catch (error) {
    console.error('Failed to toggle category status:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to toggle category status.' });
  }
});

/**
 * 5. DELETE /api/categories/:id
 * Delete Category (Admin Only)
 */
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryGet('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Check count of products using this category
    const countRow = await queryGet('SELECT COUNT(*) as count FROM products WHERE LOWER(TRIM(category)) = LOWER(TRIM(?))', [existing.name]);
    const assignedCount = countRow ? countRow.count : 0;

    await queryRun('DELETE FROM categories WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: `Category "${existing.name}" has been deleted. ${assignedCount > 0 ? `(${assignedCount} product(s) were under this category)` : ''}`,
      affectedProducts: assignedCount
    });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete category.' });
  }
});

export default router;

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { queryAll, queryGet, queryRun } from '../database/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mws_eagle_mobile_parts_super_secret_jwt_key_2026_auth_system';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads/categories');

// Ensure category uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage for category images
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
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
  fileFilter
});

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
 * 1. POST /api/categories/upload
 * Upload Category Image File (Admin Only)
 */
router.post('/upload', verifyToken, requireAdmin, upload.single('imageFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }
    const relativeUrl = `/uploads/categories/${req.file.filename}`;
    return res.status(200).json({
      success: true,
      message: 'Category image uploaded successfully!',
      url: relativeUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Category image upload error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Image upload failed.' });
  }
});

/**
 * 2. GET /api/categories
 * Returns all categories with product counts
 */
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.*,
        COUNT(p.id) as productCount,
        SUM(CASE WHEN (p.showOnCustomerPortal = 1 OR p.targetVisibility IN ('Customer', 'Both')) THEN 1 ELSE 0 END) as customerProductCount,
        SUM(CASE WHEN (p.showOnDistributorPortal = 1 OR p.targetVisibility IN ('Distributor', 'Both')) THEN 1 ELSE 0 END) as distributorProductCount
      FROM categories c
      LEFT JOIN products p ON LOWER(TRIM(p.category)) = LOWER(TRIM(c.name))
      GROUP BY c.id
      ORDER BY c.id DESC
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
 * 3. POST /api/categories
 * Create new Category (Admin Only: Name and Image only)
 */
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, imageUrl = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category Name is required.' });
    }

    const trimmedName = name.trim();

    // Check duplicate name (case-insensitive)
    const existingName = await queryGet('SELECT id FROM categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))', [trimmedName]);
    if (existingName) {
      return res.status(409).json({
        success: false,
        message: `Category "${trimmedName}" already exists.`
      });
    }

    // Auto-generate safe slug
    let baseSlug = slugify(trimmedName) || 'cat';
    let finalSlug = baseSlug;
    let counter = 1;
    while (await queryGet('SELECT id FROM categories WHERE slug = ?', [finalSlug])) {
      counter++;
      finalSlug = `${baseSlug}-${counter}`;
    }

    const now = new Date().toISOString();

    const result = await queryRun(
      `INSERT INTO categories (
        name, slug, imageUrl, icon, description, status, displayOrder, createdDate, updatedDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trimmedName,
        finalSlug,
        imageUrl ? imageUrl.trim() : '',
        'Tag',
        '',
        'Active',
        0,
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
 * 4. PUT /api/categories/:id
 * Edit Category (Admin Only: Name and Image)
 */
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryGet('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const { name, imageUrl } = req.body;

    const trimmedName = name !== undefined ? name.trim() : existing.name;
    if (!trimmedName) {
      return res.status(400).json({ success: false, message: 'Category Name cannot be empty.' });
    }

    // If name changed, check uniqueness
    if (trimmedName.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await queryGet('SELECT id FROM categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND id != ?', [trimmedName, id]);
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Another category with name "${trimmedName}" already exists.`
        });
      }
    }

    // Auto-update slug if name changed
    let finalSlug = existing.slug;
    if (trimmedName.toLowerCase() !== existing.name.toLowerCase()) {
      let baseSlug = slugify(trimmedName) || 'cat';
      finalSlug = baseSlug;
      let counter = 1;
      while (await queryGet('SELECT id FROM categories WHERE slug = ? AND id != ?', [finalSlug, id])) {
        counter++;
        finalSlug = `${baseSlug}-${counter}`;
      }
    }

    const newImageUrl = imageUrl !== undefined ? imageUrl.trim() : existing.imageUrl;
    const now = new Date().toISOString();

    await queryRun(
      `UPDATE categories SET
        name = ?,
        slug = ?,
        imageUrl = ?,
        updatedDate = ?
       WHERE id = ?`,
      [
        trimmedName,
        finalSlug,
        newImageUrl,
        now,
        id
      ]
    );

    // If category name changed, synchronize existing products assigned to this category
    if (trimmedName.toLowerCase() !== existing.name.toLowerCase()) {
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
      message: `Category "${existing.name}" deleted successfully.${assignedCount > 0 ? ` (${assignedCount} product(s) were under this category)` : ''}`,
      affectedProducts: assignedCount
    });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete category.' });
  }
});

export default router;

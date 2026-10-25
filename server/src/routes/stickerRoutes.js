import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { queryAll, queryGet, queryRun } from '../database/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads/stickers');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration for stickers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBaseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    cb(null, `sticker_${cleanBaseName}_${uniqueSuffix}${ext}`);
  }
});

// File filter for image formats
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpg|jpeg|png|webp|gif|svg|avif)$/i;
  const isExtAllowed = allowedExtensions.test(path.extname(file.originalname));
  const isMimeAllowed = file.mimetype.startsWith('image/');

  if (isExtAllowed || isMimeAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, WEBP, GIF, SVG) are allowed for promotional stickers.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter
});

/**
 * 1. Public Endpoint: Get all active promotional stickers
 * Used on the user landing/mobile page promotional strip
 */
router.get(['/active'], async (req, res) => {
  try {
    const stickers = await queryAll(
      'SELECT * FROM promotional_stickers WHERE isActive = 1 ORDER BY orderIndex ASC, id DESC'
    );
    return res.status(200).json({
      success: true,
      stickers
    });
  } catch (error) {
    console.error('Failed to fetch public promotional stickers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve promotional stickers.'
    });
  }
});

/**
 * 2. Admin Endpoint: Get all promotional stickers (including inactive)
 */
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const stickers = await queryAll('SELECT * FROM promotional_stickers ORDER BY orderIndex ASC, id DESC');
    return res.status(200).json({
      success: true,
      stickers
    });
  } catch (error) {
    console.error('Failed to fetch admin stickers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve all promotional stickers.'
    });
  }
});

/**
 * 3. Admin Endpoint: Upload sticker image
 */
router.post('/upload', verifyToken, requireAdmin, upload.single('stickerImage'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No sticker image file uploaded.'
      });
    }

    const relativeUrl = `/uploads/stickers/${req.file.filename}`;
    return res.status(200).json({
      success: true,
      message: 'Sticker graphic uploaded successfully!',
      url: relativeUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Sticker upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'File upload failed.'
    });
  }
});

/**
 * 4. Admin Endpoint: Create a new promotional sticker
 */
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      imageUrl,
      linkUrl,
      isActive = 1,
      orderIndex = 0
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Sticker image URL is required.'
      });
    }

    const now = new Date().toISOString();
    const result = await queryRun(
      `INSERT INTO promotional_stickers (
        title, imageUrl, linkUrl, isActive, orderIndex, createdDate, updatedDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        (title || 'Promotional Offer').trim(),
        imageUrl.trim(),
        (linkUrl || '').trim(),
        isActive ? 1 : 0,
        Number(orderIndex) || 0,
        now,
        now
      ]
    );

    const newSticker = await queryGet('SELECT * FROM promotional_stickers WHERE id = ?', [result.lastID]);

    return res.status(201).json({
      success: true,
      message: 'Promotional sticker created successfully!',
      sticker: newSticker
    });
  } catch (error) {
    console.error('Failed to create promotional sticker:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create promotional sticker.'
    });
  }
});

/**
 * 5. Admin Endpoint: Update sticker
 */
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      imageUrl,
      linkUrl,
      isActive,
      orderIndex
    } = req.body;

    const existing = await queryGet('SELECT * FROM promotional_stickers WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Promotional sticker not found.'
      });
    }

    const now = new Date().toISOString();
    await queryRun(
      `UPDATE promotional_stickers SET
        title = COALESCE(?, title),
        imageUrl = COALESCE(?, imageUrl),
        linkUrl = COALESCE(?, linkUrl),
        isActive = COALESCE(?, isActive),
        orderIndex = COALESCE(?, orderIndex),
        updatedDate = ?
      WHERE id = ?`,
      [
        title !== undefined ? title.trim() : null,
        imageUrl !== undefined ? imageUrl.trim() : null,
        linkUrl !== undefined ? linkUrl.trim() : null,
        isActive !== undefined ? (isActive ? 1 : 0) : null,
        orderIndex !== undefined ? Number(orderIndex) : null,
        now,
        id
      ]
    );

    const updated = await queryGet('SELECT * FROM promotional_stickers WHERE id = ?', [id]);
    return res.status(200).json({
      success: true,
      message: 'Promotional sticker updated successfully!',
      sticker: updated
    });
  } catch (error) {
    console.error('Failed to update sticker:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update promotional sticker.'
    });
  }
});

/**
 * 6. Admin Endpoint: Quick toggle active visibility
 */
router.patch('/:id/toggle', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryGet('SELECT * FROM promotional_stickers WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Sticker not found.' });
    }

    const nextState = existing.isActive ? 0 : 1;
    await queryRun('UPDATE promotional_stickers SET isActive = ?, updatedDate = ? WHERE id = ?', [
      nextState,
      new Date().toISOString(),
      id
    ]);

    return res.status(200).json({
      success: true,
      message: `Sticker visibility ${nextState ? 'enabled' : 'disabled'} successfully!`,
      isActive: nextState
    });
  } catch (error) {
    console.error('Failed to toggle sticker:', error);
    return res.status(500).json({ success: false, message: 'Failed to toggle sticker status.' });
  }
});

/**
 * 7. Admin Endpoint: Delete sticker
 */
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryGet('SELECT * FROM promotional_stickers WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Promotional sticker not found.'
      });
    }

    await queryRun('DELETE FROM promotional_stickers WHERE id = ?', [id]);

    // Clean up local uploaded file
    if (existing.imageUrl && existing.imageUrl.startsWith('/uploads/stickers/')) {
      const filePath = path.resolve(__dirname, '../..', existing.imageUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { console.warn('Could not delete sticker file:', e.message); }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Promotional sticker deleted successfully.'
    });
  } catch (error) {
    console.error('Failed to delete promotional sticker:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete promotional sticker.'
    });
  }
});

export default router;

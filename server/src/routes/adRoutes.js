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
const uploadDir = path.resolve(__dirname, '../../uploads/advertisements');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
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

// File filter for image and video formats
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpg|jpeg|png|webp|gif|svg|mp4|webm|ogg|mov|mkv)$/i;
  const isExtAllowed = allowedExtensions.test(path.extname(file.originalname));
  const isMimeAllowed = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');

  if (isExtAllowed || isMimeAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are supported.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max for videos
  fileFilter
});

/**
 * 1. Public Endpoint: Get all active advertisements
 * Used on the landing page advertisement board
 */
router.get(['/', '/active'], async (req, res) => {
  try {
    const ads = await queryAll(
      'SELECT * FROM advertisements WHERE isActive = 1 ORDER BY orderIndex ASC, id DESC'
    );
    return res.status(200).json({
      success: true,
      advertisements: ads
    });
  } catch (error) {
    console.error('Failed to fetch public advertisements:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve advertisements.'
    });
  }
});

/**
 * 2. Admin Endpoint: Get all advertisements (including inactive)
 */
router.get('/all', verifyToken, requireAdmin, async (req, res) => {
  try {
    const ads = await queryAll('SELECT * FROM advertisements ORDER BY orderIndex ASC, id DESC');
    return res.status(200).json({
      success: true,
      advertisements: ads
    });
  } catch (error) {
    console.error('Failed to fetch admin advertisements:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve all advertisements.'
    });
  }
});

/**
 * 3. Admin Endpoint: Upload media file (Image or Video)
 */
router.post('/upload', verifyToken, requireAdmin, upload.single('mediaFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or file format rejected.'
      });
    }

    const isVideo = req.file.mimetype.startsWith('video/') ||
      /\.(mp4|webm|ogg|mov|mkv)$/i.test(req.file.originalname);
    const mediaType = isVideo ? 'video' : 'image';
    const relativeUrl = `/uploads/advertisements/${req.file.filename}`;

    return res.status(201).json({
      success: true,
      message: `${mediaType === 'video' ? 'Video' : 'Image'} uploaded successfully!`,
      url: relativeUrl,
      mediaType,
      fileName: req.file.filename
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'File upload failed.'
    });
  }
});

/**
 * 4. Admin Endpoint: Create a new advertisement card
 */
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, mediaType, mediaUrl, badgeText, linkUrl, orderIndex } = req.body;

    if (!title || !mediaType || !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title, Media Type (image or video), and Media URL/file are required.'
      });
    }

    if (!['image', 'video'].includes(mediaType)) {
      return res.status(400).json({
        success: false,
        message: 'Media type must be either "image" or "video".'
      });
    }

    const now = new Date().toISOString();
    const result = await queryRun(
      `INSERT INTO advertisements (
        title, description, mediaType, mediaUrl, badgeText, linkUrl, isActive, orderIndex, createdDate
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        title.trim(),
        description ? description.trim() : '',
        mediaType,
        mediaUrl.trim(),
        badgeText ? badgeText.trim().toUpperCase() : 'HOT DEAL',
        linkUrl ? linkUrl.trim() : '/login',
        Number(orderIndex) || 0,
        now
      ]
    );

    const newAd = await queryGet('SELECT * FROM advertisements WHERE id = ?', [result.lastID]);
    return res.status(201).json({
      success: true,
      message: 'Advertisement created successfully!',
      advertisement: newAd
    });
  } catch (error) {
    console.error('Failed to create advertisement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create advertisement.'
    });
  }
});

/**
 * 5. Admin Endpoint: Update advertisement (or toggle active status)
 */
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, mediaType, mediaUrl, badgeText, linkUrl, isActive, orderIndex } = req.body;

    const existing = await queryGet('SELECT * FROM advertisements WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found.'
      });
    }

    await queryRun(
      `UPDATE advertisements SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        mediaType = COALESCE(?, mediaType),
        mediaUrl = COALESCE(?, mediaUrl),
        badgeText = COALESCE(?, badgeText),
        linkUrl = COALESCE(?, linkUrl),
        isActive = COALESCE(?, isActive),
        orderIndex = COALESCE(?, orderIndex)
       WHERE id = ?`,
      [
        title !== undefined ? title : existing.title,
        description !== undefined ? description : existing.description,
        mediaType !== undefined ? mediaType : existing.mediaType,
        mediaUrl !== undefined ? mediaUrl : existing.mediaUrl,
        badgeText !== undefined ? badgeText : existing.badgeText,
        linkUrl !== undefined ? linkUrl : existing.linkUrl,
        isActive !== undefined ? (isActive ? 1 : 0) : existing.isActive,
        orderIndex !== undefined ? Number(orderIndex) : existing.orderIndex,
        id
      ]
    );

    const updated = await queryGet('SELECT * FROM advertisements WHERE id = ?', [id]);
    return res.status(200).json({
      success: true,
      message: 'Advertisement updated successfully!',
      advertisement: updated
    });
  } catch (error) {
    console.error('Failed to update advertisement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update advertisement.'
    });
  }
});

/**
 * 6. Admin Endpoint: Delete advertisement
 */
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryGet('SELECT * FROM advertisements WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found.'
      });
    }

    await queryRun('DELETE FROM advertisements WHERE id = ?', [id]);

    // If local file, attempt cleanup
    if (existing.mediaUrl && existing.mediaUrl.startsWith('/uploads/advertisements/')) {
      const localFilePath = path.join(uploadDir, path.basename(existing.mediaUrl));
      if (fs.existsSync(localFilePath)) {
        fs.unlink(localFilePath, () => {});
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Advertisement deleted successfully.'
    });
  } catch (error) {
    console.error('Failed to delete advertisement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete advertisement.'
    });
  }
});

export default router;

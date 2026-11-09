import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { queryGet, queryAll, queryRun } from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import {
  getUploadDir,
  generateSafeStoredName,
  validateImageFile,
  getPublicImageUrl,
  resolveSafeImagePath,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES
} from '../services/imageStorageService.js';

const router = express.Router();

// Configure Multer Disk Storage pointing to the persistent upload directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const uploadDir = getUploadDir();
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    try {
      const safeName = generateSafeStoredName(file.originalname, file.mimetype);
      cb(null, safeName);
    } catch (err) {
      cb(err);
    }
  }
});

// Multer file filter enforcing strict image validation
const fileFilter = (req, file, cb) => {
  const validation = validateImageFile(file.originalname, file.mimetype);
  if (!validation.valid) {
    const error = new Error(validation.error);
    error.status = 400;
    error.isValidationError = true;
    return cb(error, false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
});

// Middleware wrapper to handle Multer upload errors cleanly
const uploadSingleImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File size exceeds the 5 MB limit. Maximum allowed size is 5 MB.`
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload validation failed.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded. Please provide a file using the "image" field.'
      });
    }

    next();
  });
};

/**
 * POST /api/images
 * Upload an image file to persistent storage and save metadata in the database.
 */
router.post('/', uploadSingleImage, async (req, res) => {
  const file = req.file;

  try {
    const originalName = file.originalname || 'unknown';
    const storedName = file.filename;
    const mimeType = file.mimetype;
    const fileSize = file.size;
    // Relative storage reference stored in database
    const relativeFilePath = `images/${storedName}`;

    // Insert metadata into database table
    const result = await queryRun(
      `INSERT INTO images (original_name, stored_name, mime_type, file_size, file_path)
       VALUES (?, ?, ?, ?, ?)`,
      [originalName, storedName, mimeType, fileSize, relativeFilePath]
    );

    const publicUrl = getPublicImageUrl(storedName, req);

    return res.status(201).json({
      success: true,
      image: {
        id: result.insertId,
        originalName,
        storedName,
        mimeType,
        fileSize,
        url: publicUrl
      }
    });
  } catch (error) {
    console.error('Database error during image save:', error);

    // Rollback / clean up orphaned physical file if database insert failed
    if (file && file.path && fs.existsSync(file.path)) {
      try {
        await fs.promises.unlink(file.path);
      } catch (unlinkErr) {
        console.error('Failed to remove orphaned file:', unlinkErr);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to save image record in database.'
    });
  }
});

/**
 * GET /api/images
 * Returns a list of uploaded images, newest first, with safe public URLs.
 */
router.get('/', async (req, res) => {
  try {
    const rows = await queryAll(
      `SELECT id, original_name, stored_name, mime_type, file_size, created_at, updated_at
       FROM images
       ORDER BY created_at DESC`
    );

    const images = rows.map((row) => ({
      id: row.id,
      originalName: row.original_name,
      storedName: row.stored_name,
      mimeType: row.mime_type,
      fileSize: row.file_size,
      url: getPublicImageUrl(row.stored_name, req),
      createdAt: row.created_at
    }));

    return res.status(200).json({
      success: true,
      count: images.length,
      images
    });
  } catch (error) {
    console.error('Error fetching images list:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve images list.'
    });
  }
});

/**
 * GET /api/images/:id
 * Retrieve details of a single image.
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image ID format.'
      });
    }

    const row = await queryGet(
      `SELECT id, original_name, stored_name, mime_type, file_size, created_at, updated_at
       FROM images
       WHERE id = ?`,
      [id]
    );

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Image not found.'
      });
    }

    return res.status(200).json({
      success: true,
      image: {
        id: row.id,
        originalName: row.original_name,
        storedName: row.stored_name,
        mimeType: row.mime_type,
        fileSize: row.file_size,
        url: getPublicImageUrl(row.stored_name, req),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching single image:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve image.'
    });
  }
});

/**
 * DELETE /api/images/:id
 * Deletes the physical image file and removes the database record.
 * Uses authentication to protect deletion operations.
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image ID.'
      });
    }

    // Retrieve image record from database
    const row = await queryGet('SELECT * FROM images WHERE id = ?', [id]);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Image not found.'
      });
    }

    // Resolve physical file path safely
    const filePath = resolveSafeImagePath(row.stored_name);

    // Delete physical file if present
    if (filePath && fs.existsSync(filePath)) {
      try {
        await fs.promises.unlink(filePath);
      } catch (unlinkErr) {
        console.error('Error unlinking physical file:', unlinkErr);
      }
    }

    // Delete database record
    await queryRun('DELETE FROM images WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete image.'
    });
  }
});

/**
 * Image serving handler for GET /images/:filename
 * Streams the physical file with proper Content-Type and security checks.
 */
export const serveImageHandler = (req, res) => {
  const rawFilename = req.params.filename;

  if (!rawFilename) {
    return res.status(404).json({
      success: false,
      message: 'Image filename not specified.'
    });
  }

  const safePath = resolveSafeImagePath(rawFilename);

  if (!safePath) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or unsafe image filename.'
    });
  }

  if (!fs.existsSync(safePath)) {
    return res.status(404).json({
      success: false,
      message: 'Image not found.'
    });
  }

  // Derive Content-Type from extension
  const ext = path.extname(safePath).toLowerCase();
  let contentType = 'application/octet-stream';
  if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  else if (ext === '.png') contentType = 'image/png';
  else if (ext === '.gif') contentType = 'image/gif';
  else if (ext === '.webp') contentType = 'image/webp';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  const stream = fs.createReadStream(safePath);
  stream.on('error', (err) => {
    console.error('Error streaming image file:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to read image file.' });
    }
  });

  stream.pipe(res);
};

export default router;


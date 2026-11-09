import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allowed MIME types and corresponding safe file extensions
export const ALLOWED_MIME_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp']
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Forbidden extensions (executable, script, dangerous extensions)
export const FORBIDDEN_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx',
  '.php', '.phtml', '.php3', '.php4', '.php5', '.phps',
  '.html', '.htm', '.xhtml', '.shtml',
  '.sh', '.bash', '.zsh', '.csh',
  '.exe', '.bat', '.cmd', '.com', '.msi', '.vbs',
  '.py', '.pl', '.cgi', '.jar', '.jsp', '.asp', '.aspx',
  '.htaccess', '.htpasswd', '.ini', '.env'
]);

/**
 * Checks if a given filesystem directory path is writable.
 * Attempts to create the directory if missing, writes a temporary test probe, and deletes it.
 */
function testDirectoryWritable(targetDir) {
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const testProbe = path.join(targetDir, `.write_probe_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    fs.writeFileSync(testProbe, 'ok', 'utf8');
    fs.unlinkSync(testProbe);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Resolves the active persistent image upload directory.
 * Priority:
 * 1. process.env.IMAGE_UPLOAD_DIR (e.g. /home/u472025985/uploads/images)
 * 2. Hostinger user home default candidate: /home/u472025985/uploads/images
 * 3. Sibling persistent storage: path.resolve(process.cwd(), '../uploads/images')
 * 4. Local workspace persistent directory: path.resolve(__dirname, '../../../persistent_uploads/images')
 * 5. Server uploads folder: path.resolve(__dirname, '../../uploads/images')
 */
export function resolvePersistentUploadDir() {
  const envDir = (process.env.IMAGE_UPLOAD_DIR || '').trim();

  const candidates = [
    ...(envDir ? [path.resolve(envDir)] : []),
    // Hostinger typical persistent home path
    '/home/u472025985/uploads/images',
    // Sibling outside current deployment directory
    path.resolve(process.cwd(), '../uploads/images'),
    path.resolve(__dirname, '../../../persistent_uploads/images'),
    path.resolve(__dirname, '../../uploads/images')
  ];

  for (const candidate of candidates) {
    if (testDirectoryWritable(candidate)) {
      return path.resolve(candidate);
    }
  }

  // Fallback to local server uploads directory if no outside folder is writable
  const fallback = path.resolve(__dirname, '../../uploads/images');
  fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

// Cached resolved directory
let cachedUploadDir = null;

export function getUploadDir() {
  if (!cachedUploadDir) {
    cachedUploadDir = resolvePersistentUploadDir();
    console.log(`[IMAGE STORAGE] Persistent directory active: ${cachedUploadDir}`);
  }
  return cachedUploadDir;
}

/**
 * Generates a collision-resistant, safe stored filename.
 * Pattern: img_[timestamp]_[16 random hex bytes].[safe_extension]
 */
export function generateSafeStoredName(originalName, mimeType) {
  const allowedExts = ALLOWED_MIME_TYPES[mimeType] || ['.jpg'];
  const rawExt = path.extname(originalName || '').toLowerCase().trim();

  // Validate extension matches allowed MIME type list
  const safeExt = allowedExts.includes(rawExt) ? rawExt : allowedExts[0];
  const uniqueToken = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();

  return `img_${timestamp}_${uniqueToken}${safeExt}`;
}

/**
 * Validates a file's MIME type and extension against the security policy.
 */
export function validateImageFile(originalName, mimeType) {
  if (!mimeType || !ALLOWED_MIME_TYPES[mimeType]) {
    return {
      valid: false,
      error: 'Invalid MIME type. Only image/jpeg, image/png, image/gif, and image/webp are allowed.'
    };
  }

  const rawExt = path.extname(originalName || '').toLowerCase().trim();

  if (!rawExt) {
    return {
      valid: false,
      error: 'Image filename must include a valid file extension.'
    };
  }

  if (FORBIDDEN_EXTENSIONS.has(rawExt)) {
    return {
      valid: false,
      error: 'Executable or dangerous file extensions are strictly prohibited.'
    };
  }

  const allowedExts = ALLOWED_MIME_TYPES[mimeType];
  if (!allowedExts.includes(rawExt)) {
    return {
      valid: false,
      error: `File extension ${rawExt} does not match declared MIME type ${mimeType}.`
    };
  }

  return { valid: true };
}

/**
 * Constructs the public URL for an image.
 */
export function getPublicImageUrl(storedName, req) {
  const configuredBase = (process.env.IMAGE_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
  if (configuredBase) {
    return `${configuredBase}/${storedName}`;
  }

  // If running in production context, default to official API URL
  const isProduction = process.env.NODE_ENV === 'production' || (req && req.get('host') && req.get('host').includes('mwseagle.com'));
  if (isProduction) {
    return `https://api.mwseagle.com/images/${storedName}`;
  }

  if (req) {
    const host = req.get('host');
    const protocol = req.protocol;
    return `${protocol}://${host}/images/${storedName}`;
  }

  return `/images/${storedName}`;
}

/**
 * Safely resolves an image file path and verifies that it resides within the upload directory
 * to prevent directory traversal attacks.
 */
export function resolveSafeImagePath(filename) {
  const uploadDir = getUploadDir();
  const safeFilename = path.basename(String(filename || '').trim());

  // Filename must match safe generated pattern
  if (!/^[a-zA-Z0-9_\-.]+$/.test(safeFilename)) {
    return null;
  }

  const targetPath = path.resolve(uploadDir, safeFilename);

  // Path traversal check
  if (!targetPath.startsWith(uploadDir)) {
    return null;
  }

  return targetPath;
}


import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

let s3Client = null;

export const getS3Config = () => {
  const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();
  let region = (process.env.AWS_REGION || 'ap-southeast-2').trim();
  const bucket = (process.env.AWS_S3_BUCKET_NAME || 'mws-eagle').trim();

  // AWS bucket 'mws-eagle' is located in 'ap-southeast-2'.
  // If .env specifies 'ap-south-1', AWS throws 301 PermanentRedirect.
  // Enforcing the true region guarantees S3 calls always succeed without redirection errors.
  if (bucket === 'mws-eagle' || region === 'ap-south-1') {
    region = 'ap-southeast-2';
  }

  const isConfigured = Boolean(accessKeyId && secretAccessKey && bucket);

  return {
    accessKeyId,
    secretAccessKey,
    region,
    bucket,
    isConfigured
  };
};

export const getS3Client = () => {
  const config = getS3Config();
  if (!config.isConfigured) return null;

  if (!s3Client) {
    s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });
  }
  return s3Client;
};

export const isS3Configured = () => {
  return getS3Config().isConfigured;
};

/**
 * Upload a file (from buffer or disk path) to AWS S3 bucket.
 * Returns the full S3 URL or null if S3 is not configured/fails.
 */
export const uploadFileToS3 = async ({ filePath, buffer, originalName, mimeType, folder = 'products' }) => {
  const config = getS3Config();
  if (!config.isConfigured) return null;

  const client = getS3Client();
  if (!client) return null;

  try {
    let fileBuffer = buffer;
    if (!fileBuffer && filePath && fs.existsSync(filePath)) {
      fileBuffer = fs.readFileSync(filePath);
    }
    if (!fileBuffer) {
      throw new Error('No file buffer or file path provided for S3 upload.');
    }

    const ext = path.extname(originalName || '').toLowerCase() || '.jpg';
    const cleanBase = path.basename(originalName || 'file', ext).replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    const filename = `${cleanBase}_${uniqueSuffix}${ext}`;
    const s3Key = `${folder}/${filename}`;

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: mimeType || 'image/jpeg'
    });

    await client.send(command);

    const s3Url = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${s3Key}`;
    console.log(`[AWS S3] Uploaded successfully: ${s3Key} -> ${s3Url}`);

    return {
      success: true,
      key: s3Key,
      filename,
      url: s3Url
    };
  } catch (error) {
    console.error(`[AWS S3] Upload failed for ${folder}/${originalName}:`, error.message);
    return null;
  }
};

/**
 * Stream an S3 object directly to an Express response.
 * Used as a fallback proxy if the S3 bucket has public access blocked.
 */
export const streamS3Object = async (s3Key, res) => {
  const config = getS3Config();
  const client = getS3Client();
  if (!config.isConfigured || !client) {
    return res.status(404).send('S3 not configured.');
  }

  try {
    let cleanKey = String(s3Key || '').trim().replace(/\\/g, '/');
    if (cleanKey.includes('amazonaws.com/')) {
      cleanKey = cleanKey.split('amazonaws.com/')[1] || cleanKey;
    }
    cleanKey = cleanKey.replace(/^\/+/, '').replace(/^uploads\//, '');

    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: cleanKey
    });

    const response = await client.send(command);

    if (response.ContentType) {
      res.setHeader('Content-Type', response.ContentType);
    }
    if (response.ContentLength) {
      res.setHeader('Content-Length', response.ContentLength);
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    if (response.Body && typeof response.Body.pipe === 'function') {
      response.Body.pipe(res);
    } else if (response.Body && typeof response.Body.transformToByteArray === 'function') {
      const bytes = await response.Body.transformToByteArray();
      res.end(Buffer.from(bytes));
    } else {
      res.status(500).send('Unable to stream S3 object.');
    }
  } catch (error) {
    console.error(`[AWS S3] Failed to stream key "${s3Key}":`, error.message);
    res.status(404).send('Image not found on S3.');
  }
};

/**
 * Safely delete an S3 object by key or full S3 URL.
 * Automatically protects official assets from deletion.
 */
export const deleteFileFromS3 = async (urlOrKey) => {
  if (!urlOrKey) return false;
  const config = getS3Config();
  if (!config.isConfigured) return false;
  const client = getS3Client();
  if (!client) return false;

  try {
    let key = String(urlOrKey);
    if (key.includes('.amazonaws.com/')) {
      key = key.split('.amazonaws.com/')[1];
    }
    key = key.replace(/^\/+/, '');

    // Never delete official cat_ or mws_ template assets
    if (!key || key.startsWith('cat_') || key.startsWith('mws_') || key.includes('/cat_') || key.includes('/mws_')) {
      return false;
    }

    await client.send(new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key
    }));
    console.log(`[AWS S3] Safely deleted object: ${key}`);
    return true;
  } catch (err) {
    console.warn(`[AWS S3] Failed to delete object: ${urlOrKey}`, err.message);
    return false;
  }
};

/**
 * Generate a short-lived presigned GET URL for viewing private S3 objects.
 */
export const getPresignedProfileGetUrl = async (s3Key, expiresIn = 3600) => {
  const config = getS3Config();
  const client = getS3Client();
  if (!config.isConfigured || !client || !s3Key) return null;

  try {
    let cleanKey = String(s3Key).trim().replace(/\\/g, '/');
    if (cleanKey.includes('.amazonaws.com/')) {
      cleanKey = cleanKey.split('.amazonaws.com/')[1];
    }
    cleanKey = cleanKey.replace(/^\/+/, '');

    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: cleanKey
    });

    const url = await getSignedUrl(client, command, { expiresIn });
    return url;
  } catch (err) {
    console.warn(`[AWS S3] Failed to generate presigned GET URL for ${s3Key}:`, err.message);
    return null;
  }
};

/**
 * Generate a short-lived presigned PUT URL for client-side direct S3 upload.
 */
export const getPresignedProfileUploadUrl = async ({ accountType = 'Customer', originalName = 'photo.jpg', mimeType = 'image/jpeg', expiresIn = 900 }) => {
  const config = getS3Config();
  const client = getS3Client();
  if (!config.isConfigured || !client) return null;

  try {
    let folder = 'profile-images/customers';
    const roleLower = String(accountType).toLowerCase();
    if (roleLower.includes('distributor')) folder = 'profile-images/distributors';
    else if (roleLower.includes('retailer')) folder = 'profile-images/retailers';
    else if (roleLower.includes('admin')) folder = 'profile-images/admin';

    const ext = path.extname(originalName || '').toLowerCase() || '.jpg';
    const uniqueName = `profile_${crypto.randomBytes(12).toString('hex')}_${Date.now()}${ext}`;
    const s3Key = `${folder}/${uniqueName}`;

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: s3Key,
      ContentType: mimeType || 'image/jpeg'
    });

    const presignedUrl = await getSignedUrl(client, command, { expiresIn });
    return {
      presignedUrl,
      s3Key,
      expiresIn
    };
  } catch (err) {
    console.error('[AWS S3] Failed to generate presigned upload URL:', err.message);
    return null;
  }
};

/**
 * Securely validate, resize (512x512), strip EXIF metadata, and upload profile photo to AWS S3.
 * Folder structure:
 *  - Customer: profile-images/customers/
 *  - Distributor: profile-images/distributors/
 *  - Retailer: profile-images/retailers/
 *  - Admin: profile-images/admin/
 */
export const processAndUploadProfilePhoto = async ({ buffer, filePath, originalName = 'profile.jpg', mimeType = 'image/jpeg', accountType = 'Customer' }) => {
  // 1. Resolve raw input buffer
  let inputBuffer = buffer;
  if (!inputBuffer && filePath && fs.existsSync(filePath)) {
    inputBuffer = fs.readFileSync(filePath);
  }
  if (!inputBuffer || inputBuffer.length === 0) {
    throw new Error('No image file data provided.');
  }

  // 2. Maximum file size check (5 MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (inputBuffer.length > MAX_SIZE) {
    throw new Error('Image file exceeds the 5 MB limit. Please select a smaller photo.');
  }

  // 3. Validate image content with sharp (fails if corrupted, executable, or non-image)
  let metadata;
  try {
    metadata = await sharp(inputBuffer).metadata();
  } catch (valErr) {
    throw new Error('Invalid or corrupted image file. Please upload a valid JPG, PNG, or WEBP image.');
  }

  const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];
  if (!metadata.format || !allowedFormats.includes(metadata.format.toLowerCase())) {
    throw new Error(`Unsupported image format (${metadata.format}). Only JPG, JPEG, PNG, and WEBP are supported.`);
  }

  // 4. Resize to 512x512 pixels, cover fit, auto-orient, and strip EXIF metadata
  const processedBuffer = await sharp(inputBuffer)
    .rotate() // auto-orient based on EXIF before stripping
    .resize(512, 512, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  // 5. Select dedicated S3 folder
  let folder = 'profile-images/customers';
  const roleLower = String(accountType).toLowerCase();
  if (roleLower.includes('distributor')) folder = 'profile-images/distributors';
  else if (roleLower.includes('retailer')) folder = 'profile-images/retailers';
  else if (roleLower.includes('admin')) folder = 'profile-images/admin';

  // 6. Generate unpredictable unique filename
  const filename = `photo_${crypto.randomBytes(12).toString('hex')}_${Date.now()}.jpg`;
  const s3Key = `${folder}/${filename}`;

  // 7. Upload to AWS S3
  const config = getS3Config();
  const client = getS3Client();
  let s3Url = null;
  let presignedUrl = null;

  if (config.isConfigured && client) {
    try {
      const command = new PutObjectCommand({
        Bucket: config.bucket,
        Key: s3Key,
        Body: processedBuffer,
        ContentType: 'image/jpeg'
      });
      await client.send(command);

      s3Url = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${s3Key}`;
      presignedUrl = await getPresignedProfileGetUrl(s3Key, 86400); // 24-hr presigned link
      console.log(`[AWS S3] Profile photo uploaded successfully: ${s3Key}`);
    } catch (uploadErr) {
      console.warn(`[AWS S3] Upload failed for ${s3Key}: ${uploadErr.message}`);
    }
  }

  // 8. Local persistent backup if S3 is not configured
  const localDir = path.resolve(process.cwd(), 'uploads/profiles');
  if (!fs.existsSync(localDir)) {
    try { fs.mkdirSync(localDir, { recursive: true }); } catch (e) {}
  }
  const localFilePath = path.join(localDir, filename);
  try {
    fs.writeFileSync(localFilePath, processedBuffer);
  } catch (e) {}

  const proxyUrl = `/api/s3/${s3Key}`;
  const finalDisplayUrl = presignedUrl || proxyUrl || `/uploads/profiles/${filename}`;

  return {
    success: true,
    s3Key,
    filename,
    s3Url,
    presignedUrl,
    proxyUrl,
    displayUrl: finalDisplayUrl,
    mimeType: 'image/jpeg',
    fileSize: processedBuffer.length
  };
};

/**
 * Safely delete an old profile photo from S3.
 * Strictly verifies that the key starts with 'profile-images/' so no product, category, or template assets are ever touched.
 */
export const deleteOldProfilePhoto = async (s3Key) => {
  if (!s3Key) return false;
  let cleanKey = String(s3Key).trim().replace(/\\/g, '/');
  if (cleanKey.includes('.amazonaws.com/')) {
    cleanKey = cleanKey.split('.amazonaws.com/')[1];
  }
  cleanKey = cleanKey.replace(/^\/+/, '');

  if (!cleanKey.startsWith('profile-images/')) {
    console.warn(`[AWS S3] Safety check prevented deletion of non-profile asset: ${cleanKey}`);
    return false;
  }

  return await deleteFileFromS3(cleanKey);
};


import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

let s3Client = null;

export const getS3Config = () => {
  const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();
  const region = (process.env.AWS_REGION || 'ap-southeast-2').trim();
  const bucket = (process.env.AWS_S3_BUCKET_NAME || 'mws-eagle').trim();

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
    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: s3Key
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


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { queryAll, queryRun, initDb } from '../database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../../server/.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const region = (process.env.AWS_REGION || 'ap-southeast-2').trim();
const bucket = (process.env.AWS_S3_BUCKET_NAME || 'mws-eagle').trim();
const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || '').trim();
const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();

if (!accessKeyId || !secretAccessKey || !bucket) {
  console.error('[MIGRATION ERROR] AWS credentials missing in .env!');
  process.exit(1);
}

const s3 = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey }
});

const getMimeType = (file) => {
  const ext = path.extname(file).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm'
  };
  return map[ext] || 'application/octet-stream';
};

const uploadsRoot = path.resolve(__dirname, '../../uploads');

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      getAllFiles(full, fileList);
    } else {
      fileList.push(full);
    }
  }
  return fileList;
}

export async function runMigration() {
  await initDb();
  console.log('====================================================');
  console.log(' MWS EAGLE — AWS S3 IMAGE STORAGE MIGRATION');
  console.log(` Target Bucket: ${bucket}`);
  console.log(` Target Region: ${region}`);
  console.log('====================================================\n');

  const files = getAllFiles(uploadsRoot);
  console.log(`[DISCOVERY] Found ${files.length} physical files in server/uploads.\n`);

  const urlMapping = {};
  const report = {
    discovered: files.length,
    uploaded: 0,
    skippedAlreadyOnS3: 0,
    failed: 0,
    dbRecordsUpdated: 0,
    details: []
  };

  // 1. Upload all local files to AWS S3
  for (const filePath of files) {
    const relativeToUploads = path.relative(uploadsRoot, filePath).replace(/\\/g, '/');
    const s3Key = relativeToUploads;
    const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
    const localUrl1 = `/uploads/${relativeToUploads}`;
    const localUrl2 = `uploads/${relativeToUploads}`;

    urlMapping[localUrl1] = s3Url;
    urlMapping[localUrl2] = s3Url;

    const mimeType = getMimeType(filePath);
    const buffer = fs.readFileSync(filePath);

    try {
      // Check if already on S3 with same size
      let existsOnS3 = false;
      try {
        const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: s3Key }));
        if (head.ContentLength === buffer.length) {
          existsOnS3 = true;
          report.skippedAlreadyOnS3++;
          console.log(`[SKIP - ALREADY ON S3] ${s3Key}`);
        }
      } catch (headErr) {}

      if (!existsOnS3) {
        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: s3Key,
          Body: buffer,
          ContentType: mimeType
        }));
        report.uploaded++;
        console.log(`[UPLOADED] ${s3Key} (${(buffer.length / 1024).toFixed(1)} KB) -> ${s3Url}`);
      }

      report.details.push({
        file: relativeToUploads,
        s3Key,
        s3Url,
        size: buffer.length,
        status: 'SUCCESS'
      });
    } catch (err) {
      report.failed++;
      console.error(`[FAILED] ${s3Key}:`, err.message);
      report.details.push({
        file: relativeToUploads,
        s3Key,
        status: 'FAILED',
        error: err.message
      });
    }
  }

  // Also upload official category photographs as backup on S3
  const clientPublicDir = path.resolve(__dirname, '../../../client/public');
  if (fs.existsSync(clientPublicDir)) {
    const publicFiles = fs.readdirSync(clientPublicDir).filter(f => f.startsWith('cat_') && f.endsWith('.jpg'));
    console.log(`\n[OFFICIAL ASSETS] Syncing ${publicFiles.length} category assets to S3 (local files preserved)...`);
    for (const pf of publicFiles) {
      const full = path.join(clientPublicDir, pf);
      const s3Key = `categories/${pf}`;
      const buf = fs.readFileSync(full);
      try {
        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: s3Key,
          Body: buf,
          ContentType: 'image/jpeg'
        }));
        console.log(`  Synced official ${pf} -> s3://${bucket}/${s3Key}`);
      } catch (e) {
        console.warn(`  Warning: Could not sync ${pf} to S3:`, e.message);
      }
    }
  }

  // 2. Update Database Records
  console.log('\n[DATABASE] Updating image references in MySQL tables...');

  // Helper to replace matching URLs in a column
  async function updateTableColumn(tableName, colName, idCol = 'id') {
    const rows = await queryAll(`SELECT \`${idCol}\`, \`${colName}\` FROM \`${tableName}\` WHERE \`${colName}\` IS NOT NULL AND \`${colName}\` != ''`);
    for (const r of rows) {
      const val = String(r[colName] || '').trim();
      let matchedS3 = null;

      for (const [localPath, s3Url] of Object.entries(urlMapping)) {
        if (val === localPath || val.endsWith(localPath)) {
          matchedS3 = s3Url;
          break;
        }
      }

      // Check if filename matches anywhere
      if (!matchedS3 && val.includes('/uploads/')) {
        const basename = path.basename(val);
        for (const [localPath, s3Url] of Object.entries(urlMapping)) {
          if (localPath.endsWith(basename)) {
            matchedS3 = s3Url;
            break;
          }
        }
      }

      if (matchedS3 && matchedS3 !== val) {
        await queryRun(`UPDATE \`${tableName}\` SET \`${colName}\` = ? WHERE \`${idCol}\` = ?`, [matchedS3, r[idCol]]);
        report.dbRecordsUpdated++;
        console.log(`  Updated [${tableName}].${colName} for ID ${r[idCol]}:`);
        console.log(`    Before: ${val}`);
        console.log(`    After:  ${matchedS3}`);
      }
    }
  }

  await updateTableColumn('advertisements', 'mediaUrl');
  await updateTableColumn('categories', 'imageUrl');
  await updateTableColumn('products', 'imageUrl');
  await updateTableColumn('promotional_stickers', 'imageUrl');
  await updateTableColumn('orders', 'paymentScreenshot');
  await updateTableColumn('payment_attempts', 'screenshotUrl');
  await updateTableColumn('chat_messages', 'media_url');

  // Also check orders.items JSON
  const orders = await queryAll('SELECT id, items FROM orders WHERE items IS NOT NULL AND items != ""');
  for (const ord of orders) {
    let itemsStr = ord.items;
    let modified = false;
    for (const [localPath, s3Url] of Object.entries(urlMapping)) {
      if (itemsStr.includes(localPath)) {
        itemsStr = itemsStr.split(localPath).join(s3Url);
        modified = true;
      }
    }
    if (modified) {
      await queryRun('UPDATE orders SET items = ? WHERE id = ?', [itemsStr, ord.id]);
      report.dbRecordsUpdated++;
      console.log(`  Updated orders.items JSON for Order ID ${ord.id} with S3 URLs.`);
    }
  }

  console.log('\n====================================================');
  console.log(' MIGRATION COMPLETED SUCCESSFULLY');
  console.log('====================================================');
  console.log(` Total Files Discovered:       ${report.discovered}`);
  console.log(` New Files Uploaded to S3:     ${report.uploaded}`);
  console.log(` Already Existing on S3:       ${report.skippedAlreadyOnS3}`);
  console.log(` Failed Uploads:               ${report.failed}`);
  console.log(` MySQL Records Updated:        ${report.dbRecordsUpdated}`);
  console.log('====================================================\n');

  return report;
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('migrateImagesToS3.js')) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}


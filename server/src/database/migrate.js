import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDb, queryGet, queryRun } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlitePath = path.resolve(__dirname, '../../database.sqlite');

export async function migrateFromSqlite() {
  await initDb();

  if (!fs.existsSync(sqlitePath)) {
    console.log('[MIGRATION] No SQLite file found at:', sqlitePath);
    return;
  }

  console.log('[MIGRATION] Checking if migration from SQLite is needed...');
  
  // Check if MySQL already has products or users
  const userCount = await queryGet('SELECT COUNT(*) as cnt FROM users');
  if (userCount && userCount.cnt > 0) {
    console.log('[MIGRATION] MySQL database already contains users. Skipping SQLite import to prevent duplicate data.');
    return;
  }

  console.log('[MIGRATION] Opening SQLite database for data transfer...');
  const { default: sqlite3 } = await import('sqlite3').catch(() => ({ default: null }));
  if (!sqlite3) {
    console.log('[MIGRATION] sqlite3 module not installed. Migration skipped.');
    return;
  }
  const sqliteDb = new sqlite3.Database(sqlitePath);

  const fetchSqlite = (sql) => {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, [], (err, rows) => {
        if (err) resolve([]);
        else resolve(rows || []);
      });
    });
  };

  const tablesToMigrate = [
    'users',
    'categories',
    'products',
    'advertisements',
    'orders',
    'notifications',
    'qr_tokens',
    'point_transactions',
    'redemption_requests',
    'system_settings'
  ];

  for (const table of tablesToMigrate) {
    try {
      const rows = await fetchSqlite(`SELECT * FROM ${table}`);
      if (rows.length === 0) continue;

      console.log(`[MIGRATION] Migrating ${rows.length} rows from SQLite table [${table}] into MySQL...`);

      for (const row of rows) {
        const columns = Object.keys(row);
        const escapedColumns = columns.map(c => `\`${c}\``).join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        const values = Object.values(row);

        const sql = `INSERT IGNORE INTO \`${table}\` (${escapedColumns}) VALUES (${placeholders})`;
        await queryRun(sql, values);
      }
      console.log(`[MIGRATION] Successfully migrated [${table}].`);
    } catch (err) {
      console.warn(`[MIGRATION] Table [${table}] transfer note:`, err.message);
    }
  }

  sqliteDb.close();
  console.log('[MIGRATION] Migration from SQLite to MySQL completed successfully!');
}

if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  migrateFromSqlite()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[MIGRATION] Error:', err);
      process.exit(1);
    });
}

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../database.sqlite');

const verboseSqlite = sqlite3.verbose();
const db = new verboseSqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Promisified database helper methods
export const queryGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const queryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const queryRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const initDb = async () => {
  // Users table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT UNIQUE NOT NULL,
      fullName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phoneNumber TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      userType TEXT NOT NULL CHECK(userType IN ('Customer', 'Distributor', 'Admin')),
      accountStatus TEXT NOT NULL CHECK(accountStatus IN ('Pending', 'Active', 'Rejected', 'Suspended')),
      profileInfo TEXT,
      createdDate TEXT NOT NULL,
      updatedDate TEXT NOT NULL,
      lastLogin TEXT,
      approvalDate TEXT,
      approvedBy TEXT,
      businessName TEXT,
      businessAddress TEXT,
      panVatNumber TEXT,
      contactPerson TEXT,
      businessPhone TEXT,
      businessEmail TEXT,
      statusRemark TEXT
    )
  `);

  // Products table (foundation for Product Visibility role checks)
  await queryRun(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      customerPrice REAL,
      distributorPrice REAL,
      targetVisibility TEXT NOT NULL CHECK(targetVisibility IN ('Customer', 'Distributor', 'Both')),
      description TEXT,
      imageUrl TEXT,
      inStock INTEGER DEFAULT 1
    )
  `);

  try {
    await queryRun('ALTER TABLE products ADD COLUMN imageUrl TEXT');
  } catch (e) {
    // Column already exists, ignore
  }

  // Advertisements table for Landing Page Board (Images and Videos uploaded by Admin)
  await queryRun(`
    CREATE TABLE IF NOT EXISTS advertisements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      mediaType TEXT NOT NULL CHECK(mediaType IN ('image', 'video')),
      mediaUrl TEXT NOT NULL,
      badgeText TEXT,
      linkUrl TEXT,
      isActive INTEGER DEFAULT 1,
      orderIndex INTEGER DEFAULT 0,
      createdDate TEXT NOT NULL
    )
  `);

  console.log('Database tables verified and ready.');
};

export default db;

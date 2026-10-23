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
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE products ADD COLUMN badge TEXT');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE products ADD COLUMN originalPrice REAL');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE products ADD COLUMN rating REAL DEFAULT 5.0');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE products ADD COLUMN reviewCount INTEGER DEFAULT 0');
  } catch (e) {}
  try {
    await queryRun("ALTER TABLE products ADD COLUMN brand TEXT DEFAULT 'MWS Eagle'");
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE products ADD COLUMN specifications TEXT');
  } catch (e) {}
  try {
    await queryRun("ALTER TABLE products ADD COLUMN productStatus TEXT DEFAULT 'Active'");
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE products ADD COLUMN customerOriginalPrice REAL DEFAULT 0');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE products ADD COLUMN customerDiscount REAL DEFAULT 0');
  } catch (e) {}
  try {
    await queryRun("ALTER TABLE products ADD COLUMN customerPricingMode TEXT DEFAULT 'auto'");
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE products ADD COLUMN showOnCustomerPortal INTEGER DEFAULT 1');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE products ADD COLUMN distributorOriginalPrice REAL DEFAULT 0');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE products ADD COLUMN distributorDiscount REAL DEFAULT 0');
  } catch (e) {}
  try {
    await queryRun("ALTER TABLE products ADD COLUMN distributorPricingMode TEXT DEFAULT 'auto'");
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE products ADD COLUMN showOnDistributorPortal INTEGER DEFAULT 1');
  } catch (e) {}

  // Backfill/migrate legacy product rows if needed
  try {
    await queryRun(`
      UPDATE products 
      SET 
        brand = COALESCE(brand, 'MWS Eagle'),
        productStatus = COALESCE(productStatus, 'Active'),
        customerPricingMode = COALESCE(customerPricingMode, 'auto'),
        distributorPricingMode = COALESCE(distributorPricingMode, 'auto'),
        showOnCustomerPortal = CASE 
          WHEN showOnCustomerPortal IS NOT NULL THEN showOnCustomerPortal
          WHEN targetVisibility IN ('Customer', 'Both') THEN 1 
          ELSE 0 
        END,
        showOnDistributorPortal = CASE 
          WHEN showOnDistributorPortal IS NOT NULL THEN showOnDistributorPortal
          WHEN targetVisibility IN ('Distributor', 'Both') THEN 1 
          ELSE 0 
        END,
        customerOriginalPrice = CASE 
          WHEN customerOriginalPrice IS NOT NULL AND customerOriginalPrice > 0 THEN customerOriginalPrice
          WHEN originalPrice IS NOT NULL AND originalPrice > 0 THEN originalPrice
          WHEN customerPrice IS NOT NULL AND customerPrice > 0 THEN ROUND(customerPrice * 1.25, 2)
          ELSE 0 
        END,
        distributorOriginalPrice = CASE 
          WHEN distributorOriginalPrice IS NOT NULL AND distributorOriginalPrice > 0 THEN distributorOriginalPrice
          WHEN originalPrice IS NOT NULL AND originalPrice > 0 THEN originalPrice
          WHEN distributorPrice IS NOT NULL AND distributorPrice > 0 THEN ROUND(distributorPrice * 1.4, 2)
          ELSE 0 
        END
      WHERE customerOriginalPrice IS NULL OR customerOriginalPrice = 0 OR distributorOriginalPrice IS NULL OR distributorOriginalPrice = 0
    `);

    // Backfill discounts based on original and final prices
    await queryRun(`
      UPDATE products
      SET
        customerDiscount = CASE
          WHEN customerDiscount IS NOT NULL AND customerDiscount > 0 THEN customerDiscount
          WHEN customerOriginalPrice > customerPrice AND customerOriginalPrice > 0 THEN ROUND(((customerOriginalPrice - customerPrice) * 100.0) / customerOriginalPrice, 1)
          ELSE 0
        END,
        distributorDiscount = CASE
          WHEN distributorDiscount IS NOT NULL AND distributorDiscount > 0 THEN distributorDiscount
          WHEN distributorOriginalPrice > distributorPrice AND distributorOriginalPrice > 0 THEN ROUND(((distributorOriginalPrice - distributorPrice) * 100.0) / distributorOriginalPrice, 1)
          ELSE 0
        END
      WHERE customerDiscount IS NULL OR distributorDiscount IS NULL OR customerDiscount = 0 OR distributorDiscount = 0
    `);
  } catch (e) {
    console.error('Migration notice:', e.message);
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

  // Orders table for customer & distributor order management
  await queryRun(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderNumber TEXT UNIQUE NOT NULL,
      userId TEXT,
      customerName TEXT NOT NULL,
      customerEmail TEXT NOT NULL,
      customerPhone TEXT NOT NULL,
      userType TEXT NOT NULL,
      shippingAddress TEXT NOT NULL,
      district TEXT,
      city TEXT,
      state TEXT,
      postalCode TEXT,
      items TEXT NOT NULL,
      totalAmount REAL NOT NULL,
      paymentMethod TEXT DEFAULT 'Cash on Delivery',
      transactionId TEXT,
      paymentScreenshot TEXT,
      paymentStatus TEXT DEFAULT 'Pending Verification',
      orderStatus TEXT DEFAULT 'Pending' CHECK(orderStatus IN ('Pending', 'Processing', 'Dispatched', 'Delivered', 'Cancelled')),
      notes TEXT,
      createdDate TEXT NOT NULL,
      updatedDate TEXT NOT NULL
    )
  `);

  try {
    await queryRun('ALTER TABLE orders ADD COLUMN district TEXT');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN transactionId TEXT');
  } catch (e) {}
  try {
    await queryRun('ALTER TABLE orders ADD COLUMN paymentScreenshot TEXT');
  } catch (e) {}
  try {
    await queryRun("ALTER TABLE orders ADD COLUMN paymentStatus TEXT DEFAULT 'Pending Verification'");
  } catch (e) {}

  // Notifications table for Admin, Customer, and Distributor alerts
  await queryRun(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipientId TEXT NOT NULL,
      recipientRole TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      entityId TEXT,
      linkUrl TEXT NOT NULL,
      isRead INTEGER DEFAULT 0,
      createdDate TEXT NOT NULL,
      dedupKey TEXT UNIQUE
    )
  `);

  // Categories table for master Category Management
  await queryRun(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      imageUrl TEXT,
      icon TEXT DEFAULT 'Package',
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')),
      displayOrder INTEGER DEFAULT 0,
      createdDate TEXT NOT NULL,
      updatedDate TEXT NOT NULL
    )
  `);

  // Seed default categories if empty
  try {
    const existingCatCount = await queryGet('SELECT COUNT(*) as count FROM categories');
    if (!existingCatCount || existingCatCount.count === 0) {
      const defaultCategories = [
        {
          name: 'Charging',
          slug: 'charging',
          icon: 'Zap',
          imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
          description: 'High-speed fast wall adapters, GaN power blocks, and wireless charging stations.',
          status: 'Active',
          displayOrder: 1
        },
        {
          name: 'Power',
          slug: 'power',
          icon: 'Battery',
          imageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80',
          description: 'High capacity power banks, MagSafe magnetic batteries, and portable power stations.',
          status: 'Active',
          displayOrder: 2
        },
        {
          name: 'Cables',
          slug: 'cables',
          icon: 'Cable',
          imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
          description: 'Ultra-durable silicon and braided Type-C, Lightning, and Micro USB cables.',
          status: 'Active',
          displayOrder: 3
        },
        {
          name: 'Audio',
          slug: 'audio',
          icon: 'Headphones',
          imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
          description: 'True Wireless (TWS) earbuds, active noise cancelling headphones, and neckbands.',
          status: 'Active',
          displayOrder: 4
        },
        {
          name: 'Protection',
          slug: 'protection',
          icon: 'Shield',
          imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
          description: 'Edge-to-edge 9H tempered glass, privacy screen guards, and shockproof cases.',
          status: 'Active',
          displayOrder: 5
        },
        {
          name: 'Displays',
          slug: 'displays',
          icon: 'Smartphone',
          imageUrl: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=600&q=80',
          description: 'Premium OEM OLED and IPS touch screen replacement assemblies.',
          status: 'Active',
          displayOrder: 6
        },
        {
          name: 'Batteries',
          slug: 'batteries',
          icon: 'BatteryCharging',
          imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
          description: 'High-density zero-cycle lithium-ion replacement battery cells.',
          status: 'Active',
          displayOrder: 7
        },
        {
          name: 'Chargers',
          slug: 'chargers',
          icon: 'Zap',
          imageUrl: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?auto=format&fit=crop&w=600&q=80',
          description: 'Multi-port USB-C and USB-A smart adapters with Power Delivery.',
          status: 'Active',
          displayOrder: 8
        },
        {
          name: 'Connectors',
          slug: 'connectors',
          icon: 'Cpu',
          imageUrl: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=600&q=80',
          description: 'Micro-soldering connectors, charging sub-boards, and flex ribbon cables.',
          status: 'Active',
          displayOrder: 9
        }
      ];

      const now = new Date().toISOString();
      for (const cat of defaultCategories) {
        await queryRun(
          `INSERT OR IGNORE INTO categories (name, slug, icon, imageUrl, description, status, displayOrder, createdDate, updatedDate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [cat.name, cat.slug, cat.icon, cat.imageUrl, cat.description, cat.status, cat.displayOrder, now, now]
        );
      }
      console.log('[INIT DB] Initial default categories seeded.');
    }

    // Also auto-sync any category from products that isn't in categories table
    const productCategoriesInDb = await queryAll('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ""');
    const now = new Date().toISOString();
    for (const row of productCategoriesInDb) {
      const catName = row.category.trim();
      if (!catName) continue;
      const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existing = await queryGet('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)', [catName]);
      if (!existing) {
        await queryRun(
          `INSERT INTO categories (name, slug, icon, imageUrl, description, status, displayOrder, createdDate, updatedDate)
           VALUES (?, ?, 'Package', '', ?, 'Active', 10, ?, ?)`,
          [catName, slug, `${catName} category products and spare parts`, now, now]
        );
      }
    }
  } catch (err) {
    console.error('Category table init/sync notice:', err.message);
  }

  console.log('Database tables verified and ready.');
};

export default db;

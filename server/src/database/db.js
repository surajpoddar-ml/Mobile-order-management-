import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const getCleanEnv = (key, fallback = '') => {
  const val = process.env[key] !== undefined ? process.env[key] : (process.env[key.trim()] !== undefined ? process.env[key.trim()] : undefined);
  if (val !== undefined && val !== null) {
    if (key === 'DB_PASSWORD') return String(val).trim();
    if (String(val).trim() !== '') return String(val).trim();
  }
  return fallback;
};

const databaseUrl = getCleanEnv('DATABASE_URL') || getCleanEnv('MYSQL_URL') || getCleanEnv('JAWSDB_URL');
const dbHost = getCleanEnv('DB_HOST', '127.0.0.1');
const dbPort = parseInt(getCleanEnv('DB_PORT', '3306'), 10);
const dbUser = getCleanEnv('DB_USER', 'u472025985_mwseagle1');
const dbPassword = getCleanEnv('DB_PASSWORD', 'Sharwan@1234!');
const dbName = getCleanEnv('DB_NAME', 'u472025985_mwseagle_123');

// Create connection pool for MySQL (non-blocking, instant initialization)
export const pool = databaseUrl
  ? mysql.createPool({
      uri: databaseUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    })
  : mysql.createPool({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    });

console.log(
  databaseUrl
    ? `Configured MySQL connection pool via cloud DATABASE_URL.`
    : `Configured MySQL pool for [${dbName}] at ${dbHost}:${dbPort} (user: ${dbUser}).`
);

// Helper to sanitize/normalize SQLite queries into valid MySQL queries
const normalizeSql = (sql) => {
  if (!sql || typeof sql !== 'string') return sql;
  return sql
    .replace(/\bINSERT\s+OR\s+REPLACE\s+INTO\b/gi, 'REPLACE INTO')
    .replace(/\bINSERT\s+OR\s+IGNORE\s+INTO\b/gi, 'INSERT IGNORE INTO')
    .replace(/\bsystem_settings\s+WHERE\s+key\s*=/gi, 'system_settings WHERE `key` =')
    .replace(/\bsystem_settings\s*\(\s*key\s*,/gi, 'system_settings (`key`,');
};

// Promisified database helper methods matching the previous SQLite API
export const queryGet = async (sql, params = []) => {
  const normalizedSql = normalizeSql(sql);
  const [rows] = await pool.query(normalizedSql, params);
  return rows && rows.length > 0 ? rows[0] : null;
};

export const queryAll = async (sql, params = []) => {
  const normalizedSql = normalizeSql(sql);
  const [rows] = await pool.query(normalizedSql, params);
  return rows || [];
};

export const queryRun = async (sql, params = []) => {
  const normalizedSql = normalizeSql(sql);
  const [result] = await pool.query(normalizedSql, params);
  return {
    lastID: result ? result.insertId : 0,
    insertId: result ? result.insertId : 0,
    changes: result ? result.affectedRows : 0,
    affectedRows: result ? result.affectedRows : 0
  };
};

export const initDb = async () => {
  // Users table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId VARCHAR(100) UNIQUE NOT NULL,
      fullName VARCHAR(255) NOT NULL,
      email VARCHAR(191) UNIQUE NOT NULL,
      phoneNumber VARCHAR(50) NOT NULL,
      passwordHash VARCHAR(255) NOT NULL,
      userType VARCHAR(50) NOT NULL,
      accountStatus VARCHAR(50) NOT NULL,
      profileInfo TEXT,
      createdDate VARCHAR(100) NOT NULL,
      updatedDate VARCHAR(100) NOT NULL,
      lastLogin VARCHAR(100),
      approvalDate VARCHAR(100),
      approvedBy VARCHAR(100),
      businessName VARCHAR(255),
      businessAddress TEXT,
      panVatNumber VARCHAR(100),
      contactPerson VARCHAR(255),
      businessPhone VARCHAR(50),
      businessEmail VARCHAR(191),
      statusRemark TEXT,
      pointsBalance INT DEFAULT 0,
      totalPointsEarned INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Products table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      sku VARCHAR(100) UNIQUE NOT NULL,
      customerPrice DOUBLE DEFAULT 0,
      distributorPrice DOUBLE DEFAULT 0,
      targetVisibility VARCHAR(50) NOT NULL,
      description TEXT,
      imageUrl TEXT,
      inStock INT DEFAULT 1,
      badge VARCHAR(100),
      originalPrice DOUBLE DEFAULT 0,
      rating DOUBLE DEFAULT 5.0,
      reviewCount INT DEFAULT 0,
      brand VARCHAR(100) DEFAULT 'MWS Eagle',
      specifications TEXT,
      productStatus VARCHAR(50) DEFAULT 'Active',
      customerOriginalPrice DOUBLE DEFAULT 0,
      customerDiscount DOUBLE DEFAULT 0,
      customerPricingMode VARCHAR(50) DEFAULT 'auto',
      showOnCustomerPortal INT DEFAULT 1,
      distributorOriginalPrice DOUBLE DEFAULT 0,
      distributorDiscount DOUBLE DEFAULT 0,
      distributorPricingMode VARCHAR(50) DEFAULT 'auto',
      showOnDistributorPortal INT DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Advertisements table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS advertisements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      mediaType VARCHAR(50) NOT NULL,
      mediaUrl TEXT NOT NULL,
      badgeText VARCHAR(100),
      linkUrl TEXT,
      isActive INT DEFAULT 1,
      isDefault INT DEFAULT 0,
      orderIndex INT DEFAULT 0,
      createdDate VARCHAR(100) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    await queryRun('ALTER TABLE advertisements ADD COLUMN isDefault INT DEFAULT 0');
  } catch (e) {
    // Column already exists
  }

  // Promotional Stickers table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS promotional_stickers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      imageUrl TEXT NOT NULL,
      linkUrl TEXT,
      isActive INT DEFAULT 1,
      orderIndex INT DEFAULT 0,
      createdDate VARCHAR(100) NOT NULL,
      updatedDate VARCHAR(100) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Orders table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderNumber VARCHAR(100) UNIQUE NOT NULL,
      userId VARCHAR(100),
      customerName VARCHAR(255) NOT NULL,
      customerEmail VARCHAR(191) NOT NULL,
      customerPhone VARCHAR(50) NOT NULL,
      userType VARCHAR(50) NOT NULL,
      shippingAddress TEXT NOT NULL,
      district VARCHAR(100),
      city VARCHAR(100),
      state VARCHAR(100),
      postalCode VARCHAR(50),
      items LONGTEXT NOT NULL,
      totalAmount DOUBLE NOT NULL,
      paymentMethod VARCHAR(100) DEFAULT 'Cash on Delivery',
      transactionId VARCHAR(255),
      paymentScreenshot TEXT,
      paymentStatus VARCHAR(100) DEFAULT 'Pending Verification',
      orderStatus VARCHAR(50) DEFAULT 'Pending',
      notes TEXT,
      createdDate VARCHAR(100) NOT NULL,
      updatedDate VARCHAR(100) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Notifications table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      recipientId VARCHAR(100) NOT NULL,
      recipientRole VARCHAR(50),
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      entityId VARCHAR(100),
      linkUrl TEXT NOT NULL,
      isRead INT DEFAULT 0,
      createdDate VARCHAR(100) NOT NULL,
      dedupKey VARCHAR(191) UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Categories table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) UNIQUE NOT NULL,
      slug VARCHAR(150) UNIQUE NOT NULL,
      imageUrl TEXT,
      icon VARCHAR(100) DEFAULT 'Package',
      description TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      displayOrder INT DEFAULT 0,
      createdDate VARCHAR(100) NOT NULL,
      updatedDate VARCHAR(100) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // QR Tokens table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS qr_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      token VARCHAR(191) UNIQUE NOT NULL,
      points INT NOT NULL,
      title VARCHAR(255) DEFAULT 'MWS Eagle Rewards',
      description TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      createdByAdminId INT,
      createdDate VARCHAR(100) NOT NULL,
      expiryDate VARCHAR(100),
      claimedByUserId INT,
      claimedByRole VARCHAR(50),
      claimedAt VARCHAR(100),
      claimIp VARCHAR(100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Point Ledger Transactions table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS point_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      userType VARCHAR(50) NOT NULL,
      type VARCHAR(50) NOT NULL,
      points INT NOT NULL,
      balanceAfter INT NOT NULL,
      referenceId VARCHAR(100),
      description TEXT NOT NULL,
      createdDate VARCHAR(100) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Cash Redemption Requests table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS redemption_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requestNumber VARCHAR(100) UNIQUE NOT NULL,
      userId INT NOT NULL,
      userType VARCHAR(50) NOT NULL,
      points INT NOT NULL,
      cashAmount DOUBLE NOT NULL,
      conversionRate DOUBLE NOT NULL DEFAULT 1.0,
      fullName VARCHAR(255) NOT NULL,
      phoneNumber VARCHAR(50) NOT NULL,
      address TEXT,
      bankName VARCHAR(255) NOT NULL,
      accountHolderName VARCHAR(255) NOT NULL,
      accountNumber VARCHAR(100) NOT NULL,
      ifscCode VARCHAR(100) NOT NULL,
      upiId VARCHAR(100),
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      adminNotes TEXT,
      transactionReference VARCHAR(255),
      rejectionReason TEXT,
      createdDate VARCHAR(100) NOT NULL,
      updatedDate VARCHAR(100) NOT NULL,
      processedDate VARCHAR(100),
      processedByAdminId INT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Safe schema extensions for product redemption
  const redemptionAlterCols = [
    'ALTER TABLE redemption_requests ADD COLUMN productId INT DEFAULT NULL',
    'ALTER TABLE redemption_requests ADD COLUMN productName VARCHAR(255) DEFAULT NULL',
    'ALTER TABLE redemption_requests ADD COLUMN productImage TEXT DEFAULT NULL',
    'ALTER TABLE redemption_requests ADD COLUMN quantity INT DEFAULT 1',
    'ALTER TABLE redemption_requests ADD COLUMN orderNumber VARCHAR(100) DEFAULT NULL',
    'ALTER TABLE redemption_requests ADD COLUMN redemptionType VARCHAR(50) DEFAULT "product"',
    'ALTER TABLE redemption_requests MODIFY COLUMN bankName VARCHAR(255) NULL',
    'ALTER TABLE redemption_requests MODIFY COLUMN accountHolderName VARCHAR(255) NULL',
    'ALTER TABLE redemption_requests MODIFY COLUMN accountNumber VARCHAR(100) NULL',
    'ALTER TABLE redemption_requests MODIFY COLUMN ifscCode VARCHAR(100) NULL'
  ];
  for (const alterSql of redemptionAlterCols) {
    try {
      await queryRun(alterSql);
    } catch (e) {
      // Ignore if already applied
    }
  }

  // System Settings table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS system_settings (
      \`key\` VARCHAR(100) PRIMARY KEY,
      \`value\` TEXT NOT NULL,
      updatedDate VARCHAR(100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Payment Attempts table for dynamic UPI QR generation & reconciliation audit
  await queryRun(`
    CREATE TABLE IF NOT EXISTS payment_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      paymentReference VARCHAR(100) UNIQUE NOT NULL,
      orderNumber VARCHAR(100) DEFAULT NULL,
      userId VARCHAR(100) DEFAULT NULL,
      customerEmail VARCHAR(191) DEFAULT NULL,
      userType VARCHAR(50) DEFAULT 'Customer',
      amount DOUBLE NOT NULL,
      currency VARCHAR(10) DEFAULT 'INR',
      payeeUpiId VARCHAR(100) NOT NULL,
      payeeName VARCHAR(100) NOT NULL,
      upiUri TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'PENDING',
      transactionId VARCHAR(255) DEFAULT NULL,
      screenshotUrl TEXT DEFAULT NULL,
      itemsJson LONGTEXT DEFAULT NULL,
      expiresAt VARCHAR(100) DEFAULT NULL,
      reconciledBy VARCHAR(100) DEFAULT NULL,
      reconciledAt VARCHAR(100) DEFAULT NULL,
      createdDate VARCHAR(100) NOT NULL,
      updatedDate VARCHAR(100) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    await queryRun('ALTER TABLE orders ADD COLUMN paymentReference VARCHAR(100) DEFAULT NULL');
  } catch (e) {
    // Column already exists
  }

  // Seed default reward system settings if not present
  try {
    const rateSetting = await queryGet('SELECT value FROM system_settings WHERE `key` = "points_to_cash_rate"');
    if (!rateSetting) {
      await queryRun('INSERT INTO system_settings (`key`, `value`, updatedDate) VALUES ("points_to_cash_rate", "1.0", ?)', [new Date().toISOString()]);
    }
    const minRedeemSetting = await queryGet('SELECT value FROM system_settings WHERE `key` = "min_redemption_points"');
    if (!minRedeemSetting) {
      await queryRun('INSERT INTO system_settings (`key`, `value`, updatedDate) VALUES ("min_redemption_points", "10", ?)', [new Date().toISOString()]);
    }
  } catch (e) {
    console.warn('[MySQL Init] Setting seed notice:', e.message);
  }

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
          `INSERT IGNORE INTO categories (name, slug, icon, imageUrl, description, status, displayOrder, createdDate, updatedDate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [cat.name, cat.slug, cat.icon, cat.imageUrl, cat.description, cat.status, cat.displayOrder, now, now]
        );
      }
      console.log('[INIT DB] Initial default categories seeded.');
    }

    // Sync any unique product categories
    const productCategoriesInDb = await queryAll('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ""');
    const now = new Date().toISOString();
    for (const row of productCategoriesInDb) {
      const catName = (row.category || '').trim();
      if (!catName) continue;
      const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existing = await queryGet('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)', [catName]);
      if (!existing) {
        await queryRun(
          `INSERT IGNORE INTO categories (name, slug, icon, imageUrl, description, status, displayOrder, createdDate, updatedDate)
           VALUES (?, ?, 'Package', '', ?, 'Active', 10, ?, ?)`,
          [catName, slug, `${catName} category products and spare parts`, now, now]
        );
      }
    }
  } catch (err) {
    console.warn('[MySQL Init] Category seed/sync notice:', err.message);
  }

  // Remove the 5 sample advertisements so digital board is 100% controlled by Admin Panel
  try {
    await queryRun(`
      DELETE FROM advertisements 
      WHERE title IN (
        'Next-Gen OLED Display Assemblies for Flagship Phones',
        'Wholesale Touch Screens, ICs & Flex Ribbon Cables',
        'Precision Soldering & High-Tech Motherboard Rework',
        'Certified 5000mAh Replacement Battery Packs',
        'Express 24-Hour Dispatch & Pan-National Delivery',
        'MWS Eagle Premium Mobile Accessories'
      )
      OR mediaUrl LIKE '%mixkit%'
      OR mediaUrl LIKE '%unsplash%'
      OR mediaUrl LIKE '%mws_main_banner%'
    `);
  } catch (err) {}

  // Product Warranties Table (MWS Eagle Product Warranty QR & Verification System)
  await queryRun(`
    CREATE TABLE IF NOT EXISTS product_warranties (
      id INT AUTO_INCREMENT PRIMARY KEY,
      warranty_token VARCHAR(191) UNIQUE NOT NULL,
      warranty_code VARCHAR(100) UNIQUE NOT NULL,
      product_id INT NOT NULL,
      product_code VARCHAR(100) NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      product_sku VARCHAR(100) DEFAULT NULL,
      brand VARCHAR(100) DEFAULT 'MWS Eagle',
      model VARCHAR(100) DEFAULT NULL,
      warranty_type VARCHAR(50) DEFAULT 'Warranty',
      warranty_duration INT NOT NULL,
      warranty_duration_unit VARCHAR(50) DEFAULT 'Months',
      description TEXT DEFAULT NULL,
      purchase_info TEXT DEFAULT NULL,
      terms TEXT DEFAULT NULL,
      qr_expiry_date VARCHAR(100) DEFAULT NULL,
      status VARCHAR(50) DEFAULT 'Not Activated',
      created_at VARCHAR(100) NOT NULL,
      activated_at VARCHAR(100) DEFAULT NULL,
      warranty_start_date VARCHAR(100) DEFAULT NULL,
      warranty_end_date VARCHAR(100) DEFAULT NULL,
      activated_by_user_id INT DEFAULT NULL,
      activated_by_name VARCHAR(255) DEFAULT NULL,
      activated_by_email VARCHAR(191) DEFAULT NULL,
      updated_at VARCHAR(100) NOT NULL,
      INDEX idx_pw_prod (product_id),
      INDEX idx_pw_token (warranty_token),
      INDEX idx_pw_code (product_code),
      INDEX idx_pw_status (status),
      INDEX idx_pw_user (activated_by_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Warranty Scan Logs Table (Scan history, timestamps, IP/device, verification events)
  await queryRun(`
    CREATE TABLE IF NOT EXISTS warranty_scan_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      warranty_id INT NOT NULL,
      user_id INT DEFAULT NULL,
      user_name VARCHAR(255) DEFAULT NULL,
      event_type VARCHAR(100) NOT NULL,
      ip_address VARCHAR(100) DEFAULT NULL,
      user_agent TEXT DEFAULT NULL,
      scanned_at VARCHAR(100) NOT NULL,
      created_at VARCHAR(100) NOT NULL,
      INDEX idx_wsl_warranty (warranty_id),
      INDEX idx_wsl_event (event_type),
      INDEX idx_wsl_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    await queryRun('ALTER TABLE product_warranties ADD COLUMN qr_expiry_date VARCHAR(100) DEFAULT NULL');
  } catch (e) {}

  // Chat Conversations Table (Customer/Distributor to Admin)
  await queryRun(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_token VARCHAR(191) UNIQUE NOT NULL,
      user_id INT NOT NULL,
      user_type VARCHAR(50) NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      user_identifier VARCHAR(100) NOT NULL,
      user_email VARCHAR(191) DEFAULT NULL,
      user_phone VARCHAR(50) DEFAULT NULL,
      status VARCHAR(50) DEFAULT 'open',
      last_message_text TEXT DEFAULT NULL,
      last_message_at VARCHAR(100) DEFAULT NULL,
      last_sender_role VARCHAR(50) DEFAULT NULL,
      unread_admin_count INT DEFAULT 0,
      unread_user_count INT DEFAULT 0,
      created_at VARCHAR(100) NOT NULL,
      updated_at VARCHAR(100) NOT NULL,
      INDEX idx_cc_user (user_id),
      INDEX idx_cc_type (user_type),
      INDEX idx_cc_last (last_message_at),
      INDEX idx_cc_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Chat Messages Table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_id INT NOT NULL,
      sender_id INT NOT NULL,
      sender_name VARCHAR(255) NOT NULL,
      sender_role VARCHAR(50) NOT NULL,
      message_type VARCHAR(50) DEFAULT 'text',
      message_text TEXT DEFAULT NULL,
      media_url TEXT DEFAULT NULL,
      media_type VARCHAR(100) DEFAULT NULL,
      file_name VARCHAR(255) DEFAULT NULL,
      file_size INT DEFAULT NULL,
      is_read INT DEFAULT 0,
      read_at VARCHAR(100) DEFAULT NULL,
      deleted_at VARCHAR(100) DEFAULT NULL,
      deleted_by_id INT DEFAULT NULL,
      created_at VARCHAR(100) NOT NULL,
      updated_at VARCHAR(100) NOT NULL,
      INDEX idx_cm_conv (conversation_id),
      INDEX idx_cm_sender (sender_id),
      INDEX idx_cm_read (is_read),
      INDEX idx_cm_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('MySQL database tables verified and ready.');
};

export default pool;

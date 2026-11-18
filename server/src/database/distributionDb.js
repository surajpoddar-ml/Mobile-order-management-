import { queryGet, queryAll, queryRun } from './db.js';
import { INDIAN_STATES_AND_UTS, SAMPLE_AREAS_BY_DISTRICT } from './geoSeedData.js';

/**
 * Initialize all database tables and schema migrations for the Multi-Level Distribution Ecosystem
 */
export async function initDistributionTables() {
  console.log('[DISTRIBUTION DB] Initializing multi-level distribution tables and schema extensions...');

  // 1. Extend users table with hierarchy & territory columns
  const userMigrations = [
    'ALTER TABLE users ADD COLUMN distributorLevel VARCHAR(50) DEFAULT NULL',
    'ALTER TABLE users ADD COLUMN mustChangePassword INT DEFAULT 0',
    'ALTER TABLE users ADD COLUMN temporaryPassword VARCHAR(255) DEFAULT NULL',
    'ALTER TABLE users ADD COLUMN assignedStateId INT DEFAULT NULL',
    'ALTER TABLE users ADD COLUMN assignedDistrictId INT DEFAULT NULL',
    'ALTER TABLE users ADD COLUMN assignedAreaId INT DEFAULT NULL',
    'ALTER TABLE users ADD COLUMN parentUserId INT DEFAULT NULL',
    'ALTER TABLE users ADD COLUMN paymentTerms VARCHAR(100) DEFAULT "Net 15"',
    'ALTER TABLE users ADD COLUMN creditLimit DECIMAL(12,2) DEFAULT 0.00',
    'ALTER TABLE users ADD COLUMN openingCredit DECIMAL(12,2) DEFAULT 0.00',
    'ALTER TABLE users ADD COLUMN territoryNotes TEXT DEFAULT NULL',
    'ALTER TABLE users ADD INDEX idx_u_dist_level (distributorLevel)',
    'ALTER TABLE users ADD INDEX idx_u_parent (parentUserId)',
    'ALTER TABLE users ADD INDEX idx_u_state (assignedStateId)',
    'ALTER TABLE users ADD INDEX idx_u_district (assignedDistrictId)',
    'ALTER TABLE users ADD INDEX idx_u_area (assignedAreaId)'
  ];

  for (const sql of userMigrations) {
    try {
      await queryRun(sql);
    } catch (e) {
      // Ignore if already exists
    }
  }

  // 2. Geographical Master Tables: States & Union Territories
  await queryRun(`
    CREATE TABLE IF NOT EXISTS geo_states (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(10) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      type ENUM('State', 'Union Territory') DEFAULT 'State',
      zone VARCHAR(50) DEFAULT 'North',
      createdDate VARCHAR(100) NOT NULL,
      INDEX idx_gs_name (name),
      INDEX idx_gs_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 3. Geographical Master Tables: Districts
  await queryRun(`
    CREATE TABLE IF NOT EXISTS geo_districts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      stateId INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(20) DEFAULT NULL,
      headquarters VARCHAR(100) DEFAULT NULL,
      createdDate VARCHAR(100) NOT NULL,
      INDEX idx_gd_state (stateId),
      INDEX idx_gd_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 4. Geographical Master Tables: Areas / Localities
  await queryRun(`
    CREATE TABLE IF NOT EXISTS geo_areas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      districtId INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      pincode VARCHAR(20) DEFAULT NULL,
      createdDate VARCHAR(100) NOT NULL,
      INDEX idx_ga_dist (districtId),
      INDEX idx_ga_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 5. Distributor Hierarchy Link Table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS distributor_hierarchy (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL UNIQUE,
      level ENUM('StateDistributor', 'DistrictDistributor', 'AreaDistributor', 'Retailer') NOT NULL,
      stateId INT DEFAULT NULL,
      districtId INT DEFAULT NULL,
      areaId INT DEFAULT NULL,
      parentId INT DEFAULT NULL,
      assignedDate VARCHAR(100) NOT NULL,
      assignedBy VARCHAR(100) DEFAULT 'SUPER_ADMIN',
      status VARCHAR(50) DEFAULT 'Active',
      INDEX idx_dh_level (level),
      INDEX idx_dh_state (stateId),
      INDEX idx_dh_dist (districtId),
      INDEX idx_dh_area (areaId),
      INDEX idx_dh_parent (parentId),
      INDEX idx_dh_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 6. Payment Reliability Scores
  await queryRun(`
    CREATE TABLE IF NOT EXISTS payment_reliability_scores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL UNIQUE,
      score DECIMAL(5,2) NOT NULL DEFAULT 100.00,
      onTimeRate DECIMAL(5,2) NOT NULL DEFAULT 100.00,
      consistencyRate DECIMAL(5,2) NOT NULL DEFAULT 100.00,
      overdueRate DECIMAL(5,2) NOT NULL DEFAULT 100.00,
      totalInvoices INT NOT NULL DEFAULT 0,
      onTimePayments INT NOT NULL DEFAULT 0,
      latePayments INT NOT NULL DEFAULT 0,
      missedPayments INT NOT NULL DEFAULT 0,
      totalDue DECIMAL(14,2) NOT NULL DEFAULT 0.00,
      totalPaid DECIMAL(14,2) NOT NULL DEFAULT 0.00,
      outstandingAmount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
      overdueDays INT NOT NULL DEFAULT 0,
      ratingTier VARCHAR(50) NOT NULL DEFAULT 'Not Yet Rated',
      lastCalculated VARCHAR(100) NOT NULL,
      updatedDate VARCHAR(100) NOT NULL,
      INDEX idx_prs_score (score),
      INDEX idx_prs_tier (ratingTier)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 7. Payment Score History (for tracking improvement / deterioration)
  await queryRun(`
    CREATE TABLE IF NOT EXISTS payment_score_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      score DECIMAL(5,2) NOT NULL,
      previousScore DECIMAL(5,2) DEFAULT NULL,
      changeAmount DECIMAL(5,2) DEFAULT 0.00,
      reason TEXT DEFAULT NULL,
      recordedDate VARCHAR(100) NOT NULL,
      INDEX idx_psh_user (userId),
      INDEX idx_psh_date (recordedDate)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 8. Distribution Invoices (Orders & Wholesale Invoices)
  await queryRun(`
    CREATE TABLE IF NOT EXISTS distribution_invoices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoiceNumber VARCHAR(100) UNIQUE NOT NULL,
      userId INT NOT NULL,
      userRole VARCHAR(50) NOT NULL,
      parentUserId INT DEFAULT NULL,
      stateId INT DEFAULT NULL,
      districtId INT DEFAULT NULL,
      areaId INT DEFAULT NULL,
      amountDue DECIMAL(14,2) NOT NULL DEFAULT 0.00,
      amountPaid DECIMAL(14,2) NOT NULL DEFAULT 0.00,
      balanceDue DECIMAL(14,2) NOT NULL DEFAULT 0.00,
      dueDate VARCHAR(100) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      paymentTerms VARCHAR(100) DEFAULT 'Net 15',
      invoiceDate VARCHAR(100) NOT NULL,
      paidDate VARCHAR(100) DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      createdDate VARCHAR(100) NOT NULL,
      INDEX idx_di_user (userId),
      INDEX idx_di_parent (parentUserId),
      INDEX idx_di_status (status),
      INDEX idx_di_due (dueDate)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 9. Distribution Payments (Verified Wholesale & Retailer Payment Records)
  await queryRun(`
    CREATE TABLE IF NOT EXISTS distribution_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      transactionId VARCHAR(100) UNIQUE NOT NULL,
      invoiceId INT DEFAULT NULL,
      userId INT NOT NULL,
      accountName VARCHAR(255) DEFAULT NULL,
      distributorLevel VARCHAR(50) DEFAULT NULL,
      parentUserId INT DEFAULT NULL,
      stateId INT DEFAULT NULL,
      districtId INT DEFAULT NULL,
      areaId INT DEFAULT NULL,
      amountPaid DECIMAL(14,2) NOT NULL DEFAULT 0.00,
      paymentDate VARCHAR(100) NOT NULL,
      dueDate VARCHAR(100) DEFAULT NULL,
      paymentMethod VARCHAR(100) DEFAULT 'Bank Transfer',
      transactionReference VARCHAR(255) DEFAULT NULL,
      verificationStatus VARCHAR(50) NOT NULL DEFAULT 'VERIFIED',
      verifiedBy VARCHAR(100) DEFAULT 'SUPER_ADMIN',
      remarks TEXT DEFAULT NULL,
      createdDate VARCHAR(100) NOT NULL,
      INDEX idx_dp_user (userId),
      INDEX idx_dp_inv (invoiceId),
      INDEX idx_dp_ver (verificationStatus),
      INDEX idx_dp_date (paymentDate)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 10. Audit Logs Table
  await queryRun(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      actionId VARCHAR(100) UNIQUE NOT NULL,
      performedBy VARCHAR(100) NOT NULL,
      userRole VARCHAR(50) NOT NULL,
      targetAccount VARCHAR(100) DEFAULT NULL,
      targetUserId INT DEFAULT NULL,
      actionType VARCHAR(100) NOT NULL,
      previousValues LONGTEXT DEFAULT NULL,
      updatedValues LONGTEXT DEFAULT NULL,
      remarks TEXT DEFAULT NULL,
      ipAddress VARCHAR(100) DEFAULT NULL,
      timestamp VARCHAR(100) NOT NULL,
      INDEX idx_al_target (targetUserId),
      INDEX idx_al_action (actionType),
      INDEX idx_al_time (timestamp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Seed India Geographical Master Data if not yet seeded
  await seedIndianGeoData();

  console.log('[DISTRIBUTION DB] Multi-level distribution tables initialized successfully.');
}

/**
 * Seed all 28 Indian States, 8 Union Territories, Districts and core Areas
 */
export async function seedIndianGeoData() {
  const stateCount = await queryGet('SELECT COUNT(*) as cnt FROM geo_states');
  if (stateCount && stateCount.cnt >= 36) {
    return; // Already seeded
  }

  console.log('[GEO SEED] Seeding 28 Indian States & 8 Union Territories with official districts...');
  const now = new Date().toISOString();

  for (const st of INDIAN_STATES_AND_UTS) {
    let existingState = await queryGet('SELECT id FROM geo_states WHERE code = ?', [st.code]);
    let stateId = existingState ? existingState.id : null;

    if (!existingState) {
      const res = await queryRun(
        'INSERT INTO geo_states (code, name, type, zone, createdDate) VALUES (?, ?, ?, ?, ?)',
        [st.code, st.name, st.type, st.zone, now]
      );
      stateId = res.lastID;
    }

    if (!stateId) continue;

    // Seed Districts for this State / UT
    for (const distName of st.districts) {
      let existingDist = await queryGet('SELECT id FROM geo_districts WHERE stateId = ? AND name = ?', [stateId, distName]);
      let distId = existingDist ? existingDist.id : null;

      if (!existingDist) {
        const dRes = await queryRun(
          'INSERT INTO geo_districts (stateId, name, createdDate) VALUES (?, ?, ?)',
          [stateId, distName, now]
        );
        distId = dRes.lastID;
      }

      // Check if this district has sample areas to seed
      if (distId && SAMPLE_AREAS_BY_DISTRICT[distName]) {
        for (const areaName of SAMPLE_AREAS_BY_DISTRICT[distName]) {
          const existingArea = await queryGet('SELECT id FROM geo_areas WHERE districtId = ? AND name = ?', [distId, areaName]);
          if (!existingArea) {
            await queryRun(
              'INSERT INTO geo_areas (districtId, name, createdDate) VALUES (?, ?, ?)',
              [distId, areaName, now]
            );
          }
        }
      }
    }
  }

  console.log('[GEO SEED] Finished seeding official Indian geographical master data.');
}


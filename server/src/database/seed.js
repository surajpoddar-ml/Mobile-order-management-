import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { initDb, queryGet, queryRun, queryAll } from './db.js';

dotenv.config();

export const seedDatabase = async () => {
  await initDb();

  const salt = await bcrypt.genSalt(10);
  const now = new Date().toISOString();

  // 1. Ensure Admin Account configured via .env
  const envAdminEmail = (process.env.ADMIN_EMAIL || 'admin@mwseagle.com').trim().toLowerCase();
  const envAdminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const hashedEnvAdminPassword = await bcrypt.hash(envAdminPassword, salt);

  const existingAdminByEmail = await queryGet('SELECT * FROM users WHERE LOWER(email) = ?', [envAdminEmail]);
  const primaryAdmin = await queryGet('SELECT * FROM users WHERE userId = "ADM-001"');

  if (existingAdminByEmail) {
    await queryRun(
      'UPDATE users SET passwordHash = ?, userType = "Admin", accountStatus = "Active", updatedDate = ? WHERE id = ?',
      [hashedEnvAdminPassword, now, existingAdminByEmail.id]
    );
    console.log(`[SEED] Synced Admin password from .env for: ${envAdminEmail}`);
  } else if (primaryAdmin) {
    await queryRun(
      'UPDATE users SET email = ?, passwordHash = ?, userType = "Admin", accountStatus = "Active", updatedDate = ? WHERE id = ?',
      [envAdminEmail, hashedEnvAdminPassword, now, primaryAdmin.id]
    );
    console.log(`[SEED] Updated primary ADM-001 to .env credentials: ${envAdminEmail}`);
  } else {
    await queryRun(
      `INSERT INTO users (
        userId, fullName, email, phoneNumber, passwordHash, userType, accountStatus,
        profileInfo, createdDate, updatedDate, lastLogin, approvalDate, approvedBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'ADM-001',
        'MWS Eagle System Admin',
        envAdminEmail,
        '+1-800-555-0100',
        hashedEnvAdminPassword,
        'Admin',
        'Active',
        'Master Administrator of MWS Eagle Marketplace',
        now, now, now, now, 'SYSTEM'
      ]
    );
    console.log(`[SEED] Created Admin account from .env: ${envAdminEmail}`);
  }

  // 2. Ensure Sample Advertisements for Landing Page Board (Images and Videos)
  const existingAds = await queryAll('SELECT id FROM advertisements');
  if (existingAds.length === 0) {
    console.log('[SEED] Seeding interactive advertisement board items (images & videos)...');
    const defaultAds = [
      {
        title: 'Next-Gen OLED Display Assemblies for Flagship Phones',
        description: 'Ultra-high 120Hz refresh rate, true tone color accuracy, and military-grade glass coating.',
        mediaType: 'video',
        mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-repairing-a-smartphone-40899-large.mp4',
        badgeText: 'FEATURED VIDEO',
        linkUrl: '/login?mode=signup&role=Distributor',
        orderIndex: 1
      },
      {
        title: 'Wholesale Touch Screens, ICs & Flex Ribbon Cables',
        description: 'Direct factory imports at guaranteed volume discounts for registered service centers.',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=1200&q=80',
        badgeText: 'WHOLESALE DEAL',
        linkUrl: '/login',
        orderIndex: 2
      },
      {
        title: 'Precision Soldering & High-Tech Motherboard Rework',
        description: 'Watch precision micro-soldering and thermal imaging diagnostics in action.',
        mediaType: 'video',
        mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-of-a-technological-device-41559-large.mp4',
        badgeText: 'TECH LAB',
        linkUrl: '/login',
        orderIndex: 3
      },
      {
        title: 'Certified 5000mAh Replacement Battery Packs',
        description: 'Zero-cycle cobalt cells with multi-layer smart temperature protection and 1-year warranty.',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80',
        badgeText: 'NEW ARRIVAL',
        linkUrl: '/login?mode=signup&role=Customer',
        orderIndex: 4
      },
      {
        title: 'Express 24-Hour Dispatch & Pan-National Delivery',
        description: 'Immediate secure packing and priority dispatch for wholesale distributor shipments.',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
        badgeText: 'FAST SHIPPING',
        linkUrl: '/login',
        orderIndex: 5
      }
    ];

    for (const ad of defaultAds) {
      await queryRun(
        `INSERT INTO advertisements (
          title, description, mediaType, mediaUrl, badgeText, linkUrl, isActive, orderIndex, createdDate
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [ad.title, ad.description, ad.mediaType, ad.mediaUrl, ad.badgeText, ad.linkUrl, ad.orderIndex, now]
      );
    }
    console.log('[SEED] Default advertisements seeded successfully.');
  }

  // 3. Ensure system_settings table exists and check if initial seed was already completed
  await queryRun(`
    CREATE TABLE IF NOT EXISTS system_settings (
      \`key\` VARCHAR(100) PRIMARY KEY,
      \`value\` TEXT,
      updatedDate VARCHAR(100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const seedCompleted = await queryGet('SELECT `value` FROM system_settings WHERE `key` = "initial_seed_completed"');
  if (seedCompleted && seedCompleted.value === 'true') {
    console.log('[SEED] System already initialized. Preserving all admin product & user changes.');
    return;
  }

  // Also check if any products already exist in the database (to protect existing installations)
  const productCountRow = await queryGet('SELECT COUNT(*) as cnt FROM products');
  if (productCountRow && productCountRow.cnt > 0) {
    await queryRun('REPLACE INTO system_settings (`key`, `value`) VALUES ("initial_seed_completed", "true")');
    console.log('[SEED] Product catalog already populated. Marked initial seed as completed.');
    return;
  }

  console.log('[SEED] Seeding initial test users and product foundation...');
  const custPassword = await bcrypt.hash('Customer@123', salt);
  const distPassword = await bcrypt.hash('Distributor@123', salt);

  // Active Customer
  await queryRun(
    `INSERT INTO users (
      userId, fullName, email, phoneNumber, passwordHash, userType, accountStatus,
      profileInfo, createdDate, updatedDate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'CUST-101',
      'John Anderson',
      'customer@example.com',
      '+1-555-0199',
      custPassword,
      'Customer',
      'Active',
      'Retail customer / Mobile hobbyist',
      now,
      now
    ]
  );

  // Approved & Active Distributor
  await queryRun(
    `INSERT INTO users (
      userId, fullName, email, phoneNumber, passwordHash, userType, accountStatus,
      profileInfo, createdDate, updatedDate, approvalDate, approvedBy,
      businessName, businessAddress, panVatNumber, contactPerson, businessPhone, businessEmail
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'DIST-201',
      'Robert Miller',
      'approved.dist@mobilecare.com',
      '+1-555-0211',
      distPassword,
      'Distributor',
      'Active',
      'Authorized Regional Mobile Spares Wholesale Distributor',
      now,
      now,
      now,
      'admin@sparedepot.com',
      'Apex Mobile Spares Hub Ltd',
      '742 Tech Boulevard, Industrial Zone, CA 90210',
      'VAT-984210492',
      'Robert Miller (Procurement Director)',
      '+1-555-0212',
      'procurement@apexspares.com'
    ]
  );

  // Pending Distributor (Awaiting Admin Review)
  await queryRun(
    `INSERT INTO users (
      userId, fullName, email, phoneNumber, passwordHash, userType, accountStatus,
      profileInfo, createdDate, updatedDate,
      businessName, businessAddress, panVatNumber, contactPerson, businessPhone, businessEmail
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'DIST-202',
      'Elena Vance',
      'pending.dist@speedyfix.com',
      '+1-555-0322',
      distPassword,
      'Distributor',
      'Pending',
      'Applicant seeking wholesale distributor terms',
      now,
      now,
      'SpeedyFix Electronic Repairs & Distribution',
      '128 Commerce Way, Suite 400, Austin, TX 78701',
      'PAN-448291054',
      'Elena Vance',
      '+1-555-0323',
      'admin@speedyfixrepairs.com'
    ]
  );

  // Rejected Distributor
  await queryRun(
    `INSERT INTO users (
      userId, fullName, email, phoneNumber, passwordHash, userType, accountStatus,
      profileInfo, createdDate, updatedDate, statusRemark,
      businessName, businessAddress, panVatNumber, contactPerson, businessPhone, businessEmail
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'DIST-203',
      'Marcus Brody',
      'rejected.dist@fakeparts.com',
      '+1-555-0444',
      distPassword,
      'Distributor',
      'Rejected',
      'Distributor registration rejected due to non-verifiable tax ID',
      now,
      now,
      'Invalid tax registration and non-matching business license documents.',
      'Brody Gray-Market Goods',
      'PO Box 99, Unknown St',
      'PAN-000000000',
      'Marcus Brody',
      '+1-555-0445',
      'contact@fakeparts.com'
    ]
  );

  // Suspended Distributor
  await queryRun(
    `INSERT INTO users (
      userId, fullName, email, phoneNumber, passwordHash, userType, accountStatus,
      profileInfo, createdDate, updatedDate, statusRemark,
      businessName, businessAddress, panVatNumber, contactPerson, businessPhone, businessEmail
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'DIST-204',
      'Daniel Croft',
      'suspended.dist@latepay.com',
      '+1-555-0555',
      distPassword,
      'Distributor',
      'Suspended',
      'Distributor suspended due to contractual breaches',
      now,
      now,
      'Repeated non-compliance with distributor terms & conditions.',
      'Overdue Spares & Tools Co',
      '55 Harbor View Road, Seattle, WA 98101',
      'VAT-112233445',
      'Daniel Croft',
      '+1-555-0556',
      'billing@overduetools.com'
    ]
  );

  // Foundation MWS Products in INR
  const sampleProducts = [
    {
      name: 'MDC-102 55w type c silicon data cable',
      category: 'Cables',
      sku: 'MWS-CBL-102',
      customerPrice: 120,
      distributorPrice: 45,
      originalPrice: 160,
      badge: 'Bestseller',
      rating: 5.0,
      reviewCount: 1,
      targetVisibility: 'Both',
      description: 'Ultra-flexible 55W Type-C fast charging silicon cable with tangle-free silicone jacket.',
      imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
      inStock: 1
    },
    {
      name: 'MDC-102 55W V8 silicon cable',
      category: 'Cables',
      sku: 'MWS-CBL-102V8',
      customerPrice: 120,
      distributorPrice: 45,
      originalPrice: 160,
      badge: 'New!',
      rating: 0,
      reviewCount: 0,
      targetVisibility: 'Both',
      description: 'Micro USB V8 55W fast charging silicon data cable for legacy and accessory hardware.',
      imageUrl: 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=600&q=80',
      inStock: 1
    },
    {
      name: 'MDC-110 120W type c silicon cable',
      category: 'Cables',
      sku: 'MWS-CBL-110',
      customerPrice: 199,
      distributorPrice: 75,
      originalPrice: 270,
      badge: 'New!',
      rating: 0,
      reviewCount: 0,
      targetVisibility: 'Both',
      description: 'Heavy-duty 120W flash charging silicon cable with reinforced zinc alloy connector head.',
      imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
      inStock: 1
    },
    {
      name: 'MDC-107 120W V8 silicon cable',
      category: 'Cables',
      sku: 'MWS-CBL-107',
      customerPrice: 199,
      distributorPrice: 75,
      originalPrice: 270,
      badge: 'New!',
      rating: 0,
      reviewCount: 0,
      targetVisibility: 'Both',
      description: 'High wattage 120W V8 silicon charging cable with anti-split strain relief joints.',
      imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
      inStock: 1
    },
    {
      name: '65W GaN Super Fast Dual Port Charger (Type-C + USB-A)',
      category: 'Charging',
      sku: 'MWS-CHG-65W',
      customerPrice: 599,
      distributorPrice: 240,
      originalPrice: 899,
      badge: 'Bestseller',
      rating: 4.9,
      reviewCount: 18,
      targetVisibility: 'Both',
      description: 'Gallium Nitride high speed dual charger with temperature control protection.',
      imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
      inStock: 1
    },
    {
      name: '20W PD Fast Charging Cube Adapter',
      category: 'Charging',
      sku: 'MWS-CHG-20W',
      customerPrice: 349,
      distributorPrice: 130,
      originalPrice: 499,
      badge: 'Hot Deal',
      rating: 4.8,
      reviewCount: 32,
      targetVisibility: 'Customer',
      description: 'Compact 20W Power Delivery adapter for rapid device charging.',
      imageUrl: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?auto=format&fit=crop&w=600&q=80',
      inStock: 1
    },
    {
      name: '20000mAh 22.5W Super Fast Power Bank with LED Display',
      category: 'Power',
      sku: 'MWS-PWR-20K',
      customerPrice: 899,
      distributorPrice: 480,
      originalPrice: 1299,
      badge: 'Bestseller',
      rating: 4.9,
      reviewCount: 14,
      targetVisibility: 'Both',
      description: 'High capacity 20000mAh external battery pack with real-time digital display.',
      imageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80',
      inStock: 1
    },
    {
      name: '10000mAh Magnetic Wireless MagSafe Power Bank',
      category: 'Power',
      sku: 'MWS-PWR-10K',
      customerPrice: 749,
      distributorPrice: 380,
      originalPrice: 1099,
      badge: 'New!',
      rating: 4.7,
      reviewCount: 9,
      targetVisibility: 'Customer',
      description: 'Pocket-sized magnetic snap-on wireless power bank with folding kickstand.',
      imageUrl: 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=600&q=80',
      inStock: 1
    },
    {
      name: 'MWS Pro TWS Earbuds with Active Noise Cancellation',
      category: 'Audio',
      sku: 'MWS-AUD-TWS',
      customerPrice: 699,
      distributorPrice: 290,
      originalPrice: 999,
      badge: 'Bestseller',
      rating: 4.9,
      reviewCount: 27,
      targetVisibility: 'Both',
      description: 'True wireless stereo earbuds with immersive sound and clear calling mics.',
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
      inStock: 1
    },
    {
      name: 'Edge-to-Edge 9H Tempered Glass Screen Protector (Pack of 3)',
      category: 'Protection',
      sku: 'MWS-PRO-9H',
      customerPrice: 149,
      distributorPrice: 35,
      originalPrice: 220,
      badge: 'Bestseller',
      rating: 5.0,
      reviewCount: 42,
      targetVisibility: 'Both',
      description: 'Anti-scratch 9H hardness tempered glass with oleophobic fingerprint-resistant coating.',
      imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
      inStock: 1
    },
    {
      name: 'Wholesale Master Box: MDC-102 55W Cables (Box of 100 Pcs)',
      category: 'Cables',
      sku: 'MWS-DIST-CBL-100',
      customerPrice: 0,
      distributorPrice: 3500,
      originalPrice: 5000,
      badge: 'Wholesale Box',
      rating: 5.0,
      reviewCount: 8,
      targetVisibility: 'Distributor',
      description: 'Distributor exclusive wholesale box. 100 factory-sealed retail units at B2B tier pricing.',
      imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
      inStock: 1
    },
    {
      name: 'Wholesale Bulk Carton: 50x 65W GaN Chargers + Display Stand',
      category: 'Charging',
      sku: 'MWS-DIST-CHG-50',
      customerPrice: 0,
      distributorPrice: 9800,
      originalPrice: 14500,
      badge: 'Wholesale Box',
      rating: 5.0,
      reviewCount: 5,
      targetVisibility: 'Distributor',
      description: 'Dealer pack with 50 units and promotional marketing point-of-sale display stand.',
      imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
      inStock: 1
    }
  ];

  for (const prod of sampleProducts) {
    const showCust = prod.targetVisibility === 'Customer' || prod.targetVisibility === 'Both' ? 1 : 0;
    const showDist = prod.targetVisibility === 'Distributor' || prod.targetVisibility === 'Both' ? 1 : 0;
    const cOrig = prod.originalPrice || (prod.customerPrice ? Math.round(prod.customerPrice * 1.25) : 0);
    const cPrice = prod.customerPrice || 0;
    const cDisc = cOrig > cPrice && cOrig > 0 ? Math.round(((cOrig - cPrice) / cOrig) * 100) : 0;

    const dOrig = prod.originalPrice || (prod.distributorPrice ? Math.round(prod.distributorPrice * 1.35) : 0);
    const dPrice = prod.distributorPrice || 0;
    const dDisc = dOrig > dPrice && dOrig > 0 ? Math.round(((dOrig - dPrice) / dOrig) * 100) : 0;

    await queryRun(
      `INSERT INTO products (
        name, category, brand, sku, customerPrice, distributorPrice, originalPrice, badge, rating, reviewCount, targetVisibility, description, imageUrl, inStock,
        showOnCustomerPortal, customerPricingMode, customerOriginalPrice, customerDiscount,
        showOnDistributorPortal, distributorPricingMode, distributorOriginalPrice, distributorDiscount,
        productStatus, specifications
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        prod.name,
        prod.category,
        'MWS Eagle',
        prod.sku,
        cPrice,
        dPrice,
        prod.originalPrice,
        prod.badge,
        prod.rating,
        prod.reviewCount,
        prod.targetVisibility,
        prod.description,
        prod.imageUrl,
        prod.inStock,
        showCust,
        'auto',
        cOrig,
        cDisc,
        showDist,
        'auto',
        dOrig,
        dDisc,
        'Active',
        '• OEM Grade Quality\n• Tested Before Packaging\n• 6-Month Replacement Guarantee'
      ]
    );
  }

  await queryRun('REPLACE INTO system_settings (`key`, `value`) VALUES ("initial_seed_completed", "true")');
  console.log('[SEED] Database seeded successfully with default test users, products, and advertisements!');
};

// Run directly if invoked from command line
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

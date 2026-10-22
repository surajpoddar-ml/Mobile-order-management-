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

  // 3. Check if base users and products already seeded
  const existingCust = await queryGet('SELECT id FROM users WHERE email = "customer@example.com"');
  if (existingCust) {
    console.log('[SEED] Base user catalog already present. Seed check complete.');
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

  // Foundation Products
  const sampleProducts = [
    {
      name: 'Ultra-Tough 9H Tempered Glass Screen Protector (iPhone 15)',
      category: 'Displays',
      sku: 'PRD-SCR-101',
      customerPrice: 12.99,
      distributorPrice: 3.50,
      targetVisibility: 'Customer',
      description: 'Retail packaging screen protector with easy align applicator tray.',
      inStock: 1
    },
    {
      name: 'OEM Grade OLED Display Screen Assembly 10-Pack (iPhone 14)',
      category: 'Displays',
      sku: 'PRD-DISP-202',
      customerPrice: 0,
      distributorPrice: 420.00,
      targetVisibility: 'Distributor',
      description: 'Distributor exclusive wholesale box. Pre-assembled with bezel bracket and digitizer.',
      inStock: 1
    },
    {
      name: 'High Capacity 3900mAh Replacement Battery (Samsung Galaxy S22)',
      category: 'Batteries',
      sku: 'PRD-BAT-303',
      customerPrice: 0,
      distributorPrice: 18.50,
      targetVisibility: 'Distributor',
      description: 'Bulk wholesale certified Li-ion cell with pre-applied adhesive tape.',
      inStock: 1
    },
    {
      name: '65W GaN Super-Fast Dual Port Wall Charger (USB-C + USB-A)',
      category: 'Chargers',
      sku: 'PRD-CHG-404',
      customerPrice: 29.99,
      distributorPrice: 14.20,
      targetVisibility: 'Both',
      description: 'Compact high-efficiency Gallium Nitride charger supporting PD 3.0 & PPS.',
      inStock: 1
    },
    {
      name: 'Braided 100W USB-C to USB-C Fast Charging Cable (2-Meter)',
      category: 'USB cables',
      sku: 'PRD-CBL-505',
      customerPrice: 14.99,
      distributorPrice: 5.80,
      targetVisibility: 'Both',
      description: 'E-Marker chip integrated high speed sync and power delivery cable.',
      inStock: 1
    },
    {
      name: 'TWS Wireless Bluetooth Earphones with Enc Noise Cancelling',
      category: 'Earphones',
      sku: 'PRD-EAR-606',
      customerPrice: 39.99,
      distributorPrice: 19.00,
      targetVisibility: 'Customer',
      description: 'Consumer audio kit with charging dock, wireless charging, and spare ear tips.',
      inStock: 1
    },
    {
      name: 'Universal Type-C Sub-Board Charging Connector Flex (Box of 50)',
      category: 'Mobile connectors',
      sku: 'PRD-CON-707',
      customerPrice: 0,
      distributorPrice: 85.00,
      targetVisibility: 'Distributor',
      description: 'Wholesale technician component tray with micro-soldered mic and antenna contacts.',
      inStock: 1
    },
    {
      name: 'Rugged Magnetic Phone Ring Holder & Stand',
      category: 'Other mobile accessories',
      sku: 'PRD-ACC-808',
      customerPrice: 8.99,
      distributorPrice: 2.75,
      targetVisibility: 'Both',
      description: 'Zinc alloy 360-degree rotation finger grip holder.',
      inStock: 1
    }
  ];

  for (const prod of sampleProducts) {
    await queryRun(
      `INSERT INTO products (
        name, category, sku, customerPrice, distributorPrice, targetVisibility, description, inStock
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        prod.name,
        prod.category,
        prod.sku,
        prod.customerPrice,
        prod.distributorPrice,
        prod.targetVisibility,
        prod.description,
        prod.inStock
      ]
    );
  }

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

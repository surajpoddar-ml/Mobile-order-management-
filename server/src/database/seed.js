import bcrypt from 'bcryptjs';
import { initDb, queryGet, queryRun } from './db.js';

export const seedDatabase = async () => {
  await initDb();

  const adminEmail = 'admin@sparedepot.com';
  const existingAdmin = await queryGet('SELECT * FROM users WHERE email = ?', [adminEmail]);

  if (existingAdmin) {
    console.log('Database already seeded. Skipping initial seed.');
    return;
  }

  console.log('Seeding initial users and product foundation...');
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123', salt);
  const custPassword = await bcrypt.hash('Customer@123', salt);
  const distPassword = await bcrypt.hash('Distributor@123', salt);

  const now = new Date().toISOString();

  // 1. Admin Account
  await queryRun(
    `INSERT INTO users (
      userId, fullName, email, phoneNumber, passwordHash, userType, accountStatus,
      profileInfo, createdDate, updatedDate, lastLogin, approvalDate, approvedBy
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'ADM-001',
      'System Super Admin',
      'admin@sparedepot.com',
      '+1-800-555-0100',
      adminPassword,
      'Admin',
      'Active',
      'Master Administrator of Mobile Spares Depot',
      now,
      now,
      now,
      now,
      'SYSTEM'
    ]
  );

  // 2. Active Customer
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

  // 3. Approved & Active Distributor
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

  // 4. Pending Distributor (Awaiting Admin Review)
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

  // 5. Rejected Distributor
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

  // 6. Suspended Distributor
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

  // 7. Seed Foundation Products for Visibility Verification
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

  console.log('Database seeded successfully with default test users and visibility foundation products!');
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

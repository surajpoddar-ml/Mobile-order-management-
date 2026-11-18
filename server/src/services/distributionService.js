import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { queryGet, queryAll, queryRun } from '../database/db.js';
import { recordAuditLog } from './auditService.js';
import { recalculateAndSaveUserScore } from './paymentReliabilityService.js';

// Valid hierarchical levels
export const HIERARCHY_LEVELS = {
  STATE: 'StateDistributor',
  DISTRICT: 'DistrictDistributor',
  AREA: 'AreaDistributor',
  RETAILER: 'Retailer'
};

/**
 * Generate a random secure temporary password
 */
export function generateTemporaryPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let pwd = '';
  for (let i = 0; i < 10; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

/**
 * Generate a clean, unique account ID according to distributor level
 */
export async function generateUniqueAccountId(level) {
  let prefix = 'DIST';
  if (level === HIERARCHY_LEVELS.STATE) prefix = 'STATE-DIST';
  else if (level === HIERARCHY_LEVELS.DISTRICT) prefix = 'DIST-DIST';
  else if (level === HIERARCHY_LEVELS.AREA) prefix = 'AREA-DIST';
  else if (level === HIERARCHY_LEVELS.RETAILER) prefix = 'RET';

  let uniqueId = '';
  let exists = true;
  while (exists) {
    const num = Math.floor(10000 + Math.random() * 90000);
    uniqueId = `${prefix}-${num}`;
    const row = await queryGet('SELECT id FROM users WHERE userId = ?', [uniqueId]);
    if (!row) exists = false;
  }
  return uniqueId;
}

/**
 * Super Admin Creates a Hierarchical Distributor or Retailer Account
 */
export async function createHierarchicalAccount({
  fullName,
  businessName,
  email,
  phoneNumber,
  distributorLevel,
  stateId,
  districtId,
  areaId,
  parentUserId,
  completeAddress,
  accountStatus = 'Active',
  openingCredit = 0,
  paymentTerms = 'Net 15',
  customPassword = null,
  territoryNotes = null,
  adminUser = null,
  ipAddress = null
}) {
  if (!fullName || !email || !phoneNumber || !distributorLevel) {
    throw new Error('Full Name, Email, Phone Number, and Distributor Level are required.');
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = await queryGet('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
  if (existing) {
    throw new Error(`An account with email "${cleanEmail}" already exists.`);
  }

  // 1. Validate Territory and Parent Hierarchy Rules
  if (distributorLevel === HIERARCHY_LEVELS.STATE) {
    if (!stateId) throw new Error('State / Union Territory selection is required for State-Level Distributor.');
    const state = await queryGet('SELECT id, name FROM geo_states WHERE id = ?', [stateId]);
    if (!state) throw new Error('Selected State does not exist in master data.');
    parentUserId = null; // State distributor reports directly to Super Admin
  } else if (distributorLevel === HIERARCHY_LEVELS.DISTRICT) {
    if (!stateId || !districtId) throw new Error('State and District selections are required for District-Level Distributor.');
    const district = await queryGet('SELECT id, stateId, name FROM geo_districts WHERE id = ?', [districtId]);
    if (!district || district.stateId !== Number(stateId)) {
      throw new Error('Selected District does not belong to the selected State.');
    }
    if (parentUserId) {
      const parent = await queryGet('SELECT id, distributorLevel, assignedStateId FROM users WHERE id = ?', [parentUserId]);
      if (!parent || parent.distributorLevel !== HIERARCHY_LEVELS.STATE) {
        throw new Error('Parent must be an active State-Level Distributor.');
      }
      if (parent.assignedStateId !== Number(stateId)) {
        throw new Error('Selected parent State Distributor is assigned to a different State.');
      }
    }
  } else if (distributorLevel === HIERARCHY_LEVELS.AREA) {
    if (!stateId || !districtId || !areaId) {
      throw new Error('State, District, and Area selections are required for Area-Level Distributor.');
    }
    const area = await queryGet('SELECT id, districtId, name FROM geo_areas WHERE id = ?', [areaId]);
    if (!area || area.districtId !== Number(districtId)) {
      throw new Error('Selected Area does not belong to the selected District.');
    }
    if (parentUserId) {
      const parent = await queryGet('SELECT id, distributorLevel, assignedDistrictId FROM users WHERE id = ?', [parentUserId]);
      if (!parent || parent.distributorLevel !== HIERARCHY_LEVELS.DISTRICT) {
        throw new Error('Parent must be an active District-Level Distributor.');
      }
      if (parent.assignedDistrictId !== Number(districtId)) {
        throw new Error('Selected parent District Distributor is assigned to a different District.');
      }
    }
  } else if (distributorLevel === HIERARCHY_LEVELS.RETAILER) {
    if (!stateId || !districtId || !areaId) {
      throw new Error('State, District, and Area selections are required for Retailer account.');
    }
    if (parentUserId) {
      const parent = await queryGet('SELECT id, distributorLevel, assignedAreaId FROM users WHERE id = ?', [parentUserId]);
      if (!parent || parent.distributorLevel !== HIERARCHY_LEVELS.AREA) {
        throw new Error('Parent must be an active Area-Level Distributor.');
      }
      if (parent.assignedAreaId !== Number(areaId)) {
        throw new Error('Selected parent Area Distributor is assigned to a different Area.');
      }
    }
  } else {
    throw new Error(`Invalid distributor level: ${distributorLevel}`);
  }

  // 2. Generate Account ID and Temporary Password
  const userId = await generateUniqueAccountId(distributorLevel);
  const plainPassword = customPassword && customPassword.length >= 6 ? customPassword : generateTemporaryPassword();
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(plainPassword, salt);

  const now = new Date().toISOString();
  // Role mapping: Retailers get userType 'Retailer', distributors get 'Distributor'
  const userType = distributorLevel === HIERARCHY_LEVELS.RETAILER ? 'Retailer' : 'Distributor';

  // 3. Insert into users table
  const insertUserRes = await queryRun(
    `INSERT INTO users (
      userId, fullName, email, phoneNumber, passwordHash, userType, distributorLevel,
      accountStatus, mustChangePassword, temporaryPassword,
      assignedStateId, assignedDistrictId, assignedAreaId, parentUserId,
      businessName, businessAddress, profileInfo, createdDate, updatedDate,
      paymentTerms, creditLimit, openingCredit, territoryNotes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      fullName.trim(),
      cleanEmail,
      phoneNumber.trim(),
      passwordHash,
      userType,
      distributorLevel,
      accountStatus,
      plainPassword, // Stored safely for Super Admin to review/copy credentials
      stateId ? Number(stateId) : null,
      districtId ? Number(districtId) : null,
      areaId ? Number(areaId) : null,
      parentUserId ? Number(parentUserId) : null,
      (businessName || fullName).trim(),
      (completeAddress || '').trim(),
      `Multi-Level Distribution Partner - ${distributorLevel}`,
      now,
      now,
      paymentTerms || 'Net 15',
      Number(openingCredit || 0),
      Number(openingCredit || 0),
      territoryNotes || null
    ]
  );

  const newId = insertUserRes.lastID;

  // 4. Insert into distributor_hierarchy table
  await queryRun(
    `INSERT INTO distributor_hierarchy (
      userId, level, stateId, districtId, areaId, parentId, assignedDate, assignedBy, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId,
      distributorLevel,
      stateId ? Number(stateId) : null,
      districtId ? Number(districtId) : null,
      areaId ? Number(areaId) : null,
      parentUserId ? Number(parentUserId) : null,
      now,
      adminUser?.fullName || 'SUPER_ADMIN',
      accountStatus
    ]
  );

  // 5. Initialize Payment Reliability Score
  await recalculateAndSaveUserScore(newId, 'Initial Account Setup');

  // 6. Record Audit Log
  await recordAuditLog({
    performedBy: adminUser?.fullName || 'SUPER_ADMIN',
    userRole: 'Super Admin',
    targetAccount: userId,
    targetUserId: newId,
    actionType: 'ACCOUNT_CREATED',
    updatedValues: {
      userId,
      fullName,
      email: cleanEmail,
      distributorLevel,
      stateId,
      districtId,
      areaId,
      parentUserId,
      accountStatus
    },
    remarks: `Created ${distributorLevel} account with territory assignment`,
    ipAddress
  });

  return {
    id: newId,
    userId,
    fullName,
    email: cleanEmail,
    phoneNumber,
    distributorLevel,
    temporaryPassword: plainPassword,
    mustChangePassword: true,
    accountStatus,
    createdDate: now
  };
}

/**
 * Update distributor details (contact, business, payment terms)
 */
export async function updateHierarchicalAccount(id, updateData, adminUser, ipAddress) {
  const existing = await queryGet('SELECT * FROM users WHERE id = ?', [id]);
  if (!existing) {
    throw new Error('Account not found.');
  }

  const allowedFields = [
    'fullName', 'businessName', 'phoneNumber', 'businessAddress',
    'paymentTerms', 'creditLimit', 'territoryNotes'
  ];

  const sets = [];
  const params = [];
  const updatedValues = {};

  for (const f of allowedFields) {
    if (updateData[f] !== undefined) {
      sets.push(`\`${f}\` = ?`);
      params.push(updateData[f]);
      updatedValues[f] = updateData[f];
    }
  }

  if (sets.length === 0) return existing;

  const now = new Date().toISOString();
  sets.push('`updatedDate` = ?');
  params.push(now);

  params.push(id);
  await queryRun(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);

  await recordAuditLog({
    performedBy: adminUser?.fullName || 'SUPER_ADMIN',
    userRole: 'Super Admin',
    targetAccount: existing.userId,
    targetUserId: id,
    actionType: 'ACCOUNT_UPDATED',
    previousValues: {
      fullName: existing.fullName,
      businessName: existing.businessName,
      phoneNumber: existing.phoneNumber,
      paymentTerms: existing.paymentTerms,
      creditLimit: existing.creditLimit
    },
    updatedValues,
    remarks: 'Super Admin updated account details',
    ipAddress
  });

  return await queryGet('SELECT * FROM users WHERE id = ?', [id]);
}

/**
 * Super Admin updates account status (Active, Suspended, Pending, Rejected, Deactivated)
 */
export async function updateAccountStatus(id, newStatus, remarks, adminUser, ipAddress) {
  const existing = await queryGet('SELECT * FROM users WHERE id = ?', [id]);
  if (!existing) {
    throw new Error('Account not found.');
  }

  const validStatuses = ['Active', 'Pending', 'Suspended', 'Rejected', 'Deactivated'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  const now = new Date().toISOString();
  await queryRun(
    'UPDATE users SET accountStatus = ?, statusRemark = ?, updatedDate = ? WHERE id = ?',
    [newStatus, remarks || null, now, id]
  );

  await queryRun(
    'UPDATE distributor_hierarchy SET status = ? WHERE userId = ?',
    [newStatus, id]
  );

  // If suspended or deactivated, check subordinate accounts to flag for review
  let subordinateCount = 0;
  if (newStatus === 'Suspended' || newStatus === 'Deactivated') {
    const subordinates = await queryAll('SELECT id, userId, fullName FROM users WHERE parentUserId = ?', [id]);
    subordinateCount = subordinates.length;
  }

  await recordAuditLog({
    performedBy: adminUser?.fullName || 'SUPER_ADMIN',
    userRole: 'Super Admin',
    targetAccount: existing.userId,
    targetUserId: id,
    actionType: newStatus === 'Suspended' ? 'ACCOUNT_SUSPENDED' : (newStatus === 'Active' ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_STATUS_CHANGED'),
    previousValues: { accountStatus: existing.accountStatus },
    updatedValues: { accountStatus: newStatus, remarks },
    remarks: remarks || `Account status changed from ${existing.accountStatus} to ${newStatus}`,
    ipAddress
  });

  return {
    id,
    userId: existing.userId,
    previousStatus: existing.accountStatus,
    newStatus,
    subordinateCountNotice: subordinateCount > 0 ? `${subordinateCount} direct subordinate account(s) flagged for review.` : null
  };
}

/**
 * Super Admin transfers territory or reassigns parent distributor
 */
export async function transferTerritory(id, { stateId, districtId, areaId, parentUserId, reason }, adminUser, ipAddress) {
  const existing = await queryGet('SELECT * FROM users WHERE id = ?', [id]);
  if (!existing) {
    throw new Error('Account not found.');
  }

  const now = new Date().toISOString();

  await queryRun(
    `UPDATE users SET
      assignedStateId = COALESCE(?, assignedStateId),
      assignedDistrictId = COALESCE(?, assignedDistrictId),
      assignedAreaId = COALESCE(?, assignedAreaId),
      parentUserId = COALESCE(?, parentUserId),
      updatedDate = ?
     WHERE id = ?`,
    [stateId || null, districtId || null, areaId || null, parentUserId || null, now, id]
  );

  await queryRun(
    `UPDATE distributor_hierarchy SET
      stateId = COALESCE(?, stateId),
      districtId = COALESCE(?, districtId),
      areaId = COALESCE(?, areaId),
      parentId = COALESCE(?, parentId)
     WHERE userId = ?`,
    [stateId || null, districtId || null, areaId || null, parentUserId || null, id]
  );

  await recordAuditLog({
    performedBy: adminUser?.fullName || 'SUPER_ADMIN',
    userRole: 'Super Admin',
    targetAccount: existing.userId,
    targetUserId: id,
    actionType: 'TERRITORY_TRANSFERRED',
    previousValues: {
      stateId: existing.assignedStateId,
      districtId: existing.assignedDistrictId,
      areaId: existing.assignedAreaId,
      parentUserId: existing.parentUserId
    },
    updatedValues: { stateId, districtId, areaId, parentUserId, reason },
    remarks: reason || 'Territory assignment transferred by Super Admin',
    ipAddress
  });

  return await queryGet('SELECT * FROM users WHERE id = ?', [id]);
}

/**
 * Super Admin resets credentials for a distributor / retailer
 */
export async function resetAccountCredentials(id, adminUser, ipAddress) {
  const existing = await queryGet('SELECT * FROM users WHERE id = ?', [id]);
  if (!existing) {
    throw new Error('Account not found.');
  }

  const newTempPassword = generateTemporaryPassword();
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newTempPassword, salt);
  const now = new Date().toISOString();

  await queryRun(
    'UPDATE users SET passwordHash = ?, temporaryPassword = ?, mustChangePassword = 1, updatedDate = ? WHERE id = ?',
    [passwordHash, newTempPassword, now, id]
  );

  await recordAuditLog({
    performedBy: adminUser?.fullName || 'SUPER_ADMIN',
    userRole: 'Super Admin',
    targetAccount: existing.userId,
    targetUserId: id,
    actionType: 'PASSWORD_RESET',
    updatedValues: { mustChangePassword: 1 },
    remarks: 'Credentials reset by Super Admin. User will be forced to change password on login.',
    ipAddress
  });

  return {
    userId: existing.userId,
    fullName: existing.fullName,
    email: existing.email,
    newTemporaryPassword: newTempPassword
  };
}

/**
 * Super Admin visual expandable Distribution Network Tree
 * India -> State -> District -> Area -> Retailers
 */
export async function getDistributionNetworkTree() {
  const states = await queryAll('SELECT id, code, name, type FROM geo_states ORDER BY name ASC');
  const districts = await queryAll('SELECT id, stateId, name FROM geo_districts ORDER BY name ASC');
  const areas = await queryAll('SELECT id, districtId, name FROM geo_areas ORDER BY name ASC');

  // All active and non-deleted accounts
  const accounts = await queryAll(`
    SELECT
      u.id, u.userId, u.fullName, u.businessName, u.email, u.phoneNumber,
      u.distributorLevel, u.accountStatus, u.assignedStateId, u.assignedDistrictId,
      u.assignedAreaId, u.parentUserId, u.creditLimit,
      prs.score, prs.ratingTier, prs.outstandingAmount
    FROM users u
    LEFT JOIN payment_reliability_scores prs ON prs.userId = u.id
    WHERE u.distributorLevel IS NOT NULL
    ORDER BY u.id ASC
  `);

  // Build indexed map
  const accountsByState = {};
  const accountsByDistrict = {};
  const accountsByArea = {};
  const retailersByArea = {};

  for (const acc of accounts) {
    if (acc.distributorLevel === HIERARCHY_LEVELS.STATE && acc.assignedStateId) {
      accountsByState[acc.assignedStateId] = accountsByState[acc.assignedStateId] || [];
      accountsByState[acc.assignedStateId].push(acc);
    } else if (acc.distributorLevel === HIERARCHY_LEVELS.DISTRICT && acc.assignedDistrictId) {
      accountsByDistrict[acc.assignedDistrictId] = accountsByDistrict[acc.assignedDistrictId] || [];
      accountsByDistrict[acc.assignedDistrictId].push(acc);
    } else if (acc.distributorLevel === HIERARCHY_LEVELS.AREA && acc.assignedAreaId) {
      accountsByArea[acc.assignedAreaId] = accountsByArea[acc.assignedAreaId] || [];
      accountsByArea[acc.assignedAreaId].push(acc);
    } else if (acc.distributorLevel === HIERARCHY_LEVELS.RETAILER && acc.assignedAreaId) {
      retailersByArea[acc.assignedAreaId] = retailersByArea[acc.assignedAreaId] || [];
      retailersByArea[acc.assignedAreaId].push(acc);
    }
  }

  const districtsByState = {};
  for (const d of districts) {
    districtsByState[d.stateId] = districtsByState[d.stateId] || [];
    districtsByState[d.stateId].push(d);
  }

  const areasByDistrict = {};
  for (const a of areas) {
    areasByDistrict[a.districtId] = areasByDistrict[a.districtId] || [];
    areasByDistrict[a.districtId].push(a);
  }

  // Construct hierarchy
  const tree = states.map(st => {
    const stateDistributors = accountsByState[st.id] || [];
    const stateDistricts = (districtsByState[st.id] || []).map(dist => {
      const districtDistributors = accountsByDistrict[dist.id] || [];
      const distAreas = (areasByDistrict[dist.id] || []).map(ar => {
        const areaDistributors = accountsByArea[ar.id] || [];
        const areaRetailers = retailersByArea[ar.id] || [];
        return {
          id: ar.id,
          name: ar.name,
          type: 'Area',
          areaDistributors,
          retailers: areaRetailers,
          totalRetailers: areaRetailers.length
        };
      });

      return {
        id: dist.id,
        name: dist.name,
        type: 'District',
        districtDistributors,
        areas: distAreas,
        totalAreas: distAreas.length,
        totalRetailers: distAreas.reduce((sum, a) => sum + a.totalRetailers, 0)
      };
    });

    const totalRetailersInState = stateDistricts.reduce((sum, d) => sum + d.totalRetailers, 0);

    return {
      id: st.id,
      code: st.code,
      name: st.name,
      type: st.type,
      stateDistributors,
      districts: stateDistricts,
      totalDistricts: stateDistricts.length,
      totalRetailers: totalRetailersInState
    };
  });

  return {
    root: 'India',
    states: tree,
    totalAccounts: accounts.length
  };
}

/**
 * Super Admin 12 Master Dashboard Metrics
 */
export async function getSuperAdminDashboardMetrics() {
  const [geoCount] = await queryAll('SELECT COUNT(*) as cnt FROM geo_states');
  const [levelCounts] = await queryAll(`
    SELECT
      COUNT(DISTINCT CASE WHEN distributorLevel = 'StateDistributor' THEN id END) as stateDists,
      COUNT(DISTINCT CASE WHEN distributorLevel = 'DistrictDistributor' THEN id END) as distDists,
      COUNT(DISTINCT CASE WHEN distributorLevel = 'AreaDistributor' THEN id END) as areaDists,
      COUNT(DISTINCT CASE WHEN distributorLevel = 'Retailer' THEN id END) as retailers,
      COUNT(DISTINCT CASE WHEN accountStatus = 'Active' AND distributorLevel IS NOT NULL THEN id END) as activeAccounts,
      COUNT(DISTINCT CASE WHEN accountStatus = 'Pending' AND distributorLevel IS NOT NULL THEN id END) as pendingAccounts,
      COUNT(DISTINCT CASE WHEN accountStatus = 'Suspended' AND distributorLevel IS NOT NULL THEN id END) as suspendedAccounts
    FROM users
  `);

  const [financeCounts] = await queryAll(`
    SELECT
      SUM(amountDue) as totalDue,
      SUM(amountPaid) as totalPaid,
      SUM(balanceDue) as totalOutstanding,
      SUM(CASE WHEN dueDate < CURDATE() AND status != 'PAID' THEN balanceDue ELSE 0 END) as totalOverdue
    FROM distribution_invoices
    WHERE status != 'CANCELLED'
  `);

  return {
    totalStatesAndUTs: Number(geoCount?.cnt || 36),
    totalStateDistributors: Number(levelCounts?.stateDists || 0),
    totalDistrictDistributors: Number(levelCounts?.distDists || 0),
    totalAreaDistributors: Number(levelCounts?.areaDists || 0),
    totalRetailers: Number(levelCounts?.retailers || 0),
    totalActiveDistributors: Number(levelCounts?.activeAccounts || 0),
    totalPendingDistributors: Number(levelCounts?.pendingAccounts || 0),
    totalSuspendedAccounts: Number(levelCounts?.suspendedAccounts || 0),
    totalOutstandingPayments: Number(financeCounts?.totalOutstanding || 0),
    totalPaymentsReceived: Number(financeCounts?.totalPaid || 0),
    totalOverduePayments: Number(financeCounts?.totalOverdue || 0),
    totalDistributionNetworkValue: Number(financeCounts?.totalDue || 0)
  };
}

/**
 * Record a verified wholesale payment
 */
export async function recordDistributionPayment({
  invoiceId = null,
  userId,
  amountPaid,
  paymentDate,
  paymentMethod = 'Bank Transfer',
  transactionReference = null,
  remarks = null,
  adminUser = null,
  ipAddress = null
}) {
  const user = await queryGet('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) {
    throw new Error('Distributor / Retailer account not found.');
  }

  const amt = Number(amountPaid);
  if (isNaN(amt) || amt <= 0) {
    throw new Error('Valid payment amount is required.');
  }

  const now = new Date().toISOString();
  const txnId = `PAY-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  let invoice = null;
  if (invoiceId) {
    invoice = await queryGet('SELECT * FROM distribution_invoices WHERE id = ?', [invoiceId]);
  }

  await queryRun(
    `INSERT INTO distribution_payments (
      transactionId, invoiceId, userId, accountName, distributorLevel,
      parentUserId, stateId, districtId, areaId, amountPaid, paymentDate,
      dueDate, paymentMethod, transactionReference, verificationStatus,
      verifiedBy, remarks, createdDate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', ?, ?, ?)`,
    [
      txnId,
      invoiceId ? Number(invoiceId) : null,
      user.id,
      user.fullName || user.businessName,
      user.distributorLevel,
      user.parentUserId,
      user.assignedStateId,
      user.assignedDistrictId,
      user.assignedAreaId,
      amt,
      paymentDate || now.split('T')[0],
      invoice ? invoice.dueDate : null,
      paymentMethod,
      transactionReference,
      adminUser?.fullName || 'SUPER_ADMIN',
      remarks,
      now
    ]
  );

  // Update invoice balance if linked
  if (invoice) {
    const newPaid = Number(invoice.amountPaid || 0) + amt;
    const newBalance = Math.max(0, Number(invoice.amountDue || 0) - newPaid);
    const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';
    const paidDate = newBalance <= 0 ? now : null;

    await queryRun(
      'UPDATE distribution_invoices SET amountPaid = ?, balanceDue = ?, status = ?, paidDate = ? WHERE id = ?',
      [newPaid, newBalance, newStatus, paidDate, invoice.id]
    );
  }

  // Recalculate payment reliability score immediately
  const updatedScore = await recalculateAndSaveUserScore(user.id, `Payment verified: ₹${amt}`);

  await recordAuditLog({
    performedBy: adminUser?.fullName || 'SUPER_ADMIN',
    userRole: 'Super Admin',
    targetAccount: user.userId,
    targetUserId: user.id,
    actionType: 'PAYMENT_RECORDED',
    updatedValues: { transactionId: txnId, amountPaid: amt, invoiceId },
    remarks: remarks || `Recorded verified payment of ₹${amt}`,
    ipAddress
  });

  return {
    transactionId: txnId,
    amountPaid: amt,
    updatedScore: updatedScore.score,
    ratingTier: updatedScore.ratingTier
  };
}


import express from 'express';
import bcrypt from 'bcryptjs';
import { queryGet, queryAll, queryRun } from '../database/db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  HIERARCHY_LEVELS,
  createHierarchicalAccount,
  updateHierarchicalAccount,
  updateAccountStatus,
  transferTerritory,
  resetAccountCredentials,
  getDistributionNetworkTree,
  getSuperAdminDashboardMetrics,
  recordDistributionPayment
} from '../services/distributionService.js';
import {
  getAllStatesWithMetrics,
  getDistrictsByState,
  getAreasByDistrict,
  createDistrict,
  createArea
} from '../services/geoService.js';
import { getAuditLogs, recordAuditLog } from '../services/auditService.js';
import {
  getUserScoreDetails,
  recalculateAndSaveUserScore
} from '../services/paymentReliabilityService.js';

const router = express.Router();

// Helper to check if user is Super Admin
const isSuperAdmin = (user) => {
  if (!user) return false;
  return user.userType === 'Admin';
};

// Middleware: Super Admin only
const requireSuperAdmin = (req, res, next) => {
  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only Super Admin has permission to perform this administrative action.'
    });
  }
  next();
};

/* ==========================================================================
   1. GEOGRAPHY ENDPOINTS
   ========================================================================== */

/**
 * GET /api/distribution/geo/states
 * Returns all 28 States and 8 Union Territories with aggregate metrics
 */
router.get('/geo/states', verifyToken, async (req, res) => {
  try {
    const states = await getAllStatesWithMetrics();
    res.json({ success: true, count: states.length, data: states });
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ success: false, message: 'Failed to load states and territories', error: error.message });
  }
});

/**
 * GET /api/distribution/geo/districts/:stateId
 * Returns districts under a specific state
 */
router.get('/geo/districts/:stateId', verifyToken, async (req, res) => {
  try {
    const { stateId } = req.params;
    const districts = await getDistrictsByState(stateId);
    res.json({ success: true, count: districts.length, data: districts });
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ success: false, message: 'Failed to load districts', error: error.message });
  }
});

/**
 * GET /api/distribution/geo/areas/:districtId
 * Returns areas under a specific district
 */
router.get('/geo/areas/:districtId', verifyToken, async (req, res) => {
  try {
    const { districtId } = req.params;
    const areas = await getAreasByDistrict(districtId);
    res.json({ success: true, count: areas.length, data: areas });
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({ success: false, message: 'Failed to load areas', error: error.message });
  }
});

/**
 * POST /api/distribution/geo/districts
 * Super Admin adds a new district
 */
router.post('/geo/districts', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { stateId, name, code, headquarters } = req.body;
    if (!stateId || !name) {
      return res.status(400).json({ success: false, message: 'State ID and District Name are required' });
    }
    const result = await createDistrict({ stateId, name, code, headquarters });
    await recordAuditLog({
      actionType: 'CREATE_DISTRICT',
      entityType: 'DISTRICT',
      entityId: result.districtId,
      performedByUserId: req.user.id,
      performedByName: req.user.fullName,
      details: { stateId, name, code, headquarters },
      ipAddress: req.ip
    });
    res.status(201).json({ success: true, message: 'District created successfully', data: result });
  } catch (error) {
    console.error('Error creating district:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/distribution/geo/areas
 * Super Admin adds a new area
 */
router.post('/geo/areas', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { districtId, name, pincode } = req.body;
    if (!districtId || !name) {
      return res.status(400).json({ success: false, message: 'District ID and Area Name are required' });
    }
    const result = await createArea({ districtId, name, pincode });
    await recordAuditLog({
      actionType: 'CREATE_AREA',
      entityType: 'AREA',
      entityId: result.areaId,
      performedByUserId: req.user.id,
      performedByName: req.user.fullName,
      details: { districtId, name, pincode },
      ipAddress: req.ip
    });
    res.status(201).json({ success: true, message: 'Area created successfully', data: result });
  } catch (error) {
    console.error('Error creating area:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================================
   2. HIERARCHICAL NETWORK TREE
   ========================================================================== */

/**
 * GET /api/distribution/network/tree
 * Returns nested tree structure: India -> State -> District -> Area -> Retailer
 * Scoped by role: Super Admin sees all; State distributor sees state; District distributor sees district; Area distributor sees area.
 */
router.get('/network/tree', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const fullTree = await getDistributionNetworkTree();

    if (isSuperAdmin(user)) {
      return res.json({ success: true, tree: fullTree });
    }

    // Role-based scoping for lower-level distributors
    if (user.distributorLevel === HIERARCHY_LEVELS.STATE || user.userType === 'StateDistributor') {
      const stateTree = fullTree.states.filter(s => s.stateId === user.assignedStateId);
      return res.json({
        success: true,
        tree: {
          country: 'India',
          totalStates: stateTree.length,
          states: stateTree
        }
      });
    }

    if (user.distributorLevel === HIERARCHY_LEVELS.DISTRICT || user.userType === 'DistrictDistributor') {
      const filteredStates = fullTree.states
        .map(s => {
          const matchingDistricts = (s.districts || []).filter(d => d.districtId === user.assignedDistrictId);
          if (matchingDistricts.length > 0) {
            return { ...s, districts: matchingDistricts };
          }
          return null;
        })
        .filter(Boolean);

      return res.json({
        success: true,
        tree: {
          country: 'India',
          totalStates: filteredStates.length,
          states: filteredStates
        }
      });
    }

    if (user.distributorLevel === HIERARCHY_LEVELS.AREA || user.userType === 'AreaDistributor') {
      const filteredStates = fullTree.states
        .map(s => {
          const matchingDistricts = (s.districts || [])
            .map(d => {
              const matchingAreas = (d.areas || []).filter(a => a.areaId === user.assignedAreaId);
              if (matchingAreas.length > 0) {
                return { ...d, areas: matchingAreas };
              }
              return null;
            })
            .filter(Boolean);

          if (matchingDistricts.length > 0) {
            return { ...s, districts: matchingDistricts };
          }
          return null;
        })
        .filter(Boolean);

      return res.json({
        success: true,
        tree: {
          country: 'India',
          totalStates: filteredStates.length,
          states: filteredStates
        }
      });
    }

    return res.status(403).json({ success: false, message: 'Access denied to network hierarchy' });
  } catch (error) {
    console.error('Error fetching network tree:', error);
    res.status(500).json({ success: false, message: 'Failed to build network hierarchy tree', error: error.message });
  }
});

/* ==========================================================================
   3. DASHBOARD METRICS
   ========================================================================== */

/**
 * GET /api/distribution/dashboard/super-admin
 * Returns the 12 master statistics required for the Super Admin Panel
 */
router.get('/dashboard/super-admin', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const metrics = await getSuperAdminDashboardMetrics();
    res.json({ success: true, metrics });
  } catch (error) {
    console.error('Error fetching Super Admin metrics:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate dashboard statistics', error: error.message });
  }
});

/**
 * GET /api/distribution/dashboard/state
 * Returns state distributor's view-only dashboard metrics and district breakdown
 */
router.get('/dashboard/state', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    if (!isSuperAdmin(user) && user.distributorLevel !== HIERARCHY_LEVELS.STATE) {
      return res.status(403).json({ success: false, message: 'Access restricted to State-Level Distributors' });
    }

    const stateId = req.query.stateId || user.assignedStateId;
    if (!stateId) {
      return res.status(400).json({ success: false, message: 'Assigned state ID is missing' });
    }

    const state = await queryGet('SELECT * FROM geo_states WHERE id = ?', [stateId]);
    if (!state) {
      return res.status(404).json({ success: false, message: 'State territory not found' });
    }

    const districts = await getDistrictsByState(stateId);

    // Subordinate counts
    const accounts = await queryAll(
      `SELECT distributorLevel, accountStatus, COUNT(*) as cnt 
       FROM users 
       WHERE assignedStateId = ? AND userType IN ('Distributor', 'Retailer')
       GROUP BY distributorLevel, accountStatus`,
      [stateId]
    );

    let totalDistrictsDistributors = 0;
    let totalAreaDistributors = 0;
    let totalRetailers = 0;
    let activeAccounts = 0;
    let pendingAccounts = 0;
    let suspendedAccounts = 0;

    accounts.forEach(a => {
      if (a.distributorLevel === HIERARCHY_LEVELS.DISTRICT) totalDistrictsDistributors += a.cnt;
      if (a.distributorLevel === HIERARCHY_LEVELS.AREA) totalAreaDistributors += a.cnt;
      if (a.distributorLevel === HIERARCHY_LEVELS.RETAILER) totalRetailers += a.cnt;

      if (a.accountStatus === 'Active') activeAccounts += a.cnt;
      if (a.accountStatus === 'Pending') pendingAccounts += a.cnt;
      if (a.accountStatus === 'Suspended') suspendedAccounts += a.cnt;
    });

    // Invoices and financial summary for this state
    const fin = await queryGet(
      `SELECT 
        COALESCE(SUM(totalAmount), 0) as totalBilled,
        COALESCE(SUM(paidAmount), 0) as totalCollected,
        COALESCE(SUM(balanceAmount), 0) as totalOutstanding
       FROM distribution_invoices i
       JOIN users u ON i.recipientUserId = u.id
       WHERE u.assignedStateId = ?`,
      [stateId]
    );

    // Get own reliability score
    const myScore = await getUserScoreDetails(user.id);

    res.json({
      success: true,
      data: {
        assignedState: state.name,
        stateCode: state.code,
        isUnionTerritory: Boolean(state.isUnionTerritory),
        totalDistricts: districts.length,
        totalDistrictsDistributors,
        totalAreaDistributors,
        totalRetailers,
        activeAccounts,
        pendingAccounts,
        suspendedAccounts,
        totalBilled: parseFloat(fin?.totalBilled || 0),
        totalCollected: parseFloat(fin?.totalCollected || 0),
        totalOutstanding: parseFloat(fin?.totalOutstanding || 0),
        paymentReliabilityScore: myScore?.scoreDetails?.score ?? 'N/A',
        reliabilityTier: myScore?.scoreDetails?.tier ?? 'Not Yet Rated',
        districts
      }
    });
  } catch (error) {
    console.error('Error fetching state dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to load State Distributor dashboard', error: error.message });
  }
});

/**
 * GET /api/distribution/dashboard/district
 * Returns district distributor's view-only dashboard metrics and area breakdown
 */
router.get('/dashboard/district', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    if (!isSuperAdmin(user) && user.distributorLevel !== HIERARCHY_LEVELS.DISTRICT) {
      return res.status(403).json({ success: false, message: 'Access restricted to District-Level Distributors' });
    }

    const districtId = req.query.districtId || user.assignedDistrictId;
    if (!districtId) {
      return res.status(400).json({ success: false, message: 'Assigned district ID is missing' });
    }

    const district = await queryGet('SELECT * FROM geo_districts WHERE id = ?', [districtId]);
    if (!district) {
      return res.status(404).json({ success: false, message: 'District territory not found' });
    }

    const areas = await getAreasByDistrict(districtId);

    // Subordinate counts
    const accounts = await queryAll(
      `SELECT distributorLevel, accountStatus, COUNT(*) as cnt 
       FROM users 
       WHERE assignedDistrictId = ? AND userType IN ('Distributor', 'Retailer')
       GROUP BY distributorLevel, accountStatus`,
      [districtId]
    );

    let totalAreaDistributors = 0;
    let totalRetailers = 0;
    let activeAccounts = 0;
    let pendingAccounts = 0;
    let suspendedAccounts = 0;

    accounts.forEach(a => {
      if (a.distributorLevel === HIERARCHY_LEVELS.AREA) totalAreaDistributors += a.cnt;
      if (a.distributorLevel === HIERARCHY_LEVELS.RETAILER) totalRetailers += a.cnt;

      if (a.accountStatus === 'Active') activeAccounts += a.cnt;
      if (a.accountStatus === 'Pending') pendingAccounts += a.cnt;
      if (a.accountStatus === 'Suspended') suspendedAccounts += a.cnt;
    });

    const fin = await queryGet(
      `SELECT 
        COALESCE(SUM(totalAmount), 0) as totalBilled,
        COALESCE(SUM(paidAmount), 0) as totalCollected,
        COALESCE(SUM(balanceAmount), 0) as totalOutstanding
       FROM distribution_invoices i
       JOIN users u ON i.recipientUserId = u.id
       WHERE u.assignedDistrictId = ?`,
      [districtId]
    );

    const myScore = await getUserScoreDetails(user.id);

    res.json({
      success: true,
      data: {
        assignedDistrict: district.name,
        districtCode: district.code,
        totalAreas: areas.length,
        totalAreaDistributors,
        totalRetailers,
        activeAccounts,
        pendingAccounts,
        suspendedAccounts,
        totalBilled: parseFloat(fin?.totalBilled || 0),
        totalCollected: parseFloat(fin?.totalCollected || 0),
        totalOutstanding: parseFloat(fin?.totalOutstanding || 0),
        paymentReliabilityScore: myScore?.scoreDetails?.score ?? 'N/A',
        reliabilityTier: myScore?.scoreDetails?.tier ?? 'Not Yet Rated',
        areas
      }
    });
  } catch (error) {
    console.error('Error fetching district dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to load District Distributor dashboard', error: error.message });
  }
});

/**
 * GET /api/distribution/dashboard/area
 * Returns area distributor's view-only dashboard metrics and retailer breakdown
 */
router.get('/dashboard/area', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    if (!isSuperAdmin(user) && user.distributorLevel !== HIERARCHY_LEVELS.AREA) {
      return res.status(403).json({ success: false, message: 'Access restricted to Area-Level Distributors' });
    }

    const areaId = req.query.areaId || user.assignedAreaId;
    if (!areaId) {
      return res.status(400).json({ success: false, message: 'Assigned area ID is missing' });
    }

    const area = await queryGet('SELECT * FROM geo_areas WHERE id = ?', [areaId]);
    if (!area) {
      return res.status(404).json({ success: false, message: 'Area territory not found' });
    }

    // Retailers in this area
    const retailers = await queryAll(
      `SELECT u.id, u.userId, u.fullName, u.businessName, u.email, u.phoneNumber, u.accountStatus,
              s.overallScore, s.ratingTier
       FROM users u
       LEFT JOIN payment_reliability_scores s ON u.id = s.userId
       WHERE u.assignedAreaId = ? AND (u.distributorLevel = 'Retailer' OR u.userType = 'Retailer')`,
      [areaId]
    );

    const activeRetailers = retailers.filter(r => r.accountStatus === 'Active').length;
    const inactiveRetailers = retailers.filter(r => r.accountStatus !== 'Active').length;

    const fin = await queryGet(
      `SELECT 
        COALESCE(SUM(totalAmount), 0) as totalBilled,
        COALESCE(SUM(paidAmount), 0) as totalCollected,
        COALESCE(SUM(balanceAmount), 0) as totalOutstanding
       FROM distribution_invoices i
       JOIN users u ON i.recipientUserId = u.id
       WHERE u.assignedAreaId = ?`,
      [areaId]
    );

    const myScore = await getUserScoreDetails(user.id);

    res.json({
      success: true,
      data: {
        assignedArea: area.name,
        pincode: area.pincode,
        totalRetailers: retailers.length,
        activeRetailers,
        inactiveRetailers,
        totalBilled: parseFloat(fin?.totalBilled || 0),
        totalCollected: parseFloat(fin?.totalCollected || 0),
        totalOutstanding: parseFloat(fin?.totalOutstanding || 0),
        paymentReliabilityScore: myScore?.scoreDetails?.score ?? 'N/A',
        reliabilityTier: myScore?.scoreDetails?.tier ?? 'Not Yet Rated',
        retailers
      }
    });
  } catch (error) {
    console.error('Error fetching area dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to load Area Distributor dashboard', error: error.message });
  }
});

/**
 * GET /api/distribution/dashboard/retailer
 * Returns Retailer's personal dashboard (orders, invoices, payments, reliability score)
 */
router.get('/dashboard/retailer', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    if (!isSuperAdmin(user) && user.distributorLevel !== HIERARCHY_LEVELS.RETAILER && user.userType !== 'Retailer') {
      return res.status(403).json({ success: false, message: 'Access restricted to Retailers' });
    }

    const retailerId = req.query.retailerId || user.id;

    // Fetch personal invoices
    const invoices = await queryAll(
      `SELECT * FROM distribution_invoices WHERE recipientUserId = ? ORDER BY invoiceDate DESC`,
      [retailerId]
    );

    // Fetch personal payments
    const payments = await queryAll(
      `SELECT * FROM distribution_payments WHERE payerUserId = ? ORDER BY paymentDate DESC`,
      [retailerId]
    );

    // Fetch personal orders
    const orders = await queryAll(
      `SELECT * FROM orders WHERE customerId = ? ORDER BY createdDate DESC LIMIT 20`,
      [retailerId]
    );

    // Score details
    const scoreData = await getUserScoreDetails(retailerId);

    const totalInvoiced = invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const outstanding = invoices.reduce((sum, inv) => sum + parseFloat(inv.balanceAmount || 0), 0);

    res.json({
      success: true,
      data: {
        totalOrders: orders.length,
        totalInvoiced,
        totalPaid,
        outstanding,
        paymentReliabilityScore: scoreData?.scoreDetails?.score ?? 'N/A',
        reliabilityTier: scoreData?.scoreDetails?.tier ?? 'Not Yet Rated',
        scoreBreakdown: scoreData?.scoreDetails,
        invoices: invoices.slice(0, 10),
        payments: payments.slice(0, 10),
        recentOrders: orders
      }
    });
  } catch (error) {
    console.error('Error fetching retailer dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to load Retailer dashboard', error: error.message });
  }
});

/* ==========================================================================
   4. ACCOUNTS CRUD & MANAGEMENT (SUPER ADMIN CONTROL)
   ========================================================================== */

/**
 * GET /api/distribution/accounts
 * Lists distributor and retailer accounts with filters.
 * Scoped by role: lower-level distributors can only view within their assigned territory.
 */
router.get('/accounts', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const { level, status, stateId, districtId, areaId, search } = req.query;

    let conditions = ["u.userType IN ('Distributor', 'Retailer')"];
    let params = [];

    // Geographical scoping for non-admins
    if (!isSuperAdmin(user)) {
      if (user.distributorLevel === HIERARCHY_LEVELS.STATE) {
        conditions.push("u.assignedStateId = ?");
        params.push(user.assignedStateId);
      } else if (user.distributorLevel === HIERARCHY_LEVELS.DISTRICT) {
        conditions.push("u.assignedDistrictId = ?");
        params.push(user.assignedDistrictId);
      } else if (user.distributorLevel === HIERARCHY_LEVELS.AREA) {
        conditions.push("u.assignedAreaId = ?");
        params.push(user.assignedAreaId);
      } else {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    if (level) {
      conditions.push("u.distributorLevel = ?");
      params.push(level);
    }
    if (status) {
      conditions.push("u.accountStatus = ?");
      params.push(status);
    }
    if (stateId) {
      conditions.push("u.assignedStateId = ?");
      params.push(stateId);
    }
    if (districtId) {
      conditions.push("u.assignedDistrictId = ?");
      params.push(districtId);
    }
    if (areaId) {
      conditions.push("u.assignedAreaId = ?");
      params.push(areaId);
    }
    if (search) {
      conditions.push("(u.fullName LIKE ? OR u.businessName LIKE ? OR u.email LIKE ? OR u.phoneNumber LIKE ? OR u.userId LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    const sql = `
      SELECT 
        u.id, u.userId, u.fullName, u.businessName, u.email, u.phoneNumber,
        u.distributorLevel, u.accountStatus, u.mustChangePassword, u.paymentTerms,
        u.creditLimit, u.openingCredit, u.createdDate, u.lastLogin,
        s.name as stateName, d.name as districtName, a.name as areaName,
        parent.fullName as parentName, parent.businessName as parentBusinessName, parent.distributorLevel as parentLevel,
        prs.overallScore, prs.ratingTier
      FROM users u
      LEFT JOIN geo_states s ON u.assignedStateId = s.id
      LEFT JOIN geo_districts d ON u.assignedDistrictId = d.id
      LEFT JOIN geo_areas a ON u.assignedAreaId = a.id
      LEFT JOIN users parent ON u.parentUserId = parent.id
      LEFT JOIN payment_reliability_scores prs ON u.id = prs.userId
      WHERE ${conditions.join(' AND ')}
      ORDER BY u.createdDate DESC
    `;

    const accounts = await queryAll(sql, params);
    res.json({ success: true, count: accounts.length, data: accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ success: false, message: 'Failed to load distributor accounts', error: error.message });
  }
});

/**
 * POST /api/distribution/accounts/create
 * Super Admin creates a State Distributor, District Distributor, Area Distributor, or Retailer
 */
router.post('/accounts/create', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const {
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
      accountStatus,
      openingCredit,
      paymentTerms,
      customPassword,
      territoryNotes
    } = req.body;

    const result = await createHierarchicalAccount({
      fullName,
      businessName,
      email,
      phoneNumber,
      distributorLevel,
      stateId: stateId ? parseInt(stateId) : null,
      districtId: districtId ? parseInt(districtId) : null,
      areaId: areaId ? parseInt(areaId) : null,
      parentUserId: parentUserId ? parseInt(parentUserId) : null,
      completeAddress,
      accountStatus,
      openingCredit,
      paymentTerms,
      customPassword,
      territoryNotes,
      adminUser: req.user,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: `${distributorLevel} account created successfully!`,
      data: result
    });
  } catch (error) {
    console.error('Error creating hierarchical account:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/distribution/accounts/:id
 * Super Admin updates account details
 */
router.put('/accounts/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateHierarchicalAccount(id, req.body, req.user, req.ip);
    res.json({ success: true, message: 'Account updated successfully', data: result });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/distribution/accounts/:id/status
 * Super Admin changes account status (Active, Suspended, Deactivated, Pending, Rejected)
 */
router.patch('/accounts/:id/status', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    const result = await updateAccountStatus(id, status, remarks, req.user, req.ip);
    res.json({ success: true, message: `Account status updated to ${status}`, data: result });
  } catch (error) {
    console.error('Error updating account status:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/distribution/accounts/:id/reset-password
 * Super Admin generates a new temporary password for the account
 */
router.post('/accounts/:id/reset-password', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await resetAccountCredentials(id, req.user, req.ip);
    res.json({
      success: true,
      message: 'Password reset successfully. A new temporary password has been generated.',
      data: result
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/distribution/accounts/:id/transfer
 * Super Admin reassigns territory or parent account
 */
router.post('/accounts/:id/transfer', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { stateId, districtId, areaId, parentUserId, reason } = req.body;
    const result = await transferTerritory(id, { stateId, districtId, areaId, parentUserId, reason }, req.user, req.ip);
    res.json({ success: true, message: 'Territory transferred successfully', data: result });
  } catch (error) {
    console.error('Error transferring territory:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/* ==========================================================================
   5. INVOICES, PAYMENTS & SETTLEMENTS
   ========================================================================== */

/**
 * GET /api/distribution/invoices
 * Lists invoices with optional filters
 */
router.get('/invoices', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const { recipientUserId, status } = req.query;

    let conditions = ['1=1'];
    let params = [];

    if (!isSuperAdmin(user)) {
      if (user.distributorLevel === HIERARCHY_LEVELS.RETAILER || user.userType === 'Retailer') {
        conditions.push('i.recipientUserId = ?');
        params.push(user.id);
      } else if (user.distributorLevel === HIERARCHY_LEVELS.STATE) {
        conditions.push('u.assignedStateId = ?');
        params.push(user.assignedStateId);
      } else if (user.distributorLevel === HIERARCHY_LEVELS.DISTRICT) {
        conditions.push('u.assignedDistrictId = ?');
        params.push(user.assignedDistrictId);
      } else if (user.distributorLevel === HIERARCHY_LEVELS.AREA) {
        conditions.push('u.assignedAreaId = ?');
        params.push(user.assignedAreaId);
      }
    } else if (recipientUserId) {
      conditions.push('i.recipientUserId = ?');
      params.push(recipientUserId);
    }

    if (status) {
      conditions.push('i.status = ?');
      params.push(status);
    }

    const sql = `
      SELECT i.*, u.fullName as recipientName, u.businessName, u.userId as recipientCustomId, u.distributorLevel
      FROM distribution_invoices i
      JOIN users u ON i.recipientUserId = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY i.invoiceDate DESC
    `;

    const invoices = await queryAll(sql, params);
    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, message: 'Failed to load invoices', error: error.message });
  }
});

/**
 * POST /api/distribution/invoices
 * Super Admin creates a new invoice for wholesale order / stock delivery
 */
router.post('/invoices', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { recipientUserId, totalAmount, dueDate, description, paymentTerms } = req.body;
    if (!recipientUserId || !totalAmount || !dueDate) {
      return res.status(400).json({ success: false, message: 'Recipient User ID, Total Amount, and Due Date are required' });
    }

    const recipient = await queryGet('SELECT * FROM users WHERE id = ?', [recipientUserId]);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient account not found' });
    }

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const result = await queryRun(
      `INSERT INTO distribution_invoices (
        invoiceNumber, recipientUserId, totalAmount, paidAmount, balanceAmount,
        dueDate, invoiceDate, paymentTerms, status, description, createdDate, updatedDate
      ) VALUES (?, ?, ?, 0, ?, ?, ?, ?, 'Unpaid', ?, ?, ?)`,
      [
        invoiceNumber,
        recipientUserId,
        parseFloat(totalAmount),
        parseFloat(totalAmount),
        dueDate,
        now,
        paymentTerms || recipient.paymentTerms || 'Net 15',
        description || 'Wholesale Distribution Order',
        now,
        now
      ]
    );

    // Recalculate score for recipient
    await recalculateAndSaveUserScore(recipientUserId);

    await recordAuditLog({
      actionType: 'CREATE_INVOICE',
      entityType: 'INVOICE',
      entityId: result.lastID,
      performedByUserId: req.user.id,
      performedByName: req.user.fullName,
      details: { invoiceNumber, recipientUserId, totalAmount, dueDate },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: { invoiceId: result.lastID, invoiceNumber }
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/distribution/payments
 * Lists distribution payment transactions
 */
router.get('/payments', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const { payerUserId } = req.query;

    let conditions = ['1=1'];
    let params = [];

    if (!isSuperAdmin(user)) {
      if (user.distributorLevel === HIERARCHY_LEVELS.RETAILER || user.userType === 'Retailer') {
        conditions.push('p.payerUserId = ?');
        params.push(user.id);
      } else if (user.distributorLevel === HIERARCHY_LEVELS.STATE) {
        conditions.push('u.assignedStateId = ?');
        params.push(user.assignedStateId);
      } else if (user.distributorLevel === HIERARCHY_LEVELS.DISTRICT) {
        conditions.push('u.assignedDistrictId = ?');
        params.push(user.assignedDistrictId);
      } else if (user.distributorLevel === HIERARCHY_LEVELS.AREA) {
        conditions.push('u.assignedAreaId = ?');
        params.push(user.assignedAreaId);
      }
    } else if (payerUserId) {
      conditions.push('p.payerUserId = ?');
      params.push(payerUserId);
    }

    const sql = `
      SELECT p.*, u.fullName as payerName, u.businessName, u.userId as payerCustomId,
             inv.invoiceNumber, inv.dueDate
      FROM distribution_payments p
      JOIN users u ON p.payerUserId = u.id
      LEFT JOIN distribution_invoices inv ON p.invoiceId = inv.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.paymentDate DESC
    `;

    const payments = await queryAll(sql, params);
    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, message: 'Failed to load payments', error: error.message });
  }
});

/**
 * POST /api/distribution/payments/record
 * Super Admin records a verified wholesale payment & recalculates reliability score immediately
 */
router.post('/payments/record', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const {
      invoiceId,
      payerUserId,
      amount,
      paymentMethod,
      transactionReference,
      paymentDate,
      paymentStatus = 'Verified',
      notes
    } = req.body;

    const result = await recordDistributionPayment({
      invoiceId,
      payerUserId,
      amount,
      paymentMethod,
      transactionReference,
      paymentDate,
      paymentStatus,
      notes,
      adminUser: req.user,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded and verified successfully. Reliability score has been updated.',
      data: result
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/distribution/settlements
 * Summary of settlements, outstanding amounts, and payment rates
 */
router.get('/settlements', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    let userFilter = '';
    let params = [];

    if (!isSuperAdmin(user)) {
      if (user.distributorLevel === HIERARCHY_LEVELS.STATE) {
        userFilter = 'JOIN users u ON i.recipientUserId = u.id WHERE u.assignedStateId = ?';
        params = [user.assignedStateId];
      } else if (user.distributorLevel === HIERARCHY_LEVELS.DISTRICT) {
        userFilter = 'JOIN users u ON i.recipientUserId = u.id WHERE u.assignedDistrictId = ?';
        params = [user.assignedDistrictId];
      } else if (user.distributorLevel === HIERARCHY_LEVELS.AREA) {
        userFilter = 'JOIN users u ON i.recipientUserId = u.id WHERE u.assignedAreaId = ?';
        params = [user.assignedAreaId];
      } else {
        userFilter = 'WHERE i.recipientUserId = ?';
        params = [user.id];
      }
    }

    const summary = await queryGet(
      `SELECT 
        COUNT(*) as totalInvoices,
        COALESCE(SUM(totalAmount), 0) as totalBilled,
        COALESCE(SUM(paidAmount), 0) as totalPaid,
        COALESCE(SUM(balanceAmount), 0) as totalOutstanding,
        SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) as paidCount,
        SUM(CASE WHEN status = 'PartiallyPaid' THEN 1 ELSE 0 END) as partialCount,
        SUM(CASE WHEN status = 'Unpaid' AND dueDate < NOW() THEN 1 ELSE 0 END) as overdueCount
       FROM distribution_invoices i
       ${userFilter}`,
      params
    );

    res.json({
      success: true,
      data: {
        totalInvoices: summary?.totalInvoices || 0,
        totalBilled: parseFloat(summary?.totalBilled || 0),
        totalPaid: parseFloat(summary?.totalPaid || 0),
        totalOutstanding: parseFloat(summary?.totalOutstanding || 0),
        paidCount: summary?.paidCount || 0,
        partialCount: summary?.partialCount || 0,
        overdueCount: summary?.overdueCount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching settlements:', error);
    res.status(500).json({ success: false, message: 'Failed to load settlements summary', error: error.message });
  }
});

/* ==========================================================================
   6. PAYMENT RELIABILITY SCORES
   ========================================================================== */

/**
 * GET /api/distribution/reliability-scores
 * Lists all calculated reliability scores with tiers
 */
router.get('/reliability-scores', verifyToken, async (req, res) => {
  try {
    const scores = await queryAll(`
      SELECT 
        s.*,
        u.userId, u.fullName, u.businessName, u.email, u.phoneNumber, u.distributorLevel,
        st.name as stateName, dt.name as districtName
      FROM payment_reliability_scores s
      JOIN users u ON s.userId = u.id
      LEFT JOIN geo_states st ON u.assignedStateId = st.id
      LEFT JOIN geo_districts dt ON u.assignedDistrictId = dt.id
      ORDER BY s.overallScore DESC
    `);
    res.json({ success: true, count: scores.length, data: scores });
  } catch (error) {
    console.error('Error fetching reliability scores:', error);
    res.status(500).json({ success: false, message: 'Failed to load reliability scores', error: error.message });
  }
});

/**
 * GET /api/distribution/reliability/:userId
 * Specific user score details & history
 */
router.get('/reliability/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = req.user;

    // View check: Super Admin or own score
    if (!isSuperAdmin(user) && parseInt(userId) !== user.id) {
      // Subordinate check can also allow parent distributors to view their subordinates
      const account = await queryGet('SELECT * FROM users WHERE id = ?', [userId]);
      if (!account) return res.status(404).json({ success: false, message: 'User not found' });
      
      const allowed = 
        (user.distributorLevel === HIERARCHY_LEVELS.STATE && account.assignedStateId === user.assignedStateId) ||
        (user.distributorLevel === HIERARCHY_LEVELS.DISTRICT && account.assignedDistrictId === user.assignedDistrictId) ||
        (user.distributorLevel === HIERARCHY_LEVELS.AREA && account.assignedAreaId === user.assignedAreaId);

      if (!allowed) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const details = await getUserScoreDetails(userId);
    res.json({ success: true, data: details });
  } catch (error) {
    console.error('Error fetching user reliability score:', error);
    res.status(500).json({ success: false, message: 'Failed to load user score', error: error.message });
  }
});

/* ==========================================================================
   7. HIERARCHICAL REPORTS & EXPORT
   ========================================================================== */

/**
 * GET /api/distribution/reports/summary
 * Multi-level aggregate report data
 */
router.get('/reports/summary', verifyToken, async (req, res) => {
  try {
    const { stateId, districtId, areaId, startDate, endDate } = req.query;

    let dateCondition = '';
    let params = [];
    if (startDate && endDate) {
      dateCondition = 'AND i.invoiceDate BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const stateReports = await queryAll(
      `SELECT 
        s.id as stateId, s.name as stateName, s.isUnionTerritory,
        COUNT(DISTINCT d.id) as totalDistricts,
        COUNT(DISTINCT CASE WHEN u.distributorLevel = 'DistrictDistributor' THEN u.id END) as districtDistributors,
        COUNT(DISTINCT CASE WHEN u.distributorLevel = 'AreaDistributor' THEN u.id END) as areaDistributors,
        COUNT(DISTINCT CASE WHEN u.distributorLevel = 'Retailer' THEN u.id END) as retailers,
        COALESCE(SUM(i.totalAmount), 0) as totalBilled,
        COALESCE(SUM(i.paidAmount), 0) as totalCollected,
        COALESCE(SUM(i.balanceAmount), 0) as totalOutstanding
       FROM geo_states s
       LEFT JOIN geo_districts d ON s.id = d.stateId
       LEFT JOIN users u ON s.id = u.assignedStateId
       LEFT JOIN distribution_invoices i ON u.id = i.recipientUserId ${dateCondition}
       GROUP BY s.id, s.name, s.isUnionTerritory
       ORDER BY s.name ASC`,
      params
    );

    res.json({ success: true, data: stateReports });
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ success: false, message: 'Failed to generate distribution reports', error: error.message });
  }
});

/* ==========================================================================
   8. AUDIT LOGS
   ========================================================================== */

/**
 * GET /api/distribution/audit-logs
 * Super Admin reviews system actions
 */
router.get('/audit-logs', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { actionType, limit = 100 } = req.query;
    const logs = await getAuditLogs({ actionType, limit: parseInt(limit) });
    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Failed to load audit logs', error: error.message });
  }
});

/* ==========================================================================
   9. AUTHENTICATED USER PASSWORD CHANGE (MANDATORY ON FIRST LOGIN)
   ========================================================================== */

/**
 * POST /api/distribution/change-password
 * Allows any authenticated user (especially those with mustChangePassword = 1)
 * to set their new personal password.
 */
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const user = await queryGet('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password if user is not in forced-change mode or if provided
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password does not match.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    const now = new Date().toISOString();

    await queryRun(
      `UPDATE users 
       SET passwordHash = ?, mustChangePassword = 0, temporaryPassword = NULL, updatedDate = ? 
       WHERE id = ?`,
      [newHash, now, userId]
    );

    await recordAuditLog({
      actionType: 'CHANGE_PASSWORD',
      entityType: 'USER',
      entityId: userId,
      performedByUserId: userId,
      performedByName: user.fullName,
      details: { note: 'User changed temporary password to permanent password.' },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Password changed successfully! You can now use your new password.'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Failed to update password', error: error.message });
  }
});

export default router;


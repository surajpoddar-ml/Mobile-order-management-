import { queryGet, queryAll, queryRun } from '../database/db.js';

/**
 * Get all States and Union Territories with aggregated distributor counts and financial metrics
 */
export async function getAllStatesWithMetrics() {
  const states = await queryAll('SELECT * FROM geo_states ORDER BY type ASC, name ASC');

  // Aggregated metrics per state
  const metrics = await queryAll(`
    SELECT
      u.assignedStateId as stateId,
      COUNT(DISTINCT CASE WHEN u.distributorLevel = 'StateDistributor' THEN u.id END) as totalStateDistributors,
      COUNT(DISTINCT CASE WHEN u.distributorLevel = 'DistrictDistributor' THEN u.id END) as totalDistrictDistributors,
      COUNT(DISTINCT CASE WHEN u.distributorLevel = 'AreaDistributor' THEN u.id END) as totalAreaDistributors,
      COUNT(DISTINCT CASE WHEN u.distributorLevel = 'Retailer' THEN u.id END) as totalRetailers,
      COUNT(DISTINCT CASE WHEN u.accountStatus = 'Active' THEN u.id END) as totalActive,
      COUNT(DISTINCT CASE WHEN u.accountStatus = 'Pending' THEN u.id END) as totalPending,
      COUNT(DISTINCT CASE WHEN u.accountStatus = 'Suspended' THEN u.id END) as totalSuspended
    FROM users u
    WHERE u.assignedStateId IS NOT NULL
    GROUP BY u.assignedStateId
  `);

  const metricsMap = {};
  for (const m of metrics) {
    metricsMap[m.stateId] = m;
  }

  // Count districts per state
  const districtCounts = await queryAll(`
    SELECT stateId, COUNT(*) as districtCount
    FROM geo_districts
    GROUP BY stateId
  `);
  const distCountMap = {};
  for (const d of districtCounts) {
    distCountMap[d.stateId] = d.districtCount;
  }

  // Financial sums per state
  const financialSums = await queryAll(`
    SELECT
      stateId,
      SUM(amountDue) as totalDue,
      SUM(amountPaid) as totalPaid,
      SUM(balanceDue) as totalOutstanding
    FROM distribution_invoices
    WHERE stateId IS NOT NULL AND status != 'CANCELLED'
    GROUP BY stateId
  `);
  const financeMap = {};
  for (const f of financialSums) {
    financeMap[f.stateId] = f;
  }

  return states.map(st => {
    const m = metricsMap[st.id] || {};
    const fin = financeMap[st.id] || {};
    return {
      id: st.id,
      code: st.code,
      name: st.name,
      type: st.type,
      zone: st.zone,
      createdDate: st.createdDate,
      totalDistricts: distCountMap[st.id] || 0,
      totalStateDistributors: Number(m.totalStateDistributors || 0),
      totalDistrictDistributors: Number(m.totalDistrictDistributors || 0),
      totalAreaDistributors: Number(m.totalAreaDistributors || 0),
      totalRetailers: Number(m.totalRetailers || 0),
      totalActiveAccounts: Number(m.totalActive || 0),
      totalPendingAccounts: Number(m.totalPending || 0),
      totalSuspendedAccounts: Number(m.totalSuspended || 0),
      totalDue: Number(fin.totalDue || 0),
      totalCollectedPayments: Number(fin.totalPaid || 0),
      totalOutstandingPayments: Number(fin.totalOutstanding || 0)
    };
  });
}

/**
 * Get districts for a specific state with area and distributor counts
 */
export async function getDistrictsByState(stateId) {
  const districts = await queryAll(
    'SELECT * FROM geo_districts WHERE stateId = ? ORDER BY name ASC',
    [stateId]
  );

  const areaCounts = await queryAll(`
    SELECT districtId, COUNT(*) as areaCount
    FROM geo_areas
    GROUP BY districtId
  `);
  const areaCountMap = {};
  for (const a of areaCounts) {
    areaCountMap[a.districtId] = a.areaCount;
  }

  // Accounts in each district
  const accounts = await queryAll(`
    SELECT
      assignedDistrictId as districtId,
      COUNT(DISTINCT CASE WHEN distributorLevel = 'DistrictDistributor' THEN id END) as districtDistributors,
      COUNT(DISTINCT CASE WHEN distributorLevel = 'AreaDistributor' THEN id END) as areaDistributors,
      COUNT(DISTINCT CASE WHEN distributorLevel = 'Retailer' THEN id END) as retailers,
      COUNT(DISTINCT CASE WHEN accountStatus = 'Active' THEN id END) as activeAccounts,
      COUNT(DISTINCT CASE WHEN accountStatus = 'Pending' THEN id END) as pendingAccounts
    FROM users
    WHERE assignedStateId = ? AND assignedDistrictId IS NOT NULL
    GROUP BY assignedDistrictId
  `, [stateId]);

  const accountMap = {};
  for (const acc of accounts) {
    accountMap[acc.districtId] = acc;
  }

  // Financials per district
  const districtFinances = await queryAll(`
    SELECT
      districtId,
      SUM(amountDue) as totalDue,
      SUM(amountPaid) as totalPaid,
      SUM(balanceDue) as totalOutstanding
    FROM distribution_invoices
    WHERE stateId = ? AND districtId IS NOT NULL AND status != 'CANCELLED'
    GROUP BY districtId
  `, [stateId]);

  const financeMap = {};
  for (const f of districtFinances) {
    financeMap[f.districtId] = f;
  }

  return districts.map(d => {
    const acc = accountMap[d.id] || {};
    const fin = financeMap[d.id] || {};
    return {
      id: d.id,
      stateId: d.stateId,
      name: d.name,
      code: d.code,
      headquarters: d.headquarters,
      totalAreas: areaCountMap[d.id] || 0,
      totalDistrictDistributors: Number(acc.districtDistributors || 0),
      totalAreaDistributors: Number(acc.areaDistributors || 0),
      totalRetailers: Number(acc.retailers || 0),
      totalActiveAccounts: Number(acc.activeAccounts || 0),
      totalPendingAccounts: Number(acc.pendingAccounts || 0),
      totalBusiness: Number(fin.totalDue || 0),
      totalCollected: Number(fin.totalPaid || 0),
      totalOutstanding: Number(fin.totalOutstanding || 0)
    };
  });
}

/**
 * Get areas for a specific district
 */
export async function getAreasByDistrict(districtId) {
  const areas = await queryAll(
    'SELECT * FROM geo_areas WHERE districtId = ? ORDER BY name ASC',
    [districtId]
  );

  const retailers = await queryAll(`
    SELECT
      assignedAreaId as areaId,
      COUNT(DISTINCT id) as totalRetailers,
      COUNT(DISTINCT CASE WHEN accountStatus = 'Active' THEN id END) as activeRetailers
    FROM users
    WHERE assignedDistrictId = ? AND assignedAreaId IS NOT NULL AND distributorLevel = 'Retailer'
    GROUP BY assignedAreaId
  `, [districtId]);

  const retailerMap = {};
  for (const r of retailers) {
    retailerMap[r.areaId] = r;
  }

  // Get assigned Area Distributor for each area
  const areaDists = await queryAll(`
    SELECT id, fullName, businessName, assignedAreaId
    FROM users
    WHERE assignedDistrictId = ? AND distributorLevel = 'AreaDistributor' AND accountStatus = 'Active'
  `, [districtId]);

  const distMap = {};
  for (const ad of areaDists) {
    distMap[ad.assignedAreaId] = ad;
  }

  return areas.map(a => {
    const ret = retailerMap[a.id] || {};
    const ad = distMap[a.id] || null;
    return {
      id: a.id,
      districtId: a.districtId,
      name: a.name,
      pincode: a.pincode,
      totalRetailers: Number(ret.totalRetailers || 0),
      activeRetailers: Number(ret.activeRetailers || 0),
      assignedAreaDistributor: ad ? { id: ad.id, name: ad.fullName, businessName: ad.businessName } : null
    };
  });
}

/**
 * Create a new district under a state
 */
export async function createDistrict({ stateId, name, code, headquarters }) {
  const state = await queryGet('SELECT id FROM geo_states WHERE id = ?', [stateId]);
  if (!state) {
    throw new Error('State / Union Territory not found.');
  }

  const existing = await queryGet('SELECT id FROM geo_districts WHERE stateId = ? AND LOWER(name) = LOWER(?)', [stateId, name.trim()]);
  if (existing) {
    throw new Error(`District "${name}" already exists in this state.`);
  }

  const now = new Date().toISOString();
  const res = await queryRun(
    'INSERT INTO geo_districts (stateId, name, code, headquarters, createdDate) VALUES (?, ?, ?, ?, ?)',
    [stateId, name.trim(), code ? code.trim().toUpperCase() : null, headquarters ? headquarters.trim() : null, now]
  );

  return { id: res.lastID, stateId, name: name.trim() };
}

/**
 * Create a new area under a district
 */
export async function createArea({ districtId, name, pincode }) {
  const district = await queryGet('SELECT id, stateId FROM geo_districts WHERE id = ?', [districtId]);
  if (!district) {
    throw new Error('District not found.');
  }

  const existing = await queryGet('SELECT id FROM geo_areas WHERE districtId = ? AND LOWER(name) = LOWER(?)', [districtId, name.trim()]);
  if (existing) {
    throw new Error(`Area "${name}" already exists in this district.`);
  }

  const now = new Date().toISOString();
  const res = await queryRun(
    'INSERT INTO geo_areas (districtId, name, pincode, createdDate) VALUES (?, ?, ?, ?)',
    [districtId, name.trim(), pincode ? pincode.trim() : null, now]
  );

  return { id: res.lastID, districtId, name: name.trim() };
}


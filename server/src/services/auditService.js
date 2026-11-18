import { queryRun, queryAll } from '../database/db.js';
import crypto from 'crypto';

/**
 * Record an immutable audit log entry for Super Admin actions
 */
export async function recordAuditLog({
  performedBy = 'SUPER_ADMIN',
  userRole = 'Admin',
  targetAccount = null,
  targetUserId = null,
  actionType,
  previousValues = null,
  updatedValues = null,
  remarks = null,
  ipAddress = null
}) {
  try {
    const actionId = `AUD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const prevJson = previousValues ? (typeof previousValues === 'string' ? previousValues : JSON.stringify(previousValues)) : null;
    const updJson = updatedValues ? (typeof updatedValues === 'string' ? updatedValues : JSON.stringify(updatedValues)) : null;

    await queryRun(
      `INSERT INTO audit_logs (
        actionId, performedBy, userRole, targetAccount, targetUserId,
        actionType, previousValues, updatedValues, remarks, ipAddress, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        actionId,
        performedBy,
        userRole,
        targetAccount,
        targetUserId,
        actionType,
        prevJson,
        updJson,
        remarks,
        ipAddress,
        timestamp
      ]
    );

    return actionId;
  } catch (err) {
    console.error('[AUDIT LOG ERROR] Failed to record audit log:', err.message);
    return null;
  }
}

/**
 * Retrieve audit logs with filtering & pagination
 */
export async function getAuditLogs({
  actionType,
  targetUserId,
  performedBy,
  startDate,
  endDate,
  limit = 100,
  offset = 0
} = {}) {
  let whereClauses = [];
  let params = [];

  if (actionType && actionType !== 'ALL') {
    whereClauses.push('actionType = ?');
    params.push(actionType);
  }

  if (targetUserId) {
    whereClauses.push('targetUserId = ?');
    params.push(targetUserId);
  }

  if (performedBy) {
    whereClauses.push('performedBy LIKE ?');
    params.push(`%${performedBy}%`);
  }

  if (startDate) {
    whereClauses.push('timestamp >= ?');
    params.push(startDate);
  }

  if (endDate) {
    whereClauses.push('timestamp <= ?');
    params.push(endDate);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const query = `
    SELECT * FROM audit_logs
    ${whereSql}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  params.push(Number(limit), Number(offset));
  const logs = await queryAll(query, params);

  // Parse JSON values for easier consumption
  return logs.map(l => ({
    ...l,
    previousValues: l.previousValues ? safeParseJson(l.previousValues) : null,
    updatedValues: l.updatedValues ? safeParseJson(l.updatedValues) : null
  }));
}

function safeParseJson(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
}


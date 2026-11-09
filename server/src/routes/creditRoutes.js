import express from 'express';
import { queryGet, queryAll, queryRun } from '../database/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { createNotification } from './notificationRoutes.js';

const router = express.Router();

/**
 * Helper: Ensure distributor credit record exists in distributor_credits table
 */
export const ensureDistributorCreditRecord = async (distributorUser) => {
  if (!distributorUser) return null;

  let record = await queryGet(
    'SELECT * FROM distributor_credits WHERE distributor_id = ? OR user_id = ?',
    [distributorUser.userId, distributorUser.id]
  );

  if (!record) {
    await queryRun(
      `INSERT INTO distributor_credits (user_id, distributor_id, total_credit, used_credit, available_credit)
       VALUES (?, ?, 0.00, 0.00, 0.00)
       ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
      [distributorUser.id, distributorUser.userId]
    );

    record = await queryGet(
      'SELECT * FROM distributor_credits WHERE distributor_id = ? OR user_id = ?',
      [distributorUser.userId, distributorUser.id]
    );
  }

  return record;
};

// =========================================================================
// 1. DISTRIBUTOR: GET OWN CREDIT BALANCE & TRANSACTION HISTORY
// =========================================================================
router.get('/my-credit', verifyToken, async (req, res) => {
  try {
    if (req.user.userType !== 'Distributor') {
      return res.status(403).json({
        success: false,
        message: 'Credit payment system is exclusively for wholesale distributors.'
      });
    }

    const creditRecord = await ensureDistributorCreditRecord(req.user);

    // Fetch transactions ledger for this distributor
    const transactions = await queryAll(
      `SELECT id, distributor_id, transaction_type, amount, previous_credit, new_credit,
              reference_order_number, description, admin_name, created_at
       FROM distributor_credit_transactions
       WHERE distributor_id = ? OR user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.userId, req.user.id]
    );

    const totalCredit = Number(creditRecord?.total_credit || 0);
    const usedCredit = Number(creditRecord?.used_credit || 0);
    const availableCredit = Math.max(0, totalCredit - usedCredit);

    return res.status(200).json({
      success: true,
      credit: {
        totalCredit,
        usedCredit,
        availableCredit,
        distributorId: req.user.userId,
        businessName: req.user.businessName || req.user.fullName
      },
      transactions: transactions || []
    });
  } catch (error) {
    console.error('Error fetching distributor credit:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch credit balance.'
    });
  }
});

// =========================================================================
// 2. ADMIN: GET ALL DISTRIBUTORS CREDIT SUMMARY & AGGREGATE STATS
// =========================================================================
router.get('/admin/distributors', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { query } = req.query;

    let sql = `
      SELECT
        u.id AS user_pk,
        u.userId AS distributorId,
        u.fullName,
        u.businessName,
        u.phoneNumber,
        u.email,
        u.accountStatus,
        COALESCE(dc.total_credit, 0.00) AS totalCredit,
        COALESCE(dc.used_credit, 0.00) AS usedCredit,
        GREATEST(0.00, COALESCE(dc.total_credit, 0.00) - COALESCE(dc.used_credit, 0.00)) AS availableCredit,
        dc.updated_at AS lastUpdated
      FROM users u
      LEFT JOIN distributor_credits dc ON (dc.distributor_id = u.userId OR dc.user_id = u.id)
      WHERE u.userType = 'Distributor'
    `;

    const params = [];
    if (query && query.trim()) {
      const q = `%${query.trim()}%`;
      sql += ` AND (u.userId LIKE ? OR u.fullName LIKE ? OR u.businessName LIKE ? OR u.phoneNumber LIKE ? OR u.email LIKE ?)`;
      params.push(q, q, q, q, q);
    }

    sql += ` ORDER BY u.fullName ASC`;

    const distributors = await queryAll(sql, params);

    // Calculate overall aggregates
    let totalAssigned = 0;
    let totalUsed = 0;
    let totalAvailable = 0;

    distributors.forEach(d => {
      d.totalCredit = Number(d.totalCredit || 0);
      d.usedCredit = Number(d.usedCredit || 0);
      d.availableCredit = Math.max(0, d.totalCredit - d.usedCredit);

      totalAssigned += d.totalCredit;
      totalUsed += d.usedCredit;
      totalAvailable += d.availableCredit;
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalDistributors: distributors.length,
        totalAssigned,
        totalUsed,
        totalAvailable
      },
      distributors
    });
  } catch (error) {
    console.error('Error fetching admin distributor credits:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch distributor credit records.'
    });
  }
});

// =========================================================================
// 3. ADMIN: GET DETAILED TRANSACTION LEDGER FOR A SPECIFIC DISTRIBUTOR
// =========================================================================
router.get('/admin/ledger/:distributorId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { distributorId } = req.params;

    const distributorUser = await queryGet(
      "SELECT id, userId, fullName, businessName, email, phoneNumber, accountStatus FROM users WHERE (userId = ? OR id = ?) AND userType = 'Distributor'",
      [distributorId, distributorId]
    );

    if (!distributorUser) {
      return res.status(404).json({
        success: false,
        message: 'Distributor not found.'
      });
    }

    const creditRecord = await ensureDistributorCreditRecord(distributorUser);

    const transactions = await queryAll(
      `SELECT id, distributor_id, transaction_type, amount, previous_credit, new_credit,
              reference_order_number, description, admin_id, admin_name, created_at
       FROM distributor_credit_transactions
       WHERE distributor_id = ? OR user_id = ?
       ORDER BY created_at DESC`,
      [distributorUser.userId, distributorUser.id]
    );

    const totalCredit = Number(creditRecord?.total_credit || 0);
    const usedCredit = Number(creditRecord?.used_credit || 0);
    const availableCredit = Math.max(0, totalCredit - usedCredit);

    return res.status(200).json({
      success: true,
      distributor: {
        id: distributorUser.id,
        distributorId: distributorUser.userId,
        fullName: distributorUser.fullName,
        businessName: distributorUser.businessName,
        email: distributorUser.email,
        phoneNumber: distributorUser.phoneNumber,
        accountStatus: distributorUser.accountStatus,
        totalCredit,
        usedCredit,
        availableCredit
      },
      transactions: transactions || []
    });
  } catch (error) {
    console.error('Error fetching distributor ledger:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch distributor credit ledger.'
    });
  }
});

// =========================================================================
// 4. ADMIN: MANUALLY ASSIGN, INCREASE, OR ADJUST CREDIT LIMIT
// =========================================================================
router.post('/admin/adjust', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { distributorId, amount, mode = 'SET', description } = req.body;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid non-negative credit amount.'
      });
    }

    const distributorUser = await queryGet(
      "SELECT id, userId, fullName, businessName, email, phoneNumber FROM users WHERE (userId = ? OR id = ?) AND userType = 'Distributor'",
      [distributorId, distributorId]
    );

    if (!distributorUser) {
      return res.status(404).json({
        success: false,
        message: 'Distributor not found.'
      });
    }

    const creditRecord = await ensureDistributorCreditRecord(distributorUser);
    const currentTotal = Number(creditRecord.total_credit || 0);
    const currentUsed = Number(creditRecord.used_credit || 0);
    const currentAvailable = Math.max(0, currentTotal - currentUsed);

    let newTotal = currentTotal;
    let transactionType = 'ALLOCATION';

    if (mode === 'SET') {
      newTotal = parsedAmount;
      transactionType = 'ALLOCATION';
    } else if (mode === 'INCREASE') {
      newTotal = currentTotal + parsedAmount;
      transactionType = 'ADJUSTMENT';
    } else if (mode === 'DECREASE') {
      newTotal = Math.max(0, currentTotal - parsedAmount);
      transactionType = 'ADJUSTMENT';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid adjustment mode. Allowed values: SET, INCREASE, DECREASE.'
      });
    }

    const newAvailable = Math.max(0, newTotal - currentUsed);

    // Update distributor_credits table
    await queryRun(
      `UPDATE distributor_credits
       SET total_credit = ?, available_credit = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newTotal, newAvailable, creditRecord.id]
    );

    const adminName = req.user.fullName || req.user.email || 'Admin';
    const auditDesc = description && description.trim()
      ? description.trim()
      : (mode === 'SET'
          ? `Admin set credit limit to ₹${newTotal.toLocaleString('en-IN')}`
          : (mode === 'INCREASE'
              ? `Admin increased credit limit by ₹${parsedAmount.toLocaleString('en-IN')}`
              : `Admin decreased credit limit by ₹${parsedAmount.toLocaleString('en-IN')}`));

    // Insert historical audit ledger transaction
    await queryRun(
      `INSERT INTO distributor_credit_transactions
       (distributor_id, user_id, transaction_type, amount, previous_credit, new_credit, description, admin_id, admin_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        distributorUser.userId,
        distributorUser.id,
        transactionType,
        parsedAmount,
        currentAvailable,
        newAvailable,
        auditDesc,
        req.user.id,
        adminName
      ]
    );

    // Notify distributor immediately
    try {
      await createNotification({
        recipientId: distributorUser.userId,
        recipientRole: 'Distributor',
        title: `💳 Available Credit Updated: ₹${newAvailable.toLocaleString('en-IN')}`,
        message: `Your credit limit has been adjusted by administration. Total Assigned: ₹${newTotal.toLocaleString('en-IN')}, Remaining Available: ₹${newAvailable.toLocaleString('en-IN')}.`,
        type: 'credit_update',
        entityId: String(creditRecord.id),
        linkUrl: '/portal/distributor?tab=credit',
        dedupKey: `credit_adj_${distributorUser.userId}_${Date.now()}`
      });
    } catch (e) {
      console.warn('Could not dispatch notification:', e.message);
    }

    return res.status(200).json({
      success: true,
      message: `Credit successfully ${mode === 'SET' ? 'assigned' : (mode === 'INCREASE' ? 'increased' : 'adjusted')}. Available Balance: ₹${newAvailable.toLocaleString('en-IN')}`,
      credit: {
        totalCredit: newTotal,
        usedCredit: currentUsed,
        availableCredit: newAvailable,
        distributorId: distributorUser.userId
      }
    });
  } catch (error) {
    console.error('Error adjusting distributor credit:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to adjust distributor credit.'
    });
  }
});

export default router;


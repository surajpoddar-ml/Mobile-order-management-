import express from 'express';
import { queryGet, queryAll, queryRun } from '../database/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { createNotification } from '../services/notificationService.js';

const router = express.Router();

/**
 * Generate a unique readable transaction reference
 */
export const generateTxnNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `TXN-CR-${timestamp}-${randomPart}`;
};

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
      `INSERT INTO distributor_credits (user_id, distributor_id, total_credit, used_credit, total_paid, outstanding_balance, available_credit)
       VALUES (?, ?, 0.00, 0.00, 0.00, 0.00, 0.00)
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
      `SELECT id, txn_number, distributor_id, transaction_type, amount, credit_added, credit_removed,
              payment_amount, previous_credit, new_credit, outstanding_before, outstanding_after,
              payment_method, reference_id, reference_order_number, description, admin_name, created_at
       FROM distributor_credit_transactions
       WHERE distributor_id = ? OR user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 100`,
      [req.user.userId, req.user.id]
    );

    const totalCredit = Number(creditRecord?.total_credit || 0);
    const usedCredit = Number(creditRecord?.used_credit || 0);
    const totalPaid = Number(creditRecord?.total_paid || 0);
    const outstandingBalance = Number(creditRecord?.outstanding_balance || Math.max(0, usedCredit - totalPaid));
    const availableCredit = Math.max(0, totalCredit - outstandingBalance);

    return res.status(200).json({
      success: true,
      credit: {
        totalCredit,
        usedCredit,
        totalPaid,
        outstandingBalance,
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
        COALESCE(dc.total_paid, 0.00) AS totalPaid,
        COALESCE(dc.outstanding_balance, 0.00) AS outstandingBalance,
        COALESCE(dc.available_credit, 0.00) AS availableCredit,
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
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalAvailable = 0;

    distributors.forEach(d => {
      d.totalCredit = Number(d.totalCredit || 0);
      d.usedCredit = Number(d.usedCredit || 0);
      d.totalPaid = Number(d.totalPaid || 0);
      d.outstandingBalance = Number(d.outstandingBalance || Math.max(0, d.usedCredit - d.totalPaid));
      d.availableCredit = Math.max(0, d.totalCredit - d.outstandingBalance);

      totalAssigned += d.totalCredit;
      totalUsed += d.usedCredit;
      totalPaid += d.totalPaid;
      totalOutstanding += d.outstandingBalance;
      totalAvailable += d.availableCredit;
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalDistributors: distributors.length,
        totalAssigned,
        totalUsed,
        totalPaid,
        totalOutstanding,
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
// 3. ADMIN: GET DETAILED DISTRIBUTOR TRANSACTION LEDGER & ACCOUNTING OVERVIEW
// =========================================================================
router.get('/admin/ledger/:distributorId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { distributorId } = req.params;
    const {
      search = '',
      type = 'ALL',
      startDate = '',
      endDate = '',
      sort = 'newest',
      page = 1,
      limit = 25
    } = req.query;

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

    // Build query with filters
    let sql = `
      SELECT id, txn_number, distributor_id, user_id, transaction_type, amount,
             credit_added, credit_removed, payment_amount,
             previous_credit, new_credit, outstanding_before, outstanding_after,
             payment_method, reference_id, reference_order_number, description,
             admin_id, admin_name, created_at
      FROM distributor_credit_transactions
      WHERE (distributor_id = ? OR user_id = ?)
    `;
    const params = [distributorUser.userId, distributorUser.id];

    // Search filter
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      sql += ` AND (txn_number LIKE ? OR reference_id LIKE ? OR reference_order_number LIKE ? OR description LIKE ? OR admin_name LIKE ?)`;
      params.push(q, q, q, q, q);
    }

    // Type filter
    if (type && type !== 'ALL') {
      if (type === 'CREDIT_ADDED') {
        sql += ` AND (transaction_type IN ('CREDIT_ADDED', 'ALLOCATION', 'INCREASE') OR credit_added > 0)`;
      } else if (type === 'CREDIT_REMOVED') {
        sql += ` AND (transaction_type IN ('CREDIT_REMOVED', 'DECREASE') OR (credit_removed > 0 AND transaction_type != 'PURCHASE_DEDUCTION'))`;
      } else if (type === 'PAYMENT_SETTLEMENT') {
        sql += ` AND (transaction_type = 'PAYMENT_SETTLEMENT' OR payment_amount > 0)`;
      } else if (type === 'PURCHASE_DEDUCTION') {
        sql += ` AND transaction_type = 'PURCHASE_DEDUCTION'`;
      } else if (type === 'REFUND') {
        sql += ` AND transaction_type = 'REFUND'`;
      } else if (type === 'ADJUSTMENT') {
        sql += ` AND transaction_type = 'ADJUSTMENT'`;
      } else {
        sql += ` AND transaction_type = ?`;
        params.push(type);
      }
    }

    // Date range filter
    if (startDate && startDate.trim()) {
      sql += ` AND created_at >= ?`;
      params.push(`${startDate.trim()} 00:00:00`);
    }
    if (endDate && endDate.trim()) {
      sql += ` AND created_at <= ?`;
      params.push(`${endDate.trim()} 23:59:59`);
    }

    // Sorting
    const sortOrder = sort === 'oldest' ? 'ASC' : 'DESC';
    sql += ` ORDER BY created_at ${sortOrder}, id ${sortOrder}`;

    // Fetch all matching records to compute totals & pagination
    const allMatching = await queryAll(sql, params);
    const totalTransactionsCount = allMatching.length;

    // Apply pagination if limit is numeric
    let paginatedTransactions = allMatching;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = limit === 'all' ? allMatching.length : (parseInt(limit, 10) || 25);
    if (limit !== 'all') {
      const offset = (pageNum - 1) * limitNum;
      paginatedTransactions = allMatching.slice(offset, offset + limitNum);
    }

    // Financial aggregates across entire historical ledger for this distributor
    const allHistory = await queryAll(
      `SELECT transaction_type, amount, credit_added, credit_removed, payment_amount, created_at
       FROM distributor_credit_transactions
       WHERE distributor_id = ? OR user_id = ?
       ORDER BY created_at DESC, id DESC`,
      [distributorUser.userId, distributorUser.id]
    );

    let totalAmountAdded = 0;
    let totalAmountDeducted = 0;
    let totalOrderDeducted = 0;
    let totalAmountPaid = 0;
    let lastTransactionDate = null;

    allHistory.forEach(tx => {
      const added = Number(tx.credit_added || 0);
      const removed = Number(tx.credit_removed || 0);
      const payment = Number(tx.payment_amount || 0);
      const amt = Number(tx.amount || 0);

      if (tx.transaction_type === 'ALLOCATION' || tx.transaction_type === 'CREDIT_ADDED') {
        totalAmountAdded += (added > 0 ? added : amt);
      } else if (tx.transaction_type === 'PURCHASE_DEDUCTION') {
        totalOrderDeducted += amt;
      } else if (tx.transaction_type === 'PAYMENT_SETTLEMENT') {
        totalAmountPaid += (payment > 0 ? payment : amt);
      } else if (tx.transaction_type === 'CREDIT_REMOVED' || tx.transaction_type === 'DECREASE') {
        totalAmountDeducted += (removed > 0 ? removed : amt);
      } else if (tx.transaction_type === 'REFUND') {
        // Refund restores credit
        totalAmountAdded += amt;
      } else {
        if (added > 0) totalAmountAdded += added;
        if (removed > 0) totalAmountDeducted += removed;
        if (payment > 0) totalAmountPaid += payment;
      }

      if (!lastTransactionDate && tx.created_at) {
        lastTransactionDate = tx.created_at;
      }
    });

    const totalCredit = Number(creditRecord?.total_credit || 0);
    const usedCredit = Number(creditRecord?.used_credit || 0);
    const recordedTotalPaid = Number(creditRecord?.total_paid || totalAmountPaid);
    const currentOutstanding = Number(creditRecord?.outstanding_balance || Math.max(0, usedCredit - recordedTotalPaid));
    const currentAvailable = Math.max(0, totalCredit - currentOutstanding);

    return res.status(200).json({
      success: true,
      distributor: {
        id: distributorUser.id,
        distributorId: distributorUser.userId,
        fullName: distributorUser.fullName,
        businessName: distributorUser.businessName,
        email: distributorUser.email,
        phoneNumber: distributorUser.phoneNumber,
        accountStatus: distributorUser.accountStatus
      },
      summary: {
        totalCreditAssigned: totalCredit,
        totalAmountAdded,
        totalAmountDeducted,
        totalOrderDeducted,
        totalAmountPaid: recordedTotalPaid,
        currentOutstanding,
        currentAvailable,
        totalTransactions: totalTransactionsCount,
        lastTransactionDate
      },
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalTransactionsCount / limitNum) || 1,
        totalItems: totalTransactionsCount,
        limit: limitNum
      },
      transactions: paginatedTransactions
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
// 4. ADMIN: MANUALLY ASSIGN, INCREASE, OR REDUCE CREDIT LIMIT
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
    const currentPaid = Number(creditRecord.total_paid || 0);
    const currentOutstanding = Number(creditRecord.outstanding_balance || Math.max(0, currentUsed - currentPaid));
    const currentAvailable = Math.max(0, currentTotal - currentOutstanding);

    let newTotal = currentTotal;
    let transactionType = 'ALLOCATION';
    let creditAdded = 0;
    let creditRemoved = 0;

    if (mode === 'SET') {
      newTotal = parsedAmount;
      if (newTotal >= currentTotal) {
        transactionType = 'ALLOCATION';
        creditAdded = newTotal - currentTotal;
      } else {
        transactionType = 'CREDIT_REMOVED';
        creditRemoved = currentTotal - newTotal;
      }
    } else if (mode === 'INCREASE' || mode === 'ADD') {
      newTotal = currentTotal + parsedAmount;
      transactionType = 'ALLOCATION';
      creditAdded = parsedAmount;
    } else if (mode === 'DECREASE' || mode === 'REMOVE') {
      newTotal = Math.max(0, currentTotal - parsedAmount);
      transactionType = 'CREDIT_REMOVED';
      creditRemoved = Math.min(currentTotal, parsedAmount);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid adjustment mode. Allowed values: SET, INCREASE, DECREASE.'
      });
    }

    const newAvailable = Math.max(0, newTotal - currentOutstanding);
    const txnNumber = generateTxnNumber();
    const adminName = req.user.fullName || req.user.email || 'Admin';

    // Update distributor_credits table
    await queryRun(
      `UPDATE distributor_credits
       SET total_credit = ?, available_credit = ?, outstanding_balance = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newTotal, newAvailable, currentOutstanding, creditRecord.id]
    );

    const auditDesc = description && description.trim()
      ? description.trim()
      : (mode === 'SET'
          ? `Admin set credit limit to ₹${newTotal.toLocaleString('en-IN')}`
          : (mode === 'INCREASE' || mode === 'ADD'
              ? `Admin increased credit limit by ₹${parsedAmount.toLocaleString('en-IN')}`
              : `Admin decreased credit limit by ₹${parsedAmount.toLocaleString('en-IN')}`));

    // Insert historical audit ledger transaction
    await queryRun(
      `INSERT INTO distributor_credit_transactions
       (txn_number, distributor_id, user_id, transaction_type, amount, credit_added, credit_removed,
        payment_amount, previous_credit, new_credit, outstanding_before, outstanding_after,
        description, admin_id, admin_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0.00, ?, ?, ?, ?, ?, ?, ?)`,
      [
        txnNumber,
        distributorUser.userId,
        distributorUser.id,
        transactionType,
        parsedAmount,
        creditAdded,
        creditRemoved,
        currentAvailable,
        newAvailable,
        currentOutstanding,
        currentOutstanding,
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
      message: `Credit successfully ${mode === 'SET' ? 'assigned' : (mode === 'INCREASE' || mode === 'ADD' ? 'increased' : 'adjusted')}. Available Balance: ₹${newAvailable.toLocaleString('en-IN')}`,
      credit: {
        totalCredit: newTotal,
        usedCredit: currentUsed,
        totalPaid: currentPaid,
        outstandingBalance: currentOutstanding,
        availableCredit: newAvailable,
        distributorId: distributorUser.userId
      },
      txnNumber
    });
  } catch (error) {
    console.error('Error adjusting distributor credit:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to adjust distributor credit.'
    });
  }
});

// =========================================================================
// 5. ADMIN: RECORD DISTRIBUTOR PAYMENT / SETTLEMENT
// =========================================================================
router.post('/admin/settle-payment', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      distributorId,
      amount,
      paymentMethod = 'Bank Transfer',
      referenceId = '',
      description = ''
    } = req.body;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero.'
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
    const currentPaid = Number(creditRecord.total_paid || 0);
    const outstandingBefore = Number(creditRecord.outstanding_balance || Math.max(0, currentUsed - currentPaid));
    const availableBefore = Math.max(0, currentTotal - outstandingBefore);

    // Update financial balance
    const newPaid = currentPaid + parsedAmount;
    const outstandingAfter = Math.max(0, outstandingBefore - parsedAmount);
    // Also adjust used_credit downward to match remaining debt
    const newUsed = Math.max(0, currentUsed - parsedAmount);
    const availableAfter = Math.max(0, currentTotal - outstandingAfter);

    const txnNumber = generateTxnNumber();
    const adminName = req.user.fullName || req.user.email || 'Admin';

    // Update distributor_credits
    await queryRun(
      `UPDATE distributor_credits
       SET total_paid = ?, used_credit = ?, outstanding_balance = ?, available_credit = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newPaid, newUsed, outstandingAfter, availableAfter, creditRecord.id]
    );

    const note = description && description.trim()
      ? description.trim()
      : `Payment received via ${paymentMethod}${referenceId ? ` (Ref: ${referenceId})` : ''} - ₹${parsedAmount.toLocaleString('en-IN')}`;

    // Record in ledger
    await queryRun(
      `INSERT INTO distributor_credit_transactions
       (txn_number, distributor_id, user_id, transaction_type, amount, credit_added, credit_removed,
        payment_amount, previous_credit, new_credit, outstanding_before, outstanding_after,
        payment_method, reference_id, description, admin_id, admin_name)
       VALUES (?, ?, ?, 'PAYMENT_SETTLEMENT', ?, 0.00, 0.00, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        txnNumber,
        distributorUser.userId,
        distributorUser.id,
        parsedAmount,
        parsedAmount,
        availableBefore,
        availableAfter,
        outstandingBefore,
        outstandingAfter,
        paymentMethod,
        referenceId.trim() || null,
        note,
        req.user.id,
        adminName
      ]
    );

    // Notify distributor
    try {
      await createNotification({
        recipientId: distributorUser.userId,
        recipientRole: 'Distributor',
        title: `✅ Payment Received: ₹${parsedAmount.toLocaleString('en-IN')}`,
        message: `Your payment of ₹${parsedAmount.toLocaleString('en-IN')} has been acknowledged and credited to your account. Available Credit restored: ₹${availableAfter.toLocaleString('en-IN')}. Outstanding: ₹${outstandingAfter.toLocaleString('en-IN')}.`,
        type: 'credit_update',
        entityId: txnNumber,
        linkUrl: '/portal/distributor?tab=credit',
        dedupKey: `credit_pay_${txnNumber}`
      });
    } catch (e) {
      console.warn('Could not dispatch payment notification:', e.message);
    }

    return res.status(200).json({
      success: true,
      message: `Payment of ₹${parsedAmount.toLocaleString('en-IN')} recorded successfully. Outstanding balance updated to ₹${outstandingAfter.toLocaleString('en-IN')}.`,
      txnNumber,
      credit: {
        totalCredit: currentTotal,
        usedCredit: newUsed,
        totalPaid: newPaid,
        outstandingBalance: outstandingAfter,
        availableCredit: availableAfter
      }
    });
  } catch (error) {
    console.error('Error recording distributor payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record distributor payment.'
    });
  }
});

export default router;

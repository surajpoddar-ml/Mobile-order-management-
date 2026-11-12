import express from 'express';
import { queryGet, queryAll, queryRun } from '../database/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { createNotification } from '../services/notificationService.js';
import {
  getInterestSettings,
  updateInterestSettings,
  calculateEstimatedInterest,
  processDailyInterestForAllDistributors,
  getNepalDateString,
  round2
} from '../services/creditInterestService.js';

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
 * Safe helper to read outstanding principal balance from credit record
 */
const resolveOutstandingPrincipal = (record) => {
  if (!record) return 0;
  if (record.outstanding_balance !== undefined && record.outstanding_balance !== null) {
    return Math.max(0, round2(record.outstanding_balance));
  }
  return Math.max(0, round2(Number(record.used_credit || 0) - Number(record.total_paid || 0)));
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
      `INSERT INTO distributor_credits
       (user_id, distributor_id, total_credit, used_credit, total_paid, outstanding_balance, available_credit,
        interest_enabled, accumulated_interest, total_interest_charged, total_interest_paid, last_daily_interest)
       VALUES (?, ?, 0.00, 0.00, 0.00, 0.00, 0.00, 1, 0.00, 0.00, 0.00, 0.00)
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
// 1. DISTRIBUTOR: GET OWN CREDIT BALANCE, INTEREST DETAILS & HISTORY
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
    const interestSettings = await getInterestSettings();

    // Fetch combined credit + interest ledger transactions
    const transactions = await queryAll(
      `SELECT id, txn_number, distributor_id, transaction_type, amount, credit_added, credit_removed,
              payment_amount, previous_credit, new_credit, outstanding_before, outstanding_after,
              interest_amount, interest_rate, principal_amount, interest_before, interest_after,
              interest_date, calc_method, payment_method, reference_id, reference_order_number,
              description, admin_name, created_at
       FROM distributor_credit_transactions
       WHERE distributor_id = ? OR user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 150`,
      [req.user.userId, req.user.id]
    );

    // Fetch dedicated daily interest logs
    const interestHistory = await queryAll(
      `SELECT id, txn_number, distributor_id, interest_date, principal_amount, monthly_rate,
              days_in_month, daily_interest, interest_before, interest_after, calc_method,
              compounding_enabled, notes, triggered_by, created_at
       FROM distributor_credit_interest_logs
       WHERE distributor_id = ? OR user_id = ?
       ORDER BY interest_date DESC, id DESC
       LIMIT 120`,
      [req.user.userId, req.user.id]
    );

    const totalCredit = Number(creditRecord?.total_credit || 0);
    const usedCredit = Number(creditRecord?.used_credit || 0);
    const totalPaid = Number(creditRecord?.total_paid || 0);
    const outstandingBalance = resolveOutstandingPrincipal(creditRecord);
    const availableCredit = Math.max(0, round2(totalCredit - outstandingBalance));

    const accumulatedInterest = round2(creditRecord?.accumulated_interest || 0);
    const totalInterestCharged = round2(creditRecord?.total_interest_charged || 0);
    const totalInterestPaid = round2(creditRecord?.total_interest_paid || 0);
    const totalPayable = round2(outstandingBalance + accumulatedInterest);

    const hasCustomRate =
      creditRecord?.custom_monthly_interest_rate !== null &&
      creditRecord?.custom_monthly_interest_rate !== undefined;
    const effectiveRate = hasCustomRate
      ? Number(creditRecord.custom_monthly_interest_rate)
      : interestSettings.defaultMonthlyRate;
    const distributorInterestActive =
      interestSettings.enabled && Number(creditRecord?.interest_enabled ?? 1) === 1;

    const { monthlyInterest, dailyInterest, daysInMonth } = distributorInterestActive
      ? calculateEstimatedInterest({
          principal: outstandingBalance,
          accumulatedInterest,
          monthlyRate: effectiveRate,
          dateStr: interestSettings.nepalToday,
          calcMode: interestSettings.calcMode,
          compounding: interestSettings.compounding
        })
      : { monthlyInterest: 0, dailyInterest: 0, daysInMonth: interestSettings.daysInCurrentMonth };

    return res.status(200).json({
      success: true,
      credit: {
        totalCredit,
        usedCredit,
        totalPaid,
        outstandingBalance,
        availableCredit,
        principalAmount: outstandingBalance,
        accumulatedInterest,
        totalInterestCharged,
        totalInterestPaid,
        totalPayable,
        monthlyInterestRate: effectiveRate,
        isCustomRate: hasCustomRate,
        interestEnabled: distributorInterestActive,
        globalInterestEnabled: interestSettings.enabled,
        distributorInterestEnabled: Number(creditRecord?.interest_enabled ?? 1) === 1,
        calcMode: interestSettings.calcMode,
        daysInCurrentMonth: daysInMonth,
        dailyInterestAmount: dailyInterest,
        monthlyEstimatedInterest: monthlyInterest,
        lastInterestDate: creditRecord?.last_interest_date || null,
        interestStartDate: creditRecord?.interest_start_date || interestSettings.startDate,
        distributorId: req.user.userId,
        businessName: req.user.businessName || req.user.fullName
      },
      transactions: transactions || [],
      interestHistory: interestHistory || []
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
// 2. ADMIN: GET ALL DISTRIBUTORS CREDIT & INTEREST SUMMARY
// =========================================================================
router.get('/admin/distributors', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { query } = req.query;
    const interestSettings = await getInterestSettings();

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
        dc.outstanding_balance AS outstandingBalanceRaw,
        COALESCE(dc.available_credit, 0.00) AS availableCredit,
        COALESCE(dc.interest_enabled, 1) AS interestEnabledRaw,
        dc.custom_monthly_interest_rate AS customMonthlyRateRaw,
        dc.interest_start_date AS interestStartDate,
        COALESCE(dc.accumulated_interest, 0.00) AS accumulatedInterest,
        COALESCE(dc.total_interest_charged, 0.00) AS totalInterestCharged,
        COALESCE(dc.total_interest_paid, 0.00) AS totalInterestPaid,
        dc.last_interest_date AS lastInterestDate,
        COALESCE(dc.last_daily_interest, 0.00) AS lastDailyInterest,
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

    let totalAssigned = 0;
    let totalUsed = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalAvailable = 0;
    let totalAccumulatedInterest = 0;
    let totalPayableAll = 0;
    let totalDailyInterestAll = 0;

    distributors.forEach((d) => {
      d.totalCredit = Number(d.totalCredit || 0);
      d.usedCredit = Number(d.usedCredit || 0);
      d.totalPaid = Number(d.totalPaid || 0);
      d.outstandingBalance =
        d.outstandingBalanceRaw !== undefined && d.outstandingBalanceRaw !== null
          ? Math.max(0, round2(d.outstandingBalanceRaw))
          : Math.max(0, round2(d.usedCredit - d.totalPaid));
      d.availableCredit = Math.max(0, round2(d.totalCredit - d.outstandingBalance));

      d.accumulatedInterest = round2(d.accumulatedInterest || 0);
      d.totalInterestCharged = round2(d.totalInterestCharged || 0);
      d.totalInterestPaid = round2(d.totalInterestPaid || 0);
      d.totalPayable = round2(d.outstandingBalance + d.accumulatedInterest);

      d.distributorInterestEnabled = Number(d.interestEnabledRaw ?? 1) === 1;
      d.interestEnabled = interestSettings.enabled && d.distributorInterestEnabled;
      d.isCustomRate = d.customMonthlyRateRaw !== null && d.customMonthlyRateRaw !== undefined;
      d.customMonthlyRate = d.isCustomRate ? Number(d.customMonthlyRateRaw) : null;
      d.effectiveMonthlyRate = d.isCustomRate
        ? Number(d.customMonthlyRateRaw)
        : interestSettings.defaultMonthlyRate;

      const calc = d.interestEnabled
        ? calculateEstimatedInterest({
            principal: d.outstandingBalance,
            accumulatedInterest: d.accumulatedInterest,
            monthlyRate: d.effectiveMonthlyRate,
            dateStr: interestSettings.nepalToday,
            calcMode: interestSettings.calcMode,
            compounding: interestSettings.compounding
          })
        : { monthlyInterest: 0, dailyInterest: 0, daysInMonth: interestSettings.daysInCurrentMonth };

      d.dailyInterestAmount = calc.dailyInterest;
      d.monthlyEstimatedInterest = calc.monthlyInterest;
      d.daysInCurrentMonth = calc.daysInMonth;

      totalAssigned = round2(totalAssigned + d.totalCredit);
      totalUsed = round2(totalUsed + d.usedCredit);
      totalPaid = round2(totalPaid + d.totalPaid);
      totalOutstanding = round2(totalOutstanding + d.outstandingBalance);
      totalAvailable = round2(totalAvailable + d.availableCredit);
      totalAccumulatedInterest = round2(totalAccumulatedInterest + d.accumulatedInterest);
      totalPayableAll = round2(totalPayableAll + d.totalPayable);
      totalDailyInterestAll = round2(totalDailyInterestAll + d.dailyInterestAmount);
    });

    return res.status(200).json({
      success: true,
      interestSettings,
      stats: {
        totalDistributors: distributors.length,
        totalAssigned,
        totalUsed,
        totalPaid,
        totalOutstanding,
        totalAvailable,
        totalAccumulatedInterest,
        totalPayableAll,
        totalDailyInterestAll
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
// 3. ADMIN: GET / UPDATE GLOBAL CREDIT INTEREST SETTINGS
// =========================================================================
router.get('/admin/interest-settings', verifyToken, requireAdmin, async (req, res) => {
  try {
    const settings = await getInterestSettings();
    return res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error loading interest settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load credit interest settings.'
    });
  }
});

router.put('/admin/interest-settings', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      enabled,
      defaultMonthlyRate,
      startDate,
      calcMode,
      compounding,
      applyToAllDistributors
    } = req.body;

    const settings = await updateInterestSettings({
      enabled: Boolean(enabled),
      defaultMonthlyRate: Number(defaultMonthlyRate),
      startDate,
      calcMode,
      compounding: Boolean(compounding),
      applyToAllDistributors: Boolean(applyToAllDistributors)
    });

    return res.status(200).json({
      success: true,
      message: applyToAllDistributors
        ? `Interest settings saved and ${settings.defaultMonthlyRate}%/month applied uniformly to all distributors.`
        : 'Credit interest settings updated successfully.',
      settings
    });
  } catch (error) {
    console.error('Error saving interest settings:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update credit interest settings.'
    });
  }
});

// =========================================================================
// 4. ADMIN: UPDATE INDIVIDUAL DISTRIBUTOR INTEREST CONFIGURATION
// =========================================================================
router.put('/admin/distributor-interest/:distributorId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { distributorId } = req.params;
    const { interestEnabled, customMonthlyRate, interestStartDate } = req.body;

    const distributorUser = await queryGet(
      "SELECT id, userId, fullName, businessName FROM users WHERE (userId = ? OR id = ?) AND userType = 'Distributor'",
      [distributorId, distributorId]
    );

    if (!distributorUser) {
      return res.status(404).json({
        success: false,
        message: 'Distributor not found.'
      });
    }

    const creditRecord = await ensureDistributorCreditRecord(distributorUser);

    let parsedCustomRate = null;
    if (customMonthlyRate !== null && customMonthlyRate !== undefined && String(customMonthlyRate).trim() !== '') {
      const rateNum = Number(customMonthlyRate);
      if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Custom monthly interest rate must be between 0% and 100%.'
        });
      }
      parsedCustomRate = rateNum;
    }

    const validStart =
      interestStartDate && /^\d{4}-\d{2}-\d{2}$/.test(String(interestStartDate).trim())
        ? String(interestStartDate).trim()
        : null;

    const enabledFlag = interestEnabled === false || interestEnabled === 0 ? 0 : 1;

    await queryRun(
      `UPDATE distributor_credits
       SET interest_enabled = ?,
           custom_monthly_interest_rate = ?,
           interest_start_date = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [enabledFlag, parsedCustomRate, validStart, creditRecord.id]
    );

    return res.status(200).json({
      success: true,
      message: `Interest configuration updated for ${distributorUser.fullName} (${distributorUser.userId}).`
    });
  } catch (error) {
    console.error('Error updating distributor interest:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update distributor interest settings.'
    });
  }
});

// =========================================================================
// 5. ADMIN: MANUALLY TRIGGER DAILY INTEREST CALCULATION (IDEMPOTENT)
// =========================================================================
router.post('/admin/calculate-interest', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { distributorId = null, targetDate = null } = req.body || {};
    const adminName = req.user.fullName || req.user.email || 'Admin';

    const result = await processDailyInterestForAllDistributors({
      targetDate,
      triggeredBy: `Admin: ${adminName}`,
      onlyDistributorId: distributorId
    });

    if (result.skipped) {
      return res.status(200).json(result);
    }

    return res.status(200).json({
      ...result,
      message:
        result.chargedCount > 0
          ? `Calculated daily interest for ${result.chargedCount} distributor(s). Total added: ₹${result.totalInterestAdded.toLocaleString('en-IN')}.`
          : (result.message || `All eligible distributors are already up to date for ${result.businessDate} (no duplicates created).`)
    });
  } catch (error) {
    console.error('Error running daily interest calculation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to run daily interest calculation.'
    });
  }
});

// =========================================================================
// 6. ADMIN: GET INDIVIDUAL DISTRIBUTOR INTEREST HISTORY AUDIT LOGS
// =========================================================================
router.get('/admin/interest-history/:distributorId', verifyToken, requireAdmin, async (req, res) => {
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
    const interestSettings = await getInterestSettings();

    const logs = await queryAll(
      `SELECT id, txn_number, distributor_id, interest_date, principal_amount, monthly_rate,
              days_in_month, daily_interest, interest_before, interest_after, calc_method,
              compounding_enabled, notes, triggered_by, created_at
       FROM distributor_credit_interest_logs
       WHERE distributor_id = ? OR user_id = ?
       ORDER BY interest_date DESC, id DESC`,
      [distributorUser.userId, distributorUser.id]
    );

    const outstandingBalance = resolveOutstandingPrincipal(creditRecord);
    const accumulatedInterest = round2(creditRecord?.accumulated_interest || 0);
    const hasCustomRate =
      creditRecord?.custom_monthly_interest_rate !== null &&
      creditRecord?.custom_monthly_interest_rate !== undefined;
    const effectiveRate = hasCustomRate
      ? Number(creditRecord.custom_monthly_interest_rate)
      : interestSettings.defaultMonthlyRate;
    const isActive = interestSettings.enabled && Number(creditRecord?.interest_enabled ?? 1) === 1;

    const { monthlyInterest, dailyInterest, daysInMonth } = isActive
      ? calculateEstimatedInterest({
          principal: outstandingBalance,
          accumulatedInterest,
          monthlyRate: effectiveRate,
          dateStr: interestSettings.nepalToday,
          calcMode: interestSettings.calcMode,
          compounding: interestSettings.compounding
        })
      : { monthlyInterest: 0, dailyInterest: 0, daysInMonth: interestSettings.daysInCurrentMonth };

    return res.status(200).json({
      success: true,
      distributor: {
        id: distributorUser.id,
        distributorId: distributorUser.userId,
        fullName: distributorUser.fullName,
        businessName: distributorUser.businessName,
        email: distributorUser.email,
        phoneNumber: distributorUser.phoneNumber
      },
      summary: {
        outstandingPrincipal: outstandingBalance,
        accumulatedInterest,
        totalInterestCharged: round2(creditRecord?.total_interest_charged || 0),
        totalInterestPaid: round2(creditRecord?.total_interest_paid || 0),
        totalPayable: round2(outstandingBalance + accumulatedInterest),
        effectiveMonthlyRate: effectiveRate,
        isCustomRate,
        interestEnabled: isActive,
        dailyInterestAmount: dailyInterest,
        monthlyEstimatedInterest: monthlyInterest,
        daysInCurrentMonth: daysInMonth,
        lastInterestDate: creditRecord?.last_interest_date || null,
        totalInterestEntries: logs.length
      },
      logs: logs || []
    });
  } catch (error) {
    console.error('Error fetching distributor interest history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch distributor interest history.'
    });
  }
});

// =========================================================================
// 7. ADMIN: GET DETAILED DISTRIBUTOR TRANSACTION LEDGER & ACCOUNTING OVERVIEW
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
    const interestSettings = await getInterestSettings();

    // Build query with filters
    let sql = `
      SELECT id, txn_number, distributor_id, user_id, transaction_type, amount,
             credit_added, credit_removed, payment_amount,
             previous_credit, new_credit, outstanding_before, outstanding_after,
             interest_amount, interest_rate, principal_amount, interest_before, interest_after,
             interest_date, calc_method,
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
      } else if (type === 'DAILY_INTEREST') {
        sql += ` AND transaction_type = 'DAILY_INTEREST'`;
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

    const allMatching = await queryAll(sql, params);
    const totalTransactionsCount = allMatching.length;

    let paginatedTransactions = allMatching;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = limit === 'all' ? (allMatching.length || 1) : (parseInt(limit, 10) || 25);
    if (limit !== 'all') {
      const offset = (pageNum - 1) * limitNum;
      paginatedTransactions = allMatching.slice(offset, offset + limitNum);
    }

    const allHistory = await queryAll(
      `SELECT transaction_type, amount, credit_added, credit_removed, payment_amount, interest_amount, created_at
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

    allHistory.forEach((tx) => {
      const added = Number(tx.credit_added || 0);
      const removed = Number(tx.credit_removed || 0);
      const payment = Number(tx.payment_amount || 0);
      const amt = Number(tx.amount || 0);

      if (tx.transaction_type === 'ALLOCATION' || tx.transaction_type === 'CREDIT_ADDED') {
        totalAmountAdded += added > 0 ? added : amt;
      } else if (tx.transaction_type === 'PURCHASE_DEDUCTION') {
        totalOrderDeducted += amt;
      } else if (tx.transaction_type === 'PAYMENT_SETTLEMENT') {
        totalAmountPaid += payment > 0 ? payment : amt;
      } else if (tx.transaction_type === 'CREDIT_REMOVED' || tx.transaction_type === 'DECREASE') {
        totalAmountDeducted += removed > 0 ? removed : amt;
      } else if (tx.transaction_type === 'REFUND') {
        totalAmountAdded += amt;
      } else if (tx.transaction_type !== 'DAILY_INTEREST') {
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
    const currentOutstanding = resolveOutstandingPrincipal(creditRecord);
    const currentAvailable = Math.max(0, round2(totalCredit - currentOutstanding));
    const accumulatedInterest = round2(creditRecord?.accumulated_interest || 0);
    const totalPayable = round2(currentOutstanding + accumulatedInterest);

    const hasCustomRate =
      creditRecord?.custom_monthly_interest_rate !== null &&
      creditRecord?.custom_monthly_interest_rate !== undefined;
    const effectiveMonthlyRate = hasCustomRate
      ? Number(creditRecord.custom_monthly_interest_rate)
      : interestSettings.defaultMonthlyRate;
    const interestEnabled = interestSettings.enabled && Number(creditRecord?.interest_enabled ?? 1) === 1;

    const { dailyInterest, monthlyInterest } = interestEnabled
      ? calculateEstimatedInterest({
          principal: currentOutstanding,
          accumulatedInterest,
          monthlyRate: effectiveMonthlyRate,
          dateStr: interestSettings.nepalToday,
          calcMode: interestSettings.calcMode,
          compounding: interestSettings.compounding
        })
      : { dailyInterest: 0, monthlyInterest: 0 };

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
        accumulatedInterest,
        totalInterestCharged: round2(creditRecord?.total_interest_charged || 0),
        totalInterestPaid: round2(creditRecord?.total_interest_paid || 0),
        totalPayable,
        effectiveMonthlyRate,
        dailyInterestAmount: dailyInterest,
        monthlyEstimatedInterest: monthlyInterest,
        interestEnabled,
        lastInterestDate: creditRecord?.last_interest_date || null,
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
// 8. ADMIN: MANUALLY ASSIGN, INCREASE, OR REDUCE CREDIT LIMIT
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
    const currentOutstanding = resolveOutstandingPrincipal(creditRecord);
    const currentAvailable = Math.max(0, round2(currentTotal - currentOutstanding));

    let newTotal = currentTotal;
    let transactionType = 'ALLOCATION';
    let creditAdded = 0;
    let creditRemoved = 0;

    if (mode === 'SET') {
      newTotal = parsedAmount;
      if (newTotal >= currentTotal) {
        transactionType = 'ALLOCATION';
        creditAdded = round2(newTotal - currentTotal);
      } else {
        transactionType = 'CREDIT_REMOVED';
        creditRemoved = round2(currentTotal - newTotal);
      }
    } else if (mode === 'INCREASE' || mode === 'ADD') {
      newTotal = round2(currentTotal + parsedAmount);
      transactionType = 'ALLOCATION';
      creditAdded = parsedAmount;
    } else if (mode === 'DECREASE' || mode === 'REMOVE') {
      newTotal = round2(Math.max(0, currentTotal - parsedAmount));
      transactionType = 'CREDIT_REMOVED';
      creditRemoved = Math.min(currentTotal, parsedAmount);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid adjustment mode. Allowed values: SET, INCREASE, DECREASE.'
      });
    }

    const newAvailable = Math.max(0, round2(newTotal - currentOutstanding));
    const txnNumber = generateTxnNumber();
    const adminName = req.user.fullName || req.user.email || 'Admin';

    await queryRun(
      `UPDATE distributor_credits
       SET total_credit = ?, available_credit = ?, outstanding_balance = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newTotal, newAvailable, currentOutstanding, creditRecord.id]
    );

    const auditDesc =
      description && description.trim()
        ? description.trim()
        : mode === 'SET'
          ? `Admin set credit limit to ₹${newTotal.toLocaleString('en-IN')}`
          : mode === 'INCREASE' || mode === 'ADD'
            ? `Admin increased credit limit by ₹${parsedAmount.toLocaleString('en-IN')}`
            : `Admin decreased credit limit by ₹${parsedAmount.toLocaleString('en-IN')}`;

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
      message: `Credit successfully ${mode === 'SET' ? 'assigned' : mode === 'INCREASE' || mode === 'ADD' ? 'increased' : 'adjusted'}. Available Balance: ₹${newAvailable.toLocaleString('en-IN')}`,
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
// 9. ADMIN: RECORD DISTRIBUTOR PAYMENT / SETTLEMENT (PRINCIPAL + INTEREST)
// =========================================================================
router.post('/admin/settle-payment', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      distributorId,
      amount,
      paymentMethod = 'Bank Transfer',
      referenceId = '',
      description = '',
      allocationMode = 'PRINCIPAL_FIRST' // 'PRINCIPAL_FIRST' | 'INTEREST_FIRST'
    } = req.body;

    const parsedAmount = round2(amount);
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
    const outstandingBefore = resolveOutstandingPrincipal(creditRecord);
    const availableBefore = Math.max(0, round2(currentTotal - outstandingBefore));

    const accInterestBefore = round2(creditRecord.accumulated_interest || 0);
    const totalInterestPaidBefore = round2(creditRecord.total_interest_paid || 0);

    let principalPaid = 0;
    let interestPaid = 0;

    if (allocationMode === 'INTEREST_FIRST') {
      interestPaid = Math.min(accInterestBefore, parsedAmount);
      const remaining = round2(parsedAmount - interestPaid);
      principalPaid = Math.min(outstandingBefore, remaining);
    } else {
      // Default: PRINCIPAL_FIRST (payments reduce principal, excess reduces accumulated interest)
      principalPaid = Math.min(outstandingBefore, parsedAmount);
      const remaining = round2(parsedAmount - principalPaid);
      interestPaid = Math.min(accInterestBefore, remaining);
    }

    const newPaid = round2(currentPaid + parsedAmount);
    const outstandingAfter = round2(Math.max(0, outstandingBefore - principalPaid));
    const accInterestAfter = round2(Math.max(0, accInterestBefore - interestPaid));
    const totalInterestPaidAfter = round2(totalInterestPaidBefore + interestPaid);
    const availableAfter = Math.max(0, round2(currentTotal - outstandingAfter));

    const txnNumber = generateTxnNumber();
    const adminName = req.user.fullName || req.user.email || 'Admin';

    await queryRun(
      `UPDATE distributor_credits
       SET total_paid = ?,
           outstanding_balance = ?,
           available_credit = ?,
           accumulated_interest = ?,
           total_interest_paid = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        newPaid,
        outstandingAfter,
        availableAfter,
        accInterestAfter,
        totalInterestPaidAfter,
        creditRecord.id
      ]
    );

    const allocationDetail =
      interestPaid > 0 && principalPaid > 0
        ? ` (Principal: ₹${principalPaid.toLocaleString('en-IN')}, Interest: ₹${interestPaid.toLocaleString('en-IN')})`
        : interestPaid > 0
          ? ` (Interest Settled: ₹${interestPaid.toLocaleString('en-IN')})`
          : '';

    const note =
      description && description.trim()
        ? `${description.trim()}${allocationDetail}`
        : `Payment received via ${paymentMethod}${referenceId ? ` (Ref: ${referenceId})` : ''} - ₹${parsedAmount.toLocaleString('en-IN')}${allocationDetail}`;

    await queryRun(
      `INSERT INTO distributor_credit_transactions
       (txn_number, distributor_id, user_id, transaction_type, amount, credit_added, credit_removed,
        payment_amount, previous_credit, new_credit, outstanding_before, outstanding_after,
        interest_amount, interest_before, interest_after,
        payment_method, reference_id, description, admin_id, admin_name)
       VALUES (?, ?, ?, 'PAYMENT_SETTLEMENT', ?, 0.00, 0.00, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        interestPaid,
        accInterestBefore,
        accInterestAfter,
        paymentMethod,
        referenceId.trim() || null,
        note,
        req.user.id,
        adminName
      ]
    );

    try {
      await createNotification({
        recipientId: distributorUser.userId,
        recipientRole: 'Distributor',
        title: `✅ Payment Received: ₹${parsedAmount.toLocaleString('en-IN')}`,
        message: `Your payment of ₹${parsedAmount.toLocaleString('en-IN')} has been recorded. Principal Outstanding: ₹${outstandingAfter.toLocaleString('en-IN')}, Interest Due: ₹${accInterestAfter.toLocaleString('en-IN')}, Available Credit: ₹${availableAfter.toLocaleString('en-IN')}.`,
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
      message: `Payment of ₹${parsedAmount.toLocaleString('en-IN')} recorded. Principal: ₹${outstandingAfter.toLocaleString('en-IN')} | Interest Due: ₹${accInterestAfter.toLocaleString('en-IN')}.`,
      txnNumber,
      credit: {
        totalCredit: currentTotal,
        usedCredit: currentUsed,
        totalPaid: newPaid,
        outstandingBalance: outstandingAfter,
        accumulatedInterest: accInterestAfter,
        totalPayable: round2(outstandingAfter + accInterestAfter),
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

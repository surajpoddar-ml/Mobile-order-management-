import { queryGet, queryAll, queryRun } from '../database/db.js';

/**
 * Determine rating tier based on numerical score and invoice count
 */
export function getRatingTier(score, totalInvoices) {
  if (!totalInvoices || totalInvoices === 0) {
    return 'Not Yet Rated';
  }
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Needs Improvement';
  return 'Poor';
}

/**
 * Calculate Payment Reliability Score for a user from their verified invoices & payments
 */
export async function calculateUserReliabilityScore(userId) {
  const invoices = await queryAll(
    'SELECT * FROM distribution_invoices WHERE userId = ? AND status != "CANCELLED"',
    [userId]
  );

  const payments = await queryAll(
    'SELECT * FROM distribution_payments WHERE userId = ? AND verificationStatus = "VERIFIED"',
    [userId]
  );

  const totalInvoices = invoices.length;

  if (totalInvoices === 0 && payments.length === 0) {
    return {
      userId,
      score: 100.0,
      onTimeRate: 100.0,
      consistencyRate: 100.0,
      overdueRate: 100.0,
      totalInvoices: 0,
      onTimePayments: 0,
      latePayments: 0,
      missedPayments: 0,
      totalDue: 0.0,
      totalPaid: 0.0,
      outstandingAmount: 0.0,
      overdueDays: 0,
      ratingTier: 'Not Yet Rated'
    };
  }

  let totalDue = 0;
  let totalPaid = 0;
  let onTimePayments = 0;
  let latePayments = 0;
  let missedPayments = 0;
  let totalOverdueDays = 0;

  const now = new Date();

  // Evaluate invoices
  for (const inv of invoices) {
    const due = Number(inv.amountDue || 0);
    const paid = Number(inv.amountPaid || 0);
    totalDue += due;
    totalPaid += paid;

    const dueDate = new Date(inv.dueDate);
    const paidDate = inv.paidDate ? new Date(inv.paidDate) : null;
    const isPaid = inv.status === 'PAID';

    if (isPaid && paidDate) {
      if (paidDate <= dueDate) {
        onTimePayments++;
      } else {
        latePayments++;
        const lateDays = Math.max(0, Math.ceil((paidDate - dueDate) / (1000 * 60 * 60 * 24)));
        totalOverdueDays += lateDays;
      }
    } else {
      // Unpaid or partial
      if (now > dueDate) {
        missedPayments++;
        const overdueDays = Math.max(0, Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24)));
        totalOverdueDays += overdueDays;
      }
    }
  }

  // Also sum any direct payments not linked to invoices
  for (const pay of payments) {
    if (!pay.invoiceId) {
      totalPaid += Number(pay.amountPaid || 0);
    }
  }

  const outstandingAmount = Math.max(0, totalDue - totalPaid);

  // 1. On-time payment rate (70% weight)
  const totalEvaluated = onTimePayments + latePayments + missedPayments;
  const onTimeRatio = totalEvaluated > 0 ? (onTimePayments / totalEvaluated) : 1;
  const onTimeScore = onTimeRatio * 70.0;

  // 2. Consistency rate (20% weight: totalPaid vs totalDue)
  const consistencyRatio = totalDue > 0 ? Math.min(1, totalPaid / totalDue) : 1;
  const consistencyScore = consistencyRatio * 20.0;

  // 3. Overdue rate (10% weight: penalty for overdue days)
  // Penalize 0.5 points per overdue day up to 10 points
  const overduePenalty = Math.min(10, totalOverdueDays * 0.5);
  const overdueScore = Math.max(0, 10.0 - overduePenalty);

  const rawScore = onTimeScore + consistencyScore + overdueScore;
  const finalScore = Math.min(100.0, Math.max(0.0, Math.round(rawScore * 100) / 100));

  const ratingTier = getRatingTier(finalScore, totalInvoices);

  return {
    userId,
    score: finalScore,
    onTimeRate: Math.round(onTimeRatio * 100 * 100) / 100,
    consistencyRate: Math.round(consistencyRatio * 100 * 100) / 100,
    overdueRate: Math.round((overdueScore / 10.0) * 100 * 100) / 100,
    totalInvoices,
    onTimePayments,
    latePayments,
    missedPayments,
    totalDue: Math.round(totalDue * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    outstandingAmount: Math.round(outstandingAmount * 100) / 100,
    overdueDays: totalOverdueDays,
    ratingTier
  };
}

/**
 * Recalculate and persist user reliability score and log history if changed
 */
export async function recalculateAndSaveUserScore(userId, reason = 'Payment activity update') {
  const calc = await calculateUserReliabilityScore(userId);
  const now = new Date().toISOString();

  const existing = await queryGet('SELECT * FROM payment_reliability_scores WHERE userId = ?', [userId]);

  if (!existing) {
    await queryRun(
      `INSERT INTO payment_reliability_scores (
        userId, score, onTimeRate, consistencyRate, overdueRate,
        totalInvoices, onTimePayments, latePayments, missedPayments,
        totalDue, totalPaid, outstandingAmount, overdueDays,
        ratingTier, lastCalculated, updatedDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        calc.score,
        calc.onTimeRate,
        calc.consistencyRate,
        calc.overdueRate,
        calc.totalInvoices,
        calc.onTimePayments,
        calc.latePayments,
        calc.missedPayments,
        calc.totalDue,
        calc.totalPaid,
        calc.outstandingAmount,
        calc.overdueDays,
        calc.ratingTier,
        now,
        now
      ]
    );

    // Initial history record
    await queryRun(
      `INSERT INTO payment_score_history (userId, score, previousScore, changeAmount, reason, recordedDate)
       VALUES (?, ?, NULL, 0, ?, ?)`,
      [userId, calc.score, reason || 'Initial Score Calculation', now]
    );
  } else {
    const previousScore = Number(existing.score);
    const changeAmount = Math.round((calc.score - previousScore) * 100) / 100;

    await queryRun(
      `UPDATE payment_reliability_scores SET
        score = ?, onTimeRate = ?, consistencyRate = ?, overdueRate = ?,
        totalInvoices = ?, onTimePayments = ?, latePayments = ?, missedPayments = ?,
        totalDue = ?, totalPaid = ?, outstandingAmount = ?, overdueDays = ?,
        ratingTier = ?, lastCalculated = ?, updatedDate = ?
       WHERE userId = ?`,
      [
        calc.score,
        calc.onTimeRate,
        calc.consistencyRate,
        calc.overdueRate,
        calc.totalInvoices,
        calc.onTimePayments,
        calc.latePayments,
        calc.missedPayments,
        calc.totalDue,
        calc.totalPaid,
        calc.outstandingAmount,
        calc.overdueDays,
        calc.ratingTier,
        now,
        now,
        userId
      ]
    );

    // Log history if score changed by at least 0.1
    if (Math.abs(changeAmount) >= 0.1 || calc.ratingTier !== existing.ratingTier) {
      await queryRun(
        `INSERT INTO payment_score_history (userId, score, previousScore, changeAmount, reason, recordedDate)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, calc.score, previousScore, changeAmount, reason, now]
      );
    }
  }

  return calc;
}

/**
 * Get user reliability score details and recent score history
 */
export async function getUserScoreDetails(userId) {
  let scoreData = await queryGet('SELECT * FROM payment_reliability_scores WHERE userId = ?', [userId]);
  if (!scoreData) {
    scoreData = await recalculateAndSaveUserScore(userId, 'Initial Score Setup');
  }

  const history = await queryAll(
    'SELECT * FROM payment_score_history WHERE userId = ? ORDER BY id DESC LIMIT 15',
    [userId]
  );

  return {
    ...scoreData,
    history
  };
}


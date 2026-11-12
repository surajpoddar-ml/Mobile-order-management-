import { pool, queryAll, queryGet, queryRun } from '../database/db.js';
import { createNotification } from './notificationService.js';

let isInterestJobRunning = false;
let schedulerIntervalId = null;

export const round2 = (value) => {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Current business date string (YYYY-MM-DD) in Nepal Standard Time (Asia/Kathmandu)
 */
export const getNepalDateString = (date = new Date()) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

/**
 * Add days to a YYYY-MM-DD date string safely
 */
export const addDaysToDateString = (dateStr, days) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

/**
 * Returns number of days in the month for YYYY-MM-DD (28/29/30/31) or fixed 30
 */
export const getDaysInMonthForDate = (dateStr, calcMode = 'calendar_days') => {
  if (calcMode === 'fixed_30') return 30;
  const [year, month] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
};

/**
 * Pure calculation helper for estimated monthly & daily interest
 */
export const calculateEstimatedInterest = ({
  principal = 0,
  accumulatedInterest = 0,
  monthlyRate = 0,
  dateStr = getNepalDateString(),
  calcMode = 'calendar_days',
  compounding = false
}) => {
  const safePrincipal = Math.max(0, round2(principal));
  const safeAccInterest = Math.max(0, round2(accumulatedInterest));
  const safeRate = Math.max(0, Number(monthlyRate) || 0);
  const daysInMonth = getDaysInMonthForDate(dateStr, calcMode);

  if (safePrincipal <= 0 || safeRate <= 0) {
    return {
      effectiveBase: safePrincipal,
      daysInMonth,
      monthlyInterest: 0,
      dailyInterest: 0
    };
  }

  const effectiveBase = compounding ? round2(safePrincipal + safeAccInterest) : safePrincipal;
  const monthlyInterest = round2((effectiveBase * safeRate) / 100);
  const dailyInterest = round2(((effectiveBase * safeRate) / 100) / daysInMonth);

  return {
    effectiveBase,
    daysInMonth,
    monthlyInterest,
    dailyInterest
  };
};

/**
 * Fetch global Distributor Credit Interest configuration from system_settings
 */
export const getInterestSettings = async () => {
  const keys = [
    'credit_interest_enabled',
    'credit_interest_default_rate',
    'credit_interest_start_date',
    'credit_interest_calc_mode',
    'credit_interest_compounding'
  ];

  const rows = await queryAll(
    'SELECT `key`, `value`, updatedDate FROM system_settings WHERE `key` IN (?, ?, ?, ?, ?)',
    keys
  );

  const map = {};
  rows.forEach((r) => {
    map[r.key] = r.value;
  });

  const nepalToday = getNepalDateString();
  return {
    enabled: map.credit_interest_enabled === 'true',
    defaultMonthlyRate: Number(map.credit_interest_default_rate ?? 1.5),
    startDate: map.credit_interest_start_date || nepalToday,
    calcMode: map.credit_interest_calc_mode === 'fixed_30' ? 'fixed_30' : 'calendar_days',
    compounding: map.credit_interest_compounding === 'true',
    nepalToday,
    daysInCurrentMonth: getDaysInMonthForDate(
      nepalToday,
      map.credit_interest_calc_mode === 'fixed_30' ? 'fixed_30' : 'calendar_days'
    )
  };
};

/**
 * Save global Distributor Credit Interest settings
 */
export const updateInterestSettings = async ({
  enabled,
  defaultMonthlyRate,
  startDate,
  calcMode,
  compounding,
  applyToAllDistributors = false
}) => {
  const rate = Number(defaultMonthlyRate);
  if (isNaN(rate) || rate < 0 || rate > 100) {
    throw new Error('Monthly interest rate must be between 0% and 100%.');
  }

  const validMode = calcMode === 'fixed_30' ? 'fixed_30' : 'calendar_days';
  const nepalToday = getNepalDateString();
  const validStartDate = startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())
    ? startDate.trim()
    : nepalToday;

  const nowIso = new Date().toISOString();
  const updates = [
    ['credit_interest_enabled', enabled ? 'true' : 'false'],
    ['credit_interest_default_rate', String(rate)],
    ['credit_interest_start_date', validStartDate],
    ['credit_interest_calc_mode', validMode],
    ['credit_interest_compounding', compounding ? 'true' : 'false']
  ];

  for (const [k, v] of updates) {
    const existing = await queryGet('SELECT `key` FROM system_settings WHERE `key` = ?', [k]);
    if (existing) {
      await queryRun('UPDATE system_settings SET `value` = ?, updatedDate = ? WHERE `key` = ?', [v, nowIso, k]);
    } else {
      await queryRun('INSERT INTO system_settings (`key`, `value`, updatedDate) VALUES (?, ?, ?)', [k, v, nowIso]);
    }
  }

  if (applyToAllDistributors) {
    await queryRun(
      'UPDATE distributor_credits SET custom_monthly_interest_rate = NULL, interest_enabled = 1, updated_at = CURRENT_TIMESTAMP'
    );
  }

  return getInterestSettings();
};

/**
 * Determine applicable outstanding principal at the end of a historical Nepal business day
 */
const resolvePrincipalForDate = async (conn, distributorId, userId, dayStr, currentPrincipal) => {
  const nepalToday = getNepalDateString();
  if (dayStr >= nepalToday) {
    return currentPrincipal;
  }

  // End of business day in Nepal (+05:45) converted to JS Date (UTC) for MySQL comparison
  const endOfDayDate = new Date(`${dayStr}T23:59:59+05:45`);
  const endOfDayMysql = endOfDayDate.toISOString().slice(0, 19).replace('T', ' ');

  const [beforeRows] = await conn.query(
    `SELECT outstanding_after
     FROM distributor_credit_transactions
     WHERE (distributor_id = ? OR user_id = ?) AND created_at <= ?
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [distributorId, userId, endOfDayMysql]
  );

  if (beforeRows && beforeRows.length > 0) {
    return Math.max(0, round2(beforeRows[0].outstanding_after));
  }

  // No transaction on or before that day; check if transactions existed strictly after that day
  const [afterRows] = await conn.query(
    `SELECT outstanding_before
     FROM distributor_credit_transactions
     WHERE (distributor_id = ? OR user_id = ?) AND created_at > ?
     ORDER BY created_at ASC, id ASC
     LIMIT 1`,
    [distributorId, userId, endOfDayMysql]
  );

  if (afterRows && afterRows.length > 0) {
    return Math.max(0, round2(afterRows[0].outstanding_before));
  }

  return currentPrincipal;
};

/**
 * Idempotent daily interest calculation engine using DB transactions and UNIQUE KEY deduplication
 */
export const processDailyInterestForAllDistributors = async ({
  targetDate = null,
  triggeredBy = 'SYSTEM_SCHEDULER',
  onlyDistributorId = null
} = {}) => {
  if (isInterestJobRunning) {
    return {
      success: true,
      skipped: true,
      message: 'Interest calculation job is already in progress.',
      processedCount: 0,
      chargedCount: 0,
      totalInterestAdded: 0
    };
  }

  isInterestJobRunning = true;
  const results = {
    success: true,
    businessDate: targetDate || getNepalDateString(),
    processedCount: 0,
    chargedCount: 0,
    skippedCount: 0,
    totalInterestAdded: 0,
    details: []
  };

  try {
    const settings = await getInterestSettings();
    const nepalToday = settings.nepalToday;
    const endDate = targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate) && targetDate <= nepalToday
      ? targetDate
      : nepalToday;
    results.businessDate = endDate;

    if (!settings.enabled) {
      return {
        ...results,
        message: 'Automatic credit interest system is currently disabled.'
      };
    }

    // Fetch all eligible credit accounts (or specific distributor)
    let distSql = `
      SELECT dc.*, u.userId AS user_code, u.fullName, u.businessName, u.accountStatus
      FROM distributor_credits dc
      INNER JOIN users u ON (dc.distributor_id = u.userId OR dc.user_id = u.id)
      WHERE u.userType = 'Distributor'
    `;
    const distParams = [];
    if (onlyDistributorId) {
      distSql += ' AND (dc.distributor_id = ? OR dc.user_id = ?)';
      distParams.push(onlyDistributorId, onlyDistributorId);
    }

    const creditRows = await queryAll(distSql, distParams);

    for (const row of creditRows) {
      results.processedCount += 1;

      if (Number(row.interest_enabled) === 0) {
        results.skippedCount += 1;
        continue;
      }

      const effectiveRate =
        row.custom_monthly_interest_rate !== null && row.custom_monthly_interest_rate !== undefined
          ? Number(row.custom_monthly_interest_rate)
          : settings.defaultMonthlyRate;

      if (effectiveRate <= 0) {
        results.skippedCount += 1;
        continue;
      }

      const effectiveStartDate = row.interest_start_date || settings.startDate || endDate;
      if (endDate < effectiveStartDate) {
        results.skippedCount += 1;
        continue;
      }

      // Determine starting business day (handle missed executions safely, max 60 days lookback)
      let startDay = row.last_interest_date
        ? addDaysToDateString(row.last_interest_date, 1)
        : effectiveStartDate;

      if (startDay < effectiveStartDate) {
        startDay = effectiveStartDate;
      }

      const minAllowedDay = addDaysToDateString(endDate, -60);
      if (startDay < minAllowedDay) {
        startDay = minAllowedDay;
      }

      if (startDay > endDate) {
        results.skippedCount += 1;
        continue;
      }

      // Iterate each missed/due day inside a transaction per distributor
      const conn = await pool.getConnection();
      let chargedForThisDistributor = 0;
      let daysChargedForThisDistributor = 0;
      let latestInterestAfter = 0;
      let latestPrincipalUsed = 0;

      try {
        await conn.beginTransaction();

        const [lockedRows] = await conn.query(
          'SELECT * FROM distributor_credits WHERE id = ? FOR UPDATE',
          [row.id]
        );
        if (!lockedRows || lockedRows.length === 0) {
          await conn.rollback();
          continue;
        }

        const locked = lockedRows[0];
        const currentPrincipal = Math.max(
          0,
          round2(
            locked.outstanding_balance !== undefined && locked.outstanding_balance !== null
              ? locked.outstanding_balance
              : Math.max(0, Number(locked.used_credit || 0) - Number(locked.total_paid || 0))
          )
        );

        let runningAccumulatedInterest = Math.max(0, round2(locked.accumulated_interest || 0));
        let runningTotalCharged = Math.max(0, round2(locked.total_interest_charged || 0));
        let runningLastDate = locked.last_interest_date || null;
        let runningLastDaily = Number(locked.last_daily_interest || 0);
        const totalLimit = Number(locked.total_credit || 0);

        let loopDay = startDay;
        while (loopDay <= endDate) {
          // 1. Ensure strictly once per business day per distributor
          const [dupCheck] = await conn.query(
            'SELECT id FROM distributor_credit_interest_logs WHERE distributor_id = ? AND interest_date = ? LIMIT 1',
            [locked.distributor_id, loopDay]
          );

          if (dupCheck && dupCheck.length > 0) {
            runningLastDate = loopDay;
            loopDay = addDaysToDateString(loopDay, 1);
            continue;
          }

          // 2. Resolve applicable principal for this business day
          const principalForDay = await resolvePrincipalForDate(
            conn,
            locked.distributor_id,
            locked.user_id,
            loopDay,
            currentPrincipal
          );

          if (principalForDay <= 0) {
            runningLastDate = loopDay;
            runningLastDaily = 0;
            loopDay = addDaysToDateString(loopDay, 1);
            continue;
          }

          const { dailyInterest, daysInMonth } = calculateEstimatedInterest({
            principal: principalForDay,
            accumulatedInterest: runningAccumulatedInterest,
            monthlyRate: effectiveRate,
            dateStr: loopDay,
            calcMode: settings.calcMode,
            compounding: settings.compounding
          });

          if (dailyInterest <= 0) {
            runningLastDate = loopDay;
            runningLastDaily = 0;
            loopDay = addDaysToDateString(loopDay, 1);
            continue;
          }

          const interestBefore = runningAccumulatedInterest;
          const interestAfter = round2(interestBefore + dailyInterest);
          const txnNumber = `TXN-INT-${loopDay.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
          const calcMethodLabel = `${settings.calcMode}_${daysInMonth}`;
          const availSnapshot = Math.max(0, round2(totalLimit - currentPrincipal));
          const description = `Daily credit interest (${loopDay}) @ ${effectiveRate}%/mo on principal ₹${principalForDay.toLocaleString('en-IN')} (${daysInMonth}-day basis)`;

          // 3. Insert audit log row (UNIQUE KEY guarantees no duplicates even under race conditions)
          await conn.query(
            `INSERT INTO distributor_credit_interest_logs
             (txn_number, distributor_id, user_id, interest_date, principal_amount, monthly_rate,
              days_in_month, daily_interest, interest_before, interest_after, calc_method,
              compounding_enabled, notes, triggered_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              txnNumber,
              locked.distributor_id,
              locked.user_id,
              loopDay,
              principalForDay,
              effectiveRate,
              daysInMonth,
              dailyInterest,
              interestBefore,
              interestAfter,
              calcMethodLabel,
              settings.compounding ? 1 : 0,
              description,
              triggeredBy
            ]
          );

          // 4. Insert unified ledger entry in distributor_credit_transactions
          await conn.query(
            `INSERT INTO distributor_credit_transactions
             (txn_number, distributor_id, user_id, transaction_type, amount,
              credit_added, credit_removed, payment_amount,
              previous_credit, new_credit, outstanding_before, outstanding_after,
              interest_amount, interest_rate, principal_amount, interest_before, interest_after,
              interest_date, calc_method, reference_id, description, admin_name)
             VALUES (?, ?, ?, 'DAILY_INTEREST', ?, 0.00, 0.00, 0.00, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              txnNumber,
              locked.distributor_id,
              locked.user_id,
              dailyInterest,
              availSnapshot,
              availSnapshot,
              principalForDay,
              principalForDay,
              dailyInterest,
              effectiveRate,
              principalForDay,
              interestBefore,
              interestAfter,
              loopDay,
              calcMethodLabel,
              `INT-${loopDay}`,
              description,
              triggeredBy
            ]
          );

          runningAccumulatedInterest = interestAfter;
          runningTotalCharged = round2(runningTotalCharged + dailyInterest);
          runningLastDate = loopDay;
          runningLastDaily = dailyInterest;

          chargedForThisDistributor = round2(chargedForThisDistributor + dailyInterest);
          daysChargedForThisDistributor += 1;
          latestInterestAfter = interestAfter;
          latestPrincipalUsed = principalForDay;

          loopDay = addDaysToDateString(loopDay, 1);
        }

        // Persist updated interest summary on distributor_credits
        await conn.query(
          `UPDATE distributor_credits
           SET accumulated_interest = ?,
               total_interest_charged = ?,
               last_interest_date = ?,
               last_daily_interest = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            runningAccumulatedInterest,
            runningTotalCharged,
            runningLastDate,
            runningLastDaily,
            locked.id
          ]
        );

        await conn.commit();

        if (daysChargedForThisDistributor > 0) {
          results.chargedCount += 1;
          results.totalInterestAdded = round2(results.totalInterestAdded + chargedForThisDistributor);
          results.details.push({
            distributorId: locked.distributor_id,
            fullName: row.fullName,
            daysCharged: daysChargedForThisDistributor,
            interestAdded: chargedForThisDistributor,
            accumulatedInterest: latestInterestAfter,
            principalUsed: latestPrincipalUsed
          });

          // Send clean notification to distributor
          try {
            await createNotification({
              recipientId: locked.distributor_id,
              recipientRole: 'Distributor',
              title: `📈 Daily Credit Interest Added: ₹${chargedForThisDistributor.toLocaleString('en-IN')}`,
              message: `Daily interest of ₹${chargedForThisDistributor.toLocaleString('en-IN')} (${effectiveRate}%/mo on ₹${latestPrincipalUsed.toLocaleString('en-IN')} principal) has been recorded for ${endDate}. Accumulated interest: ₹${latestInterestAfter.toLocaleString('en-IN')}.`,
              type: 'credit_update',
              entityId: `INT-${locked.distributor_id}-${endDate}`,
              linkUrl: '/portal/distributor?tab=credit',
              dedupKey: `daily_int_${locked.distributor_id}_${endDate}`
            });
          } catch (notifErr) {
            // Do not fail job on notification warning
          }
        } else {
          results.skippedCount += 1;
        }
      } catch (distErr) {
        await conn.rollback();
        if (distErr?.code !== 'ER_DUP_ENTRY') {
          console.error(`[CREDIT INTEREST] Error processing distributor ${row.distributor_id}:`, distErr.message);
        }
      } finally {
        conn.release();
      }
    }

    return results;
  } finally {
    isInterestJobRunning = false;
  }
};

/**
 * Start automatic background scheduler (runs startup check + periodic checks aligned with Asia/Kathmandu days)
 */
export const startCreditInterestScheduler = () => {
  if (schedulerIntervalId) {
    return schedulerIntervalId;
  }

  // Run initial startup catch-up check 15 seconds after DB is ready
  setTimeout(async () => {
    try {
      const res = await processDailyInterestForAllDistributors({ triggeredBy: 'SYSTEM_AUTO_DAILY' });
      if (res.chargedCount > 0) {
        console.log(`[CREDIT INTEREST] Startup sync charged ${res.chargedCount} distributors (Total: ₹${res.totalInterestAdded})`);
      }
    } catch (e) {
      console.warn('[CREDIT INTEREST] Startup check notice:', e.message);
    }
  }, 15000);

  // Check every 15 minutes so midnight Asia/Kathmandu boundary is processed promptly and safely
  schedulerIntervalId = setInterval(async () => {
    try {
      const res = await processDailyInterestForAllDistributors({ triggeredBy: 'SYSTEM_AUTO_DAILY' });
      if (res.chargedCount > 0) {
        console.log(`[CREDIT INTEREST] Daily job (${res.businessDate}) charged ${res.chargedCount} distributors (Total: ₹${res.totalInterestAdded})`);
      }
    } catch (e) {
      console.warn('[CREDIT INTEREST] Scheduled run notice:', e.message);
    }
  }, 15 * 60 * 1000);

  console.log('[CREDIT INTEREST] Automatic daily scheduler initialized (Timezone: Asia/Kathmandu).');
  return schedulerIntervalId;
};


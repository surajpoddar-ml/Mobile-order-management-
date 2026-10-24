import express from 'express';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { queryAll, queryGet, queryRun } from '../database/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { createNotification } from '../services/notificationService.js';

const router = express.Router();

/**
 * Helper to get system settings with fallback defaults
 */
const getRewardSettings = async () => {
  const rateRow = await queryGet('SELECT `value` FROM system_settings WHERE `key` = "points_to_cash_rate"');
  const minRow = await queryGet('SELECT `value` FROM system_settings WHERE `key` = "min_redemption_points"');
  return {
    rate: rateRow ? parseFloat(rateRow.value) || 1.0 : 1.0,
    minPoints: minRow ? parseInt(minRow.value, 10) || 10 : 10
  };
};

/**
 * Generate a unique token string (e.g. MWS-7A8B-9C0D)
 */
const generateUniqueTokenString = () => {
  const p1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const p2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `MWS-${p1}-${p2}`;
};

// =========================================================================
// 1. PUBLIC / AUTHENTICATED SETTINGS & SUMMARY
// =========================================================================

/**
 * GET /api/rewards/settings
 * Fetch current reward points-to-cash rate and redemption rules
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await getRewardSettings();
    return res.status(200).json({ success: true, settings });
  } catch (err) {
    console.error('Error fetching reward settings:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch reward settings.' });
  }
});

/**
 * GET /api/rewards/my-summary
 * Get current authenticated user's points balance, lifetime earnings, and cash valuation
 */
router.get('/my-summary', verifyToken, async (req, res) => {
  try {
    const user = await queryGet(
      'SELECT id, fullName, email, userType, pointsBalance, totalPointsEarned FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const settings = await getRewardSettings();
    const currentPoints = user.pointsBalance || 0;
    const totalEarned = user.totalPointsEarned || 0;
    const cashValue = Math.round(currentPoints * settings.rate * 100) / 100;

    return res.status(200).json({
      success: true,
      summary: {
        pointsBalance: currentPoints,
        totalPointsEarned: totalEarned,
        cashValue,
        conversionRate: settings.rate,
        minRedemptionPoints: settings.minPoints
      }
    });
  } catch (err) {
    console.error('Error fetching reward summary:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch reward summary.' });
  }
});

// =========================================================================
// 2. CUSTOMER & DISTRIBUTOR: SCAN & CLAIM QR CODE
// =========================================================================

/**
 * POST /api/rewards/scan-and-claim
 * Scan and claim a point-based QR offer token
 */
router.post('/scan-and-claim', verifyToken, async (req, res) => {
  try {
    const { token: rawToken } = req.body;
    if (!rawToken || typeof rawToken !== 'string') {
      return res.status(400).json({ success: false, message: 'QR token is required.' });
    }

    // Sanitize token: handle full URL or raw token
    let cleanToken = rawToken.trim();
    if (cleanToken.includes('token=')) {
      try {
        const urlParams = new URLSearchParams(cleanToken.split('?')[1]);
        if (urlParams.get('token')) {
          cleanToken = urlParams.get('token').trim();
        }
      } catch (e) {}
    } else if (cleanToken.includes('/')) {
      const parts = cleanToken.split('/');
      cleanToken = parts[parts.length - 1].trim();
    }
    cleanToken = cleanToken.toUpperCase();

    // 1. Look up token in database
    const qrRecord = await queryGet('SELECT * FROM qr_tokens WHERE UPPER(token) = ?', [cleanToken]);
    if (!qrRecord) {
      return res.status(404).json({
        success: false,
        message: `Invalid QR Code "${cleanToken}". This reward token does not exist in our system.`
      });
    }

    // 2. Check if already claimed
    if (qrRecord.status === 'Claimed') {
      const claimDate = qrRecord.claimedAt ? new Date(qrRecord.claimedAt).toLocaleString('en-IN') : 'earlier';
      const isClaimedByMe = qrRecord.claimedByUserId === req.user.id;
      return res.status(409).json({
        success: false,
        message: isClaimedByMe
          ? `You have already claimed this QR code on ${claimDate}. Each QR code can only be claimed once.`
          : `This QR code has already been claimed on ${claimDate}. Duplicate claims are not allowed.`
      });
    }

    // 3. Check if inactive or expired
    if (qrRecord.status === 'Inactive') {
      return res.status(403).json({
        success: false,
        message: 'This reward QR code is currently inactive. Please contact support.'
      });
    }

    if (qrRecord.status === 'Expired' || (qrRecord.expiryDate && new Date(qrRecord.expiryDate) < new Date())) {
      return res.status(403).json({
        success: false,
        message: 'This reward QR code has expired.'
      });
    }

    // 4. ATOMIC CLAIM: Update token status to 'Claimed' only if currently 'Active'
    const now = new Date().toISOString();
    const claimIp = req.ip || req.headers['x-forwarded-for'] || '';

    const claimRes = await queryRun(
      `UPDATE qr_tokens 
       SET status = 'Claimed', claimedByUserId = ?, claimedByRole = ?, claimedAt = ?, claimIp = ?
       WHERE id = ? AND status = 'Active'`,
      [req.user.id, req.user.userType, now, String(claimIp), qrRecord.id]
    );

    if (claimRes.changes === 0) {
      return res.status(409).json({
        success: false,
        message: 'This QR code was just claimed by another user. Please try another QR code.'
      });
    }

    // 5. Safely credit points to user account
    const pointsToAdd = qrRecord.points;
    await queryRun(
      `UPDATE users 
       SET pointsBalance = COALESCE(pointsBalance, 0) + ?,
           totalPointsEarned = COALESCE(totalPointsEarned, 0) + ?,
           updatedDate = ?
       WHERE id = ?`,
      [pointsToAdd, pointsToAdd, now, req.user.id]
    );

    // Get fresh user balance
    const updatedUser = await queryGet('SELECT pointsBalance, totalPointsEarned FROM users WHERE id = ?', [req.user.id]);
    const balanceAfter = updatedUser ? updatedUser.pointsBalance : pointsToAdd;

    // 6. Record in point_transactions ledger
    await queryRun(
      `INSERT INTO point_transactions (
        userId, userType, type, points, balanceAfter, referenceId, description, createdDate
      ) VALUES (?, ?, 'earn_qr', ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        req.user.userType,
        pointsToAdd,
        balanceAfter,
        qrRecord.token,
        `Claimed QR Reward: ${qrRecord.title || 'MWS Points'} (+${pointsToAdd} pts)`,
        now
      ]
    );

    // 7. Dispatch Notification to User
    try {
      await createNotification({
        recipientId: String(req.user.id),
        recipientRole: req.user.userType,
        title: `🎉 +${pointsToAdd} Points Claimed!`,
        message: `Awesome! You scanned "${qrRecord.title}" and earned ${pointsToAdd} reward points. Your new balance is ${balanceAfter} points.`,
        type: 'product_created',
        entityId: String(qrRecord.id),
        linkUrl: req.user.userType === 'Distributor' ? '/distributor?tab=rewards' : '/customer?tab=rewards',
        dedupKey: `qr_claim_${qrRecord.id}_${req.user.id}`
      });
    } catch (e) {
      console.error('Notification dispatch error on QR claim:', e);
    }

    return res.status(200).json({
      success: true,
      message: `🎉 Success! You earned ${pointsToAdd} Points for "${qrRecord.title}".`,
      pointsEarned: pointsToAdd,
      newBalance: balanceAfter,
      token: qrRecord.token,
      title: qrRecord.title
    });
  } catch (err) {
    console.error('Error in scan-and-claim:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'An error occurred while verifying the QR code.'
    });
  }
});

/**
 * GET /api/rewards/my-history
 * Fetch authenticated user's claimed QR history and point transaction ledger
 */
router.get('/my-history', verifyToken, async (req, res) => {
  try {
    const [transactions, claimedTokens, redemptions] = await Promise.all([
      queryAll(
        'SELECT * FROM point_transactions WHERE userId = ? ORDER BY id DESC LIMIT 100',
        [req.user.id]
      ),
      queryAll(
        'SELECT id, token, points, title, claimedAt, status FROM qr_tokens WHERE claimedByUserId = ? ORDER BY id DESC LIMIT 100',
        [req.user.id]
      ),
      queryAll(
        'SELECT * FROM redemption_requests WHERE userId = ? ORDER BY id DESC LIMIT 50',
        [req.user.id]
      )
    ]);

    return res.status(200).json({
      success: true,
      transactions: transactions || [],
      claimedTokens: claimedTokens || [],
      redemptions: redemptions || []
    });
  } catch (err) {
    console.error('Error fetching reward history:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch reward history.' });
  }
});

// =========================================================================
// 3. CASH REDEMPTION REQUESTS (CUSTOMER & DISTRIBUTOR)
// =========================================================================

/**
 * POST /api/rewards/redeem
 * Submit a request to redeem points for cash payout
 */
router.post('/redeem', verifyToken, async (req, res) => {
  try {
    const {
      points,
      fullName,
      phoneNumber,
      address = '',
      bankName,
      accountHolderName,
      accountNumber,
      ifscCode,
      upiId = ''
    } = req.body;

    const requestedPoints = parseInt(points, 10);
    if (!requestedPoints || requestedPoints <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid points amount to redeem.' });
    }

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full Name is required.' });
    }
    if (!phoneNumber || !phoneNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Phone Number is required.' });
    }
    if (!bankName || !bankName.trim()) {
      return res.status(400).json({ success: false, message: 'Bank Name is required.' });
    }
    if (!accountHolderName || !accountHolderName.trim()) {
      return res.status(400).json({ success: false, message: 'Account Holder Name is required.' });
    }
    if (!accountNumber || !accountNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Account Number is required.' });
    }
    if (!ifscCode || !ifscCode.trim()) {
      return res.status(400).json({ success: false, message: 'Bank IFSC / Branch Code is required.' });
    }

    const settings = await getRewardSettings();
    if (requestedPoints < settings.minPoints) {
      return res.status(400).json({
        success: false,
        message: `Minimum redemption threshold is ${settings.minPoints} points.`
      });
    }

    // Fetch user record to check current points balance
    const user = await queryGet('SELECT id, fullName, email, userType, pointsBalance FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    const currentBalance = user.pointsBalance || 0;
    if (currentBalance < requestedPoints) {
      return res.status(400).json({
        success: false,
        message: `Insufficient points balance. You requested ${requestedPoints} pts, but your current balance is ${currentBalance} pts.`
      });
    }

    // Calculate cash payout amount
    const cashAmount = Math.round(requestedPoints * settings.rate * 100) / 100;
    const now = new Date().toISOString();
    const dateStr = now.slice(0, 10).replace(/-/g, '');
    const randPart = crypto.randomBytes(2).toString('hex').toUpperCase();
    const requestNumber = `RED-${dateStr}-${randPart}`;

    // 1. ATOMIC DEDUCTION: Safely deduct points immediately from user to prevent double spending
    const deductRes = await queryRun(
      'UPDATE users SET pointsBalance = pointsBalance - ?, updatedDate = ? WHERE id = ? AND pointsBalance >= ?',
      [requestedPoints, now, req.user.id, requestedPoints]
    );

    if (deductRes.changes === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not process redemption. Points balance may have changed. Please refresh and try again.'
      });
    }

    const newBalance = currentBalance - requestedPoints;

    // 2. Insert into redemption_requests
    const insertRes = await queryRun(
      `INSERT INTO redemption_requests (
        requestNumber, userId, userType, points, cashAmount, conversionRate,
        fullName, phoneNumber, address, bankName, accountHolderName, accountNumber,
        ifscCode, upiId, status, createdDate, updatedDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`,
      [
        requestNumber,
        req.user.id,
        req.user.userType,
        requestedPoints,
        cashAmount,
        settings.rate,
        fullName.trim(),
        phoneNumber.trim(),
        address ? address.trim() : '',
        bankName.trim(),
        accountHolderName.trim(),
        accountNumber.trim(),
        ifscCode.trim().toUpperCase(),
        upiId ? upiId.trim() : '',
        now,
        now
      ]
    );

    // 3. Record in point_transactions
    await queryRun(
      `INSERT INTO point_transactions (
        userId, userType, type, points, balanceAfter, referenceId, description, createdDate
      ) VALUES (?, ?, 'redeem_request', ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        req.user.userType,
        -requestedPoints,
        newBalance,
        requestNumber,
        `Redemption Request: ${requestNumber} for ₹${cashAmount.toLocaleString()}`,
        now
      ]
    );

    // 4. Notifications to Admin and User
    try {
      // Notify Admin
      await createNotification({
        recipientId: 'ADMIN',
        recipientRole: 'Admin',
        title: `💰 New Payout Request: ${requestNumber}`,
        message: `${fullName} (${req.user.userType}) requested redemption of ${requestedPoints} points for ₹${cashAmount.toLocaleString()} to ${bankName}.`,
        type: 'payment_submitted',
        entityId: requestNumber,
        linkUrl: '/admin?tab=rewards-payouts',
        dedupKey: `redeem_req_${requestNumber}_ADMIN`
      });

      // Notify User
      await createNotification({
        recipientId: String(req.user.id),
        recipientRole: req.user.userType,
        title: `Redemption Submitted: ${requestNumber}`,
        message: `Your request to redeem ${requestedPoints} points for ₹${cashAmount.toLocaleString()} has been received and is pending admin verification.`,
        type: 'payment_submitted',
        entityId: requestNumber,
        linkUrl: req.user.userType === 'Distributor' ? '/distributor?tab=rewards' : '/customer?tab=rewards',
        dedupKey: `redeem_req_${requestNumber}_USER`
      });
    } catch (e) {
      console.error('Notification dispatch error on redemption:', e);
    }

    const createdRecord = await queryGet('SELECT * FROM redemption_requests WHERE id = ?', [insertRes.lastID]);

    return res.status(201).json({
      success: true,
      message: `Redemption request ${requestNumber} for ₹${cashAmount.toLocaleString()} submitted successfully!`,
      request: createdRecord,
      newBalance
    });
  } catch (err) {
    console.error('Error submitting redemption request:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to submit redemption request.' });
  }
});

/**
 * GET /api/rewards/my-redemptions
 * Fetch redemption requests submitted by current user
 */
router.get('/my-redemptions', verifyToken, async (req, res) => {
  try {
    const list = await queryAll(
      'SELECT * FROM redemption_requests WHERE userId = ? ORDER BY id DESC',
      [req.user.id]
    );
    return res.status(200).json({ success: true, redemptions: list || [] });
  } catch (err) {
    console.error('Error fetching redemptions:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch redemptions.' });
  }
});

// =========================================================================
// 4. ADMIN: CREATE OFFERS & MANAGE QR CODES
// =========================================================================

/**
 * POST /api/rewards/admin/tokens/generate
 * Admin endpoint: Generate single or batch unique point QR codes
 */
router.post('/admin/tokens/generate', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      points,
      count = 1,
      title = 'MWS Eagle Rewards',
      description = '',
      expiryDate = null
    } = req.body;

    const pointVal = parseInt(points, 10);
    if (!pointVal || pointVal <= 0) {
      return res.status(400).json({ success: false, message: 'Please specify a valid point value greater than 0.' });
    }

    const totalCount = Math.max(1, Math.min(1000, parseInt(count, 10) || 1));
    const now = new Date().toISOString();
    const generatedTokens = [];

    for (let i = 0; i < totalCount; i++) {
      let uniqueToken = '';
      let isUnique = false;

      // Ensure uniqueness in database
      while (!isUnique) {
        uniqueToken = generateUniqueTokenString();
        const exists = await queryGet('SELECT id FROM qr_tokens WHERE token = ?', [uniqueToken]);
        if (!exists) isUnique = true;
      }

      // Generate visual base64 QR code data URL
      let qrDataUrl = '';
      try {
        qrDataUrl = await QRCode.toDataURL(uniqueToken, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 320,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
      } catch (qrErr) {
        console.warn('QR data url generation note:', qrErr.message);
      }

      const insertRes = await queryRun(
        `INSERT INTO qr_tokens (
          token, points, title, description, status, createdByAdminId, createdDate, expiryDate
        ) VALUES (?, ?, ?, ?, 'Active', ?, ?, ?)`,
        [
          uniqueToken,
          pointVal,
          title ? title.trim() : 'MWS Eagle Rewards',
          description ? description.trim() : '',
          req.user.id,
          now,
          expiryDate || null
        ]
      );

      generatedTokens.push({
        id: insertRes.lastID,
        token: uniqueToken,
        points: pointVal,
        title: title || 'MWS Eagle Rewards',
        description,
        status: 'Active',
        createdDate: now,
        expiryDate: expiryDate || null,
        qrDataUrl
      });
    }

    return res.status(201).json({
      success: true,
      message: `Successfully generated ${totalCount} QR offer code${totalCount > 1 ? 's' : ''} for ${pointVal} points!`,
      count: totalCount,
      tokens: generatedTokens
    });
  } catch (err) {
    console.error('Error generating QR tokens:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to generate QR tokens.' });
  }
});

/**
 * GET /api/rewards/admin/tokens
 * Admin endpoint: List all generated QR tokens with claim history and filter options
 */
router.get('/admin/tokens', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status = 'All', search = '', limit = 150, offset = 0 } = req.query;

    let sql = `
      SELECT 
        q.*,
        u.fullName as claimantName,
        u.email as claimantEmail,
        u.phoneNumber as claimantPhone
      FROM qr_tokens q
      LEFT JOIN users u ON q.claimedByUserId = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      sql += ' AND q.status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      sql += ' AND (q.token LIKE ? OR q.title LIKE ? OR u.fullName LIKE ? OR u.email LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY q.id DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const tokens = await queryAll(sql, params);

    // Also get quick stats
    const [counts, totalClaimedPointsRow] = await Promise.all([
      queryAll('SELECT status, COUNT(*) as count FROM qr_tokens GROUP BY status'),
      queryGet('SELECT SUM(points) as total FROM qr_tokens WHERE status = "Claimed"')
    ]);

    const stats = {
      all: 0,
      active: 0,
      claimed: 0,
      inactive: 0,
      totalClaimedPoints: totalClaimedPointsRow ? totalClaimedPointsRow.total || 0 : 0
    };

    if (Array.isArray(counts)) {
      counts.forEach(row => {
        const s = (row.status || '').toLowerCase();
        if (s === 'active') stats.active = row.count;
        if (s === 'claimed') stats.claimed = row.count;
        if (s === 'inactive') stats.inactive = row.count;
        stats.all += row.count;
      });
    }

    return res.status(200).json({
      success: true,
      tokens: tokens || [],
      stats
    });
  } catch (err) {
    console.error('Error fetching admin tokens:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch tokens.' });
  }
});

/**
 * PATCH /api/rewards/admin/tokens/:id/status
 * Admin endpoint: Toggle QR token status between Active and Inactive
 */
router.patch('/admin/tokens/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await queryGet('SELECT * FROM qr_tokens WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'QR token not found.' });
    }

    if (existing.status === 'Claimed') {
      return res.status(400).json({ success: false, message: 'Cannot modify a QR token that has already been claimed.' });
    }

    const newStatus = status === 'Inactive' ? 'Inactive' : 'Active';
    await queryRun('UPDATE qr_tokens SET status = ? WHERE id = ?', [newStatus, id]);

    return res.status(200).json({
      success: true,
      message: `Token "${existing.token}" status updated to ${newStatus}.`,
      status: newStatus
    });
  } catch (err) {
    console.error('Error updating token status:', err);
    return res.status(500).json({ success: false, message: 'Failed to update token status.' });
  }
});

/**
 * DELETE /api/rewards/admin/tokens/:id
 * Admin endpoint: Delete an unclaimed QR token
 */
router.delete('/admin/tokens/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryGet('SELECT * FROM qr_tokens WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'QR token not found.' });
    }

    if (existing.status === 'Claimed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an already claimed QR token. Claim history must be preserved for financial auditing.'
      });
    }

    await queryRun('DELETE FROM qr_tokens WHERE id = ?', [id]);
    return res.status(200).json({
      success: true,
      message: `QR token "${existing.token}" (${existing.points} pts) was deleted.`
    });
  } catch (err) {
    console.error('Error deleting token:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete token.' });
  }
});

// =========================================================================
// 5. ADMIN: REDEMPTION & PAYOUT MANAGEMENT
// =========================================================================

/**
 * GET /api/rewards/admin/redemptions
 * Admin endpoint: List all redemption requests with user info and status filters
 */
router.get('/admin/redemptions', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status = 'All', search = '' } = req.query;

    let sql = `
      SELECT 
        r.*,
        u.email as userEmail,
        u.pointsBalance as userCurrentBalance,
        u.totalPointsEarned as userTotalEarned
      FROM redemption_requests r
      LEFT JOIN users u ON r.userId = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      sql += ' AND (r.requestNumber LIKE ? OR r.fullName LIKE ? OR r.phoneNumber LIKE ? OR r.bankName LIKE ? OR u.email LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s, s);
    }

    sql += ' ORDER BY r.id DESC';
    const list = await queryAll(sql, params);

    // Summary counts
    const statusCounts = await queryAll('SELECT status, COUNT(*) as count, SUM(cashAmount) as totalCash FROM redemption_requests GROUP BY status');

    return res.status(200).json({
      success: true,
      redemptions: list || [],
      statusCounts: statusCounts || []
    });
  } catch (err) {
    console.error('Error fetching admin redemptions:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch redemption requests.' });
  }
});

/**
 * PATCH /api/rewards/admin/redemptions/:id
 * Admin endpoint: Update redemption request status (Approved, Processing, Paid, Rejected)
 * Automatically refunds points back to user balance if status is set to 'Rejected'!
 */
router.patch('/admin/redemptions/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status, // 'Approved' | 'Processing' | 'Paid' | 'Rejected'
      transactionReference = '',
      adminNotes = '',
      rejectionReason = ''
    } = req.body;

    const allowed = ['Pending', 'Approved', 'Processing', 'Paid', 'Rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status "${status}". Allowed: ${allowed.join(', ')}` });
    }

    const existing = await queryGet('SELECT * FROM redemption_requests WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Redemption request not found.' });
    }

    const previousStatus = existing.status;
    const now = new Date().toISOString();

    // 1. SPECIAL CASE: If rejecting a previously unrejected request, refund points back to the user!
    if (status === 'Rejected' && previousStatus !== 'Rejected') {
      const refundPoints = existing.points;

      await queryRun(
        'UPDATE users SET pointsBalance = pointsBalance + ?, updatedDate = ? WHERE id = ?',
        [refundPoints, now, existing.userId]
      );

      const userAfter = await queryGet('SELECT pointsBalance FROM users WHERE id = ?', [existing.userId]);
      const newBal = userAfter ? userAfter.pointsBalance : refundPoints;

      // Log refund in point_transactions
      await queryRun(
        `INSERT INTO point_transactions (
          userId, userType, type, points, balanceAfter, referenceId, description, createdDate
        ) VALUES (?, ?, 'redeem_refund', ?, ?, ?, ?, ?)`,
        [
          existing.userId,
          existing.userType,
          refundPoints,
          newBal,
          existing.requestNumber,
          `Refund: Redemption ${existing.requestNumber} Rejected (${rejectionReason || 'Admin Rejected'})`,
          now
        ]
      );

      // Notify User
      try {
        await createNotification({
          recipientId: String(existing.userId),
          recipientRole: existing.userType,
          title: `⚠️ Redemption Rejected: ${existing.requestNumber}`,
          message: `Your redemption request for ₹${existing.cashAmount.toLocaleString()} was rejected: ${rejectionReason || 'Please check payment details'}. ${refundPoints} points have been refunded to your balance.`,
          type: 'distributor_rejected',
          entityId: existing.requestNumber,
          linkUrl: existing.userType === 'Distributor' ? '/distributor?tab=rewards' : '/customer?tab=rewards',
          dedupKey: `redeem_reject_${existing.requestNumber}_${Date.now()}`
        });
      } catch (e) {}
    }

    // 2. SPECIAL CASE: If marked as 'Paid'
    if (status === 'Paid') {
      try {
        await createNotification({
          recipientId: String(existing.userId),
          recipientRole: existing.userType,
          title: `✅ Cashback Payout Sent: ₹${existing.cashAmount.toLocaleString()}`,
          message: `Great news! Payout of ₹${existing.cashAmount.toLocaleString()} for request ${existing.requestNumber} has been transferred to your ${existing.bankName} account. Reference: ${transactionReference || 'Direct Bank IMPS'}.`,
          type: 'payment_approved',
          entityId: existing.requestNumber,
          linkUrl: existing.userType === 'Distributor' ? '/distributor?tab=rewards' : '/customer?tab=rewards',
          dedupKey: `redeem_paid_${existing.requestNumber}_${Date.now()}`
        });
      } catch (e) {}
    }

    // 3. Update redemption_requests row
    await queryRun(
      `UPDATE redemption_requests SET
        status = ?,
        transactionReference = COALESCE(?, transactionReference),
        adminNotes = COALESCE(?, adminNotes),
        rejectionReason = COALESCE(?, rejectionReason),
        processedDate = ?,
        processedByAdminId = ?,
        updatedDate = ?
       WHERE id = ?`,
      [
        status,
        transactionReference ? transactionReference.trim() : null,
        adminNotes ? adminNotes.trim() : null,
        rejectionReason ? rejectionReason.trim() : null,
        status === 'Paid' || status === 'Rejected' ? now : existing.processedDate,
        req.user.id,
        now,
        id
      ]
    );

    const updated = await queryGet('SELECT * FROM redemption_requests WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: `Redemption ${existing.requestNumber} status updated to ${status}.`,
      redemption: updated
    });
  } catch (err) {
    console.error('Error updating redemption request:', err);
    return res.status(500).json({ success: false, message: 'Failed to update redemption request.' });
  }
});

// =========================================================================
// 6. ADMIN: DASHBOARD METRICS, REWARD PROFILES & SETTINGS
// =========================================================================

/**
 * GET /api/rewards/admin/dashboard
 * Complete aggregate metrics for rewards, tokens, claims, and payouts
 */
router.get('/admin/dashboard', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [
      tokenStats,
      pointsDistributedRow,
      pendingPayoutsRow,
      completedPayoutsRow,
      totalUsersWithPointsRow,
      recentClaims,
      recentRedemptions,
      settings
    ] = await Promise.all([
      queryAll('SELECT status, COUNT(*) as count, SUM(points) as pointsSum FROM qr_tokens GROUP BY status'),
      queryGet('SELECT SUM(points) as total FROM qr_tokens WHERE status = "Claimed"'),
      queryGet('SELECT COUNT(*) as count, SUM(points) as pointsSum, SUM(cashAmount) as cashSum FROM redemption_requests WHERE status IN ("Pending", "Approved", "Processing")'),
      queryGet('SELECT COUNT(*) as count, SUM(cashAmount) as totalCash FROM redemption_requests WHERE status = "Paid"'),
      queryGet('SELECT COUNT(*) as count, SUM(pointsBalance) as totalBalance FROM users WHERE pointsBalance > 0'),
      queryAll(`
        SELECT q.id, q.token, q.points, q.title, q.claimedAt, q.claimedByRole, u.fullName, u.email
        FROM qr_tokens q
        JOIN users u ON q.claimedByUserId = u.id
        WHERE q.status = 'Claimed'
        ORDER BY q.claimedAt DESC LIMIT 8
      `),
      queryAll(`
        SELECT r.*, u.email as userEmail
        FROM redemption_requests r
        JOIN users u ON r.userId = u.id
        ORDER BY r.id DESC LIMIT 8
      `),
      getRewardSettings()
    ]);

    let totalTokens = 0;
    let claimedTokens = 0;
    let activeTokens = 0;
    let inactiveTokens = 0;

    if (Array.isArray(tokenStats)) {
      tokenStats.forEach(row => {
        const s = (row.status || '').toLowerCase();
        if (s === 'claimed') claimedTokens = row.count;
        if (s === 'active') activeTokens = row.count;
        if (s === 'inactive') inactiveTokens = row.count;
        totalTokens += row.count;
      });
    }

    return res.status(200).json({
      success: true,
      metrics: {
        totalTokens,
        claimedTokens,
        activeTokens,
        inactiveTokens,
        totalPointsDistributed: pointsDistributedRow ? pointsDistributedRow.total || 0 : 0,
        pendingPayoutsCount: pendingPayoutsRow ? pendingPayoutsRow.count || 0 : 0,
        pendingPayoutsCash: pendingPayoutsRow ? pendingPayoutsRow.cashSum || 0 : 0,
        pendingPayoutsPoints: pendingPayoutsRow ? pendingPayoutsRow.pointsSum || 0 : 0,
        completedPayoutsCount: completedPayoutsRow ? completedPayoutsRow.count || 0 : 0,
        totalPayoutsPaidAmount: completedPayoutsRow ? completedPayoutsRow.totalCash || 0 : 0,
        totalUsersWithPoints: totalUsersWithPointsRow ? totalUsersWithPointsRow.count || 0 : 0,
        totalOutstandingUserBalance: totalUsersWithPointsRow ? totalUsersWithPointsRow.totalBalance || 0 : 0,
        settings
      },
      recentClaims: recentClaims || [],
      recentRedemptions: recentRedemptions || []
    });
  } catch (err) {
    console.error('Error fetching admin rewards dashboard:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard metrics.' });
  }
});

/**
 * GET /api/rewards/admin/users
 * List all customer and distributor reward profiles with points balance, claims count, and payouts
 */
router.get('/admin/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userType = 'All', search = '' } = req.query;

    let sql = `
      SELECT 
        u.id, u.fullName, u.email, u.phoneNumber, u.userType, u.accountStatus,
        COALESCE(u.pointsBalance, 0) as pointsBalance,
        COALESCE(u.totalPointsEarned, 0) as totalPointsEarned,
        (SELECT COUNT(*) FROM qr_tokens WHERE claimedByUserId = u.id) as totalClaims,
        (SELECT COUNT(*) FROM redemption_requests WHERE userId = u.id) as totalRedemptions,
        (SELECT COALESCE(SUM(cashAmount), 0) FROM redemption_requests WHERE userId = u.id AND status = 'Paid') as totalCashPaid
      FROM users u
      WHERE u.userType IN ('Customer', 'Distributor')
    `;
    const params = [];

    if (userType && userType !== 'All') {
      sql += ' AND u.userType = ?';
      params.push(userType);
    }

    if (search && search.trim()) {
      sql += ' AND (u.fullName LIKE ? OR u.email LIKE ? OR u.phoneNumber LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY u.pointsBalance DESC, u.id DESC';
    const users = await queryAll(sql, params);

    return res.status(200).json({ success: true, users: users || [] });
  } catch (err) {
    console.error('Error fetching user rewards list:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

/**
 * PUT /api/rewards/admin/settings
 * Admin endpoint: Update configurable points conversion rate and minimum redemption threshold
 */
router.put('/admin/settings', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { rate, minPoints } = req.body;

    const now = new Date().toISOString();

    if (rate !== undefined) {
      const numRate = parseFloat(rate);
      if (isNaN(numRate) || numRate <= 0) {
        return res.status(400).json({ success: false, message: 'Points conversion rate must be a positive number.' });
      }
      await queryRun(
        'REPLACE INTO system_settings (`key`, `value`, updatedDate) VALUES ("points_to_cash_rate", ?, ?)',
        [String(numRate), now]
      );
    }

    if (minPoints !== undefined) {
      const numMin = parseInt(minPoints, 10);
      if (isNaN(numMin) || numMin <= 0) {
        return res.status(400).json({ success: false, message: 'Minimum redemption points must be a positive integer.' });
      }
      await queryRun(
        'REPLACE INTO system_settings (`key`, `value`, updatedDate) VALUES ("min_redemption_points", ?, ?)',
        [String(numMin), now]
      );
    }

    const updated = await getRewardSettings();
    return res.status(200).json({
      success: true,
      message: 'Reward settings updated successfully.',
      settings: updated
    });
  } catch (err) {
    console.error('Error updating reward settings:', err);
    return res.status(500).json({ success: false, message: 'Failed to update reward settings.' });
  }
});

export default router;

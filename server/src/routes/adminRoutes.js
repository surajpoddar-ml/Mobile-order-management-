import express from 'express';
import { queryAll, queryGet, queryRun } from '../database/db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { createNotification } from '../services/notificationService.js';

const router = express.Router();

// Enforce both token authentication and Admin role on all admin routes
router.use(verifyToken, requireRole(['Admin']));

/**
 * 1. Admin Metrics Overview
 * Returns customer and distributor aggregate counts
 */
router.get('/metrics', async (req, res) => {
  try {
    const customerStats = await queryGet(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN accountStatus = 'Active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN accountStatus = 'Suspended' THEN 1 ELSE 0 END) as suspended
      FROM users 
      WHERE userType = 'Customer'
    `);

    const distributorStats = await queryGet(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN accountStatus = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN accountStatus = 'Active' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN accountStatus = 'Rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN accountStatus = 'Suspended' THEN 1 ELSE 0 END) as suspended
      FROM users 
      WHERE userType = 'Distributor'
    `);

    return res.status(200).json({
      success: true,
      metrics: {
        customers: {
          total: customerStats.total || 0,
          active: customerStats.active || 0,
          suspended: customerStats.suspended || 0
        },
        distributors: {
          total: distributorStats.total || 0,
          pending: distributorStats.pending || 0,
          approved: distributorStats.approved || 0,
          rejected: distributorStats.rejected || 0,
          suspended: distributorStats.suspended || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin metrics.' });
  }
});

/**
 * 2. Search & Filter Users
 * Query params: userType, accountStatus, search
 */
router.get('/users', async (req, res) => {
  try {
    const { userType, accountStatus, search } = req.query;

    let sql = 'SELECT id, userId, fullName, email, phoneNumber, userType, accountStatus, profileInfo, createdDate, updatedDate, lastLogin, approvalDate, approvedBy, businessName, businessAddress, panVatNumber, contactPerson, businessPhone, businessEmail, statusRemark FROM users WHERE 1=1';
    const params = [];

    if (userType && userType !== 'All') {
      sql += ' AND userType = ?';
      params.push(userType);
    }

    if (accountStatus && accountStatus !== 'All') {
      sql += ' AND accountStatus = ?';
      params.push(accountStatus);
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      sql += ` AND (
        fullName LIKE ? OR 
        email LIKE ? OR 
        userId LIKE ? OR 
        phoneNumber LIKE ? OR 
        businessName LIKE ? OR 
        panVatNumber LIKE ?
      )`;
      params.push(term, term, term, term, term, term);
    }

    sql += ' ORDER BY createdDate DESC';

    const users = await queryAll(sql, params);
    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users list.' });
  }
});

/**
 * 3. View Single User Details
 */
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await queryGet(
      'SELECT id, userId, fullName, email, phoneNumber, userType, accountStatus, profileInfo, createdDate, updatedDate, lastLogin, approvalDate, approvedBy, businessName, businessAddress, panVatNumber, contactPerson, businessPhone, businessEmail, statusRemark FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user details.' });
  }
});

/**
 * 4. Approve Distributor
 * Sets status to 'Active', records approval timestamp and admin email
 */
router.patch('/distributors/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const distributor = await queryGet('SELECT * FROM users WHERE id = ? AND userType = "Distributor"', [id]);

    if (!distributor) {
      return res.status(404).json({ success: false, message: 'Distributor application not found.' });
    }

    const now = new Date().toISOString();
    const adminEmail = req.user.email;

    await queryRun(
      `UPDATE users 
       SET accountStatus = 'Active', 
           approvalDate = ?, 
           approvedBy = ?, 
           updatedDate = ?,
           statusRemark = NULL
       WHERE id = ?`,
      [now, adminEmail, now, id]
    );

    const updated = await queryGet('SELECT id, userId, fullName, email, userType, accountStatus, approvalDate, approvedBy FROM users WHERE id = ?', [id]);

    // Notify distributor of approval
    await createNotification({
      recipientId: distributor.userId || distributor.email,
      recipientRole: 'Distributor',
      title: `🎉 Distributor Account Approved!`,
      message: `Your wholesale distributor application for "${distributor.businessName || distributor.fullName}" has been approved! You now have full access to wholesale tier pricing.`,
      type: 'distributor_approved',
      entityId: distributor.userId,
      linkUrl: '/distributor',
      dedupKey: `distributor_approved_${id}`
    });

    return res.status(200).json({
      success: true,
      message: `Distributor "${distributor.businessName || distributor.fullName}" approved successfully. They can now log in.`,
      user: updated
    });
  } catch (error) {
    console.error('Error approving distributor:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve distributor.' });
  }
});

/**
 * 5. Reject Distributor
 * Sets status to 'Rejected', records optional reason
 */
router.patch('/distributors/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const distributor = await queryGet('SELECT * FROM users WHERE id = ? AND userType = "Distributor"', [id]);
    if (!distributor) {
      return res.status(404).json({ success: false, message: 'Distributor application not found.' });
    }

    const now = new Date().toISOString();
    await queryRun(
      `UPDATE users 
       SET accountStatus = 'Rejected', 
           statusRemark = ?, 
           updatedDate = ? 
       WHERE id = ?`,
      [reason || 'Application rejected by administrator.', now, id]
    );

    // Notify distributor of rejection
    await createNotification({
      recipientId: distributor.userId || distributor.email,
      recipientRole: 'Distributor',
      title: `Distributor Application Rejected`,
      message: `Your application for "${distributor.businessName || distributor.fullName}" was rejected: "${reason || 'Application rejected by administrator.'}"`,
      type: 'distributor_rejected',
      entityId: distributor.userId,
      linkUrl: '/login',
      dedupKey: `distributor_rejected_${id}_${Date.now()}`
    });

    return res.status(200).json({
      success: true,
      message: `Distributor "${distributor.businessName || distributor.fullName}" has been rejected.`
    });
  } catch (error) {
    console.error('Error rejecting distributor:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject distributor.' });
  }
});

/**
 * 6. Suspend User (Distributor or Customer)
 * Suspended accounts immediately lose access on all requests
 */
router.patch('/users/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const targetUser = await queryGet('SELECT * FROM users WHERE id = ?', [id]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (targetUser.userType === 'Admin') {
      return res.status(400).json({ success: false, message: 'Cannot suspend Administrator accounts.' });
    }

    const now = new Date().toISOString();
    await queryRun(
      `UPDATE users 
       SET accountStatus = 'Suspended', 
           statusRemark = ?, 
           updatedDate = ? 
       WHERE id = ?`,
      [reason || 'Account suspended by administrator.', now, id]
    );

    // Notify user of suspension
    await createNotification({
      recipientId: targetUser.userId || targetUser.email,
      recipientRole: targetUser.userType,
      title: `⚠️ Account Suspended`,
      message: `Your account has been suspended by the administrator: "${reason || 'Terms breach.'}"`,
      type: 'account_status',
      entityId: targetUser.userId,
      linkUrl: '/login',
      dedupKey: `account_suspended_${id}_${Date.now()}`
    });

    return res.status(200).json({
      success: true,
      message: `User ${targetUser.fullName} (${targetUser.userType}) has been suspended. All active sessions are revoked.`
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    return res.status(500).json({ success: false, message: 'Failed to suspend user.' });
  }
});

/**
 * 7. Activate / Reactivate User
 * Changes status to 'Active'
 */
router.patch('/users/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await queryGet('SELECT * FROM users WHERE id = ?', [id]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const now = new Date().toISOString();
    const adminEmail = req.user.email;

    await queryRun(
      `UPDATE users 
       SET accountStatus = 'Active', 
           approvalDate = COALESCE(approvalDate, ?),
           approvedBy = COALESCE(approvedBy, ?),
           statusRemark = NULL, 
           updatedDate = ? 
       WHERE id = ?`,
      [now, adminEmail, now, id]
    );

    // Notify user of activation
    await createNotification({
      recipientId: targetUser.userId || targetUser.email,
      recipientRole: targetUser.userType,
      title: `✅ Account Reactivated`,
      message: `Your account has been reactivated. You may now log in to the marketplace.`,
      type: 'account_status',
      entityId: targetUser.userId,
      linkUrl: targetUser.userType === 'Distributor' ? '/distributor' : '/customer',
      dedupKey: `account_activated_${id}_${Date.now()}`
    });

    return res.status(200).json({
      success: true,
      message: `User ${targetUser.fullName} has been activated.`
    });
  } catch (error) {
    console.error('Error activating user:', error);
    return res.status(500).json({ success: false, message: 'Failed to activate user.' });
  }
});

/**
 * 8. Delete User
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await queryGet('SELECT * FROM users WHERE id = ?', [id]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (targetUser.userType === 'Admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete Administrator account.' });
    }

    await queryRun('DELETE FROM users WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: `User ${targetUser.fullName} (${targetUser.userId}) was permanently deleted.`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
});

export default router;

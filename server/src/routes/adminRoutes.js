import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { queryAll, queryGet, queryRun } from '../database/db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { createNotification } from '../services/notificationService.js';
import { recordAuditLog, getAuditLogs } from '../services/auditService.js';
import { uploadFileToS3, processAndUploadProfilePhoto, deleteOldProfilePhoto } from '../services/s3Service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveAdminProfileUploadDir = () => {
  if (process.env.IMAGE_UPLOAD_DIR) {
    const customDir = path.resolve(process.env.IMAGE_UPLOAD_DIR, 'profiles');
    if (!fs.existsSync(customDir)) {
      try { fs.mkdirSync(customDir, { recursive: true }); } catch (e) {}
    }
    return customDir;
  }
  const defaultDir = path.resolve(__dirname, '../../uploads/profiles');
  if (!fs.existsSync(defaultDir)) {
    try { fs.mkdirSync(defaultDir, { recursive: true }); } catch (e) {}
  }
  return defaultDir;
};

const adminProfileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resolveAdminProfileUploadDir());
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeBase = `profile_${Date.now()}_${crypto.randomBytes(3).toString('hex')}${ext}`;
    cb(null, safeBase);
  }
});

const adminProfileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file format. Only JPG, JPEG, PNG, and WEBP profile photos are supported.');
    error.status = 400;
    cb(error, false);
  }
};

const adminProfileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: adminProfileFilter
});

const router = express.Router();

// Enforce both token authentication and Admin role on all admin routes
router.use(verifyToken, requireRole(['Admin']));

/**
 * 1. Admin Metrics Overview
 * Returns customer, distributor, and retailer aggregate counts
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

    const retailerStats = await queryGet(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN accountStatus = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN accountStatus = 'Active' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN accountStatus = 'Rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN accountStatus = 'Suspended' THEN 1 ELSE 0 END) as suspended
      FROM users 
      WHERE userType = 'Retailer'
    `);

    return res.status(200).json({
      success: true,
      metrics: {
        customers: {
          total: customerStats?.total || 0,
          active: customerStats?.active || 0,
          suspended: customerStats?.suspended || 0
        },
        distributors: {
          total: distributorStats?.total || 0,
          pending: distributorStats?.pending || 0,
          approved: distributorStats?.approved || 0,
          rejected: distributorStats?.rejected || 0,
          suspended: distributorStats?.suspended || 0
        },
        retailers: {
          total: retailerStats?.total || 0,
          pending: retailerStats?.pending || 0,
          approved: retailerStats?.approved || 0,
          rejected: retailerStats?.rejected || 0,
          suspended: retailerStats?.suspended || 0
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

    let sql = `
      SELECT 
        id, userId, fullName, email, phoneNumber, userType, accountStatus, profileInfo, 
        createdDate, updatedDate, lastLogin, approvalDate, approvedBy, 
        businessName, businessAddress, panVatNumber, contactPerson, businessPhone, businessEmail, 
        statusRemark, country, state, district, city, locality, pincode, address, 
        ownerName, shopName, assignedStateId, assignedDistrictId, assignedAreaId, distributorLevel
      FROM users 
      WHERE 1=1
    `;
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
        shopName LIKE ? OR
        ownerName LIKE ? OR
        district LIKE ? OR
        state LIKE ? OR
        panVatNumber LIKE ?
      )`;
      params.push(term, term, term, term, term, term, term, term, term, term);
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
      `SELECT 
        id, userId, fullName, email, phoneNumber, userType, accountStatus, profileInfo, 
        createdDate, updatedDate, lastLogin, approvalDate, approvedBy, 
        businessName, businessAddress, panVatNumber, contactPerson, businessPhone, businessEmail, 
        statusRemark, country, state, district, city, locality, pincode, address, 
        ownerName, shopName, assignedStateId, assignedDistrictId, assignedAreaId, distributorLevel
      FROM users WHERE id = ?`,
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
 * 4. Approve User (Distributor or Retailer)
 * Sets status to 'Active', records approval timestamp and admin email
 */
const handleApproveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const applicant = await queryGet('SELECT * FROM users WHERE id = ? AND userType IN ("Distributor", "Retailer")', [id]);

    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Distributor or Retailer application not found.' });
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

    const updated = await queryGet(
      'SELECT id, userId, fullName, email, userType, accountStatus, approvalDate, approvedBy FROM users WHERE id = ?',
      [id]
    );

    // Audit log
    try {
      await recordAuditLog({
        actionType: 'APPROVE_ACCOUNT',
        entityType: applicant.userType.toUpperCase(),
        entityId: applicant.id,
        performedByUserId: req.user.id,
        performedByName: req.user.fullName || req.user.email,
        details: { applicantId: applicant.id, userId: applicant.userId, role: applicant.userType, name: applicant.fullName },
        ipAddress: req.ip
      });
    } catch (e) {}

    // Notify user of approval
    const roleTitle = applicant.userType === 'Retailer' ? 'Retailer' : 'Distributor';
    await createNotification({
      recipientId: applicant.userId || applicant.email,
      recipientRole: applicant.userType,
      title: `🎉 ${roleTitle} Account Approved!`,
      message: `Your ${roleTitle.toLowerCase()} application for "${applicant.shopName || applicant.businessName || applicant.fullName}" has been approved! You now have full access to your account.`,
      type: 'account_approved',
      entityId: applicant.userId,
      linkUrl: '/login',
      dedupKey: `${applicant.userType.toLowerCase()}_approved_${id}`
    });

    return res.status(200).json({
      success: true,
      message: `${roleTitle} "${applicant.shopName || applicant.businessName || applicant.fullName}" approved successfully. They can now log in.`,
      user: updated
    });
  } catch (error) {
    console.error('Error approving user:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve application.' });
  }
};

router.patch('/users/:id/approve', handleApproveUser);
router.patch('/distributors/:id/approve', handleApproveUser);

/**
 * 5. Reject User (Distributor or Retailer)
 * Sets status to 'Rejected', records optional reason
 */
const handleRejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const applicant = await queryGet('SELECT * FROM users WHERE id = ? AND userType IN ("Distributor", "Retailer")', [id]);
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Distributor or Retailer application not found.' });
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

    // Audit log
    try {
      await recordAuditLog({
        actionType: 'REJECT_ACCOUNT',
        entityType: applicant.userType.toUpperCase(),
        entityId: applicant.id,
        performedByUserId: req.user.id,
        performedByName: req.user.fullName || req.user.email,
        details: { applicantId: applicant.id, userId: applicant.userId, role: applicant.userType, reason },
        ipAddress: req.ip
      });
    } catch (e) {}

    // Notify user of rejection
    const roleTitle = applicant.userType === 'Retailer' ? 'Retailer' : 'Distributor';
    await createNotification({
      recipientId: applicant.userId || applicant.email,
      recipientRole: applicant.userType,
      title: `${roleTitle} Application Rejected`,
      message: `Your application for "${applicant.shopName || applicant.businessName || applicant.fullName}" was rejected: "${reason || 'Application rejected by administrator.'}"`,
      type: 'account_rejected',
      entityId: applicant.userId,
      linkUrl: '/login',
      dedupKey: `${applicant.userType.toLowerCase()}_rejected_${id}_${Date.now()}`
    });

    return res.status(200).json({
      success: true,
      message: `${roleTitle} "${applicant.shopName || applicant.businessName || applicant.fullName}" has been rejected.`
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject application.' });
  }
};

router.patch('/users/:id/reject', handleRejectUser);
router.patch('/distributors/:id/reject', handleRejectUser);

/**
 * 6. Suspend User (Distributor, Retailer, or Customer)
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

    // Audit log
    try {
      await recordAuditLog({
        actionType: 'SUSPEND_ACCOUNT',
        entityType: targetUser.userType.toUpperCase(),
        entityId: targetUser.id,
        performedByUserId: req.user.id,
        performedByName: req.user.fullName || req.user.email,
        details: { targetUserId: targetUser.id, userId: targetUser.userId, role: targetUser.userType, reason },
        ipAddress: req.ip
      });
    } catch (e) {}

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

    // Audit log
    try {
      await recordAuditLog({
        actionType: 'ACTIVATE_ACCOUNT',
        entityType: targetUser.userType.toUpperCase(),
        entityId: targetUser.id,
        performedByUserId: req.user.id,
        performedByName: req.user.fullName || req.user.email,
        details: { targetUserId: targetUser.id, userId: targetUser.userId, role: targetUser.userType },
        ipAddress: req.ip
      });
    } catch (e) {}

    // Notify user of activation
    await createNotification({
      recipientId: targetUser.userId || targetUser.email,
      recipientRole: targetUser.userType,
      title: `✅ Account Reactivated`,
      message: `Your account has been reactivated. You may now log in to the marketplace.`,
      type: 'account_status',
      entityId: targetUser.userId,
      linkUrl: '/login',
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
 * 8. Edit / Update User Information
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryGet('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const {
      fullName,
      email,
      phoneNumber,
      businessName,
      shopName,
      ownerName,
      country = 'India',
      state,
      district,
      city,
      locality,
      pincode,
      address,
      panVatNumber,
      accountStatus,
      avatarUrl
    } = req.body;

    const now = new Date().toISOString();

    await queryRun(
      `UPDATE users SET
        fullName = COALESCE(?, fullName),
        email = COALESCE(?, email),
        phoneNumber = COALESCE(?, phoneNumber),
        businessName = COALESCE(?, businessName),
        shopName = COALESCE(?, shopName),
        ownerName = COALESCE(?, ownerName),
        country = COALESCE(?, country),
        state = COALESCE(?, state),
        district = COALESCE(?, district),
        city = COALESCE(?, city),
        locality = COALESCE(?, locality),
        pincode = COALESCE(?, pincode),
        address = COALESCE(?, address),
        panVatNumber = COALESCE(?, panVatNumber),
        accountStatus = COALESCE(?, accountStatus),
        avatarUrl = COALESCE(?, avatarUrl),
        updatedDate = ?
      WHERE id = ?`,
      [
        fullName?.trim() || null,
        email?.trim().toLowerCase() || null,
        phoneNumber?.trim() || null,
        businessName?.trim() || null,
        shopName?.trim() || null,
        ownerName?.trim() || null,
        country || 'India',
        state || null,
        district || null,
        city || null,
        locality || null,
        pincode || null,
        address?.trim() || null,
        panVatNumber?.trim() || null,
        accountStatus || null,
        avatarUrl?.trim() || null,
        now,
        id
      ]
    );

    const updated = await queryGet('SELECT * FROM users WHERE id = ?', [id]);

    // Audit log
    try {
      await recordAuditLog({
        actionType: 'UPDATE_ACCOUNT',
        entityType: existing.userType.toUpperCase(),
        entityId: existing.id,
        targetAccount: existing.userId,
        targetUserId: existing.userId,
        performedBy: req.user.fullName || req.user.email,
        userRole: 'Admin',
        updatedValues: req.body,
        remarks: `Admin updated account information for ${updated.fullName} (${existing.userId})`,
        ipAddress: req.ip
      });
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: `Account details for ${updated.fullName} updated successfully.`,
      user: updated
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user account.' });
  }
});

/**
 * 5b. Admin Upload / Update User Profile Photo
 * Securely resizes to ~512x512, removes EXIF metadata, uploads to AWS S3,
 * records in user_profile_photos, and deletes previous S3 photo safely.
 */
router.post('/users/:id/photo', adminProfileUpload.single('photo'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const targetUser = await queryGet('SELECT * FROM users WHERE id = ?', [id]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
    }

    const previousS3Key = targetUser.avatarS3Key;

    const uploadResult = await processAndUploadProfilePhoto({
      buffer: req.file.buffer,
      filePath: req.file.path,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      accountType: targetUser.userType
    });

    const now = new Date().toISOString();
    await queryRun(
      'UPDATE users SET avatarUrl = ?, avatarS3Key = ?, updatedDate = ? WHERE id = ?',
      [uploadResult.displayUrl, uploadResult.s3Key, now, id]
    );

    try {
      await queryRun('UPDATE user_profile_photos SET isCurrent = 0 WHERE userRecordId = ?', [id]);
      await queryRun(
        `INSERT INTO user_profile_photos (
          userId, userRecordId, accountType, s3Key, originalName, mimeType, fileSize, isCurrent, uploadedBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          targetUser.userId,
          id,
          targetUser.userType,
          uploadResult.s3Key,
          req.file.originalname || uploadResult.filename,
          uploadResult.mimeType,
          uploadResult.fileSize,
          req.user.email || req.user.fullName || 'Admin'
        ]
      );
    } catch (dbErr) {
      console.warn('[ADMIN PROFILE DB] Notice recording user_profile_photos:', dbErr.message);
    }

    // Safely delete previous S3 photo only after confirming database updated
    if (previousS3Key && previousS3Key !== uploadResult.s3Key) {
      try {
        await deleteOldProfilePhoto(previousS3Key);
      } catch (delErr) {
        console.warn('[AWS S3] Notice cleaning old profile photo:', delErr.message);
      }
    }

    const updated = await queryGet('SELECT * FROM users WHERE id = ?', [id]);

    try {
      await recordAuditLog({
        actionType: 'ADMIN_UPDATE_PROFILE_PHOTO',
        entityType: targetUser.userType.toUpperCase(),
        targetAccount: targetUser.userId,
        targetUserId: targetUser.userId,
        performedBy: req.user.fullName || req.user.email,
        userRole: 'Admin',
        remarks: `Admin updated profile photo for ${targetUser.fullName} (AWS S3 512x512 stripped EXIF)`,
        updatedValues: { avatarS3Key: uploadResult.s3Key, avatarUrl: uploadResult.displayUrl },
        ipAddress: req.ip
      });
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: `Profile photo for ${targetUser.fullName} updated successfully in AWS S3!`,
      avatarUrl: uploadResult.displayUrl,
      avatarS3Key: uploadResult.s3Key,
      presignedUrl: uploadResult.presignedUrl,
      user: updated
    });
  } catch (error) {
    console.error('Admin profile photo upload error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to upload photo.' });
  }
});

/**
 * 5c. Admin Retrieve User Profile Photo Upload History
 */
router.get('/users/:id/photo-history', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const targetUser = await queryGet('SELECT id, userId, fullName, userType FROM users WHERE id = ?', [id]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const photos = await queryAll(
      `SELECT * FROM user_profile_photos 
       WHERE userRecordId = ? OR userId = ? 
       ORDER BY id DESC LIMIT 50`,
      [id, targetUser.userId]
    );

    return res.status(200).json({
      success: true,
      userId: targetUser.userId,
      fullName: targetUser.fullName,
      photos
    });
  } catch (err) {
    console.error('Photo history error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch photo history.' });
  }
});

/**
 * 5c. Admin Retrieve User Profile Modification Audit History
 */
router.get('/users/:id/audits', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const targetUser = await queryGet('SELECT * FROM users WHERE id = ?', [id]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const logs = await queryAll(
      `SELECT * FROM audit_logs 
       WHERE targetUserId = ? OR targetAccount = ? OR entityId = ?
       ORDER BY id DESC LIMIT 50`,
      [targetUser.userId, targetUser.userId, id]
    );

    return res.status(200).json({
      success: true,
      userId: targetUser.userId,
      fullName: targetUser.fullName,
      audits: logs
    });
  } catch (error) {
    console.error('Error fetching user audits:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve modification audit logs.' });
  }
});

/**
 * 9. Reset User Password Securely
 */
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const targetUser = await queryGet('SELECT * FROM users WHERE id = ?', [id]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Generate random 8-character password if not provided
    const tempPassword = newPassword && newPassword.trim() 
      ? newPassword.trim() 
      : `Mws@${crypto.randomBytes(3).toString('hex')}!`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);
    const now = new Date().toISOString();

    await queryRun(
      'UPDATE users SET passwordHash = ?, temporaryPassword = ?, mustChangePassword = 1, updatedDate = ? WHERE id = ?',
      [passwordHash, tempPassword, now, id]
    );

    // Audit log
    try {
      await recordAuditLog({
        actionType: 'RESET_PASSWORD',
        entityType: targetUser.userType.toUpperCase(),
        entityId: targetUser.id,
        performedByUserId: req.user.id,
        performedByName: req.user.fullName || req.user.email,
        details: { targetUserId: targetUser.id, userId: targetUser.userId },
        ipAddress: req.ip
      });
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: `Password reset successfully for ${targetUser.fullName}.`,
      temporaryPassword: tempPassword
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
});

/**
 * 10. View User Account History & Orders
 */
router.get('/users/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await queryGet('SELECT id, userId, fullName, email FROM users WHERE id = ?', [id]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const orders = await queryAll(
      'SELECT id, orderNumber, totalAmount, paymentStatus, orderStatus, createdDate, items FROM orders WHERE userId = ? OR customerEmail = ? ORDER BY id DESC LIMIT 20',
      [targetUser.userId, targetUser.email]
    );

    return res.status(200).json({
      success: true,
      orders,
      user: targetUser
    });
  } catch (error) {
    console.error('Error fetching user history:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user history.' });
  }
});

/**
 * 11. Delete User
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

    // Audit log
    try {
      await recordAuditLog({
        actionType: 'DELETE_ACCOUNT',
        entityType: targetUser.userType.toUpperCase(),
        entityId: targetUser.id,
        performedByUserId: req.user.id,
        performedByName: req.user.fullName || req.user.email,
        details: { deletedUser: targetUser.fullName, email: targetUser.email, userId: targetUser.userId },
        ipAddress: req.ip
      });
    } catch (e) {}

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

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryGet, queryRun } from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mobile_parts_super_secret_jwt_key_2026_auth_system';

// Helper for validating email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper for validating phone format
const isValidPhone = (phone) => {
  const phoneClean = phone.replace(/[\s\-\(\)\+]/g, '');
  return phoneClean.length >= 7 && phoneClean.length <= 15;
};

/**
 * 1. Customer Sign Up (Instant Active)
 */
router.post('/register/customer', async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, profileInfo } = req.body;

    if (!fullName || !email || !phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full Name, Email, Phone Number, and Password are required.'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (!isValidPhone(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check duplicate email
    const existing = await queryGet('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const now = new Date().toISOString();
    const userId = `CUST-${Date.now().toString().slice(-6)}`;

    const result = await queryRun(
      `INSERT INTO users (
        userId, fullName, email, phoneNumber, passwordHash, userType, accountStatus,
        profileInfo, createdDate, updatedDate, lastLogin
      ) VALUES (?, ?, ?, ?, ?, 'Customer', 'Active', ?, ?, ?, ?)`,
      [userId, fullName.trim(), email.trim().toLowerCase(), phoneNumber.trim(), passwordHash, profileInfo || '', now, now, now]
    );

    const newUser = await queryGet('SELECT * FROM users WHERE id = ?', [result.lastID]);
    const { passwordHash: _, ...safeUser } = newUser;

    // Issue JWT token immediately for active customer
    const token = jwt.sign(
      { id: safeUser.id, userId: safeUser.userId, userType: safeUser.userType, email: safeUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Customer account created successfully!',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Customer registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete customer registration. Please try again.'
    });
  }
});

/**
 * 2. Distributor Sign Up Request (Initial status: Pending)
 */
router.post('/register/distributor', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      password,
      businessName,
      businessAddress,
      panVatNumber,
      contactPerson,
      businessPhone,
      businessEmail,
      profileInfo
    } = req.body;

    // Validate required personal & business fields
    if (!fullName || !email || !phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Personal details (Name, Email, Phone, Password) are required.'
      });
    }

    if (!businessName || !businessAddress || !panVatNumber) {
      return res.status(400).json({
        success: false,
        message: 'Business details (Business Name, Business Address, PAN/VAT Number) are required.'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid personal/login email address.'
      });
    }

    if (businessEmail && !isValidEmail(businessEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid business email address.'
      });
    }

    if (!isValidPhone(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check duplicate email
    const existing = await queryGet('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const now = new Date().toISOString();
    const userId = `DIST-${Date.now().toString().slice(-6)}`;

    // Status is strictly 'Pending'
    await queryRun(
      `INSERT INTO users (
        userId, fullName, email, phoneNumber, passwordHash, userType, accountStatus,
        profileInfo, createdDate, updatedDate,
        businessName, businessAddress, panVatNumber, contactPerson, businessPhone, businessEmail
      ) VALUES (?, ?, ?, ?, ?, 'Distributor', 'Pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        fullName.trim(),
        email.trim().toLowerCase(),
        phoneNumber.trim(),
        passwordHash,
        profileInfo || 'Wholesale Distributor Applicant',
        now,
        now,
        businessName.trim(),
        businessAddress.trim(),
        panVatNumber.trim().toUpperCase(),
        (contactPerson || fullName).trim(),
        (businessPhone || phoneNumber).trim(),
        (businessEmail || email).trim().toLowerCase()
      ]
    );

    return res.status(201).json({
      success: true,
      requiresApproval: true,
      message: 'Distributor registration submitted successfully. Your account is awaiting administrator review and approval before you can log in.',
      userId
    });
  } catch (error) {
    console.error('Distributor registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit distributor registration. Please try again.'
    });
  }
});

/**
 * 3. Unified Login Endpoint
 * Supports Customer, Distributor, and Admin authentication.
 * Enforces strict account status checks.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, requestedPortal } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const user = await queryGet('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Verify account type if the user explicitly submitted under a specific portal tab
    // Note: Admin credentials can log in from ANY portal tab seamlessly
    if (requestedPortal && requestedPortal !== 'Any' && requestedPortal !== user.userType && user.userType !== 'Admin') {
      return res.status(403).json({
        success: false,
        mismatchedRole: true,
        userType: user.userType,
        message: `This account is registered as a ${user.userType}. Please switch to the ${user.userType} login tab.`
      });
    }

    // Role-specific account status verification
    if (user.userType === 'Distributor') {
      if (user.accountStatus === 'Pending') {
        return res.status(403).json({
          success: false,
          accountStatus: 'Pending',
          message: 'Your distributor account is awaiting admin approval.'
        });
      }

      if (user.accountStatus === 'Rejected') {
        return res.status(403).json({
          success: false,
          accountStatus: 'Rejected',
          statusRemark: user.statusRemark,
          message: 'Your distributor registration has been rejected. Please contact the administrator.'
        });
      }

      if (user.accountStatus === 'Suspended') {
        return res.status(403).json({
          success: false,
          accountStatus: 'Suspended',
          statusRemark: user.statusRemark,
          message: 'Your distributor account has been suspended. Please contact the administrator.'
        });
      }
    } else {
      // Customer or Admin suspended check
      if (user.accountStatus === 'Suspended') {
        return res.status(403).json({
          success: false,
          accountStatus: 'Suspended',
          message: 'Your account has been suspended. Please contact the administrator.'
        });
      }
    }

    // If account status is not Active, deny
    if (user.accountStatus !== 'Active') {
      return res.status(403).json({
        success: false,
        accountStatus: user.accountStatus,
        message: `Account is not active (Status: ${user.accountStatus}). Please contact the administrator.`
      });
    }

    // Update lastLogin timestamp
    const now = new Date().toISOString();
    await queryRun('UPDATE users SET lastLogin = ?, updatedDate = ? WHERE id = ?', [now, now, user.id]);

    const { passwordHash: _, ...safeUser } = user;
    safeUser.lastLogin = now;

    // Issue JWT
    const token = jwt.sign(
      { id: user.id, userId: user.userId, userType: user.userType, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.fullName}!`,
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.'
    });
  }
});

/**
 * 4. Current Authenticated User Profile
 */
router.get('/me', verifyToken, async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
});

export default router;

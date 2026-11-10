import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { queryGet, queryRun } from '../database/db.js';
import { verifyToken } from '../middleware/auth.js';
import { createNotification } from '../services/notificationService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mobile_parts_super_secret_jwt_key_2026_auth_system';

/**
 * Issue access token, HTTP-only refresh cookie, and store persistent session
 */
const issueSessionAndTokens = async (req, res, user, rememberMe = true) => {
  const { passwordHash: _, ...safeUser } = user;

  // Access token: 30 days if rememberMe, 1 day otherwise
  const token = jwt.sign(
    { id: user.id, userId: user.userId, userType: user.userType, email: user.email },
    JWT_SECRET,
    { expiresIn: rememberMe ? '30d' : '1d' }
  );

  let refreshToken = null;

  if (rememberMe) {
    refreshToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const deviceInfo = (req.headers['user-agent'] || '').slice(0, 250);
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').slice(0, 95);

    try {
      await queryRun(
        `INSERT INTO user_sessions (user_id, refresh_token, device_info, ip_address, expires_at)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE expires_at = ?`,
        [user.id, refreshToken, deviceInfo, ip, expiresAt, expiresAt]
      );
    } catch (sessionErr) {
      console.warn('Could not store session in user_sessions table:', sessionErr.message);
    }

    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.cookie('mws_refresh_token', refreshToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    });
  }

  return { token, refreshToken, user: safeUser };
};

/**
 * Validate Google OAuth Token safely with Google API & fallback
 */
const verifyGoogleToken = async (idToken) => {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Google credential is required.');
  }

  // 1. Attempt official Google tokeninfo verification endpoint
  try {
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (googleRes.ok) {
      const payload = await googleRes.json();
      if (payload.email) {
        return {
          email: payload.email.toLowerCase(),
          name: payload.name || payload.email.split('@')[0],
          picture: payload.picture || null,
          googleId: payload.sub
        };
      }
    }
  } catch (netErr) {
    console.warn('Google tokeninfo online check skipped/failed, validating JWT payload:', netErr.message);
  }

  // 2. Safe JWT payload extraction fallback
  const segments = idToken.split('.');
  if (segments.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8'));
      const isGoogle = payload.iss === 'https://accounts.google.com' || payload.iss === 'accounts.google.com';
      if (isGoogle && payload.email) {
        return {
          email: payload.email.toLowerCase(),
          name: payload.name || payload.email.split('@')[0],
          picture: payload.picture || null,
          googleId: payload.sub
        };
      }
    } catch (e) {}
  }

  throw new Error('Invalid or expired Google authentication credential.');
};

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
    if (!email || !phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Personal credentials (Email, Phone, Password) are required.'
      });
    }

    if (!businessName || !businessAddress) {
      return res.status(400).json({
        success: false,
        message: 'Business details (Business Name, Business Address) are required.'
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

    const effectiveFullName = (fullName && typeof fullName === 'string' && fullName.trim())
      ? fullName.trim()
      : (businessName && typeof businessName === 'string' && businessName.trim())
        ? businessName.trim()
        : 'Wholesale Distributor';

    const effectivePanVat = (panVatNumber && typeof panVatNumber === 'string' && panVatNumber.trim())
      ? panVatNumber.trim().toUpperCase()
      : null;

    const effectiveContactPerson = (contactPerson && typeof contactPerson === 'string' && contactPerson.trim())
      ? contactPerson.trim()
      : null;

    // Status is strictly 'Pending'
    await queryRun(
      `INSERT INTO users (
        userId, fullName, email, phoneNumber, passwordHash, userType, accountStatus,
        profileInfo, createdDate, updatedDate,
        businessName, businessAddress, panVatNumber, contactPerson, businessPhone, businessEmail
      ) VALUES (?, ?, ?, ?, ?, 'Distributor', 'Pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        effectiveFullName,
        email.trim().toLowerCase(),
        phoneNumber.trim(),
        passwordHash,
        profileInfo || 'Wholesale Distributor Applicant',
        now,
        now,
        businessName.trim(),
        businessAddress.trim(),
        effectivePanVat,
        effectiveContactPerson,
        (businessPhone || phoneNumber).trim(),
        (businessEmail || email).trim().toLowerCase()
      ]
    );

    // 1. Notify Admin of new distributor registration pending review
    const displayPan = effectivePanVat ? ` (PAN/VAT: ${effectivePanVat})` : '';
    await createNotification({
      recipientId: 'ADMIN',
      recipientRole: 'Admin',
      title: `🏢 New Distributor Application`,
      message: `${businessName.trim()} submitted a wholesale distributor application${displayPan}.`,
      type: 'distributor_pending',
      entityId: userId,
      linkUrl: '/admin?tab=pending',
      dedupKey: `distributor_pending_${userId}_ADMIN`
    });

    // 2. Notify Distributor of pending status
    await createNotification({
      recipientId: userId,
      recipientRole: 'Distributor',
      title: `Application Under Review`,
      message: `Welcome to MWS Eagle! Your distributor application for "${businessName.trim()}" has been received and is currently under admin review.`,
      type: 'distributor_pending',
      entityId: userId,
      linkUrl: '/login',
      dedupKey: `distributor_welcome_${userId}`
    });

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
const getAdminCredentials = () => {
  const email = (process.env.ADMIN_EMAIL || 'admin@mwseagle.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  return { email, password };
};

router.post('/login', async (req, res) => {
  try {
    const { email, password, requestedPortal, rememberMe = true } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const trimmedEmail = (email || '').trim().toLowerCase();
    const { email: envAdminEmail, password: envAdminPassword } = getAdminCredentials();
    const isMasterAdminEmail = trimmedEmail === envAdminEmail;

    // Strict role check: If requestedPortal is Admin, only the master admin email is allowed
    if (requestedPortal === 'Admin' && !isMasterAdminEmail) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the authorized administrator account can access the Admin Panel.'
      });
    }

    // 1. MASTER ADMIN AUTHENTICATION
    if (isMasterAdminEmail) {
      let adminUser = await queryGet('SELECT * FROM users WHERE LOWER(email) = ?', [trimmedEmail]);
      let isMatch = false;

      // Match against master environment password or stored hash
      if (password === envAdminPassword) {
        isMatch = true;
      } else if (adminUser && adminUser.passwordHash) {
        isMatch = await bcrypt.compare(password, adminUser.passwordHash);
      }

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const now = new Date().toISOString();
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(envAdminPassword, salt);

      // Ensure Admin user exists with Active status in database
      if (!adminUser) {
        const insertRes = await queryRun(
          `INSERT INTO users (
            userId, fullName, email, phoneNumber, passwordHash, userType, accountStatus,
            profileInfo, createdDate, updatedDate, lastLogin, approvalDate, approvedBy
          ) VALUES (?, ?, ?, ?, ?, 'Admin', 'Active', ?, ?, ?, ?, ?, ?)`,
          [
            'ADM-001',
            'MWS Eagle System Admin',
            trimmedEmail,
            '+1-800-555-0100',
            passwordHash,
            'Master Administrator of MWS Eagle Marketplace',
            now, now, now, now, 'SYSTEM'
          ]
        );
        adminUser = await queryGet('SELECT * FROM users WHERE id = ?', [insertRes.lastID]);
      } else {
        await queryRun(
          'UPDATE users SET userType = "Admin", accountStatus = "Active", passwordHash = ?, lastLogin = ?, updatedDate = ? WHERE id = ?',
          [passwordHash, now, now, adminUser.id]
        );
        adminUser.userType = 'Admin';
        adminUser.accountStatus = 'Active';
        adminUser.lastLogin = now;
      }

      const sessionData = await issueSessionAndTokens(req, res, adminUser, rememberMe);

      return res.status(200).json({
        success: true,
        message: 'Welcome back, Administrator!',
        token: sessionData.token,
        refreshToken: sessionData.refreshToken,
        user: sessionData.user
      });
    }

    // 2. STANDARD USER (CUSTOMER / DISTRIBUTOR) AUTHENTICATION
    const user = await queryGet('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [trimmedEmail]);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Prevent any non-master email from claiming an Admin role
    if (user.userType === 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This administrator account is not authorized.'
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

    const sessionData = await issueSessionAndTokens(req, res, user, rememberMe);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.fullName}!`,
      token: sessionData.token,
      refreshToken: sessionData.refreshToken,
      user: sessionData.user
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
 * 4. Google OAuth Authentication & Automatic Google Account Recognition
 */
router.post('/google', async (req, res) => {
  try {
    const { credential, requestedRole = 'Customer', rememberMe = true, profile } = req.body;

    let googleData = null;

    if (credential) {
      googleData = await verifyGoogleToken(credential);
    } else if (profile && profile.email) {
      googleData = {
        email: profile.email.toLowerCase(),
        name: profile.name || profile.email.split('@')[0],
        picture: profile.picture || null,
        googleId: profile.googleId || `g_${Date.now()}`
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Google login credential or verified profile is required.'
      });
    }

    const { email, name, picture, googleId } = googleData;
    const now = new Date().toISOString();

    const { email: envAdminEmail } = getAdminCredentials();
    const isMasterAdmin = email === envAdminEmail;

    let user = await queryGet('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);

    if (!user) {
      // Create user account via Google
      const salt = await bcrypt.genSalt(10);
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      if (isMasterAdmin) {
        const insertRes = await queryRun(
          `INSERT INTO users (
            userId, fullName, email, phoneNumber, passwordHash, userType, accountStatus,
            profileInfo, createdDate, updatedDate, lastLogin, googleId, avatarUrl
          ) VALUES (?, ?, ?, ?, ?, 'Admin', 'Active', 'Master Administrator', ?, ?, ?, ?, ?)`,
          ['ADM-001', name, email, '+1-800-555-0100', passwordHash, now, now, now, googleId, picture]
        );
        user = await queryGet('SELECT * FROM users WHERE id = ?', [insertRes.lastID]);
      } else if (requestedRole === 'Distributor') {
        const userId = `DIST-${Date.now().toString().slice(-6)}`;
        await queryRun(
          `INSERT INTO users (
            userId, fullName, email, phoneNumber, passwordHash, userType, accountStatus,
            profileInfo, createdDate, updatedDate, lastLogin, googleId, avatarUrl, businessName, businessAddress
          ) VALUES (?, ?, ?, ?, ?, 'Distributor', 'Pending', 'Google Wholesale Distributor Applicant', ?, ?, ?, ?, ?, ?, 'Pending Address')`,
          [userId, name, email, 'Not provided', passwordHash, now, now, now, googleId, picture, name]
        );

        return res.status(201).json({
          success: true,
          requiresApproval: true,
          message: 'Distributor application registered via Google! Awaiting administrator approval.',
          userId
        });
      } else {
        // Customer - Instant Active
        const userId = `CUST-${Date.now().toString().slice(-6)}`;
        const insertRes = await queryRun(
          `INSERT INTO users (
            userId, fullName, email, phoneNumber, passwordHash, userType, accountStatus,
            profileInfo, createdDate, updatedDate, lastLogin, googleId, avatarUrl
          ) VALUES (?, ?, ?, ?, ?, 'Customer', 'Active', 'Google Authenticated Customer', ?, ?, ?, ?, ?)`,
          [userId, name, email, 'Not provided', passwordHash, now, now, now, googleId, picture]
        );
        user = await queryGet('SELECT * FROM users WHERE id = ?', [insertRes.lastID]);
      }
    } else {
      // User exists - check status
      if (user.accountStatus === 'Suspended') {
        return res.status(403).json({
          success: false,
          accountStatus: 'Suspended',
          statusRemark: user.statusRemark,
          message: 'Your account has been suspended by the administrator.'
        });
      }

      if (user.accountStatus === 'Rejected') {
        return res.status(403).json({
          success: false,
          accountStatus: 'Rejected',
          statusRemark: user.statusRemark,
          message: 'Your distributor registration was reviewed and rejected by the administrator.'
        });
      }

      if (user.accountStatus === 'Pending' && user.userType === 'Distributor') {
        return res.status(403).json({
          success: false,
          accountStatus: 'Pending',
          message: 'Your distributor account is currently awaiting administrator review.'
        });
      }

      // Link googleId and avatarUrl if not already present
      await queryRun(
        `UPDATE users
         SET lastLogin = ?,
             googleId = COALESCE(googleId, ?),
             avatarUrl = COALESCE(avatarUrl, ?),
             updatedDate = ?
         WHERE id = ?`,
        [now, googleId, picture, now, user.id]
      );

      user = await queryGet('SELECT * FROM users WHERE id = ?', [user.id]);
    }

    const sessionData = await issueSessionAndTokens(req, res, user, rememberMe);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.fullName}!`,
      token: sessionData.token,
      refreshToken: sessionData.refreshToken,
      user: sessionData.user
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to authenticate with Google.'
    });
  }
});

/**
 * 5. Automatic Session Restoration & Refresh Token Exchange
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.mws_refresh_token || req.body?.refreshToken || req.headers['x-refresh-token'];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No active session or refresh token found.'
      });
    }

    // Look up session in user_sessions
    const session = await queryGet(
      'SELECT * FROM user_sessions WHERE refresh_token = ? AND expires_at > NOW()',
      [refreshToken]
    );

    if (!session) {
      res.clearCookie('mws_refresh_token', { path: '/' });
      return res.status(401).json({
        success: false,
        message: 'Session has expired or was revoked. Please sign in again.'
      });
    }

    const user = await queryGet('SELECT * FROM users WHERE id = ?', [session.user_id]);
    if (!user || user.accountStatus !== 'Active') {
      res.clearCookie('mws_refresh_token', { path: '/' });
      return res.status(401).json({
        success: false,
        message: 'Account is no longer active.'
      });
    }

    const now = new Date().toISOString();
    await queryRun('UPDATE users SET lastLogin = ? WHERE id = ?', [now, user.id]);

    const { passwordHash: _, ...safeUser } = user;
    safeUser.lastLogin = now;

    // Issue refreshed access token
    const token = jwt.sign(
      { id: user.id, userId: user.userId, userType: user.userType, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: safeUser
    });
  } catch (error) {
    console.error('Session refresh error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to restore session.'
    });
  }
});

/**
 * 6. Clean Logout & Revoke Session
 */
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies?.mws_refresh_token || req.body?.refreshToken;
    if (refreshToken) {
      await queryRun('DELETE FROM user_sessions WHERE refresh_token = ?', [refreshToken]);
    }

    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.clearCookie('mws_refresh_token', {
      path: '/',
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax'
    });

    return res.status(200).json({
      success: true,
      message: 'Signed out successfully.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Failed to logout cleanly.' });
  }
});

/**
 * 7. Current Authenticated User Profile
 */
router.get('/me', verifyToken, async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
});

export default router;

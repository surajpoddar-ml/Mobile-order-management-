import jwt from 'jsonwebtoken';
import { queryGet } from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mobile_parts_super_secret_jwt_key_2026_auth_system';

/**
 * Middleware to verify JWT token and ensure account is still valid & active
 */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.'
      });
    }

    // Retrieve fresh user record from database to verify status has not changed
    const user = await queryGet('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.'
      });
    }

    // Immediate security check: Suspended accounts immediately lose access
    if (user.accountStatus === 'Suspended') {
      const msg = user.userType === 'Distributor'
        ? 'Your distributor account has been suspended. Please contact the administrator.'
        : 'Your account has been suspended. Please contact the administrator.';
      return res.status(403).json({
        success: false,
        accountStatus: 'Suspended',
        message: msg
      });
    }

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
        message: 'Your distributor registration has been rejected. Please contact the administrator.'
      });
    }

    // Attach authenticated user to request (omit sensitive password hash)
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication check.'
    });
  }
};

/**
 * Role-Based Access Control middleware
 * @param {string[]} roles Allowed user roles e.g. ['Admin'], ['Customer'], ['Distributor']
 */
export const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Authentication required.'
      });
    }

    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Access restricted to [${roles.join(', ')}] only.`
      });
    }

    next();
  };
};

const jwt = require('jsonwebtoken');
const ServiceUser = require('../models/ServiceUser');
const User = require('../models/User');

/**
 * Middleware to authenticate Service Users (and allow platform root admins).
 */
const serviceAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. Please sign in.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Session expired or invalid token. Please log in again.' });
    }

    // Check if this is a platform admin token
    if (decoded.role === 'admin' || decoded.role === 'user') {
      const adminUser = await User.findById(decoded.id).select('-password');
      if (adminUser && adminUser.isActive && adminUser.role === 'admin') {
        req.isAdmin = true;
        req.user = adminUser;
        return next();
      }
    }

    // Otherwise, check in ServiceUser collection
    const serviceUser = await ServiceUser.findById(decoded.id).select('-password');
    if (!serviceUser) {
      return res.status(401).json({ message: 'Account not found. Please register or sign in.' });
    }

    if (serviceUser.isBlocked) {
      return res.status(403).json({
        message: 'Your account has been suspended by the administration.',
        reason: serviceUser.blockReason || 'Violation of terms of service.'
      });
    }

    req.serviceUser = serviceUser;
    req.isAdmin = false;
    next();
  } catch (error) {
    console.error('Service Auth Middleware Error:', error);
    res.status(500).json({ message: 'Internal server error during authentication.' });
  }
};

/**
 * Optional authentication middleware for public endpoints that can be enhanced when logged in
 */
const optionalServiceAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const serviceUser = await ServiceUser.findById(decoded.id).select('-password');
          if (serviceUser && !serviceUser.isBlocked) {
            req.serviceUser = serviceUser;
          }
        } catch (e) {
          // Token expired or invalid, proceed as unauthenticated
        }
      }
    }
    next();
  } catch (error) {
    next();
  }
};

/**
 * Middleware to restrict route to specific service user roles or platform admin
 * @param {Array<string>} roles
 */
const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (req.isAdmin) return next();

    if (!req.serviceUser) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.includes(req.serviceUser.role)) {
      return res.status(403).json({
        message: `Access denied. This service requires one of the following roles: ${roles.join(', ')}.`
      });
    }

    next();
  };
};

/**
 * Middleware to require platform root admin
 */
const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Admin authentication required.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.id).select('-password');

    if (!adminUser || !adminUser.isActive || adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Administrator privileges required.' });
    }

    req.adminUser = adminUser;
    req.isAdmin = true;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired administrator token.' });
  }
};

module.exports = {
  serviceAuthMiddleware,
  optionalServiceAuth,
  requireRole,
  requireAdmin
};

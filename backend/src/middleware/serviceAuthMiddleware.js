const jwt = require('jsonwebtoken');
const ServiceUser = require('../models/ServiceUser');
const User = require('../models/User');

const readBearer = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1] || null;
};

/**
 * Resolve a bearer token into either a platform admin or a service user.
 * Only two token types are accepted: 'admin_access' (admin panel) and
 * 'service_user' (the single centralized customer account). Login-challenge,
 * bundle and refresh tokens are rejected even though they share a secret.
 */
const resolveIdentity = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return { error: 'invalid' };
  }
  if (!decoded || !decoded.id) return { error: 'invalid' };

  if (decoded.type === 'admin_access') {
    const adminUser = await User.findById(decoded.id).select('-password -otp');
    if (
      adminUser &&
      adminUser.isActive &&
      adminUser.role === 'admin' &&
      (adminUser.tokenVersion || 0) === (decoded.tv || 0)
    ) {
      return { adminUser };
    }
    return { error: 'forbidden' };
  }

  if (decoded.type === 'service_user') {
    const serviceUser = await ServiceUser.findById(decoded.id).select('-password');
    if (!serviceUser) return { error: 'missing' };
    return { serviceUser };
  }

  return { error: 'invalid' };
};

/**
 * Middleware to authenticate Service Users (and allow platform root admins).
 */
const serviceAuthMiddleware = async (req, res, next) => {
  try {
    const token = readBearer(req);
    if (!token) {
      return res.status(401).json({ message: 'Authentication required. Please sign in.' });
    }

    const identity = await resolveIdentity(token);

    if (identity.adminUser) {
      req.isAdmin = true;
      req.user = identity.adminUser;
      req.adminUser = identity.adminUser;
      return next();
    }

    if (identity.error === 'missing') {
      return res.status(401).json({ message: 'Account not found. Please register or sign in.' });
    }
    if (!identity.serviceUser) {
      return res.status(401).json({ message: 'Session expired or invalid token. Please log in again.' });
    }

    if (identity.serviceUser.isBlocked) {
      return res.status(403).json({
        message: 'Your account has been suspended by the administration.',
        reason: identity.serviceUser.blockReason || 'Violation of terms of service.'
      });
    }

    req.serviceUser = identity.serviceUser;
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
    const token = readBearer(req);
    if (token) {
      const identity = await resolveIdentity(token);
      if (identity.adminUser) {
        req.isAdmin = true;
        req.user = identity.adminUser;
        req.adminUser = identity.adminUser;
      } else if (identity.serviceUser && !identity.serviceUser.isBlocked) {
        req.serviceUser = identity.serviceUser;
        req.isAdmin = false;
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
 * Middleware to require platform root admin (or a panel user with the given permission)
 */
const requireAdmin = async (req, res, next) => {
  try {
    const token = readBearer(req);
    if (!token) {
      return res.status(401).json({ message: 'Admin authentication required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired administrator token.' });
    }

    if (!decoded || !decoded.id || decoded.type !== 'admin_access') {
      return res.status(401).json({ message: 'Invalid administrator token payload.' });
    }

    const adminUser = await User.findById(decoded.id).select('-password -otp');

    const hasAccess =
      adminUser &&
      adminUser.isActive &&
      (adminUser.tokenVersion || 0) === (decoded.tv || 0) &&
      (adminUser.role === 'admin' || adminUser.permissions?.services);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Administrator privileges required.' });
    }

    req.adminUser = adminUser;
    req.user = adminUser;
    req.isAdmin = true;
    next();
  } catch (error) {
    console.error('Require Admin Error:', error);
    return res.status(500).json({ message: 'Internal server error during administrator authentication.' });
  }
};

module.exports = {
  serviceAuthMiddleware,
  optionalServiceAuth,
  requireRole,
  requireAdmin
};

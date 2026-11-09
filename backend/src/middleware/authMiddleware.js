const jwt = require('jsonwebtoken');
const User = require('../models/User');

const PERMISSION_KEYS = ['website', 'leads', 'services', 'bundles'];

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Only admin-panel access tokens are accepted here (service/bundle tokens are rejected)
    if (decoded.type !== 'admin_access') {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    const user = await User.findById(decoded.id).select('-password -otp');

    if (!user || !user.isActive || (user.tokenVersion || 0) !== (decoded.tv || 0)) {
      return res.status(401).json({ message: 'User is inactive or deleted' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const checkPermission = (type) => {
  return (req, res, next) => {
    // Super Admin (Root) has all permissions
    if (req.user.role === 'admin') return next();

    if (req.user.permissions?.[type]) {
      return next();
    }

    res.status(403).json({ message: `Access denied: Missing ${type} permission` });
  };
};

const requireRootAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Administrator privileges required.' });
};

module.exports = { authMiddleware, checkPermission, requireRootAdmin, PERMISSION_KEYS };

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
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

module.exports = { authMiddleware, checkPermission };

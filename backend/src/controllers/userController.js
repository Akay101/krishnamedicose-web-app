const User = require('../models/User');
const { PERMISSION_KEYS } = require('../middleware/authMiddleware');

// Only known permission flags, coerced to booleans (blocks injection of arbitrary keys)
const normalizePermissions = (input = {}) =>
  PERMISSION_KEYS.reduce((acc, key) => {
    acc[key] = Boolean(input && input[key]);
    return acc;
  }, {});

const isRootAccount = (user) =>
  user.role === 'admin' || (process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL);

const isAuthorizedAdmin = (user) => {
  return user && (user.role === 'admin' || (process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL));
};

exports.getUsers = async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req.user)) {
      return res.status(403).json({ message: 'Forbidden: Only administrators can manage users' });
    }

    const users = await User.find().select('-password -otp -otpExpires -otpAttempts -tokenVersion');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Unable to process user request' });
  }
};

exports.createUser = async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req.user)) {
       return res.status(403).json({ message: 'Forbidden: Only administrators can create users' });
    }

    const { name, email, password, mobile, permissions } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password must be valid strings' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be between 8 and 128 characters long' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const user = new User({
      name: typeof name === 'string' ? name.trim().slice(0, 80) : undefined,
      email: normalizedEmail,
      password,
      mobile: typeof mobile === 'string' ? mobile.replace(/[^\d+]/g, '').slice(0, 15) : undefined,
      permissions: normalizePermissions(permissions),
      role: 'user'
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process user request' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req.user)) {
       return res.status(403).json({ message: 'Forbidden: Only administrators can update users' });
    }

    const { name, mobile, permissions, isActive } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Root admin cannot be demoted or deactivated from the panel
    if (isRootAccount(user) && (isActive === false || permissions)) {
      return res.status(400).json({ message: 'Root admin account cannot be modified here' });
    }

    if (typeof name === 'string' && name.trim()) user.name = name.trim().slice(0, 80);
    if (typeof mobile === 'string' && mobile.trim()) user.mobile = mobile.replace(/[^\d+]/g, '').slice(0, 15);
    if (permissions) user.permissions = normalizePermissions(permissions);
    if (isActive !== undefined) {
      const nextActive = Boolean(isActive);
      // Deactivation revokes all live sessions immediately
      if (!nextActive && user.isActive) user.tokenVersion = (user.tokenVersion || 0) + 1;
      user.isActive = nextActive;
    }

    await user.save();
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process user request' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req.user)) {
       return res.status(403).json({ message: 'Forbidden: Only administrators can delete users' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Protect super admin / root admin
    if (isRootAccount(user)) {
      return res.status(400).json({ message: 'Cannot delete root admin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process user request' });
  }
};

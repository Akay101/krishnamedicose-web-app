const User = require('../models/User');

const isAuthorizedAdmin = (user) => {
  return user && (user.role === 'admin' || (process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL));
};

exports.getUsers = async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req.user)) {
      return res.status(403).json({ message: 'Forbidden: Only administrators can manage users' });
    }

    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const user = new User({
      name,
      email: normalizedEmail,
      password,
      mobile,
      permissions,
      role: 'user'
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    user.name = name || user.name;
    user.mobile = mobile || user.mobile;
    user.permissions = permissions || user.permissions;
    if (isActive !== undefined) user.isActive = Boolean(isActive);

    await user.save();
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    if (user.role === 'admin' || (process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL)) {
      return res.status(400).json({ message: 'Cannot delete root admin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

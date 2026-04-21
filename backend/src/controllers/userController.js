const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    // Only Root Admin can manage users
    if (req.user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Forbidden: Only the primary admin can manage users' });
    }

    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    if (req.user.email !== process.env.ADMIN_EMAIL) {
       return res.status(403).json({ message: 'Forbidden' });
    }

    const { name, email, password, mobile, permissions } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const user = new User({
      name,
      email,
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
    if (req.user.email !== process.env.ADMIN_EMAIL) {
       return res.status(403).json({ message: 'Forbidden' });
    }

    const { name, mobile, permissions, isActive } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent deactivating or changing self role if needed, 
    // though the logic is restricted to ADMIN_EMAIL anyway.

    user.name = name || user.name;
    user.mobile = mobile || user.mobile;
    user.permissions = permissions || user.permissions;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (req.user.email !== process.env.ADMIN_EMAIL) {
       return res.status(403).json({ message: 'Forbidden' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Protect super admin
    if (user.email === process.env.ADMIN_EMAIL) {
      return res.status(400).json({ message: 'Cannot delete root admin' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

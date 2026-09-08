const bcrypt = require('bcryptjs');
const db = require('../db/db');

// @desc    Get all admin users
// @route   GET /api/users
// @access  Private (Admin / Super Admin)
const getUsers = async (req, res) => {
  try {
    const users = await db.User.find();
    // Sanitize output (remove password hashes)
    const sanitized = users.map(u => ({
      _id: u._id || u.id,
      id: u._id || u.id,
      username: u.username,
      email: u.email,
      name: u.name || '',
      phone: u.phone || '',
      role: u.role || 'site_admin',
      status: u.status || 'active',
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }));
    res.json({ success: true, count: sanitized.length, data: sanitized });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error fetching admin users' });
  }
};

// @desc    Get single admin user
// @route   GET /api/users/:id
// @access  Private (Super Admin)
const getUserById = async (req, res) => {
  try {
    const user = await db.User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      data: {
        _id: user._id || user.id,
        id: user._id || user.id,
        username: user.username,
        email: user.email,
        name: user.name || '',
        phone: user.phone || '',
        role: user.role || 'site_admin',
        status: user.status || 'active',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create new admin user
// @route   POST /api/users
// @access  Private (Super Admin only)
const createUser = async (req, res) => {
  try {
    const { username, email, password, role, name, phone } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ success: false, message: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check if username exists
    const existingUser = await db.User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db.User.create({
      username: username.trim(),
      email: email.trim(),
      password: hashedPassword,
      name: name ? name.trim() : '',
      phone: phone ? phone.trim() : '',
      role: role === 'super_admin' ? 'super_admin' : 'site_admin',
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        _id: newUser._id || newUser.id,
        id: newUser._id || newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        status: newUser.status,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Server error creating admin user' });
  }
};

// @desc    Update admin user
// @route   PUT /api/users/:id
// @access  Private (Super Admin only)
const updateUser = async (req, res) => {
  try {
    const { email, role, name, phone, status } = req.body;
    const user = await db.User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Protection: Primary super admin cannot be demoted or deactivated
    if (user.username === 'admin' && (status === 'inactive' || (role && role !== 'super_admin'))) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate or demote primary super admin' });
    }

    const updates = {};
    if (email) updates.email = email.trim();
    if (role) updates.role = role === 'super_admin' ? 'super_admin' : 'site_admin';
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (status) updates.status = status;

    const updated = await db.User.findByIdAndUpdate(req.params.id, updates);

    res.json({
      success: true,
      message: 'Admin user updated successfully',
      data: {
        _id: updated._id || updated.id,
        username: updated.username,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        status: updated.status
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Server error updating admin user' });
  }
};

// @desc    Reset password for an admin user
// @route   PUT /api/users/:id/password
// @access  Private (Super Admin only)
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await db.User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.User.findByIdAndUpdate(req.params.id, { password: hashedPassword });

    res.json({ success: true, message: `Password for user "${user.username}" reset successfully` });
  } catch (error) {
    console.error('Error resetting user password:', error);
    res.status(500).json({ success: false, message: 'Server error resetting password' });
  }
};

// @desc    Delete admin user
// @route   DELETE /api/users/:id
// @access  Private (Super Admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await db.User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Protection: cannot delete self
    if (req.user && (req.user.id === user._id || req.user.id === user.id)) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    // Protection: cannot delete primary super admin
    if (user.username === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete primary super admin account' });
    }

    await db.User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `User "${user.username}" deleted successfully` });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Server error deleting user' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser
};

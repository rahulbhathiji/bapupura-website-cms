const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config();

// Helper: Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_session_token_bapupura_sanskar_bhavan_cms_2026', {
    expiresIn: process.env.JWT_EXPIRY || '8h'
  });
};

// Seed Default Admin User if no admin user exists
const seedDefaultAdmin = async () => {
  try {
    const adminUser = await db.User.findOne({ username: 'admin' });
    if (!adminUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('adminpassword123', salt);
      
      await db.User.create({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@bapupurasanskarbhavan.org',
        role: 'super_admin',
        name: 'Primary Super Admin',
        status: 'active'
      });
      console.log('--------------------------------------------------');
      console.log('Seeded Default Super Admin User:');
      console.log('  Username: admin');
      console.log('  Password: adminpassword123');
      console.log('  Email:    admin@bapupurasanskarbhavan.org');
      console.log('--------------------------------------------------');
    }
  } catch (err) {
    console.error('Error seeding default admin:', err);
  }
};

// Initialize seed
seedDefaultAdmin();

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { username, password, rememberMe } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Please provide username and password' });
  }

  const cleanUsername = String(username).trim();

  try {
    const user = await db.User.findOne({ username: cleanUsername });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact Super Admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id || user.id);

    // Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000 // 30 days or 8 hours
    };

    res.cookie('token', token, cookieOptions);

    res.json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc    Change Password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please enter all fields' });
  }

  try {
    const user = await db.User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mock Forgot & Reset password tokens in memory
const resetTokens = new Map();

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide email' });
  }

  try {
    const user = await db.User.findOne({ email });
    if (!user) {
      // Don't leak details but return success
      return res.json({ success: true, message: 'Password reset link sent' });
    }

    const resetToken = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    // Expires in 15 minutes
    resetTokens.set(resetToken, { userId: user._id || user.id, expires: Date.now() + 15 * 60 * 1000 });

    console.log('==================================================');
    console.log(`Password reset requested for: ${user.username}`);
    console.log(`Reset Token: ${resetToken}`);
    console.log(`Local link: http://localhost:5000/admin/reset-password?token=${resetToken}`);
    console.log('==================================================');

    // Return the link in development so they don't need real mail config!
    res.json({
      success: true,
      message: 'Password reset link generated. Check server console logs (or returned token).',
      token: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please provide token and new password' });
  }

  const session = resetTokens.get(token);
  if (!session || session.expires < Date.now()) {
    resetTokens.delete(token);
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.User.findByIdAndUpdate(session.userId, { password: hashedPassword });
    resetTokens.delete(token);

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { login, logout, getMe, changePassword, forgotPassword, resetPassword };

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Officer = require('../models/Officer');
const Admin = require('../admin/Admin');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'civicmind_secret_key_2026';

// @route   POST /api/auth/register
// @desc    Register a new citizen
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: 'Please enter all fields.' });
  }

  try {
    // Check if user already exists in citizen db
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: 'citizen'
    });

    const token = jwt.sign(
      { id: newUser._id, role: 'citizen', name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: 'citizen'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user (citizen, officer, admin)
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields.' });
  }

  try {
    // 1. Check Admin Database (with auto-seeding of default admin)
    let admin = await Admin.findOne({ email });
    if (!admin && email.toLowerCase() === 'admin@gvmc.gov.in') {
      if (password === 'admin123') {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);
        admin = await Admin.create({
          _id: "60c72b2f9b1d8a2c28654879",
          name: "GVMC Super Admin",
          email: "admin@gvmc.gov.in",
          phone: "9999999999",
          passwordHash,
          role: "admin"
        });
      }
    }

    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials.' });
      }

      const token = jwt.sign(
        { id: admin._id, role: 'admin', name: admin.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: 'admin'
        }
      });
    }

    // 2. Check Officer Database
    const officer = await Officer.findOne({ email });
    if (officer) {
      if (officer.status !== 'active') {
        return res.status(403).json({ message: 'Officer account is deactivated.' });
      }
      
      const isMatch = await bcrypt.compare(password, officer.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials.' });
      }

      const token = jwt.sign(
        { id: officer._id, role: 'officer', name: officer.name, department: officer.department, zone: officer.zone },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: officer._id,
          name: officer.name,
          email: officer.email,
          role: 'officer',
          department: officer.department,
          zone: officer.zone
        }
      });
    }

    // 3. Check Citizen Database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials or user does not exist.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user._id, role: 'citizen', name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: 'citizen'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authMiddleware(), async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const adminObj = await Admin.findById(req.user.id);
      if (adminObj) {
        return res.json({
          id: adminObj._id,
          name: adminObj.name,
          email: adminObj.email,
          role: 'admin'
        });
      }
      return res.json({
        id: 'super_admin_gvmc',
        name: 'GVMC Super Admin',
        email: 'admin@gvmc.gov.in',
        role: 'admin'
      });
    }

    if (req.user.role === 'officer') {
      const officer = await Officer.findById(req.user.id);
      if (!officer) return res.status(404).json({ message: 'Officer not found.' });
      return res.json({
        id: officer._id,
        name: officer.name,
        email: officer.email,
        phone: officer.phone,
        role: 'officer',
        department: officer.department,
        zone: officer.zone
      });
    }

    // Default citizen
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: 'citizen'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching user details.' });
  }
});

module.exports = router;

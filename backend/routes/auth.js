const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { getIsConnected } = require('../config/db');
const { tempUsers } = require('../config/memoryDb');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please add all required fields' });
    }

    const lowerEmail = email.toLowerCase().trim();

    if (getIsConnected()) {
      // Check if user exists in MongoDB
      const userExists = await User.findOne({ email: lowerEmail });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'Email address already registered' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await User.create({
        name,
        email: lowerEmail,
        password: hashedPassword
      });

      if (user) {
        return res.status(201).json({
          success: true,
          token: generateToken(user._id),
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          }
        });
      }
    } else {
      // In-Memory Fallback Mode
      const userExists = tempUsers.find((u) => u.email === lowerEmail);
      if (userExists) {
        return res.status(400).json({ success: false, message: 'Email address already registered in Sandbox Mode' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const mockId = `mock-user-${Date.now()}`;
      const mockUser = {
        _id: mockId,
        name,
        email: lowerEmail,
        password: hashedPassword
      };

      tempUsers.push(mockUser);

      return res.status(201).json({
        success: true,
        token: generateToken(mockId),
        user: {
          id: mockId,
          name: mockUser.name,
          email: mockUser.email
        }
      });
    }

    res.status(400).json({ success: false, message: 'Invalid registration details' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const lowerEmail = email.toLowerCase().trim();

    if (getIsConnected()) {
      // Check for user in MongoDB
      const user = await User.findOne({ email: lowerEmail });

      if (user && (await bcrypt.compare(password, user.password))) {
        return res.json({
          success: true,
          token: generateToken(user._id),
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          }
        });
      }
    } else {
      // In-Memory Fallback Mode
      const user = tempUsers.find((u) => u.email === lowerEmail);

      if (user && (await bcrypt.compare(password, user.password))) {
        return res.json({
          success: true,
          token: generateToken(user._id),
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          }
        });
      }
    }

    res.status(401).json({ success: false, message: 'Invalid email or password credentials' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get current user details
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

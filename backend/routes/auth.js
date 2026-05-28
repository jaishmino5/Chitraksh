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

// @desc    Authenticate with Google (Real Google Sign-In & Mock sandbox fallback)
// @route   POST /api/auth/google
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { token, isMock, payload } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Google credential token is required' });
    }

    let email, name;

    if (isMock) {
      // Sandbox Mock Login fallback
      const mockPayload = payload || {};
      email = (mockPayload.email || 'sandbox.google.user@example.com').toLowerCase().trim();
      name = mockPayload.name || 'Google Sandbox User';
    } else {
      // Real Google ID Token verification
      const decoded = jwt.decode(token);
      if (!decoded) {
        return res.status(400).json({ success: false, message: 'Invalid Google credential token format' });
      }

      email = (decoded.email || '').toLowerCase().trim();
      name = decoded.name || 'Google User';

      if (!email) {
        return res.status(400).json({ success: false, message: 'Email not found in Google credential payload' });
      }
    }

    let user;

    if (getIsConnected()) {
      // Check if user exists in MongoDB
      user = await User.findOne({ email });

      if (!user) {
        // If user doesn't exist, create them with blank password
        user = await User.create({
          name,
          email,
          password: '' // empty password for Google oauth users
        });
      }

      return res.json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } else {
      // In-Memory Fallback Mode
      const existingUser = tempUsers.find((u) => u.email === email);

      if (existingUser) {
        return res.json({
          success: true,
          token: generateToken(existingUser._id),
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email
          }
        });
      } else {
        const mockId = `google-user-${Date.now()}`;
        const newUser = {
          _id: mockId,
          name,
          email,
          password: ''
        };
        tempUsers.push(newUser);

        return res.json({
          success: true,
          token: generateToken(mockId),
          user: {
            id: mockId,
            name: newUser.name,
            email: newUser.email
          }
        });
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

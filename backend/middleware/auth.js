const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getIsConnected } = require('../config/db');
const { tempUsers } = require('../config/memoryDb');

const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (getIsConnected()) {
        // Get user from the token, omit password field
        req.user = await User.findById(decoded.id).select('-password');
      } else {
        // Fallback in-memory lookup
        const found = tempUsers.find((u) => u._id === decoded.id);
        if (found) {
          // Omit password equivalent from req.user
          req.user = {
            _id: found._id,
            name: found.name,
            email: found.email
          };
        }
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * 
 * Verifies the authentication token in the request header and checks if the user is active.
 * If the token is invalid or the user is not active, returns an error response.
 * Otherwise, stores the user in the request object and calls the next middleware.
 */
const auth = async (req, res, next) => {
  try {
    // Get the authentication token from the request header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth middleware token:', token ? 'present' : 'missing');
    
    // If no token is present, return an error response
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify the token and get the user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('+active');
    console.log('Auth middleware user:', user ? { id: user._id, email: user.email, active: user.active } : null);

    // If the user is not found, return an error response
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // If the user's active status is undefined, set it to true and save the user
    if (user.active === undefined) {
      user.active = true;
      await user.save();
      console.log('Set default active status for user:', user.email);
    }

    // If the user is not active, return an error response
    if (user.active === false) {
      console.log('Auth middleware: User is deactivated');
      return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan. Silakan hubungi admin untuk informasi lebih lanjut.' });
    }

    // Store the user in the request object
    req.user = user;
    next();
  } catch (error) {
    // If an error occurs during token verification, return an error response
    res.status(401).json({ message: 'Invalid authentication token' });
  }
};

/**
 * Role-based access control middleware
 * 
 * Checks if the user has one of the specified roles.
 * If the user does not have a valid role, returns an error response.
 * Otherwise, calls the next middleware.
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

/**
 * Admin authentication middleware
 * 
 * Checks if the user is an admin by checking the session.
 * If the user is not an admin, returns an error response.
 * Otherwise, calls the next middleware.
 */
const authenticateAdmin = (req, res, next) => {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ message: 'Admin authentication required' });
  }
  next();
};

module.exports = { auth, checkRole, authenticateAdmin };
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Authority from '../models/Authority.js';
import Citizen from '../models/Citizen.js';

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Helper function to get user from appropriate collection
const getUserFromCollection = async (userId, role) => {
  if (role === 'admin') {
    return await Admin.findById(userId);
  } else if (role === 'authority') {
    return await Authority.findById(userId);
  } else if (role === 'citizen') {
    return await Citizen.findById(userId);
  }
  
  // Fallback: search all collections if role not in token (for backward compatibility)
  const [admin, authority, citizen] = await Promise.all([
    Admin.findById(userId),
    Authority.findById(userId),
    Citizen.findById(userId),
  ]);
  
  return admin || authority || citizen;
};

// Middleware to protect routes
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await getUserFromCollection(decoded.id, decoded.role);

    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

// Middleware for admin-only routes
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'This route is for administrators only',
    });
  }
  next();
};

// Middleware for authority-only routes
export const requireAuthority = (req, res, next) => {
  if (req.user.role !== 'authority') {
    return res.status(403).json({
      success: false,
      message: 'This route is for authorized personnel only',
    });
  }
  next();
};

// Middleware for citizen-only routes
export const requireCitizen = (req, res, next) => {
  if (req.user.role !== 'citizen') {
    return res.status(403).json({
      success: false,
      message: 'This route is for citizens only',
    });
  }
  next();
};

// Check if user is verified (for authorities)
export const requireVerified = (req, res, next) => {
  if (!req.user.isVerified && req.user.role !== 'citizen') {
    return res.status(403).json({
      success: false,
      message: 'Your account is not verified. Please wait for admin approval.',
    });
  }
  next();
};

// Check if user is active
export const requireActive = (req, res, next) => {
  if (!req.user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated',
    });
  }
  next();
};

export default { protect, authorize, verifyToken, requireVerified, requireActive };

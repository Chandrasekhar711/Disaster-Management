import { body, param, query, validationResult } from 'express-validator';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array(),
    });
  }
  next();
};

// Auth validation
export const validateRegister = [
  body('name', 'Name is required and must be at least 3 characters')
    .trim()
    .isLength({ min: 3 }),
  body('userId', 'User ID is required, must be 4-20 characters and contain only letters, numbers, and underscores')
    .trim()
    .toLowerCase()
    .isLength({ min: 4, max: 20 })
    .matches(/^[a-z0-9_]+$/),
  body('email', 'Please provide a valid email').isEmail().normalizeEmail(),
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  body('phone', 'Please provide a valid phone number')
    .trim()
    .matches(/^[0-9]{10}$/),
  // Role is optional and will be forced to 'citizen' by controller
  body('role', 'Invalid role').optional().isIn(['citizen', 'authority', 'admin']),
  handleValidationErrors,
];

export const validateLogin = [
  body('emailOrUserId', 'Please provide an email or user ID').trim().notEmpty(),
  body('password', 'Password is required').notEmpty(),
  handleValidationErrors,
];

// Incident validation
export const validateIncidentCreate = [
  body('title', 'Title is required and must be 3-200 characters')
    .trim()
    .isLength({ min: 3, max: 200 }),
  body('description', 'Description is required and must be 10-2000 characters')
    .trim()
    .isLength({ min: 10, max: 2000 }),
  body('type', 'Invalid incident type').isIn([
    'flood',
    'fire',
    'accident',
    'earthquake',
    'hazard',
    'other',
  ]),
  body('severity', 'Invalid severity level').isIn(['low', 'medium', 'high', 'critical']),
  body('location.coordinates', 'Invalid coordinates').isArray({ min: 2, max: 2 }),
  // Address is optional (can be auto-filled from map selection)
  body('location.address', 'Address is required').optional().trim(),
  handleValidationErrors,
];

export const validateIncidentUpdate = [
  body('status', 'Invalid status').optional().isIn([
    'reported',
    'admin_review',
    'authority_review',
    'responding',
    'responded',
    'resolved',
    'cancelled',
  ]),
  body('severity', 'Invalid severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  handleValidationErrors,
];

// Pagination validation
export const validatePagination = [
  query('page', 'Page must be a positive number').optional().isInt({ min: 1 }),
  query('limit', 'Limit must be between 1 and 1000').optional().isInt({ min: 1, max: 1000 }),
  handleValidationErrors,
];

// Location validation
export const validateGeoLocation = [
  query('longitude', 'Valid longitude is required').isFloat({ min: -180, max: 180 }),
  query('latitude', 'Valid latitude is required').isFloat({ min: -90, max: 90 }),
  query('radius', 'Radius must be in meters').optional().isInt({ min: 100 }),
  handleValidationErrors,
];

export default {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateIncidentCreate,
  validateIncidentUpdate,
  validatePagination,
  validateGeoLocation,
};

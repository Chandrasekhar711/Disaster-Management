import { successResponse, errorResponse } from '../utils/responseHandler.js';
import * as authService from '../services/authService.js';

export const register = async (req, res, next) => {
  try {
    const { name, userId, email, phone, password, role } = req.body;

    // Force role to be citizen - reject if any other role is sent
    if (role && role !== 'citizen') {
      return errorResponse(
        res,
        'Public registration is only for citizens. Contact admin for authority accounts.',
        400
      );
    }

    const result = await authService.registerUser({
      name,
      userId,
      email,
      phone,
      password,
      role: 'citizen', // Always force citizen role
      department: null, // Citizens don't have department
    });

    return successResponse(res, result, 'User registered successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const login = async (req, res, next) => {
  try {
    const { emailOrUserId, password } = req.body;

    const result = await authService.loginUser(emailOrUserId, password);

    // Set cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return successResponse(res, result, 'Login successful');
  } catch (error) {
    // Use generic error message for security
    return errorResponse(res, 'Invalid credentials', 401);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id, req.user.role);
    return successResponse(res, user, 'Profile retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 404);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'address', 'profileImage', 'bio', 'location'];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const user = await authService.updateUserProfile(req.user.id, updateData, req.user.role);
    return successResponse(res, user, 'Profile updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie('token');
    return successResponse(res, {}, 'Logged out successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export default {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
};

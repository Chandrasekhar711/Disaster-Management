import { successResponse, errorResponse, paginatedResponse } from '../utils/responseHandler.js';
import * as adminService from '../services/adminService.js';

export const createAuthorityOfficer = async (req, res, next) => {
  try {
    const { name, userId, email, phone, password, department } = req.body;
    
    // Validate required fields
    if (!userId || !email || !password || !department) {
      return errorResponse(
        res,
        'Missing required fields: userId, email, password, department',
        400
      );
    }

    const officer = await adminService.createAuthorityOfficer({
      name,
      userId,
      email,
      phone,
      password,
      department,
      createdBy: req.user.id, // Track admin who created this
    });
    return successResponse(res, officer, 'Authority officer created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const role = req.query.role;

    const result = await adminService.getAllUsers(page, limit, role);
    return paginatedResponse(
      res,
      result.users,
      result.page,
      result.limit,
      result.total,
      'Users retrieved successfully'
    );
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const getAuthorityOfficers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const result = await adminService.getAuthorityOfficers(page, limit);
    return paginatedResponse(
      res,
      result.officers,
      result.page,
      result.limit,
      result.total,
      'Authority officers retrieved successfully'
    );
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const assignIncidentToOfficer = async (req, res, next) => {
  try {
    const { incidentId, officerId, department } = req.body;
    const incident = await adminService.assignIncidentToOfficer(
      incidentId,
      officerId,
      department
    );
    return successResponse(res, incident, 'Incident assigned successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const verifyAuthorityOfficer = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const officer = await adminService.verifyAuthorityOfficer(userId);
    return successResponse(res, officer, 'Authority officer verified successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const deactivateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await adminService.deactivateUser(userId);
    return successResponse(res, user, 'User deactivated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await adminService.deleteUser(userId);
    return successResponse(res, {}, 'User deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    return successResponse(res, stats, 'Dashboard stats retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Admin review incident - move from "reported" to "authority_review"
 */
export const reviewIncident = async (req, res, next) => {
  try {
    const { incidentId } = req.params;
    const { notes } = req.body;

    const incident = await adminService.reviewIncident(incidentId, req.user.id, notes);

    // Emit Socket.IO event for admin review
    const io = req.app.get('io');
    const rooms = req.app.get('socketRooms');
    if (io) {
      io.to(rooms.incidentUpdates).emit('incident-admin-reviewed', incident);
    }

    return successResponse(res, incident, 'Incident moved to authority review');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Authority verify incident - approve or reject
 * decision: "yes" (approve) | "no" (reject)
 */
export const authorityVerifyIncident = async (req, res, next) => {
  try {
    const { incidentId } = req.params;
    const { decision, notes } = req.body;

    if (!['yes', 'no'].includes(decision)) {
      return errorResponse(res, 'Decision must be "yes" or "no"', 400);
    }

    const incident = await adminService.authorityVerifyIncident(
      incidentId,
      req.user.id,
      decision,
      notes
    );

    // Emit Socket.IO event for authority verification
    const io = req.app.get('io');
    const rooms = req.app.get('socketRooms');
    if (io) {
      io.to(rooms.incidentUpdates).emit('incident-authority-verified', incident);
      io.to(rooms.liveMap).emit('incident-authority-verified', incident);
    }

    return successResponse(res, incident, 'Incident verification completed');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Delete fake incident (admin only)
 */
export const deleteIncident = async (req, res, next) => {
  try {
    const { incidentId } = req.params;
    
    await adminService.deleteIncident(incidentId, req.user.id);

    // Emit Socket.IO event for incident deletion
    const io = req.app.get('io');
    const rooms = req.app.get('socketRooms');
    if (io) {
      io.to(rooms.incidentUpdates).emit('incident:deleted', { incidentId });
      io.to(rooms.liveMap).emit('incident:deleted', { incidentId });
    }

    return successResponse(res, { incidentId }, 'Incident deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export default {
  createAuthorityOfficer,
  getAllUsers,
  getAuthorityOfficers,
  assignIncidentToOfficer,
  verifyAuthorityOfficer,
  deactivateUser,
  deleteUser,
  getDashboardStats,
  reviewIncident,
  authorityVerifyIncident,
  deleteIncident,
};

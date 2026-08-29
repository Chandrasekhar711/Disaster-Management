import Admin from '../models/Admin.js';
import Authority from '../models/Authority.js';
import Citizen from '../models/Citizen.js';
import Incident from '../models/Incident.js';
import { verifyIncident as runAuthorityVerification } from './incidentService.js';

// Helper function to check if email or userId exists across all collections
const checkExistingAuthority = async (email, userId) => {
  const normalizedEmail = email.toLowerCase();
  const normalizedUserId = userId.toLowerCase();

  const [adminByEmail, authorityByEmail, citizenByEmail] = await Promise.all([
    Admin.findOne({ email: normalizedEmail }),
    Authority.findOne({ email: normalizedEmail }),
    Citizen.findOne({ email: normalizedEmail }),
  ]);

  if (adminByEmail || authorityByEmail || citizenByEmail) {
    throw new Error('Email already registered');
  }

  const [adminByUserId, authorityByUserId, citizenByUserId] = await Promise.all([
    Admin.findOne({ userId: normalizedUserId }),
    Authority.findOne({ userId: normalizedUserId }),
    Citizen.findOne({ userId: normalizedUserId }),
  ]);

  if (adminByUserId || authorityByUserId || citizenByUserId) {
    throw new Error('User ID already taken');
  }
};

export const createAuthorityOfficer = async (officerData) => {
  const { name, userId, email, phone, password, department, createdBy } = officerData;

  // Check if user already exists
  await checkExistingAuthority(email, userId);

  const officer = new Authority({
    name,
    userId: userId.toLowerCase(),
    email,
    phone,
    password,
    department,
    createdBy,
    isActive: true,
    isVerified: false, // Admin must verify before active use
  });

  await officer.save();

  // Return officer without password
  const officerObj = officer.toObject();
  delete officerObj.password;

  return officerObj;
};

export const getAllUsers = async (page = 1, limit = 10, role = null) => {
  const skip = (page - 1) * limit;
  let users = [];
  let total = 0;

  if (role === 'admin') {
    total = await Admin.countDocuments();
    users = await Admin.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  } else if (role === 'authority') {
    total = await Authority.countDocuments();
    users = await Authority.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  } else if (role === 'citizen') {
    total = await Citizen.countDocuments();
    users = await Citizen.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  } else {
    // Get all users from all collections
    const [admins, authorities, citizens] = await Promise.all([
      Admin.find().select('-password').sort({ createdAt: -1 }),
      Authority.find().select('-password').sort({ createdAt: -1 }),
      Citizen.find().select('-password').sort({ createdAt: -1 }),
    ]);
    
    users = [...admins, ...authorities, ...citizens]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(skip, skip + limit);
    
    total = admins.length + authorities.length + citizens.length;
  }

  return {
    users,
    total,
    page,
    limit,
  };
};

export const getAuthorityOfficers = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const total = await Authority.countDocuments();

  const officers = await Authority.find()
    .select('-password')
    .populate('incidentsAssigned', 'title status type severity')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    officers,
    total,
    page,
    limit,
  };
};

export const assignIncidentToOfficer = async (incidentId, officerId, department) => {
  const [incident, officer] = await Promise.all([
    Incident.findById(incidentId),
    Authority.findById(officerId),
  ]);

  if (!incident) {
    throw new Error('Incident not found');
  }

  if (!officer) {
    throw new Error('Officer not found or is not an authority officer');
  }

  // Check if already assigned
  const alreadyAssigned = incident.assignedTo.some(
    (assignment) => assignment.userId.toString() === officerId.toString()
  );

  if (alreadyAssigned) {
    throw new Error('This incident is already assigned to this officer');
  }

  // Add to incident
  incident.assignedTo.push({
    userId: officerId,
    department: department || officer.department,
  });

  await incident.save();

  // Add to officer's assigned incidents
  await Authority.findByIdAndUpdate(officerId, {
    $push: { incidentsAssigned: incidentId },
  });

  await incident.populate('assignedTo.userId', 'name email department');
  await incident.populate('reportedBy', 'name email phone');

  return incident;
};

export const verifyAuthorityOfficer = async (userId) => {
  const officer = await Authority.findByIdAndUpdate(
    userId,
    { isVerified: true },
    { new: true }
  ).select('-password');

  if (!officer) {
    throw new Error('Officer not found');
  }

  return officer;
};

export const deactivateUser = async (userId) => {
  // Try to find and deactivate in all collections
  let user = await Admin.findByIdAndUpdate(
    userId,
    { isActive: false },
    { new: true }
  ).select('-password');

  if (!user) {
    user = await Authority.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password');
  }

  if (!user) {
    user = await Citizen.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password');
  }

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

export const deleteUser = async (userId) => {
  // Try to delete from all collections
  let user = await Admin.findByIdAndDelete(userId);
  
  if (!user) {
    user = await Authority.findByIdAndDelete(userId);
  }
  
  if (!user) {
    user = await Citizen.findByIdAndDelete(userId);
  }

  if (!user) {
    throw new Error('User not found');
  }

  // Remove user from all incidents
  await Incident.updateMany(
    {
      $or: [
        { reportedBy: userId },
        { 'assignedTo.userId': userId },
        { responders: userId },
      ],
    },
    {
      $pull: {
        assignedTo: { userId },
        responders: userId },
    }
  );

  return { message: 'User deleted successfully' };
};

export const getDashboardStats = async () => {
  const [totalAdmins, totalAuthority, totalCitizens] = await Promise.all([
    Admin.countDocuments(),
    Authority.countDocuments(),
    Citizen.countDocuments(),
  ]);

  const totalUsers = totalAdmins + totalAuthority + totalCitizens;
  const totalIncidents = await Incident.countDocuments();
  const reportedIncidents = await Incident.countDocuments({ status: 'reported' });
  const adminReviewIncidents = await Incident.countDocuments({ status: 'admin_review' });
  const authorityReviewIncidents = await Incident.countDocuments({ status: 'authority_review' });
  const respondingIncidents = await Incident.countDocuments({ status: 'responding' });
  const resolvedIncidents = await Incident.countDocuments({ status: 'resolved' });
  const cancelledIncidents = await Incident.countDocuments({ status: 'cancelled' });

  const unverifiedOfficers = await Authority.countDocuments({
    isVerified: false,
  });

  return {
    users: {
      total: totalUsers,
      authority: totalAuthority,
      citizens: totalCitizens,
      unverifiedOfficers,
    },
    incidents: {
      total: totalIncidents,
      reported: reportedIncidents,
      adminReview: adminReviewIncidents,
      authorityReview: authorityReviewIncidents,
      responding: respondingIncidents,
      resolved: resolvedIncidents,
      cancelled: cancelledIncidents,
    },
  };
};

/**
 * Admin review incident - move from "reported" to "authority_review"
 */
export const reviewIncident = async (incidentId, adminId, notes) => {
  const incident = await Incident.findById(incidentId);
  if (!incident) {
    throw new Error('Incident not found');
  }

  if (incident.status !== 'reported') {
    throw new Error('Only reported incidents can be reviewed');
  }

  incident.status = 'authority_review';
  incident.adminReviewed = true;
  incident.adminReviewedBy = adminId;
  incident.verificationNotes = notes || incident.verificationNotes;
  await incident.save();

  await incident.populate('reportedBy', 'name email userId');
  return incident;
};

/**
 * Authority verify incident - approve or reject
 * decision: "yes" (approve) | "no" (reject)
 */
export const authorityVerifyIncident = async (incidentId, authorityId, decision, notes) => {
  return runAuthorityVerification(incidentId, authorityId, decision === 'yes', notes);
};

/**
 * Delete incident (admin only - for fake incidents)
 */
export const deleteIncident = async (incidentId, adminId) => {
  const incident = await Incident.findById(incidentId);
  
  if (!incident) {
    throw new Error('Incident not found');
  }

  // Remove incident reference from reporter's incidents
  if (incident.reportedBy) {
    await Citizen.findByIdAndUpdate(incident.reportedBy, {
      $pull: { incidentsReported: incidentId },
    });
  }

  // Delete the incident
  await Incident.findByIdAndDelete(incidentId);

  return { incidentId, deletedBy: adminId };
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

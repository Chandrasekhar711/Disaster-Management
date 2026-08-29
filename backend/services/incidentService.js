import Incident from '../models/Incident.js';
import Citizen from '../models/Citizen.js';

export const createIncident = async (incidentData, userId, userRole = 'citizen') => {
  // If reported by admin or authority, auto-verify and set to responding
  const isPrivilegedUser = userRole === 'admin' || userRole === 'authority';
  
  // Map user role to model name
  const reportedByModelMap = {
    'citizen': 'Citizen',
    'admin': 'Admin',
    'authority': 'Authority',
  };
  
  const incidentPayload = {
    ...incidentData,
    reportedBy: userId,
    reportedByModel: reportedByModelMap[userRole] || 'Citizen',
  };

  // Auto-verify and set to responding for admin/authority reports
  if (isPrivilegedUser) {
    incidentPayload.status = 'responding';
    incidentPayload.adminReviewed = true;
    incidentPayload.authorityVerified = true;
    incidentPayload.verificationDecision = 'yes';
    incidentPayload.verification = {
      status: 'real',
      verifiedBy: userId,
      verifiedByModel: userRole === 'admin' ? 'Admin' : 'Authority',
      verifiedAt: new Date(),
      verificationNotes: 'Auto-verified: Reported by ' + userRole,
      history: [{
        status: 'real',
        verificationNotes: 'Auto-verified: Reported by ' + userRole,
        verifiedBy: userId,
        verifiedAt: new Date(),
      }],
    };
    if (userRole === 'admin') {
      incidentPayload.adminReviewedBy = userId;
    } else {
      incidentPayload.authorityVerifiedBy = userId;
    }
  }

  const incident = new Incident(incidentPayload);

  await incident.save();

  // Update user's reported incidents (only for citizens who track this)
  if (userRole === 'citizen') {
    await Citizen.findByIdAndUpdate(userId, {
      $push: { incidentsReported: incident._id },
    });
  }

  return incident.populate('reportedBy', 'name email phone');
};

export const getIncidentById = async (incidentId) => {
  const incident = await Incident.findByIdAndUpdate(
    incidentId,
    { $inc: { viewCount: 1 } },
    { new: true }
  )
    .populate('reportedBy', 'name email phone')
    .populate('verifiedBy', 'name email')
    .populate('assignedTo.userId', 'name email department')
    .populate('responders', 'name email department')
    .populate('verification.verifiedBy', 'name email role department');

  if (!incident) {
    throw new Error('Incident not found');
  }

  return incident;
};

export const getAllIncidents = async (filters = {}, page = 1, limit = 10, userRole = null) => {
  const query = {};

  // Apply filters only if they are provided
  if (filters.type) query.type = filters.type;
  if (filters.status) query.status = filters.status;
  if (filters.severity) query.severity = filters.severity;
  if (filters.isSOS) query.isSOS = filters.isSOS;

  // Admin users can see ALL incidents without any additional restrictions
  // No need to add role-based filtering for admins

  const skip = (page - 1) * limit;

  const total = await Incident.countDocuments(query);
  const incidents = await Incident.find(query)
    .populate('reportedBy', 'name email phone')
    .populate('assignedTo.userId', 'name email')
    .populate('verification.verifiedBy', 'name email role department')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    incidents,
    total,
    page,
    limit,
  };
};

export const getNearbyIncidents = async (coordinates, maxDistance = 5000) => {
  const incidents = await Incident.findNearby(coordinates, maxDistance)
    .populate('reportedBy', 'name email phone')
    .populate('verification.verifiedBy', 'name email role department')
    .limit(50);

  return incidents;
};

export const updateIncidentStatus = async (incidentId, status, userId) => {
  const updateData = {
    status,
    verifiedBy: status === 'verified' ? userId : undefined,
  };

  // Set respondedAt timestamp when status changes to 'responded'
  if (status === 'responded') {
    updateData.respondedAt = new Date();
  }

  const incident = await Incident.findByIdAndUpdate(
    incidentId,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('reportedBy verifiedBy assignedTo.userId')
    .populate('verification.verifiedBy', 'name email role department');

  if (!incident) {
    throw new Error('Incident not found');
  }

  return incident;
};

export const assignResponder = async (incidentId, userId, department) => {
  const incident = await Incident.findByIdAndUpdate(
    incidentId,
    {
      $push: {
        assignedTo: { userId, department },
        responders: userId,
      },
    },
    { new: true }
  )
    .populate('assignedTo.userId responders', 'name email department')
    .populate('verification.verifiedBy', 'name email role department');

  if (!incident) {
    throw new Error('Incident not found');
  }

  return incident;
};

export const addCommentToIncident = async (incidentId, userId, comment) => {
  const incident = await Incident.findByIdAndUpdate(
    incidentId,
    {
      $push: {
        comments: {
          author: userId,
          text: comment,
        },
      },
    },
    { new: true }
  )
    .populate('comments.author', 'name email role')
    .populate('verification.verifiedBy', 'name email role department');

  if (!incident) {
    throw new Error('Incident not found');
  }

  return incident;
};

export const triggerSOS = async (incidentId, userId) => {
  const incident = await Incident.findByIdAndUpdate(
    incidentId,
    {
      isSOS: true,
      sosTriggeredAt: new Date(),
      sosTriggeredBy: userId,
      severity: 'critical',
    },
    { new: true }
  )
    .populate('reportedBy sosTriggeredBy', 'name email phone')
    .populate('verification.verifiedBy', 'name email role department');

  if (!incident) {
    throw new Error('Incident not found');
  }

  return incident;
};

export const verifyIncident = async (incidentId, userId, isReal, notes = '') => {
  const incident = await Incident.findById(incidentId)
    .populate('reportedBy', 'name email phone')
    .populate('assignedTo.userId', 'name email department');

  if (!incident) {
    throw new Error('Incident not found');
  }

  if (incident.verification?.status && incident.verification.status !== 'pending') {
    throw new Error('Incident verification already completed');
  }

  if (incident.status !== 'authority_review') {
    throw new Error('Incident is not ready for authority verification');
  }

  const verificationStatus = isReal ? 'real' : 'fake';
  const verifiedAt = new Date();
  const trimmedNotes = (notes || '').trim();

  if (!incident.verification) {
    incident.verification = {};
  }
  if (!Array.isArray(incident.verification.history)) {
    incident.verification.history = [];
  }

  incident.verification.status = verificationStatus;
  incident.verification.verifiedBy = userId;
  incident.verification.verificationNotes = trimmedNotes;
  incident.verification.verifiedAt = verifiedAt;
  incident.verification.history = [
    {
      status: verificationStatus,
      verificationNotes: trimmedNotes,
      verifiedBy: userId,
      verifiedAt,
    },
    ...incident.verification.history,
  ].slice(0, 10);

  incident.authorityVerified = true;
  incident.authorityVerifiedBy = userId;
  incident.verificationDecision = isReal ? 'yes' : 'no';
  incident.verificationNotes = trimmedNotes;
  incident.verifiedBy = userId;
  incident.status = verificationStatus === 'real' ? 'responding' : 'cancelled';
  incident.updatedAt = verifiedAt;

  await incident.save();
  await incident.populate('verification.verifiedBy', 'name email role department');

  return incident;
};

export const getAssignedIncidents = async (userId) => {
  const incidents = await Incident.find({
    'assignedTo.userId': userId,
  })
    .populate('reportedBy', 'name email phone')
    .populate('verification.verifiedBy', 'name email role department')
    .populate('verification.history.verifiedBy', 'name email role department')
    .populate('assignedTo.userId', 'name email department')
    .sort({ createdAt: -1 });

  return incidents;
};

export const getIncidentsByReporter = async (userId) => {
  const incidents = await Incident.find({ reportedBy: userId })
    .populate('reportedBy', 'name email phone')
    .populate('verification.verifiedBy', 'name email role department')
    .sort({ createdAt: -1 });

  return incidents;
};

export const getIncidentStatistics = async () => {
  const stats = await Incident.getStatistics();
  const byStatus = await Incident.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const bySeverity = await Incident.aggregate([
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 },
      },
    },
  ]);

  const totalIncidents = await Incident.countDocuments();
  const sosAlerts = await Incident.countDocuments({ isSOS: true });
  const resolvedIncidents = await Incident.countDocuments({
    status: 'resolved',
  });

  return {
    total: totalIncidents,
    sosAlerts,
    resolved: resolvedIncidents,
    byType: stats,
    byStatus: byStatus,
    bySeverity: bySeverity,
  };
};

export const deactivateSOS = async (incidentId, userId) => {
  const incident = await Incident.findByIdAndUpdate(
    incidentId,
    {
      isSOS: false,
      sosDeactivatedAt: new Date(),
      sosDeactivatedBy: userId,
    },
    { new: true }
  )
    .populate('reportedBy', 'name email phone')
    .populate('verification.verifiedBy', 'name email role department');

  if (!incident) {
    throw new Error('Incident not found');
  }

  return incident;
};

export default {
  createIncident,
  getIncidentById,
  getAllIncidents,
  getNearbyIncidents,
  updateIncidentStatus,
  assignResponder,
  addCommentToIncident,
  triggerSOS,
  verifyIncident,
  getAssignedIncidents,
  getIncidentsByReporter,
  getIncidentStatistics,
  deactivateSOS,
};

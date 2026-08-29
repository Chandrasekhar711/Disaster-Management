import { successResponse, errorResponse, paginatedResponse } from '../utils/responseHandler.js';
import * as incidentService from '../services/incidentService.js';
import { verifyImageAuthenticity, determineRoutingDestination } from '../services/aiVerificationService.js';
import { sendIncidentWhatsAppAlert } from '../services/whatsappService.js';
import { getMediaUrl } from '../middleware/upload.js';
import Incident from '../models/Incident.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sendActiveIncidentWhatsAppAlert = async (incident, reason) => {
  if (!incident) {
    return;
  }

  const shouldSend = incident.isSOS || incident.severity === 'critical' || incident.status === 'responding';
  if (!shouldSend) {
    return;
  }

  try {
    const claimed = await Incident.findOneAndUpdate(
      {
        _id: incident._id,
        $or: [
          { whatsappAlertSentAt: { $exists: false } },
          { whatsappAlertSentAt: null },
        ],
      },
      {
        $set: {
          whatsappAlertSentAt: new Date(),
          whatsappAlertReason: reason,
        },
      },
      { new: false }
    );

    if (!claimed) {
      console.log(`[whatsapp] ${reason} alert skipped: already sent for incident ${incident._id}`);
      return;
    }

    const alertResult = await sendIncidentWhatsAppAlert(incident, reason);
    console.log(`[whatsapp] ${reason} alert:`, alertResult);
  } catch (error) {
    console.error(`[whatsapp] ${reason} alert failed before send:`, error.message);
  }
};

export const createIncident = async (req, res, next) => {
  try {
    const userRole = req.user.role || 'citizen';
    
    // Handle file uploads if present
    let incidentData = req.body;
    
    // If incidentData is sent as a JSON string (when using FormData)
    if (typeof req.body.incidentData === 'string') {
      try {
        incidentData = JSON.parse(req.body.incidentData);
      } catch (e) {
        // Body is already an object, use as is
      }
    }

    // Process uploaded files if any
    if (req.files && req.files.length > 0) {
      const mediaFiles = req.files.map(file => ({
        url: getMediaUrl(file.filename),
        type: file.mimetype.startsWith('image') ? 'image' : 'video',
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
      }));

      incidentData = {
        ...incidentData,
        media: mediaFiles,
        uploadMethod: 'file_upload',
        routingDestination: 'verification_team', // File uploads go to verification team
      };
    }

    const incident = await incidentService.createIncident(incidentData, req.user.id, userRole);
    
    // Emit Socket.IO event for new incident
    const io = req.app.get('io');
    const rooms = req.app.get('socketRooms');
    if (io) {
      io.to(rooms.incidentUpdates).emit('incident-created', incident);
      io.to(rooms.incidentUpdates).emit('new-incident', incident);
      io.to(rooms.liveMap).emit('incident-created', incident);
    }

    // Send WhatsApp immediately when the incident is active/responding or marked SOS/critical.
    sendActiveIncidentWhatsAppAlert(incident, 'incident-created');

    let message;
    if (userRole === 'admin' || userRole === 'authority') {
      message = 'Incident reported and automatically sent to responding';
    } else if (incidentData.uploadMethod === 'file_upload') {
      message = 'Incident reported with media and sent to Verification Team';
    } else {
      message = 'Incident reported successfully';
    }

    return successResponse(res, incident, message, 201);
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const getIncidentById = async (req, res, next) => {
  try {
    const incident = await incidentService.getIncidentById(req.params.id);
    return successResponse(res, incident, 'Incident retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 404);
  }
};

export const getAllIncidents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const filters = {
      type: req.query.type,
      status: req.query.status,
      severity: req.query.severity,
      isSOS: req.query.isSOS === 'true',
    };

    // Admin users can see all incidents without restrictions
    const userRole = req.user?.role;
    
    console.log('getAllIncidents called - filters:', filters);
    console.log('getAllIncidents - page:', page, 'limit:', limit);
    console.log('getAllIncidents - userRole:', userRole);
    
    const result = await incidentService.getAllIncidents(filters, page, limit, userRole);

    console.log('getAllIncidents - total incidents:', result.total);
    console.log('getAllIncidents - returned incidents:', result.incidents.length);

    return paginatedResponse(
      res,
      result.incidents,
      result.page,
      result.limit,
      result.total,
      'Incidents retrieved successfully'
    );
  } catch (error) {
    console.error('getAllIncidents error:', error);
    return errorResponse(res, error.message, 400);
  }
};

export const getNearbyIncidents = async (req, res, next) => {
  try {
    const { longitude, latitude, radius } = req.query;
    const coordinates = [parseFloat(longitude), parseFloat(latitude)];
    const maxDistance = parseInt(radius, 10) || 5000;

    const incidents = await incidentService.getNearbyIncidents(coordinates, maxDistance);
    return successResponse(res, incidents, 'Nearby incidents retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const updateIncidentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const incident = await incidentService.updateIncidentStatus(
      req.params.id,
      status,
      req.user.id
    );

    // Emit Socket.IO event for status update
    const io = req.app.get('io');
    const rooms = req.app.get('socketRooms');
    if (io) {
      io.to(rooms.incidentUpdates).emit('incident-update', incident);
      io.to(rooms.liveMap).emit('incident-update', incident);
    }

    sendActiveIncidentWhatsAppAlert(incident, 'incident-status-updated');

    return successResponse(res, incident, 'Incident status updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const assignResponder = async (req, res, next) => {
  try {
    const { userId, department } = req.body;
    const incident = await incidentService.assignResponder(req.params.id, userId, department);

    // Emit Socket.IO event for assignment
    const io = req.app.get('io');
    const rooms = req.app.get('socketRooms');
    if (io) {
      io.to(rooms.incidentUpdates).emit('incident-assigned', incident);
    }

    return successResponse(res, incident, 'Responder assigned successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const incident = await incidentService.addCommentToIncident(
      req.params.id,
      req.user.id,
      comment
    );
    return successResponse(res, incident, 'Comment added successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const triggerSOS = async (req, res, next) => {
  try {
    const incident = await incidentService.triggerSOS(req.params.id, req.user.id);

    // Emit Socket.IO event for SOS alert
    const io = req.app.get('io');
    const rooms = req.app.get('socketRooms');
    if (io) {
      io.to(rooms.sosAlerts).emit('sos-alert', incident);
      io.to(rooms.liveMap).emit('sos-alert', incident);
    }

    sendActiveIncidentWhatsAppAlert(incident, 'sos-triggered');

    return successResponse(res, incident, 'SOS triggered successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const verifyIncident = async (req, res, next) => {
  try {
    const { isReal, notes } = req.body;
    const incident = await incidentService.verifyIncident(
      req.params.id,
      req.user.id,
      isReal,
      notes
    );

    // Emit Socket.IO event for verification
    const io = req.app.get('io');
    const rooms = req.app.get('socketRooms');
    if (io) {
      io.to(rooms.incidentUpdates).emit('incident-verified', incident);
      io.to(rooms.liveMap).emit('incident-verified', incident);
    }

    if (incident.status === 'responding') {
      sendActiveIncidentWhatsAppAlert(incident, 'incident-verified');
    }

    return successResponse(res, incident, 'Incident verified successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const getAssignedIncidents = async (req, res, next) => {
  try {
    const incidents = await incidentService.getAssignedIncidents(req.user.id);
    return successResponse(res, incidents, 'Assigned incidents retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const getIncidentsByReporter = async (req, res, next) => {
  try {
    const incidents = await incidentService.getIncidentsByReporter(req.user.id);
    return successResponse(res, incidents, 'User reported incidents retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const getStatistics = async (req, res, next) => {
  try {
    const stats = await incidentService.getIncidentStatistics();
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const deactivateSOS = async (req, res, next) => {
  try {
    const incident = await incidentService.deactivateSOS(req.params.id, req.user.id);

    // Emit Socket.IO event for SOS deactivation
    const io = req.app.get('io');
    const rooms = req.app.get('socketRooms');
    if (io) {
      io.to(rooms.incidentUpdates).emit('incident:update', incident);
      io.to(rooms.liveMap).emit('incident:update', incident);
    }

    return successResponse(res, incident, 'SOS deactivated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Create incident with camera capture - includes AI verification
 */
export const createIncidentWithCameraCapture = async (req, res, next) => {
  try {
    const userRole = req.user.role || 'citizen';
    
    if (!req.file) {
      return errorResponse(res, 'Camera capture image is required', 400);
    }

    // Get incident data - it may already be parsed by middleware or still be a JSON string
    let incidentData;
    if (req.body.incidentData && typeof req.body.incidentData === 'string') {
      try {
        incidentData = JSON.parse(req.body.incidentData);
      } catch (e) {
        return errorResponse(res, 'Invalid incident data format', 400);
      }
    } else if (req.body.title) {
      // Data was already parsed by middleware
      incidentData = {
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        customType: req.body.customType,
        severity: req.body.severity,
        location: req.body.location,
      };
    } else {
      return errorResponse(res, 'Incident data is required', 400);
    }

    // Perform AI verification on the captured image
    console.log('Starting AI verification for camera capture...');
    const aiResult = await verifyImageAuthenticity(req.file.buffer, req.file.mimetype);
    console.log('AI Verification Result:', aiResult);

    // Determine routing destination based on AI score
    const routingDestination = determineRoutingDestination(
      aiResult.score,
      'camera_capture'
    );

    // Save the image to disk
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'incidents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filename = `camera-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);

    // Prepare incident payload with media and AI verification data
    const incidentPayload = {
      ...incidentData,
      uploadMethod: 'camera_capture',
      aiVerification: {
        isVerified: true,
        score: aiResult.score,
        isRealImage: aiResult.isRealImage,
        verifiedAt: aiResult.verifiedAt,
        rawResponse: aiResult.details,
      },
      routingDestination,
      media: [{
        url: getMediaUrl(filename),
        type: 'image',
        filename,
        originalName: req.file.originalname || 'camera-capture.jpg',
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date(),
      }],
    };

    // All AI-verified camera captures go through the verification team.
    incidentPayload.status = 'reported';

    const incident = await incidentService.createIncident(
      incidentPayload,
      req.user.id,
      userRole
    );

    // Emit Socket.IO event
    const io = req.app.get('io');
    const rooms = req.app.get('socketRooms');
    if (io) {
      io.to(rooms.incidentUpdates).emit('incident-created', incident);
      io.to(rooms.incidentUpdates).emit('new-incident', incident);
      io.to(rooms.liveMap).emit('incident-created', incident);
    }

    sendActiveIncidentWhatsAppAlert(incident, 'incident-created-camera');

    const message = `Incident sent to Verification Team for review (AI Score: ${aiResult.score}%)`;

    return successResponse(res, {
      incident,
      aiVerification: {
        score: aiResult.score,
        isRealImage: aiResult.isRealImage,
        routingDestination,
        provider: aiResult.provider,
      },
    }, message, 201);
  } catch (error) {
    console.error('Create incident with camera capture error:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Create incident without any media
 */
export const createIncidentWithoutMedia = async (req, res, next) => {
  try {
    const userRole = req.user.role || 'citizen';

    const incidentPayload = {
      ...req.body,
      uploadMethod: 'none',
      routingDestination: 'verification_team',
      media: [],
    };

    const incident = await incidentService.createIncident(
      incidentPayload,
      req.user.id,
      userRole
    );

    // Emit Socket.IO event
    const io = req.app.get('io');
    const rooms = req.app.get('socketRooms');
    if (io) {
      io.to(rooms.incidentUpdates).emit('incident-created', incident);
      io.to(rooms.incidentUpdates).emit('new-incident', incident);
      io.to(rooms.liveMap).emit('incident-created', incident);
    }

    sendActiveIncidentWhatsAppAlert(incident, 'incident-created-no-media');

    return successResponse(
      res,
      incident,
      'Incident reported and sent to Verification Team for review',
      201
    );
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Standalone image verification endpoint
 */
export const verifyImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Image file is required for verification', 400);
    }

    console.log('Starting standalone AI verification...');
    const aiResult = await verifyImageAuthenticity(req.file.buffer, req.file.mimetype);
    console.log('AI Verification Result:', aiResult);

    return successResponse(res, {
      score: aiResult.score,
      isRealImage: aiResult.isRealImage,
      confidence: aiResult.confidence,
      provider: aiResult.provider,
      verifiedAt: aiResult.verifiedAt,
      routingRecommendation: 'verification_team',
    }, 'Image verification completed');
  } catch (error) {
    console.error('Image verification error:', error);
    return errorResponse(res, error.message, 400);
  }
};

export default {
  createIncident,
  getIncidentById,
  getAllIncidents,
  getNearbyIncidents,
  updateIncidentStatus,
  assignResponder,
  addComment,
  triggerSOS,
  verifyIncident,
  getAssignedIncidents,
  getIncidentsByReporter,
  getStatistics,
  deactivateSOS,
  createIncidentWithCameraCapture,
  createIncidentWithoutMedia,
  verifyImage,
};

import express from 'express';
import {
  validateIncidentCreate,
  validateIncidentUpdate,
  validatePagination,
  validateGeoLocation,
} from '../middleware/validation.js';
import { protect, authorize, requireVerified } from '../middleware/auth.js';
import { uploadMedia, uploadCameraCapture, handleMulterError } from '../middleware/upload.js';
import * as incidentController from '../controllers/incidentController.js';

const router = express.Router();

// Middleware to parse incidentData from FormData
const parseIncidentData = (req, res, next) => {
  if (req.body.incidentData && typeof req.body.incidentData === 'string') {
    try {
      const parsed = JSON.parse(req.body.incidentData);
      req.body = { ...req.body, ...parsed };
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid incident data format',
      });
    }
  }
  next();
};

// Get incidents reported by the logged-in user
router.get(
  '/my-reports',
  protect,
  incidentController.getIncidentsByReporter
);

// Public routes
router.get('/', validatePagination, incidentController.getAllIncidents);
router.get('/nearby', validateGeoLocation, incidentController.getNearbyIncidents);
router.get('/stats', incidentController.getStatistics);
router.get('/:id', incidentController.getIncidentById);

// Protected routes - Standard incident creation (with optional file upload)
router.post(
  '/',
  protect,
  uploadMedia.array('media', 5),
  handleMulterError,
  parseIncidentData,
  validateIncidentCreate,
  incidentController.createIncident
);

// Media Upload Routes
// Route for creating incident with camera capture (with AI verification)
router.post(
  '/with-camera-capture',
  protect,
  uploadCameraCapture.single('cameraImage'),
  handleMulterError,
  parseIncidentData,
  incidentController.createIncidentWithCameraCapture
);

// Route for creating incident without any media
router.post(
  '/without-media',
  protect,
  validateIncidentCreate,
  incidentController.createIncidentWithoutMedia
);

// AI Verification endpoint (for standalone verification)
router.post(
  '/verify-image',
  protect,
  uploadCameraCapture.single('image'),
  handleMulterError,
  incidentController.verifyImage
);

// Authority routes - View assigned incidents
router.get(
  '/authority/assigned',
  protect,
  authorize('authority', 'admin'),
  incidentController.getAssignedIncidents
);

// Authority routes - Verify incident (Real/Fake)
router.post(
  '/:id/verify',
  protect,
  authorize('authority', 'admin'),
  requireVerified,
  incidentController.verifyIncident
);

router.put(
  '/:id/status',
  protect,
  authorize('authority', 'admin'),
  requireVerified,
  validateIncidentUpdate,
  incidentController.updateIncidentStatus
);

router.post(
  '/:id/assign',
  protect,
  authorize('authority', 'admin'),
  requireVerified,
  incidentController.assignResponder
);

router.post('/:id/comment', protect, incidentController.addComment);
router.post('/:id/sos', protect, incidentController.triggerSOS);
router.put('/:id/sos/deactivate', protect, authorize('admin'), incidentController.deactivateSOS);

export default router;

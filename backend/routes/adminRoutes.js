import express from 'express';
import { protect, authorize, requireAdmin } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// All admin routes are protected and require admin role
router.use(protect, requireAdmin);

// Dashboard stats
router.get('/stats', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getAllUsers);
router.post('/users/authority', adminController.createAuthorityOfficer);
router.get('/users/authority', adminController.getAuthorityOfficers);
router.put('/users/:userId/verify', adminController.verifyAuthorityOfficer);
router.put('/users/:userId/deactivate', adminController.deactivateUser);
router.delete('/users/:userId', adminController.deleteUser);

// Incident assignment
router.post('/incidents/assign', adminController.assignIncidentToOfficer);

// Incident review workflow
router.put('/incidents/:incidentId/review', adminController.reviewIncident);
router.put('/incidents/:incidentId/verify', adminController.authorityVerifyIncident);

// Delete fake incident (admin only)
router.delete('/incidents/:incidentId', adminController.deleteIncident);

export default router;

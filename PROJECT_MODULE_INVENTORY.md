# IMSD — COMPLETE PROJECT MODULE INVENTORY

**System:** Disaster Management and Emergency Alert System (IMSD)  
**Stack:** React + Vite + TailwindCSS (Frontend) | Node.js + Express + Socket.IO (Backend) | MongoDB Atlas (Database)  
**Deployment Target:** Vercel (Frontend) + Render (Backend) + MongoDB Atlas (Database)

---

## 1. COMPLETE MODULE INVENTORY

---

### MODULE 1: AUTHENTICATION & ACCESS CONTROL (RBAC)
* **Purpose:** Multi-role user authentication, secure registration, credential hashing with bcryptjs, and JWT generation & validation across Citizens, Authorities, and Admins.
* **Frontend Files:**
  * `frontend/src/pages/LoginPage.jsx`
  * `frontend/src/pages/RegisterPage.jsx`
  * `frontend/src/components/ProtectedRoute.jsx`
  * `frontend/src/utils/auth.js`
  * `frontend/src/context/store.js`
  * `frontend/src/services/apiClient.js`
* **Backend Files:**
  * `backend/routes/authRoutes.js`
  * `backend/controllers/authController.js`
  * `backend/services/authService.js`
  * `backend/middleware/auth.js`
  * `backend/middleware/validation.js`
  * `backend/utils/tokenUtils.js`
  * `backend/utils/ensureDefaultAdmin.js`
* **API Endpoints:**
  * `POST /api/auth/register` (Citizen public registration)
  * `POST /api/auth/login` (Universal login for Citizen, Authority, Admin)
  * `GET /api/auth/profile` (Protected - authenticated user profile)
  * `PUT /api/auth/profile` (Protected - update profile details & location)
  * `POST /api/auth/logout` (Protected - clear session cookie & token)
* **Database Models:**
  * `backend/models/Admin.js`
  * `backend/models/Authority.js`
  * `backend/models/Citizen.js`
  * `backend/models/User.js` (legacy support/migration compatible)
* **Dependencies:** `jsonwebtoken`, `bcryptjs`, `express-validator`, `zustand`, `axios`
* **Environment Variables:** `JWT_SECRET`, `JWT_EXPIRE`, `DEFAULT_ADMIN_*`
* **Real-time Requirements:** User-specific socket room subscription (`subscribe-user`)
* **Deployment Considerations:** Cookies configured with `secure: process.env.NODE_ENV === 'production'`; bearer token stored in localStorage for SPA compatibility across domains.
* **Test Status:** PASS

---

### MODULE 2: CITIZEN REPORTING & DASHBOARD MODULE
* **Purpose:** Allows citizens to report emergencies (floods, fires, accidents, earthquakes, hazards, other custom types), capture location via GPS/manual map picker, attach media evidence or live camera captures, view incident history, tracking, and trigger emergency SOS.
* **Frontend Files:**
  * `frontend/src/pages/ReportIncidentPage.jsx`
  * `frontend/src/pages/DashboardPage.jsx`
  * `frontend/src/pages/MyReports.jsx`
  * `frontend/src/pages/IncidentDetailsPage.jsx`
  * `frontend/src/components/CameraCapture.jsx`
  * `frontend/src/components/IncidentCard.jsx`
* **Backend Files:**
  * `backend/routes/incidentRoutes.js`
  * `backend/controllers/incidentController.js`
  * `backend/services/incidentService.js`
  * `backend/middleware/upload.js`
* **API Endpoints:**
  * `POST /api/incidents` (Report incident with multipart files)
  * `POST /api/incidents/without-media` (Report text & location incident)
  * `POST /api/incidents/with-camera-capture` (Report with live camera + AI verification)
  * `GET /api/incidents/my-reports` (Fetch all reports by logged-in citizen)
  * `GET /api/incidents/:id` (Fetch detailed incident info with comments & status history)
  * `POST /api/incidents/:id/comment` (Add comment/update to incident)
  * `POST /api/incidents/:id/sos` (Trigger critical SOS alert)
* **Database Models:** `Citizen`, `Incident`
* **Dependencies:** `leaflet`, `react-leaflet`, `multer`, `axios`, `date-fns`
* **Real-time Requirements:** Emits `incident-created`, `new-incident`, `sos-alert` via Socket.IO
* **Deployment Considerations:** Max file upload limits (50MB uploads, 10MB camera), OpenStreetMap Nominatim reverse geocoding fallback.
* **Test Status:** PASS

---

### MODULE 3: AUTHORITY DASHBOARD & RESPONDER MODULE
* **Purpose:** Allows first-responder department officers (Police, Fire, Medical, Rescue, Civil Defense) to monitor incoming emergency alerts in real-time, verify reports, update status (responding, responded, resolved), assign personnel, and add operational updates.
* **Frontend Files:**
  * `frontend/src/pages/AuthorityDashboard.jsx`
  * `frontend/src/pages/IncidentDetailsPage.jsx`
* **Backend Files:**
  * `backend/routes/incidentRoutes.js`
  * `backend/controllers/incidentController.js`
  * `backend/services/incidentService.js`
* **API Endpoints:**
  * `GET /api/incidents/authority/assigned` (Incidents assigned to officer)
  * `POST /api/incidents/:id/verify` (Verify as real or fake with notes)
  * `PUT /api/incidents/:id/status` (Update status: responding, responded, resolved)
  * `POST /api/incidents/:id/assign` (Assign responder to incident)
* **Database Models:** `Authority`, `Incident`
* **Real-time Requirements:** Listens to `incident:updates`, `incident-created`, `incident-update`, `sos:alerts`
* **Test Status:** PASS

---

### MODULE 4: ADMIN MANAGEMENT PANEL
* **Purpose:** System-level oversight: Officer creation and verification approval, citizen and authority account deactivation/deletion, reviewing reported incidents, deleting fraudulent submissions, system-wide analytics, and audit tracking.
* **Frontend Files:**
  * `frontend/src/pages/AdminPanel.jsx`
  * `frontend/src/pages/AnalyticsPage.jsx`
* **Backend Files:**
  * `backend/routes/adminRoutes.js`
  * `backend/controllers/adminController.js`
  * `backend/services/adminService.js`
  * `backend/utils/ensureDefaultAdmin.js`
* **API Endpoints:**
  * `GET /api/admin/stats` (Platform KPIs and user/incident counts)
  * `GET /api/admin/users` (Paginated list of all users with role filtering)
  * `POST /api/admin/users/authority` (Provision verified/unverified authority accounts)
  * `GET /api/admin/users/authority` (List authority officers)
  * `PUT /api/admin/users/:userId/verify` (Approve authority account)
  * `PUT /api/admin/users/:userId/deactivate` (Deactivate user account)
  * `DELETE /api/admin/users/:userId` (Delete user account)
  * `POST /api/admin/incidents/assign` (Direct dispatch assignment)
  * `PUT /api/admin/incidents/:incidentId/review` (Admin review workflow)
  * `PUT /api/admin/incidents/:incidentId/verify` (Admin verification override)
  * `DELETE /api/admin/incidents/:incidentId` (Delete fake incident)
* **Database Models:** `Admin`, `Authority`, `Citizen`, `Incident`
* **Test Status:** PASS

---

### MODULE 5: INTERACTIVE MAP & GEOLOCATION MODULE
* **Purpose:** Public & authenticated live map views displaying real-time incident pins, severity color coding, user current location, radius-based nearby query filtering, and interactive popup cards.
* **Frontend Files:**
  * `frontend/src/pages/PublicMapPage.jsx`
  * `frontend/src/pages/MapPage.jsx`
* **Backend Files:**
  * `backend/models/Incident.js` (`2dsphere` indexes)
  * `backend/controllers/incidentController.js` (`getNearbyIncidents`)
* **API Endpoints:**
  * `GET /api/incidents` (All incidents with coordinates)
  * `GET /api/incidents/nearby?longitude=X&latitude=Y&radius=Z` (MongoDB `$near` query)
* **Database Indexes:** `location: '2dsphere'` on `Incident`, `Citizen`, `Authority`, `User`
* **Test Status:** PASS

---

### MODULE 6: AI IMAGE VERIFICATION & AUTHENTICITY MODULE
* **Purpose:** Analyzes evidence submitted via live camera captures to detect AI-generated synthetic/deepfake images and compute an authenticity score. Routes reports to human verification or automated response queues.
* **Backend Files:**
  * `backend/services/aiVerificationService.js`
  * `backend/controllers/incidentController.js` (`createIncidentWithCameraCapture`, `verifyImage`)
* **External Providers:** Sightengine AI Detection API, Hugging Face AI-image-detector model, with simulated realistic verification fallback.
* **Environment Variables:** `SIGHTENGINE_API_USER`, `SIGHTENGINE_API_SECRET`, `HUGGINGFACE_API_KEY`
* **Test Status:** PASS

---

### MODULE 7: TWILIO & WHATSAPP EMERGENCY ALERT MODULE
* **Purpose:** Dispatches instant WhatsApp notifications with formatted Markdown emergency instructions, severity indicators, and location timestamps directly to designated responder WhatsApp numbers whenever a critical/SOS incident is created or updated.
* **Backend Files:**
  * `backend/services/whatsappService.js`
  * `backend/controllers/incidentController.js` (`sendActiveIncidentWhatsAppAlert`)
* **External Services:** Twilio Messaging API (WhatsApp Sandbox / Direct WhatsApp)
* **Environment Variables:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_WHATSAPP_FROM`, `WHATSAPP_ALERT_RECIPIENTS`
* **Test Status:** PASS (Graceful degradation if credentials omitted)

---

### MODULE 8: REAL-TIME WEBSOCKET (SOCKET.IO) MODULE
* **Purpose:** Provides bidirectional real-time push events between server and connected clients for instant notifications, new incident alerts, SOS broadcasts, live map marker changes, and status updates.
* **Socket Rooms:**
  * `global:notifications` (System broadcasts)
  * `incident:updates` (Live status changes)
  * `sos:alerts` (Urgent SOS triggers)
  * `map:live` (Live map streaming)
  * `user:<userId>` (Direct user notification stream)
* **Frontend Files:**
  * `frontend/src/services/socket.js`
* **Backend Files:**
  * `backend/config/socket.js`
  * `backend/server.js`
* **Test Status:** PASS

---

### MODULE 9: ANALYTICS & REPORTING MODULE
* **Purpose:** Computes and visualizes real-time metrics including total incidents, active vs resolved count, SOS emergency percentage, severity breakdowns, and disaster type distributions using Recharts charts.
* **Frontend Files:**
  * `frontend/src/pages/AnalyticsPage.jsx`
* **Backend Files:**
  * `backend/controllers/incidentController.js` (`getStatistics`)
  * `backend/services/incidentService.js` (`getIncidentStatistics`)
* **API Endpoints:**
  * `GET /api/incidents/stats`
  * `GET /api/admin/stats`
* **Test Status:** PASS

---

# IMSD — Production Deployment Checklist

## DATABASE (MongoDB Atlas)

- [x] MongoDB Atlas cluster created (M0 Free Tier or higher)
- [x] Database user created with readWriteAnyDatabase or dbAdmin permissions
- [x] Network access configured (`0.0.0.0/0` allowed for Render dynamic IPs)
- [x] Connection string formatted with database name (`/dm-eas?retryWrites=true&w=majority`)
- [x] `MONGODB_URI` environment variable verified
- [x] `2dsphere` geospatial indexes tested for location queries
- [x] Zero data loss schema validation and migration compatibility verified

## BACKEND (Render Web Service)

- [x] Git repository initialized and clean commit created
- [x] Render Web Service configured:
  - **Root Directory:** `backend`
  - **Runtime:** `Node`
  - **Build Command:** `npm install`
  - **Start Command:** `npm start`
- [x] Dynamic PORT binding (`process.env.PORT || 5000`) implemented
- [x] Environment variables configured:
  - `NODE_ENV=production`
  - `PORT=10000`
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `JWT_EXPIRE=7d`
  - `FRONTEND_URL`
  - `DEFAULT_ADMIN_*` seed variables
- [x] Health check endpoint operational (`GET /api/health`)
- [x] REST APIs verified across Auth, Incidents, Admin, and Reports
- [x] CORS configured for Vercel production domain + localhost
- [x] Socket.IO WebSocket server initialized with multi-room broadcasting

## FRONTEND (Vercel SPA)

- [x] Vercel project configuration:
  - **Root Directory:** `frontend`
  - **Framework Preset:** `Vite`
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`
- [x] `npm run build` completes with 0 errors
- [x] `npm run lint` completes with 0 errors
- [x] `vercel.json` SPA rewrite rules verified (`/*` -> `/index.html`)
- [x] Environment variables configured:
  - `VITE_API_URL=https://<your-render-backend>.onrender.com/api`
  - `VITE_SOCKET_URL=https://<your-render-backend>.onrender.com`
- [x] No hardcoded localhost API endpoints in production bundle
- [x] Dynamic media URL resolver handles uploads and cloud assets seamlessly

## FEATURES & MODULES VALIDATION

- [x] **Authentication & RBAC:**
  - Citizen registration (`POST /api/auth/register`)
  - Universal login (`POST /api/auth/login`)
  - JWT token verification and cookie handling
  - Protected routes and role authorization (Admin, Authority, Citizen)
- [x] **Citizen Reporting & Tracking:**
  - Standard text reporting (`POST /api/incidents/without-media`)
  - Media attachment uploads up to 50MB (`POST /api/incidents`)
  - Live camera capture with AI verification (`POST /api/incidents/with-camera-capture`)
  - Incident history and status tracking (`/my-reports`)
  - Emergency SOS trigger (`POST /api/incidents/:id/sos`)
- [x] **Authority Dashboard & Dispatch:**
  - Department queues (Police, Fire, Medical, Rescue, Civil Defense)
  - Incident verification decision (Real / Fake)
  - Status transitions (`reported` -> `authority_review` -> `responding` -> `resolved`)
  - Responder assignment and comment logging
- [x] **Admin Management Panel:**
  - User overview and role filtering
  - Authority officer provisioning and approval (`PUT /api/admin/users/:id/verify`)
  - Incident review override and fake report deletion
  - Real-time platform KPI statistics
- [x] **Interactive Maps & Geolocation:**
  - Leaflet live map visualization
  - Geolocation capture and manual pin placement
  - OpenStreetMap Nominatim reverse geocoding
  - MongoDB `$near` geospatial radius querying
- [x] **AI Authenticity Verification:**
  - Multi-tier pipeline (Sightengine -> Hugging Face -> realistic simulation)
  - Server-side API key protection and graceful error handling
- [x] **Twilio WhatsApp First-Responder Dispatch:**
  - Formatted markdown alert templates with safety instructions
  - Non-blocking asynchronous delivery with error logging
- [x] **Real-time WebSockets (Socket.IO):**
  - Live updates on incident creation, status changes, and SOS alerts
  - Reconnection and room subscription lifecycle

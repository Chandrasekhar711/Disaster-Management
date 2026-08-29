# IMSD Project Detailed Analysis

Date: April 5, 2026

## 1. Project Summary

IMSD is a MERN-based disaster reporting and emergency coordination platform with:
- Role-based workflows (citizen, authority, admin)
- Incident reporting with optional media upload
- AI-assisted verification path for camera-captured images
- Real-time updates via Socket.IO
- Geospatial incident discovery and map visualization

## 2. Technology Stack

### Frontend
- React 18
- Vite 5
- React Router v6
- Zustand (state management)
- Axios (API client)
- Socket.IO client
- Leaflet + react-leaflet (map)
- Recharts (analytics)
- Tailwind CSS

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Multer (media upload)
- Socket.IO server
- Optional AI image verification integrations

## 3. Workspace Structure

Top-level modules:
- backend: APIs, auth, business logic, data models, upload handling
- frontend: UI routes/pages, state store, API client, map/analytics views
- root docs: setup, testing, API, refactoring, architecture notes

Important backend folders:
- config
- controllers
- middleware
- models
- routes
- services
- utils

Important frontend folders:
- components
- context
- pages
- services
- utils

## 4. Backend Architecture Findings

### Route Groups
- /api/auth
- /api/incidents
- /api/admin

### Authentication and Authorization
- JWT-based protection middleware
- Role checks through authorize and admin-specific middleware
- Authority verification gate for sensitive operations

### Data Modeling
- Separate user collections by role:
  - Admin
  - Authority
  - Citizen
- Incident model includes:
  - Geospatial location (2dsphere index)
  - Workflow status and verification state
  - Media metadata
  - SOS fields
  - Assignment and comments

### Incident Workflow Highlights
- Citizen standard reports default toward verification path
- Camera-capture reports run AI authenticity scoring
- High-confidence camera captures can route directly to responding team
- Authority/admin verification updates incident lifecycle

## 5. Frontend Architecture Findings

### Routing
Main routes include:
- public map as default entry
- authentication routes (login/register)
- protected dashboard/report/map/my-reports
- role-gated authority/admin pages

### State and Session
- Zustand auth store persists token in local storage
- Axios interceptor injects bearer token
- Unauthorized responses clear token and redirect to login

### Service Layer
- Centralized API modules for auth, incidents, and admin operations
- Supports multipart media uploads and camera-capture flows

## 6. API Surface Snapshot

### Auth
- register
- login
- profile (get/update)
- logout

### Incident
- list/get/nearby/stats/my-reports
- create (with media, without media, camera capture)
- image verification endpoint
- verify/status/assign/comment/SOS operations

### Admin
- dashboard stats
- user management (including authority creation/verification)
- incident review/assignment/deletion

## 7. Environment Configuration

### Backend .env values
Core values:
- MONGODB_URI
- JWT_SECRET
- PORT
- NODE_ENV
- FRONTEND_URL

Optional integrations:
- email SMTP fields
- AWS S3 fields
- AI provider keys
- default admin seed overrides

### Frontend .env values
- VITE_API_URL
- VITE_SOCKET_URL

## 8. Runtime Validation Result

Validated startup behavior:
- Backend dev server starts correctly from backend folder
- Frontend dev server starts correctly from frontend folder

Observed failure pattern:
- Running npm run dev from workspace root fails because root has no package.json

## 9. Key Risks and Inconsistencies

- Potential Socket.IO event-name drift between emitters and listeners can cause missed live updates.
- Some status labels/filters may not be perfectly aligned between frontend usage and backend enums.
- Some filtering logic is UI-side, which can differ from API-level filtering intent.

## 10. Recommended Next Steps

1. Standardize real-time event names in backend and frontend.
2. Create a shared status constants file for backend and frontend parity.
3. Add a root workspace script (or task) that starts both apps from correct subfolders.
4. Add integration tests for incident lifecycle transitions.
5. Add API contract documentation with request/response examples for all role-specific endpoints.

## 11. Conclusion

The project is functionally rich and has clear layered separation (routes/controllers/services/models in backend and pages/services/store in frontend). The biggest quality gains now come from consistency hardening: event naming, status contracts, and unified startup/developer workflow.

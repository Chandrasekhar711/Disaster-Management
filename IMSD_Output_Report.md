# Integrated Management System for Disasters (IMSD) - Project Report

## CONTENTS

1. ABSTRACT  
2. LIST OF FIGURES  
3. LIST OF TABLES  
4. ACRONYMS  
5. 1. INTRODUCTION  
5.1 1.1 Brief Information about the Project  
5.2 1.2 Motivation and Contribution of Project  
5.3 1.3 Objectives of the Project  
5.4 1.4 Scope of the Project  
6. 2. SYSTEM ANALYSIS  
6.1 2.1 Functional Requirements  
6.2 2.2 Non-Functional Requirements  
6.3 2.3 Requirements Specification  
6.3.1 2.3.1 Minimum Hardware Requirements  
6.3.2 2.3.2 Software Requirements  
7. 3. TECHNOLOGY DESCRIPTION  
7.1 3.1 Programming Language  
7.2 3.2 Framework / Libraries  
7.3 3.3 Database Technology  
7.4 3.4 Tools & IDEs  
8. 4. DATABASE DESIGN  
8.1 4.1 Database Collections  
8.2 4.2 Collection Structure  
8.3 4.3 Keys and Constraints  
8.4 4.4 Collection Relationships  
9. 5. SYSTEM DESIGN  
9.1 5.1 System Architecture  
9.2 5.2 Modules Description  
10. 6. SYSTEM IMPLEMENTATION  
11. 7. CONCLUSION  
12. 8. FUTURE ENHANCEMENTS  
13. 9. REFERENCES  
14. APPENDIX A (API Snapshot)  
15. APPENDIX B (Run Commands)  

---

## ABSTRACT

The Integrated Management System for Disasters (IMSD) is a MERN-stack web platform for disaster reporting, verification, assignment, and response monitoring. The system supports three role-based user groups: citizen, authority, and admin. Citizens report incidents with optional media, authority users verify and update incidents, and admins manage users and incident workflows.

The application combines Express-based APIs, MongoDB geospatial storage, Socket.IO real-time updates, and a React front-end with route protection. It also includes an AI-assisted image verification path for camera-captured incident reports. The system is intended to reduce reporting friction, improve response coordination, and provide visibility into live and historical incident data.

---

## LIST OF FIGURES

1. Frontend Route Map (Public + Protected Pages)  
2. Backend API Layering (Routes -> Controllers -> Services -> Models)  
3. Incident Lifecycle Flow (Reported to Responded/Resolved)  
4. Role-Based Access Flow (Citizen, Authority, Admin)  

## LIST OF TABLES

1. Functional Requirement Matrix  
2. Backend Dependency Stack  
3. Frontend Dependency Stack  
4. Incident Status and Verification States  
5. API Endpoint Summary  

## ACRONYMS

- IMSD: Integrated Management System for Disasters  
- MERN: MongoDB, Express, React, Node.js  
- RBAC: Role-Based Access Control  
- JWT: JSON Web Token  
- API: Application Programming Interface  
- GIS: Geographic Information System  
- SOS: Emergency Alert Flag in Incident Workflow  

---

## 1. INTRODUCTION

### 1.1 Brief Information about the Project

IMSD is organized as a two-application workspace:
- backend: Express API server, authentication, incident workflow, admin operations, sockets, upload handling.
- frontend: React SPA with dashboards, report flows, map views, role-aware navigation, and API integration.

The backend exposes routes under:
- /api/auth
- /api/incidents
- /api/admin

The frontend uses protected routes for authenticated access and role-based access checks for authority/admin features.

### 1.2 Motivation and Contribution of Project

Disaster reporting often suffers from delayed communication and fragmented coordination. IMSD contributes by:
- enabling immediate incident submission by citizens,
- adding structured review and verification by authorities/admins,
- providing real-time updates and map visibility,
- centralizing workflow in a single digital system.

### 1.3 Objectives of the Project

1. Provide reliable incident reporting with location and optional media.
2. Enforce secure RBAC for citizen, authority, and admin operations.
3. Support real-time operational visibility using Socket.IO.
4. Improve decision-making with statistics and map-based context.
5. Keep architecture modular for future scaling.

### 1.4 Scope of the Project

In scope:
- incident creation, listing, review, assignment, verification, and status updates,
- user authentication and profile workflows,
- authority/admin management paths,
- real-time notifications and SOS signaling.

Out of scope (current version):
- native mobile application,
- advanced ML model hosting within the same deployment,
- multi-region deployment automation.

---

## 2. SYSTEM ANALYSIS

### 2.1 Functional Requirements

- User registration and login.
- Profile retrieval and update.
- Incident creation via:
  - standard multipart upload,
  - camera capture flow,
  - no-media path.
- Incident retrieval:
  - list with filters/pagination,
  - get by ID,
  - nearby incidents,
  - personal reports,
  - statistics.
- Authority/admin operations:
  - verify incident authenticity,
  - update incident status,
  - assign responders.
- Admin operations:
  - user listing and management,
  - authority creation and verification,
  - incident review and deletion.
- SOS trigger/deactivation workflow.

### 2.2 Non-Functional Requirements

- Security: JWT, route guards, role authorization.
- Performance: paginated listing and indexed geospatial queries.
- Maintainability: layered backend structure and separated frontend services.
- Availability: independent backend/frontend execution in development.
- Usability: role-specific pages with map and dashboard interfaces.

### 2.3 Requirements Specification

#### 2.3.1 Minimum Hardware Requirements

- Processor: Dual-core CPU or better
- RAM: 8 GB recommended
- Storage: 2 GB free space (project + dependencies)
- Network: Internet for package installation and optional AI API usage

#### 2.3.2 Software Requirements

- Node.js 18+
- npm
- MongoDB (local or remote)
- Modern browser (Chrome/Edge/Firefox)
- Windows PowerShell or terminal equivalent

---

## 3. TECHNOLOGY DESCRIPTION

### 3.1 Programming Language

- JavaScript (ES Modules) for both backend and frontend.

### 3.2 Framework / Libraries

Backend:
- Express, Mongoose, Socket.IO, jsonwebtoken, bcryptjs, multer, express-validator, axios.

Frontend:
- React, React Router, Zustand, Axios, Socket.IO client, Leaflet/react-leaflet, Recharts, Tailwind CSS, Framer Motion.

### 3.3 Database Technology

- MongoDB with Mongoose ODM.
- Incident location stored as GeoJSON Point.
- 2dsphere index used for nearby incident queries.

### 3.4 Tools & IDEs

- Visual Studio Code
- Vite (frontend dev/build toolchain)
- Nodemon (backend development runtime)

---

## 4. DATABASE DESIGN

### 4.1 Database Collections

Primary collections:
- Admin
- Authority
- Citizen
- Incident

### 4.2 Collection Structure

Incident collection includes:
- core fields (title, description, type, severity),
- workflow fields (status, verification, routingDestination),
- location object with coordinates and address,
- media metadata,
- assignment/responders/comments,
- SOS and audit timestamps.

### 4.3 Keys and Constraints

- Mongo ObjectId keys for all collections.
- Enum constraints for incident type, status, severity, and verification states.
- Required validations for essential reporting fields.

### 4.4 Collection Relationships

- Incident.reportedBy uses dynamic model reference (Citizen/Admin/Authority).
- Incident verification and comments use role-based model references.
- Incident assigned responders reference authority users.

---

## 5. SYSTEM DESIGN

### 5.1 System Architecture

- Client-server architecture.
- Frontend SPA calls REST APIs through Axios client.
- Backend emits operational events through Socket.IO rooms.
- MongoDB stores role-specific user documents and incidents.

### 5.2 Modules Description

Backend modules:
- Auth Module
- Incident Module
- Admin Module
- Upload Module
- Socket Module

Frontend modules:
- Auth Pages and ProtectedRoute
- Dashboard and Analytics Views
- Report Incident Flow
- Public/Protected Map Views
- Admin and Authority Panels

---

## 6. SYSTEM IMPLEMENTATION

Implementation highlights:
- API route definitions in backend routes folder.
- Business logic in service layer with controller delegation.
- Middleware chain for auth, validation, upload errors, and exception handling.
- Frontend service layer wraps API endpoints.
- Route guards in frontend enforce authentication and role checks.
- Environment variables support local customization for URLs, DB, and secrets.

Runtime check summary:
- backend npm run dev works from backend folder.
- frontend npm run dev works from frontend folder.
- root-level npm run dev fails by design because there is no root package.json.

---

## 7. CONCLUSION

IMSD successfully implements an end-to-end disaster incident workflow with role-based control, real-time coordination support, and geospatial capabilities. The system architecture is modular and maintainable, and it is suitable for continued feature expansion.

---

## 8. FUTURE ENHANCEMENTS

1. Shared constants package for backend/frontend status and event names.
2. Expanded automated test coverage (unit + integration).
3. Root-level task runner for one-command local startup.
4. Notification escalation policies and audit dashboard enhancements.
5. Deployment automation (CI/CD and environment templates).

---

## 9. REFERENCES

1. Express.js documentation
2. MongoDB and Mongoose documentation
3. React and React Router documentation
4. Socket.IO documentation
5. Leaflet documentation
6. Vite and Tailwind documentation

---

## APPENDIX A (API Snapshot)

Auth:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile
- PUT /api/auth/profile
- POST /api/auth/logout

Incidents:
- GET /api/incidents
- GET /api/incidents/:id
- GET /api/incidents/nearby
- GET /api/incidents/stats
- GET /api/incidents/my-reports
- POST /api/incidents
- POST /api/incidents/without-media
- POST /api/incidents/with-camera-capture
- POST /api/incidents/verify-image
- POST /api/incidents/:id/verify
- PUT /api/incidents/:id/status
- POST /api/incidents/:id/assign
- POST /api/incidents/:id/comment
- POST /api/incidents/:id/sos
- PUT /api/incidents/:id/sos/deactivate

Admin:
- GET /api/admin/stats
- GET /api/admin/users
- GET /api/admin/users/authority
- POST /api/admin/users/authority
- PUT /api/admin/users/:userId/verify
- PUT /api/admin/users/:userId/deactivate
- DELETE /api/admin/users/:userId
- POST /api/admin/incidents/assign
- PUT /api/admin/incidents/:incidentId/review
- PUT /api/admin/incidents/:incidentId/verify
- DELETE /api/admin/incidents/:incidentId

## APPENDIX B (Run Commands)

Backend:
1. cd backend
2. npm install
3. copy .env.example .env
4. npm run dev

Frontend:
1. cd frontend
2. npm install
3. copy .env.example .env.local
4. npm run dev

# DM-EAS : DISASTER MANAGEMENT AND EMERGENCY ALERT SYSTEM

A MERN-based disaster reporting and emergency coordination platform with real-time updates, geospatial incident tracking, and role-based workflows for citizens, authority officers, and administrators.

## Project Analysis Snapshot (April 5, 2026)

This README was rebuilt after a full codebase pass across:
- Backend routes, controllers, services, models, middleware, and startup flow
- Frontend routing, page workflows, API integrations, and socket integration
- Environment/configuration files and local run checks
- Existing project documentation in the repository root

### Current Runtime Status

Verified locally during analysis:
- Backend starts successfully with `npm run dev` on port `5000`
- Frontend starts successfully with `npm run dev` on port `5173`
- MongoDB connection succeeds (`MongoDB Connected: localhost`)
- Default admin seeding check executes on backend start

Important context:
- Running `npm run dev` from the repository root fails (`ENOENT`) because this project has separate `package.json` files under `backend/` and `frontend/`.

## Table of Contents

- [Architecture](#architecture)
- [Core Capabilities](#core-capabilities)
- [Role-Based Workflow](#role-based-workflow)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [Known Gaps and Notes](#known-gaps-and-notes)
- [Documentation Index](#documentation-index)

## Architecture

### Frontend
- React 18 + Vite
- React Router v6 for page routing
- Zustand for app state
- Axios for API client
- Socket.IO client for live updates
- Leaflet + react-leaflet for maps
- Recharts for analytics
- Tailwind CSS for styling

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO server for event broadcasting
- JWT-based authentication
- Role-based route protection middleware
- Multer for media upload handling
- Optional AI-assisted image verification pipeline

### Data Model Design

Users are split into separate MongoDB collections by role:
- `Citizen`
- `Authority`
- `Admin`

Incidents are stored in a dedicated `Incident` collection and reference reporter/verifier dynamically via `refPath` fields.

## Core Capabilities

### Incident Reporting
- Citizens can create incidents with:
  - No media
  - Regular media uploads (images/videos)
  - Camera capture image workflow with AI verification
- Location can be selected from map interaction and reverse geocoded
- Geospatial search supported via MongoDB `2dsphere` indexing

### Verification and Routing
- Admin and authority-reported incidents are auto-marked for response
- Citizen camera-capture reports use AI score-based routing:
  - High confidence real image -> `responding_team`
  - Otherwise -> `verification_team`
- Authority verification decisions classify incidents as real/fake

### Real-Time Features
- Socket rooms for:
  - Incident updates
  - SOS alerts
  - Live map updates
  - Global notifications
- Backend emits operational events for create/update/verify/delete flows

### Admin and Officer Operations
- Admin can:
  - Manage users and authority officers
  - Verify authority accounts
  - Review and assign incidents
  - Delete fake incidents
- Authority officers can:
  - View assigned incidents
  - Mark incidents real/fake
  - Update response progress

## Role-Based Workflow

### Citizen
1. Register/Login (email or user ID)
2. Submit incident report
3. Track own reports (`/incidents/my-reports`)

### Admin
1. Review newly reported incidents
2. Move report to authority review and assign officers
3. Oversee dashboard stats and user verification

### Authority
1. View assigned incidents
2. Verify report authenticity (real/fake)
3. Mark response progress (`responding` -> `responded`)

## Project Structure

```text
IMSD/
|- backend/
|  |- config/              # DB + Socket setup
|  |- controllers/         # HTTP controller layer
|  |- middleware/          # auth, validation, upload, error handling
|  |- models/              # Admin/Authority/Citizen/Incident schemas
|  |- routes/              # auth, incidents, admin route maps
|  |- scripts/             # seed/migration/check utility scripts
|  |- services/            # business logic layer
|  |- utils/               # token + response + default admin helper
|  |- uploads/             # incident media files
|  |- server.js
|  |- package.json
|  |- .env.example
|- frontend/
|  |- src/
|  |  |- components/
|  |  |- context/
|  |  |- pages/
|  |  |- services/
|  |  |- utils/
|  |  |- App.jsx
|  |- package.json
|  |- .env.example
|- README.md
|- QUICK_START.md
|- BACKEND_API.md
|- DATABASE_GUIDE.md
|- TESTING_GUIDE.md
```

## API Overview

Base URL: `http://localhost:5000/api`

### Authentication
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/profile`
- `PUT /auth/profile`
- `POST /auth/logout`

### Incident Operations
- `GET /incidents`
- `GET /incidents/:id`
- `GET /incidents/nearby`
- `GET /incidents/stats`
- `GET /incidents/my-reports`
- `POST /incidents`
- `POST /incidents/without-media`
- `POST /incidents/with-camera-capture`
- `POST /incidents/verify-image`
- `POST /incidents/:id/verify`
- `PUT /incidents/:id/status`
- `POST /incidents/:id/assign`
- `POST /incidents/:id/comment`
- `POST /incidents/:id/sos`
- `PUT /incidents/:id/sos/deactivate`

### Admin Operations
- `GET /admin/stats`
- `GET /admin/users`
- `POST /admin/users/authority`
- `GET /admin/users/authority`
- `PUT /admin/users/:userId/verify`
- `PUT /admin/users/:userId/deactivate`
- `DELETE /admin/users/:userId`
- `POST /admin/incidents/assign`
- `PUT /admin/incidents/:incidentId/review`
- `PUT /admin/incidents/:incidentId/verify`
- `DELETE /admin/incidents/:incidentId`

## Environment Variables

### Backend (`backend/.env`)

Required:
- `MONGODB_URI`
- `JWT_SECRET`
- `PORT`
- `NODE_ENV`
- `FRONTEND_URL`

Supported optional values (from `.env.example` and code):
- `JWT_EXPIRE`
- `MONGODB_TEST_URI`
- `MAX_FILE_SIZE`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_REGION`

AI verification integration (optional, used if configured):
- `SIGHTENGINE_API_USER`
- `SIGHTENGINE_API_SECRET`
- `HUGGINGFACE_API_KEY`

Default admin seed overrides (optional):
- `DEFAULT_ADMIN_NAME`
- `DEFAULT_ADMIN_USERID`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PHONE`
- `DEFAULT_ADMIN_PASSWORD`
- `DEFAULT_ADMIN_DEPARTMENT`

### Frontend (`frontend/.env.local`)
- `VITE_API_URL`
- `VITE_SOCKET_URL`

## Local Setup

### Prerequisites
- Node.js 18+ recommended
- MongoDB running locally or remotely reachable

### 1) Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Backend should run at: `http://localhost:5000`

### 2) Frontend

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Frontend should run at: `http://localhost:5173`

### 3) Health Check

Open:
- `http://localhost:5000/api/health`
- `http://localhost:5173`

### 4) Recommended Terminal Workflow

Use two terminals:

Terminal 1:
```bash
cd backend
npm run dev
```

Terminal 2:
```bash
cd frontend
npm run dev
```

## Known Gaps and Notes

These are important implementation notes identified during analysis:

1. Socket event naming mismatch exists in places.
   - Backend commonly emits `incident-created` and `incident-update`
   - Frontend listener includes `new-incident`
   This can cause missed real-time create events unless event names are aligned.

2. Status vocabulary is not fully consistent between frontend filters and backend enums.
   - Frontend includes values like `verified` in some pages
   - Core backend incident status enum uses: `reported`, `admin_review`, `authority_review`, `responding`, `responded`, `resolved`, `cancelled`

3. Some UI filtering behavior is enforced client-side (for example, responding-only map views), so API and UI filtering intent can diverge.

4. If you see exit code `1` for `npm run dev`, first confirm your current working directory is either `backend/` or `frontend/`.

## Documentation Index

Detailed docs included in this repository:
- `QUICK_START.md`
- `SETUP_GUIDE.md`
- `BACKEND_API.md`
- `DATABASE_GUIDE.md`
- `TESTING_GUIDE.md`
- `AUTHENTICATION_UPDATE_GUIDE.md`
- `AUTHENTICATION_TESTING_GUIDE.md`
- `API_REFERENCE_WORKFLOWS.md`
- `SYSTEM_REFACTOR_GUIDE.md`
- `REFACTORING_CHANGES_SUMMARY.md`
- `PROJECT_SUMMARY.md`
- `PROJECT_INDEX.md`

## License

MIT

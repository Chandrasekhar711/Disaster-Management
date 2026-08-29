# Incident Management System for Districts (IMSD) - Complete Project Report

## TABLE OF CONTENTS

**PAGE NO**

ABSTRACT .............................................................. i
LIST OF FIGURES ..................................................... ii
LIST OF TABLES ...................................................... iii
ACRONYMS ........................................................... iv

1. INTRODUCTION ...................................................... 1
   1.1 Brief Information about the Project ...................... 1
   1.2 Motivation and Contribution of Project ................... 1
   1.3 Objectives of the Project .................................. 1
   1.4 Scope of the Project ...................................... 2

2. SYSTEM ANALYSIS ................................................... 3
   2.1 Functional Requirements .................................... 3
   2.2 Non-Functional Requirements ................................ 4
   2.3 Requirements Specification ................................ 4
      2.3.1 Minimum Hardware Requirements .......................... 4
      2.3.2 Software Requirements .................................. 4

3. TECHNOLOGY DESCRIPTION .......................................... 5
   3.1 Programming Language ....................................... 5
   3.2 Frameworks and Libraries ................................... 5
   3.3 Database Technology ........................................ 6
   3.4 Tools & IDEs .................................................. 7

4. DATABASE DESIGN ................................................... 8
   4.1 Database Collections ....................................... 8
   4.2 Schema Structure ............................................ 8
   4.3 Keys and Constraints ....................................... 9
   4.4 Relationships ............................................... 9

5. SYSTEM DESIGN .................................................... 10
   5.1 System Architecture ........................................ 10
   5.2 Modules Description ........................................ 11

6. SYSTEM IMPLEMENTATION .......................................... 15
7. CONCLUSION ...................................................... 25
8. FUTURE ENHANCEMENTS ............................................ 26
9. REFERENCES ...................................................... 27

## ABSTRACT

The **Incident Management System for Districts (IMSD)** is a production-ready full-stack web application developed using modern MERN stack technologies to facilitate efficient incident reporting, authority verification, real-time tracking, and analytical insights for disaster management at district level.

**Core Features**:
- Citizen incident reporting with GPS location, camera capture, media uploads
- Authority verification and response assignment workflows
- Interactive geospatial maps (Leaflet.js)
- Real-time Socket.IO updates and notifications
- Role-based dashboards (Citizen, Authority, Admin)
- Advanced analytics (Recharts)
- Secure authentication (JWT, bcrypt) with RBAC

The system structure includes `backend/` (Express.js server, MongoDB models/controllers/routes/services) and `frontend/` (React SPA with Vite/TailwindCSS), totaling 70+ files. Addresses traditional manual systems' limitations, reducing response time from hours to minutes.

## LIST OF FIGURES

1. System Architecture Diagram
2. Incident Reporting Flow
3. Authentication Flow
4. Geospatial Query Pipeline
5. Dashboard UI Components
6. Real-time Socket.IO Integration

## LIST OF TABLES

1. User Model Schema
2. Incident Model Schema
3. API Endpoints Summary
4. Socket Events List
5. Backend Dependencies
6. Frontend Dependencies

## ACRONYMS

- IMSD: Incident Management System Districts
- MERN: MongoDB Express React Node
- RBAC: Role-Based Access Control
- JWT: JSON Web Token
- GIS: Geographic Information System
- SOS: Short for Service (Emergency Alert)

## 1. INTRODUCTION

### 1.1 Brief Information about the Project

**Location**: `c:/Users/nvnat/OneDrive - Aditya Educational Institutions/Desktop/IMSD`

**Backend (`backend/`)**:
- `server.js`: Express + Socket.IO server
- Models: `User.js`, `Incident.js`, `Admin.js`, `Authority.js`, `Citizen.js` (geospatial indexes)
- Controllers: auth, incident, admin
- Middleware: auth (JWT/RBAC), upload (Multer), validation
- Services: business logic separation
- Scripts: database migrations, admin seeding

**Frontend (`frontend/`)**:
- `App.jsx`: React Router with ProtectedRoute
- Pages: Login, Register, Dashboard, ReportIncident, Map, Analytics, AdminPanel
- Components: Navbar, IncidentCard, CameraCapture
- State: Zustand stores (auth, incidents, notifications)
- Services: apiClient (Axios), socket

**Documentation**: 15+ MD guides (API, database, setup, testing).

### 1.2 Motivation and Contribution

Manual disaster reporting via phone/paper leads to delays, lost data. IMSD provides:
- Digital platform for instant reporting/tracking
- Data analytics for resource allocation
- Real-time coordination across stakeholders

### 1.3 Objectives

1. Build scalable incident management platform
2. Implement geospatial features for location-based queries
3. Ensure secure multi-role access
4. Provide real-time collaboration
5. Deliver responsive analytics dashboards

### 1.4 Scope

**Included**: Full CRUD incidents, auth/RBAC, maps, analytics, real-time.
**Excluded**: Hardware integration, payment systems.

## 2. SYSTEM ANALYSIS

### 2.1 Functional Requirements

**Authentication**:
- Register/Login with email or userId
- Role-specific dashboards

**Incident Management**:
- Report (location, media, type, severity)
- Verify/Assign/Resolve by authority
- Nearby incidents search

**Real-time**:
- Live updates via Socket.IO rooms

**Admin**:
- User oversight, system analytics

### 2.2 Non-Functional Requirements

Performance: API response <200ms
Security: OWASP Top 10 mitigation
Scalability: Horizontal scaling ready
Usability: Mobile-responsive, accessible

### 2.3 Requirements Specification

**Hardware**: CPU 2-core+, 4GB RAM
**Software**: Node.js 18+, MongoDB 6+, modern browser

## 3. TECHNOLOGY DESCRIPTION

### 3.1 Programming Language

**JavaScript (ES2022+)** with Node.js backend, React frontend. Async patterns throughout.

### 3.2 Frameworks and Libraries

**Backend**:
- Express.js: REST API
- Socket.IO: Real-time bi-directional
- Mongoose: ODM

**Frontend**:
- React 18: Component-based UI
- Vite: Fast bundling
- Tailwind CSS: Utility-first styling
- Leaflet: Maps
- Recharts: Visualizations
- Zustand: State management
- Framer Motion: Animations

### 3.3 Database Technology

**MongoDB**: NoSQL document database
- Geospatial indexes (`2dsphere`)
- Aggregation pipelines for analytics
- Replica sets for high availability

**Schemas**:
```javascript
// User.js excerpt
location: {
  type: { type: String, enum: ['Point'] },
  coordinates: [Number]  // [lng, lat]
}
```

### 3.4 Tools & IDEs

VS Code with extensions for React, Tailwind, MongoDB.

## 4. DATABASE DESIGN

### 4.1 Database Collections

- **Users**: All roles
- **Incidents**: Core data with media refs
- **Uploads**: File storage (/backend/uploads/incidents)

### 4.2 Schema Structure

**Table 1: User Schema**
| Field | Type | Constraints |
|-------|------|-------------|
| userId | String | unique |
| role | String | enum: citizen\|authority\|admin |
| location | GeoPoint | 2dsphere index |

**Table 2: Incident Schema**
| Field | Type | Constraints |
|-------|------|-------------|
| title | String | required |
| location | GeoPoint | required, indexed |
| status | String | enum: reported\|verified\|assigned\|resolved |
| media | [String] | upload URLs |

### 4.3 Keys and Constraints

- Primary: Mongo _id
- Unique: userId, email
- Indexes: location (2dsphere), status+createdAt

### 4.4 Relationships

User.reports → Incident.reportedBy (ref)

## 5. SYSTEM DESIGN

### 5.1 System Architecture

```
Frontend (React SPA) --HTTP/WS--> Backend (Express + Socket.IO) --> MongoDB
                         |                |
                    Tailwind/Zustand   JWT/Auth Middleware
                         |                |
                    Leaflet Maps       Mongoose Models
```

**Figure 1**: Layered architecture with real-time layer.

### 5.2 Modules Description

**Backend Modules**:
1. **Server**: Port binding, middleware stack
2. **Auth**: Login/register/token ops
3. **Incidents**: CRUD + geo queries
4. **Socket**: Room-based broadcasting

**Frontend Modules**:
1. **Auth Pages**: Login/Register
2. **Dashboard**: Incident list + filters
3. **Report**: Form + camera + GPS
4. **Map**: Live markers + clustering

**Table 3: API Endpoints**
| Endpoint | Method | Role |
|----------|--------|------|
| /api/auth/login | POST | public |
| /api/incidents | GET | authenticated |
| /api/incidents/nearby | GET | authority |

**Table 4: Socket Events**
| Event | Direction | Data |
|-------|-----------|------|
| new-incident | server→client | incident object |
| status-update | client→server | incidentId, status |

## 6. SYSTEM IMPLEMENTATION

**Backend Implementation** (`backend/server.js`):
- Express app setup with CORS
- Socket.IO integration with auth
- Route mounting: authRoutes, incidentRoutes

**Key Code Snippet** (authController.js):
```javascript
const login = async (req, res) => {
  const { emailOrUserId, password } = req.body;
  const user = await User.findOne({ $or: [{email: emailOrUserId}, {userId: emailOrUserId}] });
  if (user && await user.comparePassword(password)) {
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, user: user.toJSON() });
  }
};
```

**Frontend Implementation** (`frontend/src/pages/ReportIncidentPage.jsx`):
- CameraCapture component for media
- Geolocation API integration
- Form validation + api post

**Real-time Features** (`frontend/src/services/socket.js`):
- Auto-connect on auth
- Subscribe to personal/global rooms

## 7. CONCLUSION

IMSD successfully implements a comprehensive incident management system with modern web technologies. The project demonstrates best practices in full-stack development, security, and real-time features. Ready for deployment and scaling.

## 8. FUTURE ENHANCEMENTS

1. Mobile PWA with offline support
2. AI-powered incident verification
3. Integration with SMS/WhatsApp alerts
4. Advanced GIS features (routing, heatmaps)
5. Machine learning for priority prediction

## 9. REFERENCES

1. MongoDB Documentation: Geospatial Queries
2. Socket.IO Official Guide
3. React Patterns and Best Practices
4. Express.js Middleware Cookbook
5. Tailwind CSS Documentation

**To run**: 
- Backend: `cd backend && npm i && npm start`
- Frontend: `cd frontend && npm i && npm run dev`

**Congratulations! The IMSD project report is now complete and populated.**

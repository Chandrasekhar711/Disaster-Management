# DM-EAS API Reference - New Workflows

**Quick Reference Guide for Authentication, Authority Creation, and Incident Verification**

---

## 🔐 Authentication Endpoints

### Register (Public - Citizens Only)

```
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "name": "John Doe",              // Required: min 3 chars
  "userId": "john_doe",            // Required: 4-20 chars, alphanumeric + underscore
  "email": "john@example.com",     // Required: valid email
  "phone": "9876543210",           // Required: 10 digits
  "password": "secure_password"    // Required: min 6 chars
}

Response (201):
{
  "success": true,
  "message": "Registration successful!",
  "data": {
    "user": {
      "_id": "ObjectId",
      "name": "John Doe",
      "userId": "john_doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "role": "citizen",              // Always 'citizen' for public registration
      "isVerified": false,
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}

Errors:
- 400: Email already registered
- 400: User ID already taken
- 400: Invalid format (userId must be 4-20 alphanumeric + underscore)
```

### Login (Public - Email or User ID)

```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "emailOrUserId": "john@example.com",  // Email or userId (case-insensitive)
  "password": "secure_password"         // Plain text (hashed on backend)
}

Response (200):
{
  "success": true,
  "message": "Login successful!",
  "data": {
    "user": {
      "_id": "ObjectId",
      "name": "John Doe",
      "userId": "john_doe",
      "email": "john@example.com",
      "role": "citizen",
      "isVerified": true,
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "7d"
  }
}

Errors:
- 401: Invalid credentials (generic message for security)
- 400: Missing emailOrUserId or password
```

---

## 👮 Authority Account Management

### Create Authority (Admin Only)

```
POST /api/admin/users/authority
Authorization: Bearer <admin_token>
Content-Type: application/json

Request Body:
{
  "name": "Fire Officer",
  "userId": "fire_officer_01",       // Required: unique, 4-20 chars
  "email": "officer@fire.gov",       // Required: unique email
  "phone": "9876543211",             // Optional but recommended
  "password": "secure_pass123",      // Required: will be hashed
  "department": "fire"               // Required: police|fire|medical|rescue|civil_defense
}

Response (201):
{
  "success": true,
  "message": "Authority officer created successfully",
  "data": {
    "user": {
      "_id": "ObjectId",
      "name": "Fire Officer",
      "userId": "fire_officer_01",
      "email": "officer@fire.gov",
      "role": "authority",           // Always 'authority'
      "department": "fire",
      "isVerified": true,
      "isActive": true,
      "createdBy": "admin_user_id",
      "createdAt": "2024-01-15T11:00:00Z"
    }
  }
}

Errors:
- 401: Unauthorized (not admin)
- 400: Missing required fields (userId, email, password, department)
- 400: User ID already taken
- 400: Email already registered
- 400: Invalid department value
```

---

## 📊 Incident Verification Workflow

### Admin Review Incident (Reported → Authority Review)

```
PUT /api/admin/incidents/:incidentId/review
Authorization: Bearer <admin_token>
Content-Type: application/json

Request Body:
{
  "notes": "Incident appears legitimate. Forwarding to authority."  // Optional
}

Response (200):
{
  "success": true,
  "message": "Incident moved to authority review",
  "data": {
    "incident": {
      "_id": "ObjectId",
      "title": "Building Fire on Main Street",
      "description": "Multi-story building on fire...",
      "status": "authority_review",          // Changed from 'reported'
      "adminReviewed": true,                 // Set to true
      "adminReviewedBy": {                   // Admin user reference
        "_id": "admin_id",
        "name": "Admin User",
        "userId": "admin_user"
      },
      "adminReviewedAt": "2024-01-15T11:30:00Z",
      "severity": "critical",
      "location": {
        "coordinates": [73.8567, 18.5204],  // [longitude, latitude]
        "address": "100 Main Street, Mumbai"
      },
      "reportedBy": { /* citizen data */ },
      "isSOS": false
    }
  }
}

Socket.IO Event Emitted:
{
  "event": "incident-admin-reviewed",
  "data": { /* full incident object */ },
  "room": "incident:updates"
}

Errors:
- 401: Unauthorized (not admin)
- 404: Incident not found
- 400: Incident already in authority_review or beyond
```

### Authority Verify Incident (Authority Review → Responding or Cancelled)

```
PUT /api/admin/incidents/:incidentId/verify
Authorization: Bearer <authority_token>
Content-Type: application/json

Request Body:
{
  "decision": "yes",                    // "yes" or "no"
  "notes": "Verified. Dispatching fire trucks immediately."  // Optional
}

Response (200):
{
  "success": true,
  "message": "Incident verification completed",
  "data": {
    "incident": {
      "_id": "ObjectId",
      "title": "Building Fire on Main Street",
      "status": "responding",              // Changed based on decision
                                           // "yes" → "responding"
                                           // "no" → "cancelled"
      "authorityVerified": true,           // Set to true
      "authorityVerifiedBy": {             // Authority user reference
        "_id": "authority_id",
        "name": "Fire Officer",
        "userId": "fire_officer_01",
        "department": "fire"
      },
      "verificationDecision": "yes",       // Stores decision
      "verificationNotes": "Verified. Dispatching fire trucks...",
      "assignedTo": [                      // Automatic assignment
        {
          "_id": "responder_id",
          "name": "Station 1 Team",
          "department": "fire"
        }
      ]
    }
  }
}

Socket.IO Events Emitted:
{
  "event": "incident-authority-verified",
  "data": { /* full incident object */ },
  "room": ["incident:updates", "map:live"]
}

Errors:
- 401: Unauthorized (not authority)
- 400: Invalid decision value (must be "yes" or "no")
- 404: Incident not found
- 400: Incident not in authority_review status
```

**Decision Logic**:
- **decision = "yes"**: Status → "responding", incident accepted, responders assigned
- **decision = "no"**: Status → "cancelled", incident rejected, responders notified

---

## 📍 Public Incident API

### Get All Incidents (Public)

```
GET /api/incidents?page=1&limit=10&type=fire&status=responding&severity=high
Content-Type: application/json
(No Authentication Required)

Query Parameters:
- page: number (default: 1)
- limit: number (default: 10, max: 100)
- type: filter by incident type
- status: filter by status
- severity: filter by severity
- isSOS: true/false (emergency incidents only)

Response (200):
{
  "success": true,
  "message": "Incidents retrieved successfully",
  "data": [
    {
      "_id": "ObjectId",
      "title": "Building Fire on Main Street",
      "description": "Multi-story building...",
      "type": "fire",
      "status": "responding",
      "severity": "critical",
      "location": {
        "coordinates": [73.8567, 18.5204],
        "address": "Main Street, Mumbai"
      },
      "reportedBy": {
        "_id": "citizen_id",
        "name": "John Doe"
      },
      "isSOS": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "media": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

### Get Nearby Incidents (Public - Geospatial)

```
GET /api/incidents/nearby?longitude=73.8567&latitude=18.5204&radius=5000
Content-Type: application/json
(No Authentication Required)

Query Parameters:
- longitude: float (-180 to 180) required
- latitude: float (-90 to 90) required
- radius: number in meters (default: 5000)
- type: filter by incident type (optional)
- status: filter by status (optional)

Response (200):
{
  "success": true,
  "message": "Nearby incidents retrieved successfully",
  "data": [
    { /* incident objects */ }
  ]
}

Errors:
- 400: Invalid coordinates format
- 400: Missing required parameters
```

### Get Single Incident (Public)

```
GET /api/incidents/:incidentId
Content-Type: application/json
(No Authentication Required)

Response (200):
{
  "success": true,
  "message": "Incident retrieved successfully",
  "data": {
    /* Full incident object with all details */
  }
}

Errors:
- 404: Incident not found
```

---

## 🔴 SOS Alert

### Trigger SOS (Citizen Only)

```
POST /api/incidents/:incidentId/sos
Authorization: Bearer <citizen_token>
Content-Type: application/json

Request Body: {} (Empty)

Response (200):
{
  "success": true,
  "message": "SOS triggered successfully",
  "data": {
    "incident": {
      "_id": "ObjectId",
      "isSOS": true,              // Flagged as emergency
      "status": "responding",     // Automatically escalated
      "severity": "critical",     // Upgraded to critical
      "sosTriggeredAt": "2024-01-15T10:35:00Z",
      "sosTriggeredBy": {
        "_id": "citizen_id",
        "name": "John Doe"
      }
    }
  }
}

Socket.IO Event Emitted:
{
  "event": "sos-alert",
  "data": { /* full incident object */ },
  "room": ["sos:alerts", "map:live"]
}

Errors:
- 401: Unauthorized (not incident reporter)
- 404: Incident not found
```

---

## 🔄 Status Enum Reference

### Valid Incident Statuses

```javascript
// Complete workflow
'reported'        → Initial citizen report
'admin_review'    → Admin reviewing for legitimacy  
'authority_review'→ Authority making verification decision
'responding'      → Approved, responders en route
'resolved'        → Incident concluded
'cancelled'       → Rejected by authority
```

### Status Transitions Matrix

```
reported  ──[Admin Review]──> authority_review
                               │
                    ┌──────────┴──────────┐
                    │                     │
            [Yes Decision]          [No Decision]
                    │                     │
                    ▼                     ▼
              responding              cancelled
                    │
            [Authority Marks Complete]
                    │
                    ▼
                resolved
```

---

## 🌐 Socket.IO Events Reference

### Server → Client Events

```javascript
// Real-time incident creation
socket.on('incident-created', (incident) => {
  // New incident reported
  // Rooms: incident:updates, map:live
})

// Incident status change
socket.on('incident-update', (incident) => {
  // Any status change
  // Rooms: incident:updates, map:live
})

// Admin review completion
socket.on('incident-admin-reviewed', (incident) => {
  // Moved to authority_review
  // Rooms: incident:updates
})

// Authority decision made
socket.on('incident-authority-verified', (incident) => {
  // Decision yes/no applied
  // Rooms: incident:updates, map:live
})

// Emergency SOS triggered
socket.on('sos-alert', (incident) => {
  // High-priority emergency
  // Rooms: sos:alerts, map:live
})

// Responder assigned
socket.on('incident-assigned', (incident) => {
  // Authority assigned responders
  // Rooms: incident:updates
})

// Incident verification (real/fake)
socket.on('incident-verified', (incident) => {
  // Confirmed as real incident
  // Rooms: incident:updates, map:live
})
```

### Client → Server Events

```javascript
// Join room for incident updates
socket.emit('join-incident-updates')

// Join live map room
socket.emit('join-live-map')

// Join SOS alerts room
socket.emit('join-sos-alerts')

// Join global notifications
socket.emit('join-global-notifications')

// Subscribe to user-specific notifications
socket.emit('subscribe-user', userId)
```

---

## 🧪 Testing with cURL

### Test Citizen Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "userId": "john_doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "password123"
  }'
```

### Test Admin Authority Creation
```bash
curl -X POST http://localhost:5000/api/admin/users/authority \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fire Officer",
    "userId": "fire_officer_01",
    "email": "officer@fire.gov",
    "password": "secure_pass123",
    "department": "fire"
  }'
```

### Test Incident Review (Admin)
```bash
curl -X PUT http://localhost:5000/api/admin/incidents/INCIDENT_ID/review \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Incident appears legitimate"
  }'
```

### Test Incident Verification (Authority)
```bash
curl -X PUT http://localhost:5000/api/admin/incidents/INCIDENT_ID/verify \
  -H "Authorization: Bearer YOUR_AUTHORITY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "yes",
    "notes": "Verified and dispatching responders"
  }'
```

### Test Public Incident Fetch
```bash
curl http://localhost:5000/api/incidents?limit=10&severity=critical
```

---

## 📌 Implementation Notes

1. **Token Format**: All tokens are JWT with 7-day expiry
2. **Case Sensitivity**: Email and userId are case-insensitive in search
3. **Timestamps**: All dates in ISO 8601 format (UTC)
4. **Error Messages**: Generic messages for security (no user enumeration)
5. **Rate Limiting**: Recommended on auth endpoints (future enhancement)
6. **CORS**: Configured for frontend URL (see .env)

---

**Last Updated**: 2024
**API Version**: 2.0 (New Workflow)

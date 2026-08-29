# Backend API Documentation

## Overview
RESTful API for Disaster Management & Emergency Alert System built with Express.js and MongoDB.

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Response Format
```json
{
  "success": true/false,
  "message": "Response message",
  "data": {},
  "pagination": { "page": 1, "limit": 10, "total": 100, "pages": 10 }
}
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user

**Request Body:**
```json
{
  "name": "John Doe",
  "userId": "john_doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "citizen",
  "department": null
}
```

**Field Requirements:**
- `name`: Required, minimum 3 characters
- `userId`: Required, 4-20 characters, alphanumeric + underscore only, must be unique
- `email`: Required, valid email format, must be unique
- `phone`: Required, exactly 10 digits
- `password`: Required, minimum 6 characters
- `role`: Required, one of: 'citizen', 'authority', 'admin'
- `department`: Required only if role is 'authority', one of: 'police', 'fire', 'medical', 'rescue', 'civil_defense'

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "userId": "john_doe",
      "email": "john@example.com",
      "role": "citizen"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Responses:**
- `400`: "User ID is already taken"
- `400`: "User with this email already exists"
- `400`: "User ID must be at least 4 characters"
- `400`: "User ID cannot exceed 20 characters"
- `400`: "User ID can only contain letters, numbers, and underscores"

---

#### POST /auth/login
Authenticate user with email OR user ID and get token

**Request Body (Option 1 - With User ID):**
```json
{
  "emailOrUserId": "john_doe",
  "password": "password123"
}
```

**Request Body (Option 2 - With Email):**
```json
{
  "emailOrUserId": "john@example.com",
  "password": "password123"
}
```

**How It Works:**
- If input contains `@` symbol → treated as email
- If input doesn't contain `@` → treated as user ID
- System automatically detects and searches accordingly

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "userId": "john_doe",
      "email": "john@example.com",
      "role": "citizen",
      "isVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Responses:**
- `401`: "User not found" (email/userId doesn't exist)
- `401`: "Invalid password" (wrong password)
- `401`: "Your account has been deactivated" (account inactive)

---
Get current user profile

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "citizen",
    "address": "123 Main St",
    "location": {
      "type": "Point",
      "coordinates": [77.1025, 28.7041]
    },
    "incidentsReported": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Building Fire",
        "type": "fire",
        "status": "resolved",
        "createdAt": "2024-02-19T10:30:00Z"
      }
    ],
    "incidentsAssigned": [],
    "createdAt": "2024-02-15T08:00:00Z"
  }
}
```

#### PUT /auth/profile
Update user profile

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "address": "456 Oak Ave",
  "bio": "Emergency responder",
  "location": {
    "type": "Point",
    "coordinates": [77.1025, 28.7041]
  }
}
```

**Response (200):** Updated user object

#### POST /auth/logout
Logout user

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {}
}
```

---

### Incidents

#### POST /incidents
Create a new incident

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Building Fire",
  "description": "Large fire reported at commercial building near downtown",
  "type": "fire",
  "severity": "critical",
  "location": {
    "coordinates": [77.1025, 28.7041],
    "address": "123 Main Street, Delhi"
  },
  "media": [
    {
      "url": "base64_image_data",
      "type": "image"
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Incident reported successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Building Fire",
    "description": "Large fire reported at commercial building near downtown",
    "type": "fire",
    "status": "reported",
    "severity": "critical",
    "location": {
      "type": "Point",
      "coordinates": [77.1025, 28.7041],
      "address": "123 Main Street, Delhi"
    },
    "reportedBy": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210"
    },
    "isSOS": false,
    "viewCount": 0,
    "createdAt": "2024-02-19T10:30:00Z"
  }
}
```

#### GET /incidents
Get all incidents with filters and pagination

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 10) - Items per page
- `type` - Filter by type (flood, fire, accident, earthquake, hazard)
- `status` - Filter by status (reported, verified, responding, resolved, cancelled)
- `severity` - Filter by severity (low, medium, high, critical)
- `isSOS` - Filter by SOS status (true/false)

**Example:**
```
GET /incidents?page=1&limit=10&type=fire&status=reported&severity=high
```

**Response (200):**
```json
{
  "success": true,
  "message": "Incidents retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Building Fire",
      "type": "fire",
      "status": "verified",
      "severity": "critical",
      "location": {
        "coordinates": [77.1025, 28.7041],
        "address": "123 Main Street, Delhi"
      },
      "reportedBy": { "name": "John Doe", "email": "john@example.com" },
      "assignedTo": [],
      "isSOS": false,
      "viewCount": 15,
      "createdAt": "2024-02-19T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### GET /incidents/nearby
Get incidents within specified radius (Geospatial Query)

**Query Parameters:**
- `longitude` (required) - User longitude
- `latitude` (required) - User latitude
- `radius` (optional, default: 5000) - Search radius in meters

**Example:**
```
GET /incidents/nearby?longitude=77.1025&latitude=28.7041&radius=10000
```

**Response (200):**
```json
{
  "success": true,
  "message": "Nearby incidents retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Building Fire",
      "type": "fire",
      "location": {
        "coordinates": [77.1025, 28.7041],
        "address": "123 Main Street, Delhi"
      },
      "severity": "critical",
      "status": "responding",
      "createdAt": "2024-02-19T10:30:00Z"
    }
  ]
}
```

#### GET /incidents/:id
Get single incident details

**Response (200):**
```json
{
  "success": true,
  "message": "Incident retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Building Fire",
    "description": "Large fire at commercial building",
    "type": "fire",
    "status": "responding",
    "severity": "critical",
    "location": {
      "type": "Point",
      "coordinates": [77.1025, 28.7041],
      "address": "123 Main Street, Delhi"
    },
    "media": [
      {
        "url": "https://example.com/image.jpg",
        "type": "image",
        "uploadedAt": "2024-02-19T10:30:00Z"
      }
    ],
    "reportedBy": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "verifiedBy": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Officer Smith",
      "email": "officer@example.com"
    },
    "assignedTo": [
      {
        "userId": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Officer Smith",
          "email": "officer@example.com",
          "department": "fire"
        },
        "department": "fire",
        "assignedAt": "2024-02-19T10:35:00Z"
      }
    ],
    "responders": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Officer Smith",
        "email": "officer@example.com"
      }
    ],
    "comments": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "author": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Officer Smith",
          "email": "officer@example.com"
        },
        "text": "Fire extinguishing in progress",
        "createdAt": "2024-02-19T10:40:00Z"
      }
    ],
    "isSOS": false,
    "viewCount": 127,
    "affectedPeople": 50,
    "estimatedDamage": "severe",
    "priority": 1,
    "createdAt": "2024-02-19T10:30:00Z"
  }
}
```

#### PUT /incidents/:id/status
Update incident status (Authority/Admin only)

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "verified"
}
```

**Valid Status Values:**
- `reported` - Initial status
- `verified` - Confirmed by authority
- `responding` - Response in progress
- `resolved` - Incident resolved
- `cancelled` - Incident cancelled

**Response (200):**
```json
{
  "success": true,
  "message": "Incident status updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Building Fire",
    "status": "verified",
    "verifiedBy": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Officer Smith",
      "email": "officer@example.com"
    }
  }
}
```

#### POST /incidents/:id/assign
Assign responder to incident (Authority/Admin only)

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439013",
  "department": "fire"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Responder assigned successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Building Fire",
    "assignedTo": [
      {
        "userId": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Officer Smith",
          "email": "officer@example.com",
          "department": "fire"
        },
        "department": "fire",
        "assignedAt": "2024-02-19T10:35:00Z"
      }
    ],
    "responders": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Officer Smith",
        "email": "officer@example.com"
      }
    ]
  }
}
```

#### POST /incidents/:id/comment
Add comment to incident

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "comment": "Fire extinguishing equipment deployed"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "comments": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "author": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Officer Smith",
          "email": "officer@example.com",
          "role": "authority"
        },
        "text": "Fire extinguishing equipment deployed",
        "createdAt": "2024-02-19T10:40:00Z"
      }
    ]
  }
}
```

#### POST /incidents/:id/sos
Trigger SOS alert for incident

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "SOS triggered successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "isSOS": true,
    "severity": "critical",
    "sosTriggeredAt": "2024-02-19T10:45:00Z",
    "sosTriggeredBy": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### GET /incidents/stats
Get incident statistics and analytics

**Response (200):**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "total": 156,
    "sosAlerts": 8,
    "resolved": 92,
    "byType": [
      { "_id": "fire", "count": 45, "avgAffected": 23 },
      { "_id": "flood", "count": 38, "avgAffected": 156 },
      { "_id": "accident", "count": 56, "avgAffected": 4 },
      { "_id": "earthquake", "count": 12, "avgAffected": 500 },
      { "_id": "hazard", "count": 5, "avgAffected": 12 }
    ],
    "byStatus": [
      { "_id": "reported", "count": 15 },
      { "_id": "verified", "count": 25 },
      { "_id": "responding", "count": 24 },
      { "_id": "resolved", "count": 92 }
    ],
    "bySeverity": [
      { "_id": "low", "count": 30 },
      { "_id": "medium", "count": 60 },
      { "_id": "high", "count": 50 },
      { "_id": "critical", "count": 16 }
    ]
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "param": "email",
      "msg": "Please provide a valid email"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "User role 'citizen' is not authorized to access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Incident not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server Error"
}
```

---

## Rate Limiting
Currently no rate limiting is implemented. Consider adding for production.

## CORS
Requests must come from `http://localhost:5173` (configurable via `FRONTEND_URL` env variable)

## Request/Response Size
Maximum request body size: 50MB

---

**Last Updated: February 2024**

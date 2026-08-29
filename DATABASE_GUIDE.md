# MongoDB Database Guide

## Overview
MongoDB is used as the primary database with geospatial indexing for location-based queries.

## Connection
```javascript
// MongoDB URI
mongodb://localhost:27017/dm-eas
```

## Collections

### 1. Users Collection

#### Schema
```json
{
  "_id": ObjectId,
  "name": String,
  "userId": String (unique, 4-20 characters, alphanumeric + underscore),
  "email": String (unique, indexed),
  "phone": String,
  "password": String (hashed with bcryptjs),
  "role": String (enum: 'citizen', 'authority', 'admin'),
  "department": String (enum: 'police', 'fire', 'medical', 'rescue', 'civil_defense'),
  "location": {
    "type": String (default: 'Point'),
    "coordinates": [Number, Number] (longitude, latitude)
  },
  "address": String,
  "isVerified": Boolean (default: false),
  "isActive": Boolean (default: true),
  "profileImage": String (URL),
  "bio": String,
  "incidentsReported": [ObjectId],
  "incidentsAssigned": [ObjectId],
  "createdAt": Date,
  "updatedAt": Date
}
```

#### Indexes
```javascript
// Geospatial index for location queries
db.users.createIndex({ location: "2dsphere" });

// Email unique index
db.users.createIndex({ email: 1 }, { unique: true });

// UserId unique index
db.users.createIndex({ userId: 1 }, { unique: true });
```

#### Example Document
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "John Doe",
  "userId": "john_doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "$2a$10$encrypted_hash_here",
  "role": "citizen",
  "location": {
    "type": "Point",
    "coordinates": [77.1025, 28.7041]
  },
  "address": "123 Main Street, Delhi",
  "isVerified": true,
  "isActive": true,
  "profileImage": "https://example.com/image.jpg",
  "bio": "Emergency responder",
  "incidentsReported": [
    ObjectId("507f1f77bcf86cd799439012"),
    ObjectId("507f1f77bcf86cd799439013")
  ],
  "incidentsAssigned": [],
  "createdAt": ISODate("2024-02-15T08:00:00.000Z"),
  "updatedAt": ISODate("2024-02-19T10:30:00.000Z")
}
```

---

### 2. Incidents Collection

#### Schema
```json
{
  "_id": ObjectId,
  "title": String,
  "description": String,
  "type": String (enum: 'flood', 'fire', 'accident', 'earthquake', 'hazard', 'other'),
  "status": String (enum: 'reported', 'verified', 'responding', 'resolved', 'cancelled', default: 'reported'),
  "severity": String (enum: 'low', 'medium', 'high', 'critical', default: 'medium'),
  "location": {
    "type": String (default: 'Point'),
    "coordinates": [Number, Number] (longitude, latitude),
    "address": String
  },
  "media": [
    {
      "url": String,
      "type": String (enum: 'image', 'video'),
      "uploadedAt": Date
    }
  ],
  "reportedBy": ObjectId,
  "verifiedBy": ObjectId (nullable),
  "assignedTo": [
    {
      "userId": ObjectId,
      "department": String,
      "assignedAt": Date
    }
  ],
  "responders": [ObjectId],
  "comments": [
    {
      "author": ObjectId,
      "text": String,
      "createdAt": Date
    }
  ],
  "isSOS": Boolean (default: false),
  "sosTriggeredAt": Date (nullable),
  "sosTriggeredBy": ObjectId (nullable),
  "viewCount": Number (default: 0),
  "affectedPeople": Number (default: 0),
  "estimatedDamage": String (enum: 'minimal', 'moderate', 'severe', 'catastrophic'),
  "resolutionNotes": String (nullable),
  "resolvedAt": Date (nullable),
  "priority": Number (default: 0),
  "createdAt": Date,
  "updatedAt": Date
}
```

#### Indexes
```javascript
// Geospatial index for location queries
db.incidents.createIndex({ location: "2dsphere" });

// Timestamp index for sorting
db.incidents.createIndex({ createdAt: -1 });

// Status index for filtering
db.incidents.createIndex({ status: 1 });

// Type index for filtering
db.incidents.createIndex({ type: 1 });

// Reporter index for user-specific incidents
db.incidents.createIndex({ reportedBy: 1 });
```

#### Example Document
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "title": "Building Fire",
  "description": "Large fire reported at commercial building near downtown area",
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
      "url": "https://example.com/images/fire_001.jpg",
      "type": "image",
      "uploadedAt": ISODate("2024-02-19T10:30:00.000Z")
    }
  ],
  "reportedBy": ObjectId("507f1f77bcf86cd799439011"),
  "verifiedBy": ObjectId("507f1f77bcf86cd799439013"),
  "assignedTo": [
    {
      "userId": ObjectId("507f1f77bcf86cd799439013"),
      "department": "fire",
      "assignedAt": ISODate("2024-02-19T10:35:00.000Z")
    }
  ],
  "responders": [
    ObjectId("507f1f77bcf86cd799439013"),
    ObjectId("507f1f77bcf86cd799439014")
  ],
  "comments": [
    {
      "author": ObjectId("507f1f77bcf86cd799439013"),
      "text": "Fire extinguishing in progress",
      "createdAt": ISODate("2024-02-19T10:40:00.000Z")
    }
  ],
  "isSOS": false,
  "sosTriggeredAt": null,
  "sosTriggeredBy": null,
  "viewCount": 127,
  "affectedPeople": 50,
  "estimatedDamage": "severe",
  "resolutionNotes": null,
  "resolvedAt": null,
  "priority": 1,
  "createdAt": ISODate("2024-02-19T10:30:00.000Z"),
  "updatedAt": ISODate("2024-02-19T10:45:00.000Z")
}
```

---

## Geospatial Queries

### Find Incidents Near Location
```javascript
db.incidents.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [77.1025, 28.7041]
      },
      $maxDistance: 5000 // meters
    }
  }
});
```

### Find Users Near Location
```javascript
db.users.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [77.1025, 28.7041]
      },
      $maxDistance: 2000 // meters
    }
  }
});
```

### Within Box
```javascript
db.incidents.find({
  location: {
    $geoWithin: {
      $box: [
        [76.0, 27.0],
        [78.0, 30.0]
      ]
    }
  }
});
```

---

## Aggregation Pipelines

### Get Incident Statistics
```javascript
db.incidents.aggregate([
  {
    $group: {
      _id: "$type",
      count: { $sum: 1 },
      avgAffected: { $avg: "$affectedPeople" },
      criticalCount: {
        $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] }
      }
    }
  },
  { $sort: { count: -1 } }
]);
```

### Incidents by Status
```javascript
db.incidents.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 },
      avgViewCount: { $avg: "$viewCount" }
    }
  }
]);
```

### Active Incidents (Last 7 Days)
```javascript
db.incidents.aggregate([
  {
    $match: {
      createdAt: {
        $gte: new Date(new Date().setDate(new Date().getDate() - 7))
      }
    }
  },
  {
    $group: {
      _id: "$type",
      count: { $sum: 1 },
      severities: { $push: "$severity" }
    }
  }
]);
```

### User Activity Report
```javascript
db.incidents.aggregate([
  {
    $group: {
      _id: "$reportedBy",
      incidentCount: { $sum: 1 },
      sosCount: { $sum: { $cond: ["$isSOS", 1, 0] } }
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "userInfo"
    }
  },
  { $sort: { incidentCount: -1 } },
  { $limit: 10 }
]);
```

---

## Database Setup

### Create Database and Collections
```javascript
// Connect to MongoDB
mongo

// Use database
use dm-eas

// Create collections
db.createCollection("users")
db.createCollection("incidents")

// Create indexes
db.users.createIndex({ location: "2dsphere" })
db.users.createIndex({ email: 1 }, { unique: true })

db.incidents.createIndex({ location: "2dsphere" })
db.incidents.createIndex({ createdAt: -1 })
db.incidents.createIndex({ status: 1 })
db.incidents.createIndex({ type: 1 })
db.incidents.createIndex({ reportedBy: 1 })
```

### Backup Database
```bash
mongodump --db dm-eas --out ./backup
```

### Restore Database
```bash
mongorestore --db dm-eas ./backup/dm-eas
```

### Drop Database
```javascript
use dm-eas
db.dropDatabase()
```

---

## Data Validation

### User Validation
```javascript
db.users.updateMany({}, {
  $set: {
    isVerified: false,
    isActive: true
  }
}, { multi: true });
```

### Incident Status Transition
Valid transitions:
- reported → verified
- verified → responding
- responding → resolved or cancelled
- reported → cancelled

### Cleanup Expired Data
```javascript
// Remove incidents older than 2 years
db.incidents.deleteMany({
  createdAt: {
    $lt: new Date(new Date().setFullYear(new Date().getFullYear() - 2))
  }
});
```

---

## Performance Optimization

### Index Analysis
```javascript
// Check index usage
db.incidents.find({ type: "fire" }).explain("executionStats")

// Check all indexes
db.incidents.getIndexes()
```

### Query Optimization Tips
1. Always use indexes for frequently queried fields
2. Use projection to limit returned fields
3. Use $limit early in aggregation pipeline
4. Denormalize data for frequently accessed relations
5. Use covered queries when possible

---

## Monitoring

### Database Stats
```javascript
db.stats()
db.incidents.stats()
db.users.stats()
```

### Check Collection Size
```javascript
db.incidents.storageSize()  // Disk space used
db.incidents.totalSize()     // Total size including indexes
```

---

## Connection Strings

### Local Development
```
mongodb://localhost:27017/dm-eas
```

### MongoDB Atlas (Cloud)
```
mongodb+srv://username:password@cluster.mongodb.net/dm-eas?retryWrites=true&w=majority
```

### Docker MongoDB
```
mongodb://mongo:27017/dm-eas
```

---

**Last Updated: February 2024**

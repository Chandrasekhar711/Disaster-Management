# Setup & Installation Guide

## Prerequisites

### System Requirements
- **Node.js**: v16 or higher
- **MongoDB**: v4.4 or higher
- **npm**: v8 or higher (or yarn)
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

### Optional
- **Git**: For version control
- **MongoDB Compass**: GUI for MongoDB
- **Postman**: For API testing

---

## Installation Steps

### Step 1: Clone or Extract Project

```bash
# Navigate to project directory
cd IMSD
```

---

### Step 2: Backend Setup

#### 2.1 Install MongoDB

**Windows:**
1. Download from https://www.mongodb.com/try/download/community
2. Run the installer
3. Follow installation wizard
4. MongoDB starts as a service

**Mac (Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

#### 2.2 Navigate to Backend

```bash
cd backend
```

#### 2.3 Install Dependencies

```bash
npm install
```

Expected output:
```
added XX packages in X.XXs
```

#### 2.4 Create Environment File

```bash
# Copy example env file
cp .env.example .env
```

#### 2.5 Configure .env

Edit `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/dm-eas
JWT_SECRET=your_super_secret_key_minimum_32_characters_long
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE=5242880
```

#### 2.6 Verify MongoDB Connection

```bash
# Open MongoDB client
mongosh

# In MongoDB shell
> use dm-eas
> db.version()
```

#### 2.7 Start Backend Server

```bash
npm run dev
```

Expected output:
```
[nodemon] starting node server.js
Server is running on port 5000
Environment: development
MongoDB Connected: localhost:27017
```

---

### Step 3: Frontend Setup

#### 3.1 Open New Terminal (Keep Backend Running)

```bash
# From project root
cd frontend
```

#### 3.2 Install Dependencies

```bash
npm install
```

Expected output:
```
added XX packages in X.XXs
```

#### 3.3 Create Environment File

```bash
cp .env.example .env.local
```

#### 3.4 Configure .env.local

Edit `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

#### 3.5 Start Frontend Dev Server

```bash
npm run dev
```

Expected output:
```
VITE v5.0.4  ready in XXX ms
➜  Local:   http://localhost:5173/
➜  press h to show help
```

---

## Verification

### ✅ Backend Verification

1. **API Health Check**
   ```bash
   curl http://localhost:5000/api/health
   ```
   
   Expected response:
   ```json
   {
     "success": true,
     "message": "Server is running",
     "timestamp": "2024-02-19T10:30:00.000Z"
   }
   ```

2. **MongoDB Connection**
   - Check console output shows "MongoDB Connected"

3. **Socket.IO Status**
   - Backend logs should show socket connection handling

### ✅ Frontend Verification

1. **Application Loads**
   - Visit http://localhost:5173
   - Should redirect to /login page

2. **API Connection**
   - Network tab should show API calls to http://localhost:5000/api

3. **Socket Connection**
   - Check browser console for socket connection message

---

## First Time Setup Issues

### MongoDB Won't Start

**Windows:**
```bash
# Check if MongoDB service is running
net start MongoDB

# If not running, start it
mongod
```

**Mac:**
```bash
# Check service status
brew services list

# Start service
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl status mongod
sudo systemctl start mongod
```

### Port 5000 Already in Use

```bash
# Find process using port 5000
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000

# Kill the process
# Windows
taskkill /PID <PID> /F

# Mac/Linux
kill -9 <PID>
```

### npm install Fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

## Database Initialization

### 1. Create Admin User

```bash
# In MongoDB shell
mongosh

# Switch to dm-eas database
use dm-eas

# Create admin user (insert raw)
db.users.insertOne({
  name: "Admin User",
  userId: "admin_user",
  email: "admin@demo.com",
  phone: "0000000001",
  password: "$2a$10$...", // bcrypt hash of "password123"
  role: "admin",
  isVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 2. Create Geospatial & Uniqueness Indexes

```bash
# In MongoDB shell
use dm-eas

# Create geospatial index for incidents
db.incidents.createIndex({ location: "2dsphere" })

# Create geospatial index for users
db.users.createIndex({ location: "2dsphere" })

# Create unique indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ userId: 1 }, { unique: true })

# Verify indexes
db.incidents.getIndexes()
db.users.getIndexes()
```

### 3. Seed Sample Data (Optional)

```bash
# Using MongoDB shell or Compass
# Insert sample incidents for testing
db.incidents.insertMany([
  {
    title: "Sample Flood",
    description: "Test flood incident",
    type: "flood",
    status: "reported",
    severity: "high",
    location: {
      type: "Point",
      coordinates: [77.1025, 28.7041],
      address: "Delhi, India"
    },
    reportedBy: ObjectId("<admin_user_id>"),
    isSOS: false,
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
])
```

---

## Testing the Application

### 1. Register a User

1. Visit http://localhost:5173/register
2. Fill in the form:
   - Full Name: Test User
   - **User ID: test_user_123** (4-20 chars, alphanumeric + underscore)
   - Email: test@example.com
   - Phone: 9876543210
   - Password: password123
   - Role: Citizen
3. Click Register

### 2. Login (Option 1: With User ID)

1. Visit http://localhost:5173/login
2. Enter credentials:
   - **Email or User ID: test_user_123**
   - Password: password123
3. Click Login
4. System detects user ID format automatically

### 2B. Login (Option 2: With Email)

1. Visit http://localhost:5173/login
2. Enter credentials:
   - **Email or User ID: test@example.com**
   - Password: password123
3. Click Login
4. System detects email format automatically

### 3. Report an Incident

1. Click "Report Incident" in navbar
2. Fill incident form
3. Click "Report Incident" button

### 4. View Dashboard

1. Dashboard shows all reported incidents
2. Use filters to narrow results
3. Click incident cards to view details

### 5. View Map

1. Click "Map View" in navbar
2. See all incidents on interactive map
3. Click incident markers for details

### 6. Check Analytics

1. Login as authority user (userId: demo_officer OR email: officer@demo.com)
2. Click "Analytics" in navbar
3. View incident statistics and charts

---

## Development Workflow

### Backend Development

```bash
cd backend

# Development mode (auto-reload on file changes)
npm run dev

# Production mode
npm start

# Run tests (if configured)
npm test
```

### Frontend Development

```bash
cd frontend

# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## Building for Production

### Backend Production Build

```bash
cd backend

# Build (Node.js doesn't need compilation)
# Just ensure dependencies are installed
npm install --production

# Start production server
NODE_ENV=production npm start
```

### Frontend Production Build

```bash
cd frontend

# Build
npm run build

# Output is in dist/ directory
# Deploy dist/ to web server
```

---

## Deployment Checklist

### Backend Deployment

- [ ] Set NODE_ENV=production
- [ ] Configure MONGODB_URI for production database
- [ ] Set secure JWT_SECRET (update from default)
- [ ] Verify CORS origin matches frontend URL
- [ ] Enable HTTPS in production
- [ ] Set up environment variables on hosting platform
- [ ] Configure database backups
- [ ] Enable database user authentication
- [ ] Set up SSL certificates
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging

### Frontend Deployment

- [ ] Build with `npm run build`
- [ ] Upload `dist/` folder to CDN/static hosting
- [ ] Update VITE_API_URL to production backend
- [ ] Update VITE_SOCKET_URL to production backend
- [ ] Configure custom domain
- [ ] Enable HTTPS
- [ ] Set up caching headers
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up analytics
- [ ] Test all API endpoints

---

## Troubleshooting

### Common Issues

#### "Port 5173 already in use"
```bash
# Frontend
kill process on port 5173 and try again
# Or change port in vite.config.js
```

#### "Cannot connect to MongoDB"
```bash
# Check MongoDB is running
mongosh

# Check MONGODB_URI in .env
# Default: mongodb://localhost:27017/dm-eas
```

#### "JWT errors"
```bash
# Ensure JWT_SECRET is set and > 32 characters
# Clear localStorage in browser
# Try logging in again
```

#### "CORS errors"
```bash
# Check FRONTEND_URL in backend .env
# Should be http://localhost:5173 for dev
```

#### "Socket.IO connection refused"
```bash
# Check backend is running
# Verify VITE_SOCKET_URL in frontend .env
# Check for firewall issues
```

---

## Documentation

- **API Documentation**: See `BACKEND_API.md`
- **Database Guide**: See `DATABASE_GUIDE.md`
- **Main README**: See `README.md`

---

## Support

For additional help:
1. Check browser console for errors
2. Check backend server logs
3. Review MongoDB logs
4. Check network requests in DevTools
5. Refer to documentation files

---

**Last Updated: February 2024**

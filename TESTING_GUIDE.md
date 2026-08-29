# Testing & Usage Guide

## 🧪 Manual Testing Procedures

### Part 1: Authentication Testing

#### Test 1.1: User Registration
1. Visit http://localhost:5173/register
2. Fill form:
   - Full Name: "Test User"
   - **User ID: "test_user_123"** (4-20 chars, alphanumeric + underscore)
   - Email: "test@example.com"
   - Phone: "9999999999"
   - Password: "password123"
   - Role: "Citizen"
3. Click "Register"
4. **Expected**: 
   - User ID validated on frontend (4-20 chars, letters/numbers/underscore)
   - Redirected to dashboard, see success toast
   - User profile shows userId

#### Test 1.2: User Registration with Invalid User ID
1. Visit http://localhost:5173/register
2. Try User ID: "ab" (too short)
3. **Expected**: Error message "User ID must be at least 4 characters"
4. Try User ID: "test@user" (invalid character)
5. **Expected**: Error message "User ID can only contain letters, numbers, and underscores"

#### Test 1.3: User Login with User ID
1. Visit http://localhost:5173/login
2. Email or User ID: "test_user_123"
3. Password: "password123"
4. Click "Login"
5. **Expected**: 
   - Input field shows "User ID detected"
   - Redirected to dashboard
   - Name appears in navbar

#### Test 1.4: User Login with Email
1. Visit http://localhost:5173/login
2. Email or User ID: "test@example.com"
3. Password: "password123"
4. Click "Login"
5. **Expected**: 
   - Input field shows "Email detected"
   - Redirected to dashboard
   - Name appears in navbar

#### Test 1.5: Login Error - Invalid User ID
1. Visit http://localhost:5173/login
2. Email or User ID: "nonexistent_user"
3. Password: "password123"
4. Click "Login"
5. **Expected**: Toast error "User not found"

#### Test 1.6: Login Error - Invalid Password
1. Visit http://localhost:5173/login
2. Email or User ID: "test_user_123"
3. Password: "wrongpassword"
4. Click "Login"
5. **Expected**: Toast error "Invalid password"

#### Test 1.7: Profile Access
1. Click user avatar in navbar
2. Click "Profile"
3. **Expected**: See user profile page with info

#### Test 1.4: Logout
1. Click user avatar in navbar
2. Click "Logout"
3. **Expected**: Redirected to login page

---

### Part 2: Incident Reporting

#### Test 2.1: Report Simple Incident
1. Click "Report Incident" in navbar
2. Fill form:
   - Title: "Building Fire"
   - Description: "A large fire is burning at the downtown building"
   - Type: "Fire"
   - Severity: "Critical"
   - Address: "123 Main Street"
3. Click "Report Incident"
4. **Expected**: Redirected to dashboard, incident appears in list

#### Test 2.2: Report Incident with Media
1. Click "Report Incident"
2. Fill form with incident details
3. Click "Upload Media" and select an image
4. **Expected**: Image thumbnail appears
5. Click "Report Incident"
6. **Expected**: Incident created with media

#### Test 2.3: View Reported Incident
1. On dashboard, click on your reported incident card
2. **Expected**: Incident detail page shows all information

---

### Part 3: Dashboard Features

#### Test 3.1: Filter by Type
1. Click filter dropdown for "Type"
2. Select "Fire"
3. **Expected**: Only fire incidents shown

#### Test 3.2: Filter by Status
1. Click filter dropdown for "Status"
2. Select "Reported"
3. **Expected**: Only reported incidents shown

#### Test 3.3: Filter by Severity
1. Click filter dropdown for "Severity"
2. Select "Critical"
3. **Expected**: Only critical incidents shown

#### Test 3.4: Clear Filters
1. Set multiple filters
2. Clear each filter
3. **Expected**: All incidents shown again

---

### Part 4: Map Features

#### Test 4.1: View Map
1. Click "Map View" in navbar
2. **Expected**: Interactive map loads with incidents
3. Verify:
   - Your location shows as marker
   - Search radius circle visible
   - Incident markers visible

#### Test 4.2: Interact with Map
1. On map, click incident marker
2. **Expected**: Popup shows incident details
3. Zoom in and out
4. **Expected**: Map responds smoothly
5. Pan around
6. **Expected**: Smooth panning

#### Test 4.3: View Incident from Map
1. Click incident marker popup
2. **Expected**: Incident details displayed in side panel

---

### Part 5: Analytics (Authority Role)

#### Test 5.1: Register as Authority
1. Visit /register
2. Create account:
   - Role: "Authority"
   - Department: "Fire"
3. Register
4. **Expected**: Account created as authority

#### Test 5.2: View Analytics
1. Login as authority user
2. Click "Analytics" in navbar
3. **Expected**: Analytics page loads with:
   - KPI cards showing totals
   - Pie chart by incident type
   - Bar chart by status
   - Bar chart by severity

#### Test 5.3: Verify Analytics Data
1. Check "Total Incidents" card
2. Verify number matches dashboard count
3. Check "SOS Alerts" count
4. **Expected**: Accurate counts

---

### Part 6: Real-Time Features

#### Test 6.1: Real-Time Incident Broadcast
1. Open dashboard in two browser windows
2. In window 1, create a new incident
3. In window 2, watch for notification
4. **Expected**: New incident appears in window 2 within seconds
5. Toast notification shown

#### Test 6.2: Real-Time Status Update
1. Create incident in window 1
2. In window 2 (as authority), update status
3. **Expected**: Window 1 shows updated status in real-time

#### Test 6.3: Live Comment Updates
1. Open incident in two windows
2. Add comment in window 1
3. **Expected**: Comment appears in window 2 immediately

---

### Part 7: Error Handling

#### Test 7.1: Invalid Login
1. Visit login page
2. Enter invalid credentials
3. Click "Login"
4. **Expected**: Error toast showing "Invalid email or password"

#### Test 7.2: Missing Required Fields
1. Visit incident report page
2. Leave title empty
3. Click "Report Incident"
4. **Expected**: Validation error shown

#### Test 7.3: Invalid Email Format
1. Register with email: "invalid-email"
2. **Expected**: Validation error shown

#### Test 7.4: Network Error Simulation
1. Stop backend server
2. Try to load incidents
3. **Expected**: Error message displayed

---

## 📝 API Testing with curl

### Test 1: Health Check
```bash
curl http://localhost:5000/api/health
```

### Test 2: Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "password123",
    "role": "citizen"
  }'
```

### Test 3: Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
# Copy token from response
```

### Test 4: Get Profile (insert token)
```bash
curl -H "Authorization: Bearer <token_here>" \
  http://localhost:5000/api/health
```

### Test 5: Create Incident
```bash
curl -X POST http://localhost:5000/api/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_here>" \
  -d '{
    "title": "Test Fire",
    "description": "Test incident description",
    "type": "fire",
    "severity": "high",
    "location": {
      "coordinates": [77.1025, 28.7041],
      "address": "Test Address"
    }
  }'
```

### Test 6: Get All Incidents
```bash
curl "http://localhost:5000/api/incidents?page=1&limit=10"
```

### Test 7: Get Nearby Incidents
```bash
curl "http://localhost:5000/api/incidents/nearby?longitude=77.1025&latitude=28.7041&radius=5000"
```

### Test 8: Get Statistics
```bash
curl http://localhost:5000/api/incidents/stats
```

---

## 🔗 Browser Developer Tools Testing

### Network Tab Testing
1. Open DevTools (F12)
2. Go to Network tab
3. Perform actions:
   - Register/Login - Check auth endpoint
   - Report incident - Check POST /incidents
   - View map - Check /nearby endpoint
4. **Expected**: All requests return 200 status

### Console Testing
1. Open DevTools Console
2. Check for errors
3. **Expected**: Only warnings from dependencies, no errors
4. Test Socket connection:
   ```javascript
   // In console
   console.log(socket) // Should show socket object
   ```

### Application Tab
1. Open Application tab
2. Go to Local Storage
3. Verify:
   - `token` is stored after login
   - `user` data is saved
4. Create new incident
5. Verify data is updated

---

## 🧪 Load Testing

### Simple Load Test
```bash
# Using Apache Bench (if installed)
ab -n 100 -c 10 http://localhost:5000/api/incidents

# Or use curl loop
for i in {1..10}; do
  curl http://localhost:5000/api/incidents &
done
```

### Expected Results
- Requests complete without errors
- Response time < 500ms
- No memory leaks

---

## 🔍 Common Testing Scenarios

### Scenario 1: Complete User Journey
```
1. Register → 2. Login → 3. Report Incident → 
4. View on Dashboard → 5. View on Map → 
6. Logout → 7. Login as Authority → 
8. View Analytics → 9. Logout
```

### Scenario 2: Real-Time Collaboration
```
Browser 1: Citizen reports incident
↓
Browser 2: Authority sees real-time notification
↓
Browser 2: Authority verifies incident
↓
Browser 1: Sees status update in real-time
```

### Scenario 3: Mobile Responsiveness
```
1. Open app on mobile browser
2. Test navigation
3. Report incident (test touch inputs)
4. View map (test zoom/pan)
5. View analytics (test responsive charts)
```

---

## ✅ Checklist for Testing

### Functionality Tests
- [ ] User can register
- [ ] User can login
- [ ] User can update profile
- [ ] Incident can be created
- [ ] Incident can be viewed
- [ ] Incident can be filtered
- [ ] Incident can be commented
- [ ] Real-time updates work
- [ ] Map shows incidents
- [ ] Analytics load correctly

### UI/UX Tests
- [ ] Buttons are clickable
- [ ] Animations are smooth
- [ ] Forms show validation errors
- [ ] Loading states display
- [ ] Error messages are clear
- [ ] Mobile layout works
- [ ] Images load correctly
- [ ] Links navigate properly

### Security Tests
- [ ] Can't access protected routes without login
- [ ] Token expires and requires re-login
- [ ] Can't modify other user's data
- [ ] Can't access admin features as citizen
- [ ] Passwords are not visible in console
- [ ] JWT tokens are secure

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] API responses < 500ms
- [ ] Map loads and zooms smoothly
- [ ] Real-time updates are instant
- [ ] No memory leaks
- [ ] No console errors

---

## 🐛 Debugging Tips

### Backend Debugging
1. Check server logs for errors
2. Use MongoDB Compass to inspect data
3. Check network requests in DevTools
4. Add console.log statements
5. Use Postman to test API endpoints

### Frontend Debugging
1. Check browser console for errors
2. Check DevTools Network tab
3. Check React DevTools extension
4. Inspect element for styling issues
5. Check localStorage for token

### Socket.IO Debugging
1. Check browser DevTools Console
2. Look for socket connection logs
3. Check backend logs for socket connections
4. Use Socket.IO client debugger
5. Check if rooms are being joined

---

## 📊 Test Results Template

```
Test: [Name]
Date: [Date]
Tester: [Name]
Browser: [Browser/Version]
Status: [Pass/Fail]
Notes: [Any issues found]

Steps:
1. [Step]
2. [Step]
3. [Step]

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Screenshots:
[Attach if failed]
```

---

**Last Updated: February 2024**
**Status: Ready for Testing ✅**

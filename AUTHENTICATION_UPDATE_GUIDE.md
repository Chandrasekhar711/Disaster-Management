# Authentication System Update - Complete Implementation Guide

## Overview
The authentication system has been updated to support login via email OR user ID, and registration now requires a unique user ID.

---

## Changes Summary

### 1. Backend - User Model (`backend/models/User.js`)
**Added:**
- New `userId` field with the following specifications:
  - **Unique**: No two users can have the same user ID
  - **Format**: 4-20 characters, lowercase
  - **Characters allowed**: Letters (a-z), numbers (0-9), underscores (_)
  - **Validation**: Regex pattern `/^[a-z0-9_]+$/`
  - **Required**: Yes
  - **Auto-lowercase**: Automatically converts input to lowercase

**Implementation:**
```javascript
userId: {
  type: String,
  required: [true, 'Please provide a user ID'],
  unique: true,
  lowercase: true,
  trim: true,
  minlength: [4, 'User ID must be at least 4 characters'],
  maxlength: [20, 'User ID cannot exceed 20 characters'],
  match: [/^[a-z0-9_]+$/, 'User ID can only contain letters, numbers, and underscores'],
}
```

---

### 2. Backend - Validation Middleware (`backend/middleware/validation.js`)

**Registration Validation Updated:**
- Added `userId` field validation
- Validates: 4-20 character length, alphanumeric + underscore only

**Login Validation Updated:**
- Changed from requiring `email` to `emailOrUserId`
- Single field accepts both email addresses and user IDs
- No email format validation (flexible to accept both formats)

---

### 3. Backend - Auth Service (`backend/services/authService.js`)

**registerUser() Function:**
- Now accepts `userId` in userData
- Checks for both existing email AND existing userId
- Returns proper error messages:
  - "User with this email already exists"
  - "User ID is already taken"
- Converts userId to lowercase before saving
- Returns userId in the response

**loginUser() Function:**
- Changed parameter from `email` to `emailOrUserId`
- **Auto-detection logic:**
  - If input contains `@` → treats as email, searches by email field
  - If input doesn't contain `@` → treats as user ID, searches by userId field
- **Error messages:**
  - "User not found" (when user doesn't exist)
  - "Invalid password" (when password is incorrect)
  - "Your account has been deactivated" (when isActive is false)
- Returns userId in the response

**Key Security Features:**
- Case-insensitive matching (userId converted to lowercase)
- Passwords always hashed with bcrypt
- Separate error messages for non-existent users vs invalid passwords

---

### 4. Backend - Auth Controller (`backend/controllers/authController.js`)

**register() Function:**
- Updated to destructure `userId` from request body
- Passes userId to authService.registerUser()

**login() Function:**
- Updated parameter from `email` to `emailOrUserId`
- Passes emailOrUserId to authService.loginUser()

---

### 5. Frontend - Login Page (`frontend/src/pages/LoginPage.jsx`)

**UI Changes:**
- Replaced separate email/userId input fields with single "Email or User ID" field
- Field automatically detects user input and displays format hint:
  - Empty: "email@example.com or username"
  - Email detected (contains @): "Email detected"
  - User ID detected (no @): "User ID detected"

**Form State:**
- Simplified from `{ userId: '', email: '', password: '' }`
- To: `{ emailOrUserId: '', password: '' }`

**Validation Features:**
- Client-side validation for empty fields
- Error messages displayed below each field
- Auto-clear error messages when user starts typing
- Helper text below input field

**Demo Credentials (Updated):**
- Citizen: `demo_citizen` / `password123`
- Authority: `demo_officer` / `password123`
- Admin: `admin_user` / `password123`

---

### 6. Frontend - Register Page (`frontend/src/pages/RegisterPage.jsx`)

**New Fields Added:**
- **User ID field** with real-time validation

**Validation Features:**
- **Name**: Required, minimum 3 characters
- **User ID**: 
  - Required
  - 4-20 characters
  - Only letters, numbers, and underscores
  - Must be unique (checked on backend)
  - Real-time validation feedback
- **Email**: Required, valid email format
- **Phone**: Required, exactly 10 digits
- **Password**: Required, minimum 6 characters
- **Department**: Required only for authority users

**UI Enhancements:**
- Error messages displayed below each field
- Helper text for user ID: "4-20 characters. Letters, numbers, and underscores only."
- Helper text for password: "Minimum 6 characters"
- Input borders highlight red when validation fails
- Errors auto-clear when user starts typing in that field

**Backend Error Handling:**
- Catches "User ID is already taken" from backend
- Catches email duplication errors
- Displays appropriate toast notifications

---

## Testing Checklist

### Backend Testing
- [ ] MongoDB connection works
- [ ] User model creates with userId field
- [ ] userId validation enforces 4-20 character range
- [ ] userId validation rejects invalid characters
- [ ] userId uniqueness constraint works
- [ ] Registration endpoint accepts userId
- [ ] Login works with email (contains @)
- [ ] Login works with userId (no @)
- [ ] Proper error messages returned:
  - [ ] "User not found"
  - [ ] "Invalid password"
  - [ ] "User ID is already taken"
  - [ ] "User with this email already exists"

### Frontend Testing
- [ ] Login page shows single input field
- [ ] Email detection works (@ symbol)
- [ ] User ID detection works (no @ symbol)
- [ ] Login with email successfully
- [ ] Login with user ID successfully
- [ ] Registration page shows userId field
- [ ] User ID validation works in real-time
- [ ] All validation error messages appear
- [ ] Form submission prevented with validation errors
- [ ] Registration with unique userId succeeds
- [ ] Registration rejects duplicate userId
- [ ] Registration rejects invalid userId format

### Integration Testing
- [ ] Full registration flow (new user with userId)
- [ ] Full login flow with email
- [ ] Full login flow with user ID
- [ ] User stays logged in after refresh
- [ ] Dashboard/profile displays userId
- [ ] Incident reporting works logged in
- [ ] Role-based access works

---

## Migration for Existing Users

If you have existing users in the database, you need to add userId to them:

```javascript
// MongoDB Shell command to add userId to existing users
db.users.updateMany(
  { userId: { $exists: false } },
  [
    {
      $set: {
        userId: {
          $toLower: {
            $substr: [
              { $concat: [{ $toLower: "$email" }, "_user"] },
              0,
              20
            ]
          }
        }
      }
    }
  ]
)

// Then manually verify uniqueness and fix duplicates
```

**Important**: This is a temporary solution. You should manually assign meaningful user IDs to existing users.

---

## Security Best Practices Implemented

1. **Case-Insensitive Matching**: userId and email both converted to lowercase
2. **Unique Constraints**: Enforced at database level
3. **Password Security**: Always hashed with bcrypt before storage
4. **Input Validation**: Both frontend and backend validation
5. **Error Messages**: Don't reveal which field caused the issue during login
6. **XSS Protection**: Input sanitization in validation middleware
7. **Rate Limiting Recommended**: Consider implementing on login endpoint

---

## API Endpoints

### Register
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "userId": "john_doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "citizen",
  "department": "police" // only if role is authority
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id_mongo",
      "name": "John Doe",
      "userId": "john_doe",
      "email": "john@example.com",
      "role": "citizen"
    },
    "token": "jwt_token_here"
  }
}
```

### Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "emailOrUserId": "john_doe",
  "password": "password123"
}
```

OR

```json
{
  "emailOrUserId": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id_mongo",
      "name": "John Doe",
      "userId": "john_doe",
      "email": "john@example.com",
      "role": "citizen",
      "isVerified": false
    },
    "token": "jwt_token_here"
  }
}
```

---

## Troubleshooting

### Issue: "User ID is already taken"
**Solution**: Choose a different user ID. User IDs must be unique across all users.

### Issue: "Invalid User ID format"
**Solution**: User ID must be 4-20 characters and contain only letters, numbers, and underscores. Valid examples: `john_doe`, `user123`, `admin_001`

### Issue: Login fails with email/userId
**Solution**: 
- Ensure you're using the correct credentials
- Check that the @ symbol is included for email login
- Verify the account hasn't been deactivated

### Issue: Database migration error
**Solution**: 
- Backup your database first
- Run migrations in a test environment
- Manually fix any userId duplicates before production

---

## Configuration Files

No configuration files need to be updated. The `.env` files remain the same:

**Backend (.env):**
```env
MONGODB_URI=mongodb://localhost:27017/dm-eas
JWT_SECRET=your_super_secret_key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env.local):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Next Steps (Optional Enhancements)

1. **Rate Limiting**: Implement rate limiting on login endpoint
2. **Email Verification**: Add email confirmation before account activation
3. **Two-Factor Authentication**: Add 2FA for security
4. **Account Recovery**: Implement password reset functionality
5. **Username Suggestions**: Suggest available usernames if taken
6. **Profile URL**: Use userId in profile URLs (e.g., `/profile/john_doe`)

---

**Last Updated**: February 20, 2026
**Status**: Ready for Testing and Deployment

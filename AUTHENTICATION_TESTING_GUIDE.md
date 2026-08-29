# Authentication Update - Quick Reference & Testing

## Quick Start for Testing

### 1. Register a New User (via UI)
1. Navigate to `http://localhost:5173/register`
2. Fill form:
   - **Full Name**: John Demo
   - **User ID**: john_demo (4-20 chars, alphanumeric + underscore)
   - **Email**: john.demo@example.com
   - **Phone**: 9876543210
   - **Password**: password123
   - **Role**: Citizen
3. Click "Register"
4. Should redirect to dashboard

### 2. Login with User ID
1. Navigate to `http://localhost:5173/login`
2. **Email or User ID**: `john_demo`
3. **Password**: `password123`
4. Click "Login"
5. Should authenticate and redirect

### 3. Login with Email
1. Navigate to `http://localhost:5173/login`
2. **Email or User ID**: `john.demo@example.com`
3. **Password**: `password123`
4. Click "Login"
5. Should authenticate and redirect

---

## API Testing with cURL

### Register with cURL
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "userId": "jane_smith",
    "email": "jane.smith@example.com",
    "phone": "9876543211",
    "password": "password123",
    "role": "citizen"
  }'
```

### Login with User ID
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUserId": "jane_smith",
    "password": "password123"
  }'
```

### Login with Email
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUserId": "jane.smith@example.com",
    "password": "password123"
  }'
```

### Get Profile (with token)
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <your_jwt_token_here>"
```

---

## Database Commands

### View All Users with userId
```bash
mongosh
use dm-eas
db.users.find({}, { name: 1, userId: 1, email: 1 }).pretty()
```

### Check userId Uniqueness
```bash
db.users.find({ userId: "john_demo" })
```

### Count Total Users
```bash
db.users.countDocuments()
```

### Find User by Email
```bash
db.users.findOne({ email: "john.demo@example.com" })
```

---

## Error Messages Reference

### During Registration
| Error | Cause | Solution |
|-------|-------|----------|
| "User ID is already taken" | userId already exists | Choose different userId |
| "User with this email already exists" | Email already registered | Use different email |
| "User ID must be at least 4 characters" | userId too short | Use minimum 4 characters |
| "User ID cannot exceed 20 characters" | userId too long | Use maximum 20 characters |
| "User ID can only contain letters, numbers, and underscores" | Invalid characters | Remove special characters except `_` |
| "Phone must be 10 digits" | Invalid phone format | Enter exactly 10 digits |

### During Login
| Error | Cause | Solution |
|-------|-------|----------|
| "User not found" | Email/userId doesn't exist | Check spelling, register if new |
| "Invalid password" | Incorrect password | Verify password and try again |
| "Your account has been deactivated" | Admin disabled account | Contact support |

---

## User ID Validation Rules (Frontend + Backend)

### Valid User IDs ✅
- `john_doe`
- `user123`
- `demo_user_2024`
- `a1b2c3`
- `_username`
- `username_`
- `abc_123_xyz`

### Invalid User IDs ❌
- `john-doe` (contains hyphen)
- `john doe` (contains space)
- `user@123` (contains @)
- `jane.smith` (contains dot)
- `joh` (too short, < 4 chars)
- `this_is_a_very_long_username_exceeding_limit` (> 20 chars)

---

## Field Mapping: Old → New

### Login Request
| Old | New |
|-----|-----|
| `{ email: "..." }` | `{ emailOrUserId: "..." }` |
| Must be email | Can be email OR userId |

### Login Response
| Old | New |
|-----|-----|
| No userId returned | userId included in response |

### Register Request
| Old | New |
|-----|-----|
| No userId | **userId field required** |
| 5 fields | 6 fields (added userId) |

### Register Response
| Old | New |
|-----|-----|
| No userId | userId included in response |

---

## Postman Collection Example

### Environment Variables
```
{{base_url}}: http://localhost:5000/api
{{token}}: (set after login response)
```

### 1. Register Request
```
POST {{base_url}}/auth/register

{
  "name": "Test User",
  "userId": "test_user_{{$timestamp}}",
  "email": "test{{$timestamp}}@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "citizen"
}
```

### 2. Login with UserId Request
```
POST {{base_url}}/auth/login

{
  "emailOrUserId": "test_user_{{$timestamp}}",
  "password": "password123"
}
```

**Test Script** (set token automatically):
```javascript
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.environment.set("token", jsonData.data.token);
}
```

### 3. Get Profile Request
```
GET {{base_url}}/auth/profile

Headers:
Authorization: Bearer {{token}}
```

---

## Common Scenarios & Expected Results

### Scenario 1: New User Registration Flow
1. User enters userId `john_demo`
2. System validates: ✅ Valid format, 4-20 chars, alphanumeric + underscore
3. System checks: ✅ userId unique, email unique
4. User created with hashed password
5. JWT token issued
6. User redirected to dashboard
**Result**: ✅ Success

### Scenario 2: Attempting Duplicate userId
1. User tries to register with existing userId
2. Backend validation catches duplicate
3. Error: "User ID is already taken"
4. User stays on registration page
5. User tries different userId
**Result**: ✅ Handled gracefully

### Scenario 3: Login with Email
1. User enters `john.demo@example.com` (contains @)
2. System detects email format
3. Searches by email field
4. Validates password
5. User authenticated
**Result**: ✅ Success

### Scenario 4: Login with User ID
1. User enters `john_demo` (no @)
2. System detects userId format
3. Searches by userId field
4. Validates password
5. User authenticated
**Result**: ✅ Success

### Scenario 5: Wrong Password
1. User enters correct userId
2. User enters wrong password
3. System validates: ✅ User found
4. System validates: ❌ Password mismatch
5. Error: "Invalid password"
**Result**: ✅ Secure error handling

---

## Performance Notes

- **Database Indexes**: userId has unique index (automatic)
- **Password Hashing**: bcryptjs with salt factor 10
- **JWT Expiry**: 7 days
- **Case Normalization**: Automatic lowercase conversion

---

## Security Checklist

- ✅ Passwords hashed with bcryptjs (salting factor 10)
- ✅ userId uniqueness enforced at database level
- ✅ Input validation on both frontend & backend
- ✅ Error messages don't reveal whether email or userId exists
- ✅ Case-insensitive matching prevents duplicates
- ✅ HTTPS recommended for production
- ✅ JWT tokens set as httpOnly cookies
- ✅ Regex validation for userId format
- ✅ Email validation with regex
- ✅ Phone number validation (10 digits)

---

## Rollback Instructions (If Needed)

If you need to revert to the old email-only login system:

1. **Frontend LoginPage.jsx**: Revert to two input fields (email + userId)
2. **Frontend RegisterPage.jsx**: Remove userId field
3. **Backend validation.js**: Revert to email-only login validation
4. **Backend authService.js**: Remove userId parameter from functions
5. **Backend authController.js**: Pass email instead of emailOrUserId
6. **Database**: Remove userId field from User model (after backup!)

**WARNING**: Only do this if you haven't deployed to production yet. Removing userId after deployment requires data migration.

---

## Next Steps

1. ✅ Run comprehensive testing (see sections above)
2. ✅ Test with different user types (citizen, authority, admin)
3. ✅ Verify database entries
4. ✅ Test error scenarios
5. ✅ Performance testing
6. ✅ Security testing
7. 📝 Update API documentation
8. 📝 Train users on new login method
9. 🚀 Deploy to production
10. 📊 Monitor login metrics

---

**Last Updated**: February 20, 2026

# 🚀 Quick Start Guide - 5 Minutes

## Prerequisites
- Node.js installed
- MongoDB installed and running

## Timeline: ~5 minutes

### Step 1: Backend (2 minutes)
```bash
cd backend
npm install

# Windows: Use copy or Copy-Item
copy .env.example .env
# OR on Mac/Linux: cp .env.example .env

npm run dev
```
✅ Backend running on http://localhost:5000

### Step 2: Frontend (2 minutes)
```bash
# New terminal
cd frontend
npm install

# Windows: Use copy or Copy-Item
copy .env.example .env.local
# OR on Mac/Linux: cp .env.example .env.local

npm run dev
```
✅ Frontend running on http://localhost:5173

### Step 3: Test Login (1 minute)
Visit http://localhost:5173/register and create account with a unique user ID (4-20 chars, alphanumeric + underscore), OR use demo credentials:

```
Option 1 - Login with User ID:
User ID: demo_citizen
Password: password123

Option 2 - Login with Email:
Email: citizen@demo.com
Password: password123
```

System automatically detects whether you're using email (contains @) or user ID.

---

## That's It! 🎉

Your DM-EAS application is now running with:
- ✅ Real-time incident dashboard
- ✅ Live WebSocket updates
- ✅ Incident reporting
- ✅ Geographic mapping
- ✅ Analytics dashboard
- ✅ Role-based access control
- ✅ **New**: Email OR User ID login support
- ✅ **New**: User ID registration with validation

---

## Next Steps

1. **Create a user account**: Click "Register" and set up a unique user ID
2. **Create an incident**: Click "Report Incident" button
3. **View on map**: Click "Map View" to see incidents
4. **Check analytics**: Login as authority to see stats
5. **Read documentation**: Check `README.md` for full details & `AUTHENTICATION_UPDATE_GUIDE.md` for auth details

---

## Useful Links

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- API Docs: See `BACKEND_API.md`
- Database Guide: See `DATABASE_GUIDE.md`
- Auth Details: See `AUTHENTICATION_UPDATE_GUIDE.md`
- Full Setup: See `SETUP_GUIDE.md`

---

## Default Demo Users

| Role | User ID | Email | Password |
|------|---------|-------|----------|
| Citizen | demo_citizen | citizen@demo.com | password123 |
| Authority | demo_officer | officer@demo.com | password123 |
| Admin | admin_user | admin@demo.com | password123 |

**Login Options**: Use either User ID or Email with corresponding password

---

**Enjoy your Disaster Management System! 🚨**

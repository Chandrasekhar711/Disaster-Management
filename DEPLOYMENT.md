# IMSD — Production Deployment Guide
**Disaster Management & Emergency Alert System (IMSD)**

Deploying IMSD with **Vercel** (Frontend SPA) + **Render** (Node.js Backend & WebSockets) + **MongoDB Atlas** (Cloud Database).

---

## 1. System Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                   Citizen / Authority                    │
│            Browser Client (Desktop / Mobile)             │
└────────────────────────────┬─────────────────────────────┘
                             │ HTTPS / WSS
                             ▼
┌──────────────────────────────────────────────────────────┐
│                     Vercel Frontend                      │
│        React 18 + Vite + TailwindCSS + Leaflet Map       │
│           (Domain: https://your-app.vercel.app)          │
└────────────────────────────┬─────────────────────────────┘
                             │ REST API & WebSocket Events
                             ▼
┌──────────────────────────────────────────────────────────┐
│                     Render Web Service                   │
│        Node.js + Express + Socket.IO Server              │
│        (Domain: https://your-backend.onrender.com)       │
└──────────────┬────────────────────────────┬──────────────┘
               │ Mongoose / 2dsphere        │ REST / Webhook
               ▼                            ▼
┌──────────────────────────────┐ ┌─────────────────────────┐
│     MongoDB Atlas Cluster    │ │    External Services    │
│  - Admins & Authorities      │ │ - Twilio WhatsApp Alert │
│  - Citizens & Incidents      │ │ - Sightengine AI        │
│  - Geospatial 2dsphere Index │ │ - OpenStreetMap OSM/OSRM│
└──────────────────────────────┘ └─────────────────────────┘
```

---

## 2. Step 1: Database Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in.
2. Click **Create Cluster** (Select Shared M0 Free Tier).
3. Under **Security Quickstart**:
   - Create a database user with username (e.g. `imsd_admin`) and a strong password.
   - Choose **Password** authentication.
4. Under **Network Access**:
   - Add IP Address: `0.0.0.0/0` (Allow Access from Anywhere - required for Render cloud IPs).
5. Click **Connect** -> **Drivers** -> **Node.js**:
   - Copy your connection string. It will look like:
     ```text
     mongodb+srv://imsd_admin:<password>@cluster0.xxxxx.mongodb.net/dm-eas?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your database user password and specify `/dm-eas` as the database name.

---

## 3. Step 2: Backend Deployment (Render)

1. Push your project code to GitHub or GitLab.
2. Sign in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. Configure the Web Service:
   * **Name:** `imsd-backend` (or your preferred name)
   * **Region:** Choose closest region (e.g. Singapore / Frankfurt / Oregon)
   * **Branch:** `main`
   * **Root Directory:** `backend`
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
   * **Instance Type:** Free

6. Add the following **Environment Variables** in Render:

| Variable Name | Value / Description | Required? |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | **Yes** |
| `PORT` | `10000` *(Render sets this automatically, default fallback is 5000)* | **Yes** |
| `MONGODB_URI` | `mongodb+srv://imsd_admin:<password>@cluster0.xxxxx.mongodb.net/dm-eas?retryWrites=true&w=majority` | **Yes** |
| `JWT_SECRET` | `your_ultra_secure_random_jwt_secret_minimum_32_characters_long` | **Yes** |
| `JWT_EXPIRE` | `7d` | **Yes** |
| `FRONTEND_URL` | `https://your-app.vercel.app,http://localhost:5173` | **Yes** |
| `DEFAULT_ADMIN_NAME` | `System Administrator` | **Yes** |
| `DEFAULT_ADMIN_USERID` | `admin_user` | **Yes** |
| `DEFAULT_ADMIN_EMAIL` | `admin@demo.com` | **Yes** |
| `DEFAULT_ADMIN_PASSWORD` | `AdminPass@123` | **Yes** |
| `DEFAULT_ADMIN_DEPARTMENT` | `admin` | **Yes** |
| `TWILIO_ACCOUNT_SID` | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | *Optional (for WhatsApp)* |
| `TWILIO_AUTH_TOKEN` | `your_twilio_auth_token` | *Optional (for WhatsApp)* |
| `TWILIO_PHONE_NUMBER` | `+14155238886` | *Optional (for WhatsApp)* |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+14155238886` | *Optional (for WhatsApp)* |
| `WHATSAPP_ALERT_RECIPIENTS`| `+919876543210,+919123456780` | *Optional (for WhatsApp)* |
| `SIGHTENGINE_API_USER` | `your_sightengine_api_user` | *Optional (for AI Check)* |
| `SIGHTENGINE_API_SECRET` | `your_sightengine_api_secret` | *Optional (for AI Check)* |
| `HUGGINGFACE_API_KEY` | `hf_xxxxxxxxxxxxxxxxxxxx` | *Optional (for AI Check)* |

7. Click **Deploy Web Service**.
8. Note your Render URL (e.g., `https://imsd-backend.onrender.com`).

---

## 4. Step 3: Frontend Deployment (Vercel)

1. Sign in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. Configure the Project:
   * **Framework Preset:** `Vite`
   * **Root Directory:** `frontend` *(Click Edit and select the frontend folder)*
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
   * **Install Command:** `npm install`

5. Add **Environment Variables** in Vercel:

| Variable Name | Value | Required? |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://imsd-backend.onrender.com/api` | **Yes** |
| `VITE_SOCKET_URL` | `https://imsd-backend.onrender.com` | **Yes** |

*(Replace `https://imsd-backend.onrender.com` with your actual Render URL)*

6. Click **Deploy**.
7. Once deployed, copy your Vercel URL (e.g. `https://imsd-disaster.vercel.app`) and update `FRONTEND_URL` on Render to include your Vercel domain.

---

## 5. Local Development Testing

To run both services locally:

### Start Backend:
```bash
cd backend
npm install
npm run dev
# Running on http://localhost:5000
```

### Start Frontend:
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## 6. Pre-Configured Demo Accounts

When the backend boots for the first time, it automatically creates the default administrator:

* **Role:** Administrator
* **User ID:** `admin_user`
* **Email:** `admin@demo.com`
* **Password:** `123456` (or the value of `DEFAULT_ADMIN_PASSWORD`)

---

## 7. Hackathon Demo Checklist

- [x] **Public Live Map (`/` or `/incidents/map`):** Anyone can see active incidents without login.
- [x] **Citizen Registration (`/register`):** Creates Citizen accounts with role validation.
- [x] **Citizen Login (`/login`):** Universal login with userId or email.
- [x] **Incident Reporting (`/report`):**
  - Text-only report (`/without-media`)
  - File attachment report (`/`) with images/videos
  - Camera capture report (`/with-camera-capture`) with AI Verification
- [x] **Interactive Location Picker:** Leaflet GPS tracking & reverse geocoding via OpenStreetMap.
- [x] **Emergency SOS Trigger:** Instant priority escalation to Critical and WhatsApp dispatch.
- [x] **Citizen Incident Tracking (`/my-reports` & `/incidents/:id`):** Status timeline and comments.
- [x] **Authority Dashboard (`/authority`):** Department-specific review, assignment, and status updates.
- [x] **Admin Control Panel (`/admin`):** Officer provisioning, approvals, user deactivation, and incident deletion.
- [x] **System Analytics (`/analytics`):** Real-time disaster distribution and resolution metrics.

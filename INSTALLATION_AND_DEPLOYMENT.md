# JANGRA NIOS SERVICES — Installation, Local Setup & Live Hosting Guide

## 1. Architecture Overview
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, `@vis.gl/react-google-maps`, `jsPDF`, `SheetJS (xlsx)`
- **Backend**: Node.js + Express (`server.ts`) with:
  - Secure `scrypt` password hashing & HMAC-signed HTTP-only session cookies
  - CSRF header token enforcement
  - Server-side file validation (JPG, JPEG, PNG, PDF, DOC, DOCX; max 1 MB per document)
  - Restricted administrator-only access control for sensitive Aadhaar documents (`uploads/secure_docs/`)
  - Razorpay HMAC-SHA256 payment verification & UPI checkout flow
  - Relational SQL persistence (`node:sqlite` out of the box, plus MySQL 8.0 schema in `database/jangra_nios_services.sql`) and Firebase Firestore public catalog sync.

---

## 2. Running Locally on Your Computer

### Prerequisites
- **Node.js 22+** (`node -v`)
- **npm 10+**

### Step-by-Step Local Setup
1. **Clone / Extract the Source Code** and open a terminal inside the project folder.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Create `.env` from `.env.example`**:
   ```bash
   cp .env.example .env
   ```
   Fill in:
   - `SESSION_SECRET`: any long random string
   - `VITE_GOOGLE_MAPS_API_KEY`: your Google Maps JavaScript API key (for the Contact Us map)
   - `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`: optional live Razorpay merchant credentials (if omitted, verified UPI / Razorpay Test Checkout is active)
4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

### Optional: Importing the MySQL Schema
If you are migrating to a standalone MySQL 8.0 server:
```bash
mysql -u root -p < database/jangra_nios_services.sql
```

---

## 3. Default Portal Accounts (Change Immediately in Production)
- **Administrator Portal**:
  - Email: `admin@jangranios.com`
  - Password: `Admin@Jangra2026`
- **Sample Student Portal**:
  - Student ID: `JNS-2026-1001`
  - Password: `Student@123`

---

## 4. Uploading to a Live Hosting Server (VPS / Cloud Run / Render / Railway)
1. **Build the Frontend Bundle**:
   ```bash
   npm run build
   ```
2. **Set Environment Variables** on your hosting dashboard (`PORT=3000`, `NODE_ENV=production`, `SESSION_SECRET`, `VITE_GOOGLE_MAPS_API_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).
3. **Ensure Persistent Volume Storage**:
   Mount persistent storage for `data/` (SQL database) and `uploads/` (uploaded student documents).
4. **Start Production Server**:
   ```bash
   npm start
   ```
5. **Enable HTTPS**: Configure Nginx/Caddy or platform TLS so session cookies (`HttpOnly`, `SameSite=Lax`, `Secure`) run over HTTPS.

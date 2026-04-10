# Fixora — Mobile Repair Job Card Management System

Internal repair tracking system for Fixora shop.

---

## Project Structure

```
fixora/
├── supabase_schema.sql     ← Run this in Supabase SQL editor first
├── backend/                ← Node.js + Express API
│   ├── server.js
│   ├── routes/jobCards.js
│   ├── lib/supabase.js
│   ├── lib/whatsapp.js     ← Stub for Stage 2
│   └── .env.example
└── frontend/               ← React (Vite)
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── lib/api.js
        ├── components/
        │   ├── Common.jsx
        │   ├── Sidebar.jsx
        │   └── JobCardModal.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── NewJobCard.jsx
            ├── AllJobCards.jsx
            ├── ReadyJobCards.jsx
            ├── DeliveredJobCards.jsx
            └── Search.jsx
```

---

## Setup Instructions

### Step 1 — Supabase

1. Go to https://supabase.com and create a new project
2. Open the **SQL Editor**
3. Paste and run the contents of `supabase_schema.sql`
4. Go to **Project Settings → API** and copy:
   - Project URL
   - `service_role` secret key (not the anon key)

### Step 2 — Backend

```bash
cd backend
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
npm install
npm run dev        # Development
npm start          # Production
```

Backend runs on `http://localhost:4000`

### Step 3 — Frontend

```bash
cd frontend
npm install
npm run dev        # Development → http://localhost:5173
npm run build      # Production build → dist/
```

The Vite dev server proxies `/api` to `http://localhost:4000` automatically.

---

## Deployment (Render)

### Backend
- Create a new **Web Service** on Render
- Root directory: `backend`
- Build command: `npm install`
- Start command: `node server.js`
- Add environment variables from `.env`

### Frontend
- Create a new **Static Site** on Render
- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Add env var: `VITE_API_URL=https://your-backend.onrender.com`
  - Also update `vite.config.js` proxy target for production

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/job-cards/dashboard` | Dashboard summary + today's enquiries |
| GET | `/api/job-cards` | List all (supports `?status=`, `?search=`, `?date=`) |
| GET | `/api/job-cards/ready` | Ready for delivery cards |
| GET | `/api/job-cards/delivered` | Delivered cards |
| GET | `/api/job-cards/:id` | Single card with status log |
| POST | `/api/job-cards` | Create new job card |
| PATCH | `/api/job-cards/:id` | Update job card / status |

---

## Job Card ID Format

`FX-{YEAR}-{5-digit-sequence}`  
Example: `FX-2026-00001`, `FX-2026-00042`

Sequence resets each calendar year. Handled by a PostgreSQL function (`next_job_card_id()`).

---

## WhatsApp Integration (Stage 2)

The integration is stubbed in `backend/lib/whatsapp.js`.

When ready:
1. Set up Meta Business account + WhatsApp Cloud API
2. Get templates approved for each status transition
3. Add `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` to `.env`
4. Uncomment the fetch block in `whatsapp.js`

Notification log is already being written to the `whatsapp_log` table on every status change.

---

## Status Flow

```
Pending → In Progress → Ready for Delivery → Delivered
                     ↘ Delayed
                     ↘ Returned
```

Every status change is logged in `job_card_status_log` and a WhatsApp notification is triggered (stubbed in Stage 1).

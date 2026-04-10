# Fixora — Mobile Repair Management System

A full-stack web application for managing mobile device repair job cards. Built for repair shops to track devices from intake to delivery, manage technicians, and give customers live repair status updates.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js, Express |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT, email/password) |
| Icons | Lucide React |
| Fonts | Syne (headings), DM Sans (body) |

---

## Features

### Job Card Management
- Create detailed repair job cards with ~25 fields across 7 sections
- Auto-generated job card IDs in format `FX-{YEAR}-{00001}`
- Full edit history — every field change is tracked and timestamped
- Status flow: `Pending → In Progress → Ready for Delivery → Delivered` with `Delayed`, `Returned`, `Cancelled` branches
- Every status change logged with timestamp in activity log

### Job Card Fields
- **Customer** — salutation, name, mobile (with country code), alternate mobile, address
- **Device** — brand, model, color, IMEI status, pattern/password
- **Condition checklist** — power, touch, display, device condition, data backup
- **Service** — reported issue, remarks, technician, ETA
- **Financial** — estimated amount, advance collected, balance due

### Dashboard
- Live summary cards for all 7 statuses (color-coded per status)
- Today's enquiries table
- Quick access to open any job card

### Multi-User Authentication
- **Admin** — full access to all features and all job cards
- **Technician** — restricted view; sees only their assigned jobs; can update status only
- JWT-based auth, token stored in localStorage
- In-app user management (admin creates/deletes users)
- Theme preference saved per user profile

### Technician Features
- Quick status one-click buttons inside job card modal
- Mobile-responsive layout with hamburger sidebar
- Filtered views — only assigned jobs shown

### Search & Filtering
- Search by job card ID, customer name, phone number, device model
- Filter by status, date, technician
- Dedicated pages for Ready for Delivery and Delivered queues

### Analytics (Admin only)
- **Revenue dashboard** — total estimated, advance collected, pending collection, avg repair value
- **Monthly breakdown** — jobs, deliveries, and revenue trend by month
- **Technician performance** — total jobs, delivered, active, delayed, avg turnaround days, completion rate
- Period selector: This Week / This Month / Last 3 Months / This Year / All Time

### Customer Portal
- Public tracking page at `/track/{job-card-id}` — no login required
- Shows current status with color-coded icon, 4-step progress bar
- Status history timeline with timestamps
- Technician remarks visible to customer
- Sensitive data (phone, password, financials) is never exposed
- **Share button** in job card modal copies the tracking link to clipboard

### Print / PDF
- Print any job card as a formatted A4/thermal-friendly slip
- Includes customer info, device checklist, financials, balance due, signature line
- Auto-triggers browser print dialog

### Cancel Job
- Cancel any active job card from the All Job Cards table
- Custom confirmation modal (not a browser alert)
- Cancelled status is distinct from Returned — device never came back vs repair abandoned

### Brand & Model Management
- Dropdown-driven brand and model selection
- Inline "Add" button to register new brands/models on the fly
- Stored in Supabase, shared across all users

### Dark / Light Mode
- Toggle in sidebar, saved per user profile
- Syncs across sessions and devices on login

---

## Project Structure

```
fixora/
├── supabase_schema.sql        ← Run in Supabase SQL editor first
├── backend/
│   ├── server.js
│   ├── middleware/
│   │   └── auth.js            ← JWT verification, role checks
│   ├── routes/
│   │   ├── auth.js            ← Login, /me, profile update
│   │   ├── jobCards.js        ← Full CRUD + activity log
│   │   ├── users.js           ← Admin user management
│   │   ├── options.js         ← Brands & models
│   │   ├── analytics.js       ← Revenue & technician stats
│   │   └── public.js          ← Unauthenticated tracking endpoint
│   ├── lib/
│   │   ├── supabase.js
│   │   └── whatsapp.js        ← Stub for Stage 2
│   └── seed.js                ← Sample data script
└── frontend/
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── index.css
        ├── contexts/
        │   └── AuthContext.jsx
        ├── lib/
        │   ├── api.js
        │   └── printJobCard.js
        ├── components/
        │   ├── Common.jsx       ← Badge, Toast, ConfirmModal, PhoneInput, etc.
        │   ├── Sidebar.jsx
        │   └── JobCardModal.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── NewJobCard.jsx
            ├── AllJobCards.jsx
            ├── ReadyJobCards.jsx
            ├── DeliveredJobCards.jsx
            ├── Search.jsx
            ├── Analytics.jsx
            ├── Users.jsx
            ├── Login.jsx
            └── TrackJobCard.jsx  ← Public, no auth
```

---

## Setup

### 1 — Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run `supabase_schema.sql`
3. Run additional migrations:
```sql
-- Edit log table
CREATE TABLE IF NOT EXISTS job_card_edit_log (
  id           SERIAL PRIMARY KEY,
  job_card_id  TEXT NOT NULL REFERENCES job_cards(job_card_id) ON DELETE CASCADE,
  field_name   TEXT NOT NULL,
  old_value    TEXT,
  new_value    TEXT,
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE POLICY "service_role_all" ON job_card_edit_log FOR ALL USING (true);
ALTER TABLE job_card_edit_log ENABLE ROW LEVEL SECURITY;

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name  TEXT NOT NULL,
  role  TEXT NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'technician')),
  theme TEXT DEFAULT 'dark'
);
CREATE POLICY "service_role_all" ON user_profiles FOR ALL USING (true);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Device brands & models
CREATE TABLE IF NOT EXISTS device_brands (
  id    SERIAL PRIMARY KEY,
  name  TEXT UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS device_models (
  id    SERIAL PRIMARY KEY,
  brand TEXT NOT NULL,
  name  TEXT NOT NULL,
  UNIQUE(brand, name)
);
CREATE POLICY "service_role_all" ON device_brands FOR ALL USING (true);
CREATE POLICY "service_role_all" ON device_models FOR ALL USING (true);
ALTER TABLE device_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_models ENABLE ROW LEVEL SECURITY;

-- Additional job card columns
ALTER TABLE job_cards
  ADD COLUMN IF NOT EXISTS salutation       TEXT,
  ADD COLUMN IF NOT EXISTS alt_mobile_no    TEXT,
  ADD COLUMN IF NOT EXISTS address          TEXT,
  ADD COLUMN IF NOT EXISTS color            TEXT,
  ADD COLUMN IF NOT EXISTS pattern_password TEXT,
  ADD COLUMN IF NOT EXISTS imei_status      TEXT,
  ADD COLUMN IF NOT EXISTS power_status     TEXT,
  ADD COLUMN IF NOT EXISTS touch_status     TEXT,
  ADD COLUMN IF NOT EXISTS display_status   TEXT,
  ADD COLUMN IF NOT EXISTS device_condition TEXT,
  ADD COLUMN IF NOT EXISTS data_backup      TEXT,
  ADD COLUMN IF NOT EXISTS estimated_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS advance_amount   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS confirm_estimated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS prepared_by      TEXT;

-- Cancelled status
ALTER TABLE job_cards DROP CONSTRAINT IF EXISTS job_cards_status_check;
ALTER TABLE job_cards ADD CONSTRAINT job_cards_status_check
  CHECK (status IN ('Pending','In Progress','Ready for Delivery','Delivered','Returned','Delayed','Cancelled'));

-- Theme on user profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';
```
4. Go to **Project Settings → API**, copy the Project URL and `service_role` key

### 2 — Backend

```bash
cd backend
cp .env.example .env
# Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env
npm install
npm run dev       # runs on http://localhost:4000
```

### 3 — Frontend

```bash
cd frontend
npm install
npm run dev       # runs on http://localhost:5173
```

Vite proxies all `/api` requests to `localhost:4000` automatically.

### 4 — First Login

Create your admin user directly in Supabase:
1. **Authentication → Users → Add User** — add email + password
2. **SQL Editor** — insert the profile:
```sql
INSERT INTO user_profiles (id, name, role)
VALUES ('<paste-user-uuid>', 'Admin', 'admin');
```

---

## Mobile Access (Local Network)

To access from a phone on the same Wi-Fi:

- Backend already listens on `0.0.0.0` — accessible at `http://<your-ip>:4000`
- Vite is configured with `host: true` — accessible at `http://<your-ip>:5173`

---

## Seed Sample Data

```bash
cd backend
node seed.js
```

Creates 10 job cards across all 6 statuses with realistic Indian customer and device data.

---

## API Reference

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | ✓ | Get current user |
| PATCH | `/api/auth/profile` | ✓ | Update theme preference |

### Job Cards
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/job-cards/dashboard` | ✓ | Summary stats + today's jobs |
| GET | `/api/job-cards` | ✓ | List all (filterable) |
| GET | `/api/job-cards/ready` | ✓ | Ready for delivery |
| GET | `/api/job-cards/delivered` | ✓ | Delivered |
| GET | `/api/job-cards/:id` | ✓ | Single card + activity log |
| POST | `/api/job-cards` | ✓ | Create |
| PATCH | `/api/job-cards/:id` | ✓ | Update (role-restricted fields) |

### Admin
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users` | Admin | List users |
| POST | `/api/users` | Admin | Create user |
| DELETE | `/api/users/:id` | Admin | Delete user |
| GET | `/api/analytics/revenue` | Admin | Revenue stats |
| GET | `/api/analytics/technicians` | Admin | Technician performance |

### Public (no auth)
| Method | Path | Description |
|---|---|---|
| GET | `/api/public/track/:id` | Customer repair status |

---

## Status Flow

```
Pending → In Progress → Ready for Delivery → Delivered
                     ↘ Delayed
                     ↘ Returned
                     ↘ Cancelled
```

---

## WhatsApp Integration (Stage 2)

Stubbed in `backend/lib/whatsapp.js`. A notification log entry is written to `whatsapp_log` on every status change.

To activate:
1. Set up Meta Business account + WhatsApp Cloud API
2. Get message templates approved for each status
3. Add `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` to `.env`
4. Implement the fetch call in `whatsapp.js`

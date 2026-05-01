# Fixora — Full Project Context

## What It Is
Fixora is a **mobile repair shop management system**. It manages repair job cards from device intake to delivery, with multi-role access, customer email notifications, analytics, and a public customer tracking portal.

**Live URL:** Deployed on Vercel (connected to GitHub `Abhilash0086/Fixora---Mobile-Repair-Management-System`)
**Local path:** `D:\fixora`

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite, React Router v6 |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT tokens) |
| Email | Nodemailer (SMTP/Gmail) |
| Deployment | Vercel (serverless) |
| Fonts (app) | Syne (headings) + DM Sans (body) |
| Fonts (landing) | Space Grotesk + Outfit |

---

## Project Structure

```
D:\fixora\
├── api/
│   └── index.js              # Vercel serverless entry — just: module.exports = require('../backend/server')
├── backend/
│   ├── server.js             # Express app, all routes registered
│   ├── middleware/
│   │   └── auth.js           # authenticate, requireAdmin, blockGuest
│   ├── routes/
│   │   ├── auth.js           # /api/auth/*
│   │   ├── jobCards.js       # /api/job-cards/*
│   │   ├── users.js          # /api/users/*  (admin/owner only)
│   │   ├── enquiries.js      # /api/enquiries/*
│   │   ├── analytics.js      # /api/analytics/*
│   │   ├── options.js        # /api/options/brands + models
│   │   └── public.js         # /api/public/track/:id  (no auth)
│   └── lib/
│       ├── supabase.js       # Supabase service-role client
│       ├── email.js          # Nodemailer — sendStatusEmail()
│       └── whatsapp.js       # Stub (not implemented)
├── frontend/
│   └── src/
│       ├── App.jsx           # Routes, ProtectedRoute, AppShell, GuestSignInButton
│       ├── main.jsx
│       ├── index.css         # All styles (dark/light theme via data-theme attr)
│       ├── contexts/
│       │   └── AuthContext.jsx  # user, loading, login(), guestLogin(), logout(), updateUser()
│       ├── lib/
│       │   ├── api.js           # All fetch calls — adds Bearer token, handles 401
│       │   └── printJobCard.js  # Print slip generator
│       ├── components/
│       │   ├── Sidebar.jsx      # Role-based nav, theme toggle, logout
│       │   ├── Common.jsx       # Badge, Loading, Empty, toast, StatusSelect, RadioGroup,
│       │   │                    # PhoneInput, ConfirmModal, GuestModal, useGuestGate,
│       │   │                    # fmtDate, fmtDateTime, SectionTitle, STATUSES
│       │   └── JobCardModal.jsx # View + edit modal for job cards
│       └── pages/
│           ├── Landing.jsx       # Public landing page (/)
│           ├── Login.jsx         # /login
│           ├── Dashboard.jsx     # /dashboard — stats + today's job cards + enquiries
│           ├── NewJobCard.jsx    # /new — create job card form
│           ├── AllJobCards.jsx   # /jobs — filterable list
│           ├── ReadyJobCards.jsx # /ready
│           ├── DeliveredJobCards.jsx # /delivered
│           ├── Search.jsx        # /search
│           ├── Analytics.jsx     # /analytics
│           ├── Users.jsx         # /users — user management (admin/owner)
│           └── TrackJobCard.jsx  # /track/:id — public customer tracking page
├── package.json              # Root — backend deps + node 24.x
└── vercel.json               # Build: cd frontend && npm install && npm run build
                              # Rewrites: /api/* → /api/index, /* → /index.html
```

---

## Environment Variables

### Backend (`.env` locally, Vercel env in production)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GUEST_EMAIL=           # Supabase auth email for guest demo account
GUEST_PASS=            # Supabase auth password for guest demo account
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=             # Gmail address
SMTP_PASS=             # Gmail app password
SMTP_FROM=             # Display sender email (optional, falls back to SMTP_USER)
SHOP_NAME=             # Used in email template header
APP_URL=               # e.g. https://fixora.vercel.app — for tracking links in emails
```

---

## Supabase Database Tables

### `user_profiles`
```sql
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
name TEXT NOT NULL
role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'technician', 'guest'))
theme TEXT DEFAULT 'dark'
created_at TIMESTAMPTZ DEFAULT NOW()
```

### `job_cards`
All fields — `job_card_id` (e.g. FX-2026-00001), `salutation`, `customer_name`, `customer_phone`, `alt_mobile_no`, `customer_email`, `address`, `phone_brand`, `phone_model`, `color`, `pattern_password`, `imei_status`, `power_status`, `touch_status`, `display_status`, `device_condition`, `reported_issue`, `remarks`, `data_backup`, `estimated_amount`, `advance_amount`, `confirm_estimated`, `prepared_by`, `technician`, `eta`, `status`, `created_at`, `updated_at`, `delivered_at`

**Status values:** `Pending`, `In Progress`, `Ready for Delivery`, `Delivered`, `Returned`, `Delayed`, `Cancelled`

**Mandatory fields (POST):** `customer_name`, `phone_brand`, `phone_model`, `reported_issue`

### `job_card_status_log`
`id`, `job_card_id`, `old_status`, `new_status`, `changed_at`, `notes`

### `job_card_edit_log`
`id`, `job_card_id`, `field_name`, `old_value`, `new_value`, `changed_at`

### `enquiries`
`id`, `name` (required), `contact_no`, `device`, `description`, `created_at`
(Lightweight intake — separate from job cards)

### `brands`
`id`, `name` (unique), `sort_order`

### `device_models`
`id`, `brand`, `name`, unique(brand, name)

### DB function
`next_job_card_id()` — generates sequential IDs like `FX-2026-00001`

---

## Auth & Roles

Token stored in `localStorage('fx_token')`. All API calls send `Authorization: Bearer <token>`. On 401 → clear token + redirect to `/login`.

| Role | Permissions |
|---|---|
| **owner** | Full access. Can create/delete admin, technician, owner accounts. Own account is indestructible. |
| **admin** | Full access. Can create/delete technician accounts only. Cannot delete owner or admin accounts. |
| **technician** | Can only see their own jobs (filtered by name). Can only update `status` field on job cards. No edit, no new job card. |
| **guest** | Read-only. Can view Dashboard, All Jobs, Ready, Delivered, Search, Analytics. Cannot create/edit/delete anything. Prompted to sign in when attempting write actions. |

### Auth middleware (`backend/middleware/auth.js`)
- `authenticate` — validates JWT, attaches `req.user = { id, email, name, role, theme }`
- `requireAdmin` — allows `admin` and `owner` only (used on `/api/users`)
- `blockGuest` — blocks `guest` role from mutation endpoints

### Frontend routing (`App.jsx`)
- `/` → `Landing` (public)
- `/login` → `Login` (PublicRoute — redirects to `/dashboard` if already logged in, EXCEPT guests)
- `/track/:id` → `TrackJobCard` (public, no auth)
- All other routes → `ProtectedRoute` inside `AppShell`
  - `adminOnly` prop: requires `admin` or `owner` (technicians redirected to `/dashboard`)
  - `guestOk` prop: allows guests through adminOnly routes (used on `/jobs`, `/analytics`)

---

## Key API Endpoints

```
POST   /api/auth/login              — { email, password } → { token, user }
POST   /api/auth/guest              — → { token, user: { role: 'guest' } }
GET    /api/auth/me                 — → current user
PATCH  /api/auth/profile            — { theme } only

GET    /api/users                   — list all users (admin/owner)
POST   /api/users                   — create user (owner: any role; admin: technician only)
DELETE /api/users/:id               — delete user (owner can't be deleted; no self-delete)

GET    /api/job-cards/dashboard     — stats summary + today's job cards
GET    /api/job-cards               — list with filters: status, date, technician, search, brand
GET    /api/job-cards/ready         — status = Ready for Delivery
GET    /api/job-cards/delivered     — status = Delivered
GET    /api/job-cards/:id           — single card + activity_log (status + edit logs)
POST   /api/job-cards               — create (blockGuest)
PATCH  /api/job-cards/:id           — update (blockGuest; technician: status only)

GET    /api/options/brands          — list brands
POST   /api/options/brands          — add brand
GET    /api/options/models?brand=X  — list models for brand
POST   /api/options/models          — add model

GET    /api/enquiries               — all enquiries (?today=true for today only)
POST   /api/enquiries               — create (blockGuest)
DELETE /api/enquiries/:id           — delete (blockGuest)

GET    /api/analytics/revenue       — ?from=YYYY-MM-DD&to=YYYY-MM-DD
GET    /api/analytics/technicians   — ?from=YYYY-MM-DD&to=YYYY-MM-DD

GET    /api/public/track/:id        — public tracking (no auth, limited fields only)
```

---

## Frontend Key Patterns

### `useGuestGate()` hook (`Common.jsx`)
Wraps write actions — shows `GuestModal` if user is guest instead of executing.
```jsx
const { gate, modal, isGuest } = useGuestGate();
<button onClick={() => gate(() => doSomething())}>Action</button>
{modal}
```

### `toast(msg, type)` (`Common.jsx`)
Global toast — `type` is `'success'` (default) or `'error'`.

### Theme
`data-theme="dark"` or `data-theme="light"` on `<html>`. Toggled in `AppShell`, saved via `PATCH /api/auth/profile`.

### Sidebar nav by role
- `owner` / `admin` → full nav (Dashboard, New Job Card, All Jobs, Ready, Delivered, Search, Analytics, Users)
- `technician` → limited (Dashboard, Ready, Delivered, Search)
- `guest` → read-only nav (Dashboard, All Jobs, Ready, Delivered, Search, Analytics)

### Role chip colours
- `role-owner` → purple (`#c084fc`)
- `role-admin` → orange (`var(--accent)`)
- `role-technician` → blue (`var(--s-progress)`)
- `role-guest` → grey (`var(--text-3)`)

### Print (`printJobCard.js`)
Opens a new window and prints a formatted job slip.

---

## Deployment

- **GitHub:** `Abhilash0086/Fixora---Mobile-Repair-Management-System` (public repo)
- **Vercel:** Connected to above repo, auto-deploys on push to `main`
- **Build:** `cd frontend && npm install && npm run build`
- **Serverless function:** `api/index.js` exports the Express app directly (no `serverless-http`)
- **Node version:** `24.x` (set in `package.json` engines)

---

## Known Quirks / Important Notes

1. **Job card ID generation** uses a Supabase DB function `next_job_card_id()` — do not try to generate IDs in application code.
2. **Technician filtering** is done on the **backend** by matching `req.user.name` to `job_cards.technician`. Technician name must match exactly.
3. **Email is fire-and-forget** — failures are logged but never surface to the user/API response.
4. **Guest login** uses a real Supabase user with `role: 'guest'` in `user_profiles`. The token is real but the backend `blockGuest` middleware stops all mutations.
5. **`PublicRoute`** allows guests through to `/login` (so they can sign out of guest mode and sign in properly): `if (user && user.role !== 'guest') redirect to /dashboard`.
6. **Landing page** (`/`) does NOT redirect guests to dashboard — only non-guest authenticated users.
7. **No `serverless-http`** — exporting Express app directly was the fix for Vercel deployment.
8. **WhatsApp** (`backend/lib/whatsapp.js`) is a stub — calls are made but nothing is sent.

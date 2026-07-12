# TransitOps — Smart Transport Operations Platform

A centralized web platform that replaces spreadsheets/logbooks for logistics
companies — managing vehicles, drivers, trip dispatch, maintenance,
fuel/expenses, and analytics, with role-based access and automatic status
enforcement.

Built to the specification in [`project.md`](project.md).

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS, Recharts, lucide-react |
| Backend | Node.js + Express + TypeScript (Controller → Service → Repository) |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (Bearer token) + bcrypt |
| Validation | Zod (input shape) + service-layer business rules |

Architecture: `Request → Controller (thin, HTTP-only) → Service (all business
rules) → Prisma → PostgreSQL`. Every business rule in the spec is enforced in
the **service layer** (see `backend/src/services/eligibility.ts` for the shared,
reusable rule guards), and all multi-table status changes (trip
dispatch/complete/cancel, maintenance open/close) run inside Prisma
transactions.

---

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ running locally **or** Docker

---

## Setup

### 1. Database

**Using your local PostgreSQL** (this repo is configured for this by default):

```sql
-- as the postgres superuser
CREATE ROLE transitops LOGIN PASSWORD 'transitops';
ALTER ROLE transitops CREATEDB;                 -- needed for Prisma's shadow DB
CREATE DATABASE transitops_db OWNER transitops;
```

The default connection string (`backend/.env`) is:
`postgresql://transitops:transitops@localhost:5432/transitops_db`

**Or using Docker** (a `docker-compose.yml` is included; it maps host port
**5433** to avoid clashing with a local Postgres on 5432):

```bash
docker compose up -d
# then set DATABASE_URL to ...@localhost:5433/transitops_db in backend/.env
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # adjust DATABASE_URL if your credentials differ
npm install
npx prisma migrate dev        # create tables
npm run db:seed               # load sample data
npm run dev                   # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173 (proxies /api → :4000)
```

Open **http://localhost:5173**.

---

## Demo accounts

All use password **`password123`**:

| Role | Email | Can do |
|---|---|---|
| Fleet Manager | `manager@nayatransit.com` | Vehicles CRUD, trips, maintenance |
| Safety Officer | `safety@nayatransit.com` | Drivers CRUD (license/score/status) |
| Financial Analyst | `finance@nayatransit.com` | Fuel & expenses, CSV export |
| Driver | `driver@nayatransit.com` | Create/dispatch/complete/cancel trips, log fuel |

RBAC is enforced **server-side** on every route; the UI additionally hides
controls a role can't use.

---

## API overview

Base URL `http://localhost:4000/api`. All routes except `/auth/login` and
`/auth/register` require `Authorization: Bearer <token>`.

- **Auth** — `POST /auth/login`, `POST /auth/register`, `GET /auth/me`
- **Vehicles** — `GET /vehicles`, `GET /vehicles/:id`, `GET /vehicles/available`, `POST /vehicles`, `PATCH /vehicles/:id`, `PATCH /vehicles/:id/retire`
- **Drivers** — `GET /drivers`, `GET /drivers/:id`, `GET /drivers/available`, `POST /drivers`, `PATCH /drivers/:id`, `PATCH /drivers/:id/suspend`
- **Trips** — `GET /trips`, `GET /trips/active`, `GET /trips/:id`, `POST /trips`, `PATCH /trips/:id/{dispatch,complete,cancel}`
- **Maintenance** — `GET /maintenance`, `GET /maintenance/:vehicleId`, `POST /maintenance`, `PATCH /maintenance/:id/close`
- **Fuel logs** — `GET /fuel-logs/:vehicleId`, `POST /fuel-logs`
- **Expenses** — `GET /expenses/:vehicleId`, `POST /expenses`
- **Dashboard** — `GET /dashboard?type=&status=&region=`
- **Reports** — `GET /reports?from=&to=&vehicleId=`, `GET /reports/export.csv`

---

## Business rules (enforced in services)

Vehicles, drivers, trips, and maintenance all enforce the mandatory rules from
spec Section 6 — e.g. retired/in-shop vehicles never appear in the dispatch
pool, a vehicle can't enter maintenance while on a trip, dispatch flips vehicle
+ driver to `ON_TRIP`, completion/cancellation restores them, retirement is
terminal, expired-license/suspended/off-duty/on-trip drivers can't be assigned,
and cargo weight must be `> 0` and `≤` the vehicle's capacity. These live as
small reusable guards in `backend/src/services/eligibility.ts`.

---

## Project layout

```
TransitOPS/
├── docker-compose.yml         # optional Postgres 16 (host port 5433)
├── backend/
│   ├── prisma/                # schema.prisma, migrations, seed.ts
│   └── src/
│       ├── controllers/       # thin HTTP handlers
│       ├── services/          # all business rules + transactions
│       ├── routes/            # routing + RBAC middleware
│       ├── middleware/        # auth, validation, error handling
│       ├── validation/        # Zod schemas
│       └── utils/             # AppError, jwt, password, asyncHandler
└── frontend/
    └── src/
        ├── pages/             # Login, Dashboard, Vehicles, Drivers, Trips,
        │                      #   Maintenance, Fuel & Expenses, Reports
        ├── components/        # ui/ primitives, shared/, layout/
        ├── context/           # Auth + Theme (dark mode)
        └── lib/               # api client, types, permissions, hooks
```

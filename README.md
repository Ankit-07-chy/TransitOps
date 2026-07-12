# TransitOps — Smart Transport Operations Platform

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.0.0-blue.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgres-%3E%3D%2014.0-blue.svg)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/prisma-%3E%3D%205.22.0-lightblue.svg)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/react-%3E%3D%2018.3.1-blue.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/tailwind-3.4.17-blue.svg)](https://tailwindcss.com/)

TransitOps is a centralized, production-grade web platform designed to replace legacy spreadsheets and manual paper logbooks for fleet logistics companies. It provides real-time management of vehicles, drivers, trip dispatches, maintenance operations, and fuel/expense logs, backed by automatic business-rule status enforcement and granular role-based access control (RBAC).

---

## Table of Contents
1. [Key Features](#key-features)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema & ERD](#database-schema--erd)
5. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
6. [Business Rules & Validation](#business-rules--validation)
7. [Prerequisites](#prerequisites)
8. [Setup & Installation](#setup--installation)
    - [1. Database Configuration](#1-database-configuration)
    - [2. Backend Setup](#2-backend-setup)
    - [3. Frontend Setup](#3-frontend-setup)
9. [Demo Accounts](#demo-accounts)
10. [API Reference](#api-reference)
11. [Project Directory Structure](#project-directory-structure)

---

## Key Features

- **Consolidated Dashboard**: Real-time fleet KPIs (Utilization %, vehicle/driver status counts) and charts indicating operational cost breakdown and fuel efficiency.
- **Vehicle Registry**: Detailed registry for tracking active, retired, or in-shop vehicles with capacity and region tracking.
- **Driver & Safety Profiles**: Tracking safety scores, licensing details, expiry dates, and driver-specific trip assignments.
- **Interactive Trip Dispatcher**: Validates load capacity, matching regions, and driver/vehicle availability, switching statuses automatically on dispatch, completion, or cancellation.
- **Maintenance Lifecycle**: Track open and closed maintenance tasks. Vehicles in active maintenance are locked out from dispatcher assignment automatically.
- **Expense & Fuel Analytics**: Logs details on tolls, maintenance, fuel, and other operations to dynamically calculate ROI and operational costs per vehicle.
- **CSV Export**: Financial analysts can export complete operational reports instantly.

---

## Tech Stack

| Layer | Technology | Key Usage |
|---|---|---|
| **Frontend** | React v18 + Vite | Single Page Application (SPA) with fast Hot Module Replacement (HMR). |
| **Styling** | Tailwind CSS + Lucide React | Modern responsive design, styled components, and icons. |
| **Charts** | Recharts | Render interactive dashboard KPIs, utilization, and cost charts. |
| **Backend** | Node.js + Express + TypeScript | Layered backend routing system: Controllers → Services → Data Layer. |
| **ORM** | Prisma ORM | Object-Relational Mapping with type-safe query building and auto-migrations. |
| **Database** | PostgreSQL | Relational database engine for robust transactional guarantees. |
| **Security** | JWT + bcryptjs + cookie-parser | JSON Web Token authorization via HTTP-only cookies / headers; password hashing. |
| **Validation** | Zod | Deep schemas matching fields at database boundaries and request inputs. |

---

## Architecture Overview

TransitOps uses a strict **layered architecture** to keep logic decoupled, secure, and easily testable:

```
                  ┌────────────────────────┐
                  │   React Frontend (UI)  │
                  └───────────┬────────────┘
                              │ HTTP Requests (with JWT Bearer / Cookies)
                              ▼
                  ┌────────────────────────┐
                  │   Express Controller   │  ◄── Zod Validation Layer (Req Inputs)
                  └───────────┬────────────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │     Service Layer      │  ◄── All Business Rules & Transactions
                  └───────────┬────────────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │       Prisma ORM       │
                  └───────────┬────────────┘
                              │ SQL Queries
                              ▼
                  ┌────────────────────────┐
                  │   PostgreSQL Database  │
                  └────────────────────────┘
```

- **Controllers**: Handle HTTP serialization, parse cookies/headers, run Zod validations, and forward inputs to the service layer.
- **Service Layer**: The absolute brain of the application. Reusable eligibility guards (`backend/src/services/eligibility.ts`) enforce business logic state transitions.
- **Transactions**: Multi-table updates (e.g. dispatching or completing a trip, which changes both Vehicle/Driver statuses) are wrapped inside Prisma Transactions (`prisma.$transaction`) to guarantee ACID reliability.

---

## Database Schema & ERD

Below is the database relationship representation managed by Prisma:

```mermaid
erDiagram
    User {
        String id PK
        String name
        String email UK
        String passwordHash
        Role role
        String driverId FK
        Boolean isActive
        DateTime createdAt
    }
    
    Driver {
        String id PK
        String name
        String licenseNumber UK
        String licenseCategory
        DateTime licenseExpiryDate
        String contactNumber
        Float safetyScore
        DriverStatus status
        Boolean isActive
    }

    Vehicle {
        String id PK
        String registrationNo UK
        String name
        String type
        String region
        Float maxLoadCapacity
        Float odometer
        Float acquisitionCost
        VehicleStatus status
        Boolean isActive
    }

    Trip {
        String id PK
        String tripNumber UK
        String source
        String destination
        String vehicleId FK
        String driverId FK
        Float cargoWeight
        Float plannedDistance
        Float actualDistance
        Float fuelConsumed
        Float revenue
        TripStatus status
        DateTime dispatchedAt
        DateTime completedAt
        DateTime cancelledAt
    }

    MaintenanceLog {
        String id PK
        String vehicleId FK
        String description
        Float cost
        Boolean isActive
        DateTime openedAt
        DateTime closedAt
    }

    FuelLog {
        String id PK
        String vehicleId FK
        String tripId FK
        Float liters
        Float cost
        DateTime date
    }

    Expense {
        String id PK
        String vehicleId FK
        ExpenseType type
        Float amount
        DateTime date
        String notes
    }

    User ||--|| Driver : "optional profile link"
    Driver ||--o{ Trip : "assigned driver"
    Vehicle ||--o{ Trip : "assigned vehicle"
    Vehicle ||--o{ MaintenanceLog : "maintenance events"
    Vehicle ||--o{ FuelLog : "refueling events"
    Vehicle ||--o{ Expense : "general expenses"
    Trip ||--o{ FuelLog : "trip fuel correlation"
```

---

## Role-Based Access Control (RBAC)

RBAC is strictly enforced at the API route handler layer via custom middleware (`requireRole`). If a user tries to access routes or fire mutations outside their permitted scope, the server immediately returns a `403 Forbidden` response.

| Module | Fleet Manager | Dispatcher (Driver) | Safety Officer | Financial Analyst |
|---|:---:|:---:|:---:|:---:|
| **Dashboard** | ✓ View | ✓ View | ✓ View | ✓ View |
| **Fleet (Vehicle Registry)** | ✓ Full CRUD | View Available Only | — | ✓ View |
| **Drivers & Profiles** | ✓ View | View Own | ✓ Full CRUD | ✓ View |
| **Trips (Dispatcher)** | — | ✓ Full Lifecycle | ✓ View | — |
| **Maintenance Logs** | ✓ Full CRUD | — | — | ✓ View |
| **Fuel & Expenses** | — | ✓ Log Fuel Only | — | ✓ Full CRUD |
| **Analytics & Reports** | ✓ View | — | ✓ View | ✓ Full CRUD + Export |

---

## Business Rules & Validation

Every operational action triggers automated compliance checks in `backend/src/services/eligibility.ts`:

1. **Vehicles**:
    - `RETIRED` or `IN_SHOP` vehicles are barred from trip dispatch selection.
    - Vehicles cannot enter maintenance if currently `ON_TRIP`.
    - Once marked `RETIRED`, a vehicle status cannot be transitioned back to active/available states (retirement is terminal).
2. **Drivers**:
    - Drivers with expired licenses (`licenseExpiryDate < today`) are automatically excluded from dispatch.
    - `SUSPENDED` or `OFF_DUTY` drivers are barred from trip dispatch.
    - Drivers cannot be assigned to multiple concurrent active trips.
3. **Trips**:
    - Cargo weight must be greater than 0 and less than or equal to the designated vehicle’s `maxLoadCapacity`.
    - Trip `source` and `destination` cannot be the same.
    - Dispatching a trip (`DRAFT -> DISPATCHED`) atomicly locks both the vehicle and driver to `ON_TRIP`.
    - Completing or cancelling a trip restores vehicle and driver statuses to `AVAILABLE`.

---

## Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **PostgreSQL** (v14.0 or higher) running locally or via Docker
- **Docker & Docker Compose** (Optional, if database virtualization is preferred)

---

## Setup & Installation

### 1. Database Configuration

#### Option A: Running Local PostgreSQL Server
1. Connect to your local PostgreSQL server using pgAdmin or your terminal as a superuser.
2. Run the following commands to provision the database:
   ```sql
   CREATE ROLE transitops LOGIN PASSWORD 'transitops';
   ALTER ROLE transitops CREATEDB; -- Required for shadow DB migrations
   CREATE DATABASE transitops_db OWNER transitops;
   ```
3. Set your connection string in the backend configuration (`backend/.env`):
   ```env
   DATABASE_URL="postgresql://transitops:transitops@localhost:5432/transitops_db"
   ```

#### Option B: Virtualized PostgreSQL via Docker
A `docker-compose.yml` file is provided in the project root. To avoid conflict with any local instance running on port 5432, Docker maps the database port to **5433**.
1. Launch the database container:
   ```bash
   docker compose up -d
   ```
2. Update your `backend/.env` database URL:
   ```env
   DATABASE_URL="postgresql://transitops:transitops@localhost:5433/transitops_db"
   ```

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the example environment variables file and customize:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run Prisma database migrations to create tables and relations:
   ```bash
   npx prisma migrate dev
   ```
5. Seed the database with sample roles, credentials, vehicles, and logs:
   ```bash
   npm run db:seed
   ```
6. Start the local API server (running by default on `http://localhost:4000`):
   ```bash
   npm run dev
   ```

---

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Spin up the Vite development server (proxies `/api` to port 4000):
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to: **`http://localhost:5173`**

---

## Demo Accounts

All pre-seeded accounts utilize the default password: **`password123`**

| Role | Email | Use Case Testing |
|---|---|---|
| **Fleet Manager** | `manager@nayatransit.com` | Create vehicles, open maintenance windows, audit logs. |
| **Dispatcher / Driver** | `driver@nayatransit.com` | Draft trips, dispatch trips, complete status updates, record fuel. |
| **Safety Officer** | `safety@nayatransit.com` | Modify driver safety ratings, track license expiries. |
| **Financial Analyst** | `finance@nayatransit.com` | Register costs/tolls, view KPIs, export CSV reports. |

---

## API Reference

The server exposes endpoints at `http://localhost:4000/api`. Authentication is maintained via JSON Web Tokens passed in request headers.

### Authentication
* `POST /api/auth/login` - Authenticate user & retrieve JWT token
* `POST /api/auth/register` - Create a new user (admin/seeder context)
* `GET /api/auth/me` - Fetch authenticated user details

### Vehicles
* `GET /api/vehicles` - List all vehicles (query: `status`, `type`, `region`, `search`)
* `GET /api/vehicles/:id` - Fetch vehicle by ID
* `GET /api/vehicles/available` - List available vehicles for dispatch
* `POST /api/vehicles` - Add new vehicle (Fleet Manager only)
* `PATCH /api/vehicles/:id` - Update vehicle parameters
* `PATCH /api/vehicles/:id/retire` - Soft-retire a vehicle (terminal status)

### Drivers
* `GET /api/drivers` - List drivers (query: `status`, `search`)
* `GET /api/drivers/available` - List active, certified drivers
* `POST /api/drivers` - Create driver profile (Safety Officer only)
* `PATCH /api/drivers/:id/suspend` - Suspend a driver profile

### Trips
* `POST /api/trips` - Draft a new trip (validates cargo capacity & route)
* `PATCH /api/trips/:id/dispatch` - Set trip state to `DISPATCHED`
* `PATCH /api/trips/:id/complete` - Record actual metrics & return resources
* `PATCH /api/trips/:id/cancel` - Cancel active trip & release resources

### Analytics & Reports
* `GET /api/dashboard` - Single aggregate for real-time fleet KPI widgets
* `GET /api/reports` - Calculates ROI, fuel efficiency, and operating costs
* `GET /api/reports/export.csv` - Export structured dataset to CSV

---

## Project Directory Structure

```text
TransitOPS/
├── docker-compose.yml          # Postgres 16 container container (port 5433)
├── testing-plan.md             # Standard QA checklists and role-based test cases
├── project.md                  # Comprehensive functional product specification
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database design config (Models, Enums, Indexes)
│   │   └── seed.ts             # Seeding logic for test environments
│   └── src/
│       ├── controllers/        # Express request routing & input sanitization
│       ├── services/           # Reusable business logic & Prisma transactions
│       │   └── eligibility.ts  # Central compliance validations (license expiry, capacity)
│       ├── middleware/         # Auth verification, role checks, and error handling
│       └── validation/         # Zod schemas for input validation
└── frontend/
    └── src/
        ├── components/         # Shared UI controls, cards, forms, and layout
        ├── context/            # Auth status providers, theme managers
        ├── lib/                # API client endpoints and utility functions
        └── pages/              # Module specific views (Dashboard, Vehicles, Trips, Reports)
```

---



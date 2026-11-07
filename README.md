# Sweety — Blood Glucose Tracker

Starter workspace for a blood glucose tracking application with an Express API
and a React/Vite frontend.

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL
- A configured `DATABASE_URL` in `backend/.env`

## Getting started

Install dependencies in each app:

```sh
cd backend && npm install
cd ../frontend && npm install
```

Copy `backend/.env.example` to `backend/.env` and set values as needed. To
configure the frontend API URL, copy `frontend/.env.example` to `frontend/.env`.
The example points directly to the local API; without this file, the frontend
uses `/api` through the Vite development proxy. `VITE_API_URL` is public
frontend configuration, not a place for secrets. Start the API and frontend in
separate terminals:

```sh
cd backend && npm run dev
cd frontend && npm run dev
```

The API listens on `http://localhost:5000` by default and exposes
`GET /api/health`. The frontend runs on the Vite development server and proxies
`/api` requests to the backend.

## API scaffold

- `GET /api/health`
- `POST /api/auth/signup` and `POST /api/auth/login`
- `GET /api/readings`, `POST /api/readings`, `PUT /api/readings/:id`, and `DELETE /api/readings/:id`
- `GET /api/reports`

Reading routes require authentication and only allow users to update or delete
their own readings. The backend includes the base health endpoint, protected
auth and reading routes, and a PostgreSQL-ready schema for users and blood
glucose readings.

Run backend tests with `cd backend && npm test`.

When updating an existing database to support separate morning and after-breakfast
readings, export `DATABASE_URL` in your shell and run this migration once from the
repository root:

```sh
psql "$DATABASE_URL" -f backend/database/migrations/001_add_after_breakfast_time_slot.sql
```

New databases created from either schema file already include the updated slot.

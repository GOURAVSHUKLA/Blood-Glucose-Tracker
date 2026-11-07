# Sweety — Blood Glucose Tracker

Starter workspace for a blood glucose tracking application with an Express API
and a React/Vite frontend.

## Requirements

- Node.js 20 or newer
- npm
- MongoDB (optional for starting the API; required when database-backed features
  are implemented)

## Getting started

Install dependencies in each app:

```sh
cd backend && npm install
cd ../frontend && npm install
```

Copy `backend/.env.example` to `backend/.env` and set values as needed. Start
the API and frontend in separate terminals:

```sh
cd backend && npm run dev
cd frontend && npm run dev
```

The API listens on `http://localhost:5000` by default and exposes
`GET /api/health`. The frontend runs on the Vite development server and proxies
`/api` requests to the backend.

## API scaffold

- `POST /api/auth/signup` and `POST /api/auth/login`
- `GET /api/readings` and `POST /api/readings`
- `GET /api/reports`

Feature endpoints currently return `501 Not Implemented`; they are route and
controller placeholders, not completed authentication or glucose-reading
functionality. The seed script is likewise a placeholder until data models are
added.

Run backend tests with `cd backend && npm test`.


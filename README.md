# LeadTrack

A small, full-stack lead management CRM. React (Vite) frontend backed by an
Express + PostgreSQL API with JWT authentication.

## Features

- **Authentication** — register/login with hashed passwords (bcrypt) and
  per-user JWTs. Every lead is owned by the account that created it.
- **Leads** — create, edit, update status and delete leads. Ownership is
  enforced server-side; you only ever see your own leads.
- **Search & filters** — search by name/company/email and filter by status or
  source. Filters are applied on the server and reflected in the URL.
- **Dashboard** — real conversion/status statistics aggregated in PostgreSQL,
  a clickable pipeline funnel, leads-by-source breakdown, recent leads and a
  latest-activity feed.
- **Loading / error / empty states** — skeletons, inline alerts and retry
  actions throughout; nothing is simulated.
- **Responsive** — sidebar becomes an off-canvas drawer and tables collapse
  into cards on smaller screens.

## Tech stack

| Layer    | Choice                                        |
| -------- | --------------------------------------------- |
| Frontend | React 18, Vite, React Router                  |
| Backend  | Node.js + Express                             |
| Database | PostgreSQL                                    |
| Auth     | JSON Web Tokens (JWT), bcrypt password hashes |
| Tests    | Node's built-in test runner (backend), Puppeteer E2E harness |

## Project structure

```
backend/            Express API (auth, leads, dashboard)
  src/db/           schema, migrations, per-user repositories
  src/routes/       /api/auth, /api/leads, /api/dashboard
  src/controllers/  request handling + validation
  src/middleware/   authenticate (JWT) + error handling
  test/             backend integration tests
src/                React frontend
  pages/            Dashboard, Leads, LeadDetails, Login, Register, Settings
  context/          AuthContext (session), LeadsContext (data + dialogs)
  services/         API clients (api, auth, leads, dashboard)
  components/       tables, dialogs, forms, stat cards, pipeline
  styles/           design tokens + component/page CSS
```

## Getting started

1. Create a PostgreSQL database and set `DATABASE_URL` in `backend/.env`
   (copy of `backend/.env.example`). Set a `JWT_SECRET`.
2. Start the API:

   ```bash
   cd backend
   npm install
   npm run migrate   # applies the schema (serially, idempotently)
   npm run dev       # http://localhost:4001
   ```

3. Start the frontend (defaults to `http://localhost:4001/api`):

   ```bash
   npm install
   npm run dev       # http://localhost:5173
   ```

   To point at a different API, copy `.env.example` to `.env` and set
   `VITE_API_URL`.

## Scripts

| Command             | Where    | Description                                |
| ------------------- | -------- | ------------------------------------------ |
| `npm run dev`       | root     | Vite dev server                            |
| `npm run build`     | root     | Production build (typechecked, minified)   |
| `npm run preview`   | root     | Serve the production build locally         |
| `npm test`          | backend  | Backend integration tests                  |
| `npm run migrate`   | backend  | Apply the database schema                  |
| `npm run lint`      | root     | oxlint + eslint leftovers (frontend)       |

## API endpoints

All endpoints under `/api` are JSON. `Authorization: Bearer <jwt>` is required
for the leads and dashboard routes.

| Method   | Route                     | Description                             |
| -------- | ------------------------- | --------------------------------------- |
| POST     | `/api/auth/register`      | Create an account → `{ user, token }`   |
| POST     | `/api/auth/login`         | Sign in → `{ user, token }`             |
| GET      | `/api/auth/me`            | Current user from token                 |
| GET      | `/api/leads`              | List a user's leads (`search`, `status`, `source` filters) |
| POST     | `/api/leads`              | Create a lead                           |
| GET      | `/api/leads/:id`          | Fetch one of the user's leads           |
| PATCH    | `/api/leads/:id`          | Update fields or status                 |
| DELETE   | `/api/leads/:id`          | Delete a lead                           |
| GET      | `/api/dashboard/stats`    | Aggregated per-user stats               |
| GET      | `/api/health`             | Health check                            |

## Security notes

- Passwords are never stored or returned; only bcrypt hashes live in the DB.
- Lead ownership comes from the JWT, never from the request body.
- Cross-user access returns 404 so the real owner's ids are never exposed.
- The JWT is kept in `localStorage`; a 401 on any protected request clears the
  session and redirects to `/login`.
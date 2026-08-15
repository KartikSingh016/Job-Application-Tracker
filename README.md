# Job Application Tracker

A MERN app for tracking job applications: log applications, update their
status as you hear back, and see counts and upcoming interviews on a
dashboard.

## Stack

- **Client:** React (Vite), React Router, `fetch`
- **Server:** Node.js, Express
- **Database:** MongoDB / Mongoose

## Structure

```
server/   Express API + Mongoose models
client/   React app (Vite)
```

## Setup

Requires a MongoDB connection string — a free
[Atlas](https://www.mongodb.com/cloud/atlas/register) cluster or a local
MongoDB instance both work.

**Server**

```
cd server
npm install
cp .env.example .env   # set MONGODB_URI
npm run dev
```

Runs on `http://localhost:5000`.

**Client**

```
cd client
npm install
cp .env.example .env   # defaults already point at localhost:5000
npm run dev
```

Runs on `http://localhost:5173`. The client is fully static and talks to the
API over `fetch`; there are no server-rendered routes.

### Environment variables

`server/.env`

| Var | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `PORT` | API port (default `5000`) |

`client/.env`

| Var | Description |
|---|---|
| `VITE_API_URL` | API base URL (default `http://localhost:5000/api`) |

Both files are gitignored and should not be committed.

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/applications?search=&status=` | List applications, with optional search (company/position) and status filter |
| GET | `/api/applications/:id` | Get a single application |
| POST | `/api/applications` | Create an application |
| PUT | `/api/applications/:id` | Update an application (partial body accepted) |
| DELETE | `/api/applications/:id` | Delete an application |
| GET | `/api/applications/stats` | Counts by status, plus interviews in the next 7 days |

## Client/server interaction

- Search and status filter on the dashboard debounce and re-query
  `GET /api/applications`, re-rendering the list in place.
- Changing status inline sends `PUT /api/applications/:id` with `{ status }`
  and updates that row and the stats cards from the response.
- Stats cards and the upcoming-interviews list load from
  `GET /api/applications/stats` on mount.
- Create, edit, and delete all round-trip through the API and update the UI
  from the response — redirect to the detail view on save, remove the row on
  delete.

## Testing

`server/smoke-test.js` is an end-to-end smoke test (create → read → search →
filter → stats → delete) against a running server, using `node:assert`.

```
cd server
npm run dev    # in one terminal
npm test       # in another
```

Requires a real `MONGODB_URI`.

## Design

- Colors: navy `#1B2A56` (primary), amber `#F2A541` (accent)
- Card-based layout with color-coded status badges (Applied = blue-gray,
  Interviewing = amber, Offer = green, Rejected = red, Withdrawn = gray)
- Responsive layout with breakpoints at 768px and 480px

## Out of scope

Authentication, CSV export, calendar view, and column sorting are not
implemented. The scope is intentionally limited to CRUD + dashboard; each of
these could be added on top of the existing API and data model without
changes to either.

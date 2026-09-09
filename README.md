# Job Application Tracker

A MERN app for tracking job applications: log applications, update their
status as you hear back, and see counts and upcoming interviews on a
dashboard. Users sign in with Google, and each account sees only its own
applications.

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
MongoDB instance both work — plus a Google OAuth client.

**Google OAuth client**

In the [Google Cloud Console](https://console.cloud.google.com/), create (or
pick) a project, then:

1. **APIs & Services → OAuth consent screen** — configure it, and while the
   app is in Testing, add each Google account you want to let in under
   **Audience → Test users**. Publishing the app removes that restriction.
2. **APIs & Services → Credentials → Create credentials → OAuth client ID**,
   application type **Web application**.
3. Under **Authorized JavaScript origins**, add every origin the client is
   served from — `http://localhost:5173` for local dev, and your deployed
   client URL. No redirect URI is needed: the app uses Google Identity
   Services, which returns the ID token to the page rather than redirecting.
4. Copy the client ID into `GOOGLE_CLIENT_ID` (server) and
   `VITE_GOOGLE_CLIENT_ID` (client). They must match — the server rejects any
   token that wasn't issued for its own client ID.

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
| `GOOGLE_CLIENT_ID` | OAuth client ID; ID tokens are only accepted if issued for it |
| `JWT_SECRET` | Signs the session tokens the API issues. Any long random string — changing it signs everyone out |
| `CLIENT_ORIGIN` | Comma-separated origins allowed to call the API. Unset in local dev, where the request origin is reflected |

`client/.env`

| Var | Description |
|---|---|
| `VITE_API_URL` | API base URL (default `http://localhost:5000/api`) |
| `VITE_GOOGLE_CLIENT_ID` | Same OAuth client ID as the server's `GOOGLE_CLIENT_ID` |

Both files are gitignored and should not be committed. Generate a secret with:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deployment

Client and server are deployed as two separate Vercel projects from the same
repo, each pointed at a different Root Directory.

**Server**
- Import this repo as its own project → Root Directory `server`
- Add env vars `MONGODB_URI`, `GOOGLE_CLIENT_ID`, `JWT_SECRET`, and
  `CLIENT_ORIGIN` (your deployed client URL, no trailing slash)
- `server/api/index.js` wraps the Express app as a serverless function
  (`app.listen` only runs locally, via `server/server.js`); `server/vercel.json`
  routes every request to it. `config/db.js` reuses the Mongo connection
  across warm invocations instead of reconnecting per request.
- In MongoDB Atlas, whitelist `0.0.0.0/0` under Network Access — Vercel's
  serverless functions don't have a fixed IP.

**Client**
- Import this repo as a second project → Root Directory `client`
- Add env vars `VITE_API_URL` = `https://<your-server-project>.vercel.app/api`
  and `VITE_GOOGLE_CLIENT_ID`
- Add the deployed client URL to **Authorized JavaScript origins** on the
  OAuth client, or Google refuses to render the sign-in button
- `client/vercel.json` handles the SPA rewrite so React Router routes don't
  404 on refresh

`VITE_*` vars are baked in at build time, not read at runtime — if you add or
change one, you have to trigger a new deploy for it to take effect.

## API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/google` | Exchange a Google ID token (`{ credential }`) for a session token + user |
| GET | `/api/auth/me` | The signed-in user, used to revalidate a stored token on boot |
| GET | `/api/applications?search=&status=` | List applications, with optional search (company/position) and status filter |
| GET | `/api/applications/:id` | Get a single application |
| POST | `/api/applications` | Create an application |
| PUT | `/api/applications/:id` | Update an application (partial body accepted) |
| DELETE | `/api/applications/:id` | Delete an application |
| GET | `/api/applications/stats` | Counts by status, plus interviews in the next 7 days |

Every `/api/applications` route requires a session token
(`Authorization: Bearer <token>`) and only ever reads or writes rows belonging
to that user. Requests without a valid token get a `401`.

## Authentication

Google Identity Services runs in the browser and hands the client a signed
Google ID token. The client posts that to `POST /api/auth/google`, where the
server verifies the signature against Google's public keys — checking the
audience, issuer, and expiry — then upserts a `User` keyed on Google's stable
subject id and returns a session token of its own.

The client stores that token in `localStorage` and sends it as a bearer
header. A `401` from any request clears it and drops back to the sign-in
screen.

Two notes on why it works this way:

- **The server issues its own token rather than reusing Google's.** Google ID
  tokens expire after about an hour, which would sign users out mid-session.
- **The token is a bearer header, not a cookie.** The client and API are
  deployed as separate Vercel projects on different domains, so a session
  cookie would have to be a third-party cookie — which Safari blocks outright
  and Chrome is phasing out. The tradeoff is that `localStorage` is readable
  by injected scripts, so the app renders no user-supplied HTML.

Applications are owned via a required `userId` on the `Application` model,
indexed with `dateApplied` for the dashboard's default query. `userId` is
always taken from the verified token and stripped from request bodies, so a
client cannot create or move a record into someone else's account.

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

`server/smoke-test.js` is an end-to-end smoke test against a running server,
using `node:assert`. It covers the CRUD and stats flow (create → read →
search → filter → stats → delete) and, as two separate users, that neither
can list, read, update, delete, or see stats for the other's applications, or
reassign a record by putting a `userId` in the request body. Unauthenticated
and malformed-token requests are asserted to return `401`.

```
cd server
npm run dev    # in one terminal
npm test       # in another
```

Requires a real `MONGODB_URI` and the same `JWT_SECRET` the server was started
with — the test signs its own tokens rather than the API exposing a test-only
login route.

## Design

- Colors: navy `#121d33` (header/primary), amber `#f59e0b` (accent), orange
  `#ea580c` (links), slate `#f8fafc` ground
- Card-based layout on soft shadows, with color-coded status badges and stat
  chips (Applied = amber, Interviewing = purple, Offer = green, Rejected =
  rose, Withdrawn = slate)
- Responsive layout with breakpoints at 768px and 480px
- Tokens are defined once as CSS custom properties at the top of
  `client/src/index.css`; there is no CSS framework or build step beyond Vite

## Out of scope

CSV export, calendar view, and column sorting are not implemented; each could
be added on top of the existing API and data model without changes to either.

Within authentication, deliberately left out: sign-in providers other than
Google, account deletion, and server-side token revocation — session tokens
are stateless, so signing out clears the client's copy but a leaked token
stays valid until it expires (7 days).

# User Management API — Express.js MVC Demo

Companion code for the Monday session on **REST & the MVC pattern**
(see [`../REST-and-MVC.md`](../REST-and-MVC.md)).

A user-management REST API built with a strict MVC separation, storing data in a
plain `user.json` file, with an `isLoggedIn` middleware guarding a second copy
of the CRUD routes.

---

## Quick start

```bash
npm install
npm start          # http://localhost:3000
# or: npm run dev  (restarts on file save)
```

Then open `requests.http` in VS Code (REST Client extension) and run the blocks
top to bottom, or use the curl commands below.

---

## Project structure

```
user-management-app/
├── server.js                       # entry point — opens the port
├── requests.http                   # click-to-run demo requests for class
└── src/
    ├── app.js                      # builds the Express app (middleware + routes)
    ├── data/
    │   └── user.json               # our "database" — starts as []
    ├── models/
    │   └── user.model.js           # M — the ONLY file that touches storage
    ├── controllers/
    │   ├── user.controller.js      # C — request in, response out
    │   └── auth.controller.js      # C — flips the isLoggedIn switch
    ├── routes/
    │   ├── index.js                # mounts every route group under /api
    │   ├── user.routes.js          # OPEN CRUD routes
    │   ├── secure.routes.js        # PROTECTED CRUD routes
    │   └── auth.routes.js          # login / logout / status
    ├── middlewares/
    │   ├── auth.middleware.js      # the isLoggedIn guard
    │   ├── validate.middleware.js  # body validation
    │   └── error.middleware.js     # 404 + central error handler
    └── utils/
        └── response.js             # V — one consistent JSON shape
```

**Which layer does what**

| Layer | File(s) | Allowed to | Must never |
| --- | --- | --- | --- |
| Model | `models/` | read/write `user.json` | touch `req` or `res` |
| View | `utils/response.js` | shape the JSON reply | hold business rules |
| Controller | `controllers/` | read `req`, call the model, send `res` | read files directly |
| Routes | `routes/` | map URL + method to a handler | contain any logic |
| Middleware | `middlewares/` | guard, validate, log | know how users are stored |

---

## Endpoints

### Open — no login required

| Method | Endpoint | Success | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/users` | `201` | `400` invalid body, `409` duplicate email |
| `GET` | `/api/users` | `200` | `200` with `[]` when empty |
| `GET` | `/api/users/:id` | `200` | `404` if missing |
| `PUT` | `/api/users/:id` | `200` | `404` if missing, `409` email taken |
| `DELETE` | `/api/users/:id` | `200` | `404` if missing |

### Protected — `isLoggedIn` middleware, else `401`

| Method | Endpoint |
| --- | --- |
| `POST` | `/api/secure/users` |
| `GET` | `/api/secure/users` |
| `GET` | `/api/secure/users/:id` |
| `PUT` | `/api/secure/users/:id` |
| `DELETE` | `/api/secure/users/:id` |

These reuse **the exact same controller functions** as the open routes. The only
difference is one `router.use(checkLoggedIn)` line in `secure.routes.js`.

### Auth (the demo switch)

| Method | Endpoint | Effect |
| --- | --- | --- |
| `POST` | `/api/auth/login` | `isLoggedIn = true` |
| `POST` | `/api/auth/logout` | `isLoggedIn = false` |
| `GET` | `/api/auth/status` | read the current value |

---

## Response shape

Every endpoint answers in the same envelope:

```jsonc
// success
{ "success": true,  "message": "User created successfully.", "data": { } }

// failure
{ "success": false, "message": "Validation failed.", "errors": [ ] }
```

---

## The 60-second classroom demo

```bash
# 1. Protected route while logged out -> 401. The controller never runs.
curl -i http://localhost:3000/api/secure/users

# 2. Create a user on the open route -> 201. Watch user.json change on disk.
curl -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Asha Rao","email":"asha@example.com","age":24}'

# 3. Log in -> flips the middleware's variable
curl -X POST http://localhost:3000/api/auth/login

# 4. The exact same request as step 1 -> now 200
curl -i http://localhost:3000/api/secure/users

# 5. Log out -> back to 401
curl -X POST http://localhost:3000/api/auth/logout
curl -i http://localhost:3000/api/secure/users
```

Steps 1 and 4 are identical requests with opposite outcomes. Nothing in the
controller or model changed between them — that is the lesson.

---

## Important teaching caveat

`isLoggedIn` is a **module-level variable shared by the entire server**. If one
client logs in, every client is logged in, and the value resets on restart. It
also breaks REST's *stateless* constraint, because the server is remembering
something between requests.

That is intentional for this session: it shows the *mechanism* of middleware
without the noise of JWTs, bcrypt and session stores. When we replace it with a
real token next session, only the body of `checkLoggedIn` changes — the routes,
controllers and model stay untouched. **That is the reward for good layering.**

---

## Exercises

See Part 6 of [`../REST-and-MVC.md`](../REST-and-MVC.md). Start with:

1. Add `GET /api/users/count`. Which layer owns the counting?
2. Add `PATCH /api/users/:id`. How does it differ from `PUT`?
3. Add an `isAdmin` middleware returning `403`. Chain it *after* `checkLoggedIn`
   — why does the order matter?
4. Replace the JSON file with an in-memory array. You should only need to edit
   **one file**. If you need more, your layering leaked.

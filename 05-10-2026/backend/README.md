# Backend (Express + Passport)

The API for the [CORS and Authentication](../README.md) session. Two files:

| File | Lines | What's in it |
|---|---|---|
| `server.js` | ~55 | middleware wiring, the one protected route |
| `auth.js` | ~115 | the user file, Passport, the gate, the auth routes |

Users live in a plain JSON file, so nobody has to install a database.

## Run it

```bash
npm install
npm start
```

Runs on http://localhost:3000. Run `npm start` **from inside this folder** —
`auth.js` reads `./users.json`, which means "the folder you started the server
from".

## ⚠️ It starts broken on purpose

Two lines in `server.js` are commented out:

```js
// const cors = require('cors');
// app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
```

That is Step 1 of the session: the React app cannot read our responses and the
browser console says *"No 'Access-Control-Allow-Origin' header is present"*.
Show the class that first, then uncomment both lines and restart.

Everything from Step 3 onwards (the login cookie) needs them uncommented.

## Routes

| Method | URL | Logged in? | What it does |
|---|---|---|---|
| GET | `/` | **yes** | the protected message |
| POST | `/auth/signup` | no | create an account, then log in |
| POST | `/auth/login` | no | check the password, set the session cookie |
| POST | `/auth/logout` | no | destroy the session |
| GET | `/auth/me` | no | `{ user }` or `{ user: null }` |

## `server.js` — the wiring

Read it top to bottom; the order is the lesson.

```js
app.use(express.json());         // so req.body exists
// app.use(cors({ ... }));       // <- commented out: Step 2
app.use(/* no-store */);         // our answers depend on who is logged in
app.use(session({ ... }));       // the cookie + where we remember people
app.use(passport.initialize());
app.use(passport.session());     // must be AFTER session()
app.use('/auth', authRoutes);    // from auth.js
app.get('/', ensureLoggedIn, handler);
```

Move the CORS line below the routes and the preflight breaks. Put
`passport.session()` above `session(...)` and Express throws
`Login sessions require session support`.

The `no-store` header matters more than it looks: without it the browser can
serve a cached `/auth/me`, and the Step 1 demo appears to work even with CORS
switched back off.

## `auth.js` — everything about logging in

Four sections, in this order:

1. **the user file** — `readUsers`, `findUser`, `publicUser`
2. **Passport** — the `LocalStrategy`, then `serializeUser` and
   `deserializeUser`
3. **the gate** — `ensureLoggedIn`
4. **the routes** — an `express.Router()` with signup, login, logout and `/me`

It exports exactly two things:

```js
module.exports = { router, ensureLoggedIn };
```

`server.js` mounts the router and puts the gate in front of `/`. That is the
whole interface between the two files.

### The bits worth stopping on

**`done` has three shapes.** Mixing them up is the classic Passport bug:

| Call | Means |
|---|---|
| `done(err)` | something broke — 500 |
| `done(null, false, { message })` | wrong password — 401 |
| `done(null, user)` | success |

`done(null, false)` is **not** an error. A wrong password is a normal outcome.

**`serializeUser` runs once** (at login) and stores only the id.
**`deserializeUser` runs on every request** that carries the cookie, and is
what sets `req.user`.

**`req.logIn` is what creates the session.** Because `/auth/login` uses its own
`authenticate` callback (so a wrong password gets a JSON message React can
show), Passport no longer logs the user in for us. Forget `req.logIn` and login
"succeeds" with no cookie set.

**`publicUser` exists so the hash never leaves the server.** Delete it once,
use `res.json(user)` instead, and look at the Network tab.

## Try it without a browser

CORS is a browser rule, so `curl` ignores it completely — useful for proving
the point in class.

```bash
# protected route, no cookie
curl -i http://localhost:3000/

# sign up, keeping the cookie in a jar
curl -c jar.txt -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"secret123"}'

# now with the cookie
curl -b jar.txt http://localhost:3000/
curl -b jar.txt http://localhost:3000/auth/me

# the CORS headers (after uncommenting the two lines)
curl -i http://localhost:3000/auth/me -H "Origin: http://localhost:5173"

# the preflight that fires before POST /auth/login
curl -i -X OPTIONS http://localhost:3000/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

## Three things to demo

**1. The server never rejects anything.** With CORS on for port 5173:

```bash
curl -i http://localhost:3000/auth/me -H "Origin: http://evil.example"
```

You get `200 OK`, the JSON, and `Access-Control-Allow-Origin:
http://localhost:5173`. Express answered a request from `evil.example` — it is
the *browser* that would compare the two origins and refuse to show the body to
the page. **CORS is not authorisation.**

**2. Passwords are never stored.** Sign up, then `cat users.json`. You get a
bcrypt hash, not `secret123`. If that file leaks, the passwords do not.

**3. One argument is the whole gate.** In `server.js`:

```js
app.get('/', (req, res) => { ... });   // public again
```

Log out, refresh — the message is public. (You'll get a crash on
`req.user.email`, which is itself the point: the gate is what guarantees
`req.user` exists.)

## Reset between classes

```bash
echo '[]' > users.json
```

## Not production code

Deliberately left simple:

- `secret: 'classroom-secret-change-me'` → in real life an env var
- the session store is in memory, so every restart logs everyone out
  → `connect-redis` or similar
- `users.json` is rewritten whole on every signup, and ids are
  `users.length + 1` → fine with no delete route, wrong the moment there is one
- no rate limiting on `/auth/login` → brute force is free
- no CSRF protection, which cookie auth needs → `csurf` or
  `sameSite: 'strict'`
- `sameSite: 'lax'` only works because both ports are `localhost`; see Part 5.5
  of the [session notes](../README.md)

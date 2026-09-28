# Monday Session — REST APIs & the MVC Pattern

> Session goal: by the end of this class a student can explain what makes an API
> "RESTful", can draw the MVC triangle from memory, and can point at any file in
> our Express app and say which layer it belongs to and why.

---

## Table of contents

1. [Part 1 — REST](#part-1--rest)
2. [Part 2 — MVC](#part-2--mvc)
3. [Part 3 — REST + MVC together in Express](#part-3--rest--mvc-together-in-express)
4. [Part 4 — Middleware](#part-4--middleware)
5. [Part 5 — Live coding plan](#part-5--live-coding-plan)
6. [Part 6 — Exercises & quiz](#part-6--exercises--quiz)
7. [Cheat sheet](#cheat-sheet)

---

# Part 1 — REST

## 1.1 The one-line definition

**REST** (REpresentational State Transfer) is an *architectural style* for
designing networked applications. It is **not** a library, not a framework, and
not a protocol. It is a set of rules about *how a client and a server should
talk to each other over HTTP*.

Opening question for the class:

> "If I gave you a URL and no documentation, could you guess what it does?"

With a REST API the answer is usually **yes** — and that predictability is the
entire point.

## 1.2 The mental model: everything is a resource

In REST you stop thinking in terms of *actions* and start thinking in terms of
**nouns (resources)**.

| Not RESTful (verbs in the URL) | RESTful (nouns + HTTP verb) |
| --- | --- |
| `GET /getAllUsers` | `GET /users` |
| `POST /createNewUser` | `POST /users` |
| `POST /updateUserById?id=3` | `PUT /users/3` |
| `GET /deleteUser?id=3` | `DELETE /users/3` |

Key teaching point:

> The **URL says *what*** you are talking about.
> The **HTTP method says *what you want to do*** to it.

A resource is anything worth naming: a user, an order, a comment, a playlist.
Each resource gets an address (a URI), and the same address supports several
operations depending on the verb.

## 1.3 The HTTP verbs that matter

| Verb | Meaning | Our route | Typical success status |
| --- | --- | --- | --- |
| `GET` | Read. Never changes data. | `GET /users` | `200 OK` |
| `GET` | Read one. | `GET /users/:id` | `200 OK` |
| `POST` | Create a new resource. | `POST /users` | `201 Created` |
| `PUT` | Replace a resource entirely. | `PUT /users/:id` | `200 OK` |
| `PATCH` | Update *part* of a resource. | `PATCH /users/:id` | `200 OK` |
| `DELETE` | Remove a resource. | `DELETE /users/:id` | `200 OK` / `204 No Content` |

### Safe vs idempotent — a question that shows up in interviews

- **Safe** = does not change server state. `GET` is safe.
- **Idempotent** = calling it 1 time and 10 times leaves the server in the same
  state. `GET`, `PUT`, `DELETE` are idempotent. **`POST` is not** — call it ten
  times and you create ten users.

Demo for the class: hit `POST /users` three times with the same body, then
show `user.json` now has three records. Then hit `DELETE /users/1` three
times — the first deletes, the next two return `404`, but the *server state* is
identical after each. That is idempotency.

## 1.4 Status codes students must know

| Code | Name | When we use it |
| --- | --- | --- |
| `200` | OK | Successful read / update / delete |
| `201` | Created | A `POST` created something new |
| `204` | No Content | Success, nothing to send back |
| `400` | Bad Request | Client sent invalid data (missing `name`) |
| `401` | Unauthorized | Not logged in — **this is our middleware's job** |
| `403` | Forbidden | Logged in, but not allowed |
| `404` | Not Found | No user with that id |
| `409` | Conflict | Email already registered |
| `500` | Internal Server Error | We broke something |

Rule of thumb to give them:

> `2xx` = you did well. `4xx` = *you* (the client) messed up.
> `5xx` = *I* (the server) messed up.

## 1.5 The six REST constraints

Walk through these quickly — one sentence each, with our app as the example.

1. **Client–Server** — the UI and the data store evolve independently. Our
   Express app doesn't care whether the client is Postman, React, or curl.
2. **Stateless** — every request carries everything the server needs. The
   server does **not** remember the previous request.
   *Teaching honesty note:* the `isLoggedIn` variable we build today **violates**
   this on purpose — it's a teaching scaffold. Real systems send a JWT or a
   session cookie on every request. Say this out loud in class.
3. **Cacheable** — responses declare whether they can be cached.
4. **Uniform Interface** — same conventions everywhere: nouns, verbs, JSON.
5. **Layered System** — a client can't tell if it's talking to the real server
   or to a load balancer / proxy in front of it.
6. **Code on Demand** (optional) — the server may send executable code.

## 1.6 Anatomy of a request and a response

```http
POST /users HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{ "name": "Asha", "email": "asha@example.com", "age": 24 }
```

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "message": "User created successfully",
  "data": { "id": 1, "name": "Asha", "email": "asha@example.com", "age": 24 }
}
```

Point out the four parts of a request: **method, URL, headers, body** — and the
three parts of a response: **status code, headers, body**.

---

# Part 2 — MVC

## 2.1 The problem MVC solves

Show them this first. Write the "everything in one file" version on the board:

```js
app.post('/users', (req, res) => {
  const raw = fs.readFileSync('./user.json', 'utf-8');   // data access
  const users = JSON.parse(raw);
  if (!req.body.name) return res.status(400).send('bad'); // validation
  const user = { id: users.length + 1, ...req.body };     // business logic
  users.push(user);
  fs.writeFileSync('./user.json', JSON.stringify(users)); // data access again
  res.status(201).json(user);                             // response shaping
});
```

Ask the class:

- "What happens when we move from a JSON file to MongoDB?"
- "Where do I add the same validation for `PUT`?"
- "How do I unit test the *creation logic* without starting a web server?"

Every answer hurts. That pain is why MVC exists.

## 2.2 The three layers

```
                    ┌──────────────────────┐
   HTTP request ───►│      ROUTES          │  "which URL maps to which handler"
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │     CONTROLLER       │  "read the request, decide,
                    │                      │   shape the response"
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │       MODEL          │  "own the data — read & write it"
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  user.json / database│
                    └──────────────────────┘
```

| Layer | Responsibility | It is allowed to... | It must NEVER... |
| --- | --- | --- | --- |
| **Model** | Owns the data and how it is stored | Read and write `user.json` | Touch `req` or `res` |
| **View** | Presents the result to the user | Render HTML / format JSON | Contain business rules |
| **Controller** | The traffic cop between them | Read `req`, call the model, send `res` | Read files or write SQL directly |

## 2.3 "Where is the View in a JSON API?"

This is the question a sharp student always asks. The honest answer:

> In a server-rendered app (EJS, Pug, Handlebars) the View is the template file.
> In a **JSON API the View is the JSON response itself** — the *representation*
> of the resource. That is literally the "Representational" in REST.

In our app the "view layer" is simply the `res.json(user)` call at the end of
each controller function — the JSON we hand back is the representation.

Ask the class: if we later wanted to return HTML instead, which files would
change? (Only the controllers. The model would not notice.)

## 2.4 The golden rules (put these on a slide)

1. **Routes are dumb.** A route file should contain no `if`, no `fs`, no logic.
   It is a table of contents.
2. **Controllers are thin.** They translate HTTP ↔ business logic. If a
   controller is 80 lines, some of it belongs in the model.
3. **Models are ignorant of HTTP.** A model function should be callable from a
   CLI script, a cron job, or a test — not just from a web request.
4. **One direction of knowledge.** Routes know controllers. Controllers know
   models. Models know nothing above them.

The test to give students: *"Could I swap Express for Fastify and only rewrite
the routes and controllers?"* If yes, your layering is correct.

## 2.5 Request lifecycle — trace it out loud

For `PUT /secure/users/2`:

```
1. Browser/Postman sends PUT with a JSON body
2. server.js                  → express.json() parses the body into req.body
3. routes/secureRoutes.js     → matches /secure/users/:id, req.params.id = "2"
4. middlewares/auth.js        → checkLoggedIn: is isLoggedIn true?
                                NO  → 401, chain stops. Controller never runs.
                                YES → next()
5. controllers/userController → updateUser: reads req.body
6. models/userModel.js        → readUsers() from user.json
5. controllers/userController → finds id 2, changes the fields
6. models/userModel.js        → saveUsers() back to user.json
7. controllers/userController → res.json(user), status 200
```

Have a student narrate this while you step through the files. It is the single
most valuable five minutes of the session.

---

# Part 3 — REST + MVC together in Express

## 3.1 Our folder structure

```
user-management-app/
├── package.json
├── server.js                       # starts the app and connects the routes
├── data/
│   └── user.json                   # our "database": starts as []
├── models/
│   └── userModel.js                # M — the only file that touches the file
├── controllers/
│   └── userController.js           # C — the five CRUD functions
├── routes/
│   ├── userRoutes.js               # OPEN routes (no middleware)
│   └── secureRoutes.js             # PROTECTED routes (with middleware)
└── middlewares/
    └── auth.js                     # the isLoggedIn check
```

Emphasise: **you can guess what any file does from its name.** That is the
payoff of a convention.

## 3.2 The route table students should copy into their notes

**Open routes — no login required (for comparison/teaching):**

| Method | Endpoint | Does |
| --- | --- | --- |
| `POST` | `/users` | Create a user |
| `GET` | `/users` | List all users |
| `GET` | `/users/:id` | Read one user |
| `PUT` | `/users/:id` | Update a user |
| `DELETE` | `/users/:id` | Delete a user |

**Protected routes — the SAME controllers, guarded by middleware:**

| Method | Endpoint | Does |
| --- | --- | --- |
| `POST` | `/secure/users` | Create — 401 if logged out |
| `GET` | `/secure/users` | List — 401 if logged out |
| `GET` | `/secure/users/:id` | Read one — 401 if logged out |
| `PUT` | `/secure/users/:id` | Update — 401 if logged out |
| `DELETE` | `/secure/users/:id` | Delete — 401 if logged out |

**Auth helpers (to flip the switch in class):**

| Method | Endpoint | Does |
| --- | --- | --- |
| `POST` | `/login` | Sets `isLoggedIn = true` |
| `POST` | `/logout` | Sets `isLoggedIn = false` |

The teaching moment here is big: **the two route groups share the exact same
controller functions.** Nothing in the controller knows or cares about auth.
That separation is the whole lesson.

---

# Part 4 — Middleware

## 4.1 What middleware actually is

A middleware is just a function with a specific signature:

```js
function myMiddleware(req, res, next) {
  // 1. inspect or modify req / res
  // 2. then either:
  next();                    //   pass control to the next function, OR
  // res.status(401).json(); //   end the request here (short-circuit)
}
```

Analogy for the class: **security at an airport.**

> Check-in (route matching) → security screening (middleware) → boarding gate
> (controller). If security stops you, you never reach the gate. The gate staff
> don't need to check your passport — that already happened upstream.

## 4.2 The three things a middleware can do

1. Call `next()` → continue the chain.
2. Send a response → the chain **stops**; the controller never runs.
3. Call `next(err)` → jump straight to the error-handling middleware.

Common bug to warn about: **forgetting `next()`**. The request just hangs until
it times out, with no error message. Show them this deliberately once.

## 4.3 Our auth middleware

```js
// middlewares/auth.js
let isLoggedIn = false;          // module-level state = our fake session

function checkLoggedIn(req, res, next) {
  if (!isLoggedIn) {
    return res.status(401).json({ message: 'Please login first' });
  }
  next();
}
```

Three details worth calling out:

- **`return`** before `res.status(...)`. Without it, execution continues and you
  risk "Cannot set headers after they are sent".
- **`401` not `403`.** 401 = "I don't know who you are." 403 = "I know who you
  are, and you still can't."
- **Module-level `let`**, not a global. Node caches modules, so every file that
  imports this shares the same value — a simple, honest singleton.

## 4.4 Where middleware can be applied — four levels

```js
app.use(express.json());                      // 1. application level (all routes)
router.use(checkLoggedIn);                    // 2. router level (all routes in this file)
router.get('/:id', checkLoggedIn, handler);   // 3. route level (this one route)
app.use((err, req, res, next) => {...});      // 4. error level (4 args!)
```

Our app uses **router level** for the secure routes — one line protects five
endpoints. Ask the class why that is better than repeating the middleware on
each route. (Answer: you cannot forget it on the sixth endpoint you add later.)

## 4.5 The honest caveat — say this explicitly

> `isLoggedIn` as a module variable is **shared by every user of the server**.
> If you log in, *everyone* is logged in. It also breaks REST's statelessness
> constraint and resets when the server restarts.
>
> It exists here so you can see the *mechanism* of middleware without the noise
> of JWTs, bcrypt, and sessions. Next session we replace it with a real token
> and the middleware body changes — but **nothing else in the app does.** That
> is the reward for good layering.

---

# Part 5 — Live coding plan

Suggested order for building this in front of the class (~75 minutes):

| # | Step | Minutes | Talking point |
| --- | --- | --- | --- |
| 1 | `npm init`, install `express`, create `user.json` as `[]` | 5 | Why a JSON file instead of a DB today |
| 2 | Bare `server.js` that returns `"hello"` | 5 | The server is just a function of request → response |
| 3 | Write the **model** first | 15 | Data layer has no idea HTTP exists |
| 4 | Write the **controller** | 15 | `req` in, `res` out, delegate everything else |
| 5 | Wire up the **routes** | 10 | Routes are a table of contents |
| 6 | Test all 5 CRUD endpoints in Postman | 10 | Watch `user.json` change on disk live |
| 7 | Add the **auth middleware** + secure routes | 10 | Same controllers, new guard |
| 8 | Demo `401` → login → `200` | 5 | The payoff moment |

**Demo tip:** keep `user.json` open in the editor on one half of the screen and
Postman on the other. Students *seeing* the file change is what makes CRUD
click.

---

# Part 6 — Exercises & quiz

## 6.1 In-class exercises

1. **Easy** — Add `GET /users/count` returning `{ count: n }`. Which layer
   does the counting logic belong in?
2. **Easy** — Make `email` unique. Return `409 Conflict` on a duplicate. Where
   does that check live — model or controller?
3. **Medium** — Add `PATCH /users/:id` that updates only the supplied
   fields. How does it differ from `PUT`?
4. **Medium** — Add a `logger` middleware that prints
   `[2026-09-28T10:00:00Z] GET /users → 200`. Apply it at app level.
5. **Medium** — Add `GET /users?search=asha` filtering by name.
6. **Hard** — Add a `role` field and an `isAdmin` middleware that returns `403`
   for non-admins. Chain it *after* `checkLoggedIn`. Why does order matter?
7. **Hard** — Replace the JSON file with an in-memory array. You should only
   need to change **one file**. If you need to change more, your layering leaked.

## 6.2 Quick quiz (answers below)

1. Why is `POST` not idempotent but `PUT` is?
2. A client sends `PUT /users/999` for a user that doesn't exist. Status?
3. What is the difference between `401` and `403`?
4. Name the three things a middleware function can do.
5. In a JSON API, what plays the role of the "View"?
6. A controller contains `fs.readFileSync`. What rule is broken and how do you fix it?
7. Why does `checkLoggedIn` use `return res.status(401)...` instead of just `res.status(401)...`?

<details>
<summary>Answers</summary>

1. `POST` creates a new resource each call (10 calls = 10 users). `PUT` targets
   a specific id and replaces it, so the end state is identical after 1 or 10 calls.
2. `404 Not Found`.
3. `401` = not authenticated (I don't know who you are). `403` = authenticated
   but not authorised (I know you, you still can't).
4. Call `next()`, send a response and end the chain, or call `next(err)`.
5. The JSON response body — the *representation* of the resource.
6. Rule 3 / rule 4: controllers must not touch the data store. Move the file I/O
   into the model and have the controller call a model function.
7. Without `return`, the function keeps executing and calls `next()`, so Express
   tries to send a second response → "Cannot set headers after they are sent".

</details>

---

# Cheat sheet

**REST in one breath:** nouns in the URL, verbs in the method, status codes tell
the truth, and the server remembers nothing between requests.

**MVC in one breath:** Model owns the data, View shows the data, Controller
moves data between them — and knowledge flows in exactly one direction.

**Middleware in one breath:** a function between the route and the controller
that either waves the request through with `next()` or stops it cold.

```
Routes  →  Middleware  →  Controller  →  Model  →  user.json
 (map)      (guard)        (decide)      (store)
```

**The layering test:** *"Can I swap the web framework without touching my
models? Can I swap the database without touching my controllers?"*
If both are yes — you've done MVC right.

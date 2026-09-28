# User Management App (Express + MVC)

Simple CRUD API for the Monday session on [REST & MVC](../REST-and-MVC.md).
Users are stored in a plain JSON file.

## Run it

```bash
npm install
npm start
```

Server starts on http://localhost:3000

Run `npm start` from inside this folder. The model reads `./user.json`, which
means "the folder you started the server from", so starting it from somewhere
else will not find the file.

## Files

```
user-management-app/
├── server.js                       # starts the app, connects the routes
├── user.json                       # our "database" (starts as [])
├── models/userModel.js             # M - reads/writes user.json
├── controllers/userController.js   # C - the 5 CRUD functions
├── routes/
│   ├── userRoutes.js               # open routes
│   └── secureRoutes.js             # same routes + login check
└── middlewares/auth.js             # the isLoggedIn middleware
```

Who does what:

- **Model** - only file that touches `user.json`. Never sees `req` or `res`.
- **Controller** - reads `req`, calls the model, sends `res`.
- **Routes** - just a list of URLs pointing to controller functions.
- **Middleware** - runs before the controller, can block the request.

## Endpoints

### Open (no login)

| Method | URL | What it does |
|---|---|---|
| POST | `/users` | create a user |
| GET | `/users` | get all users |
| GET | `/users/:id` | get one user |
| PUT | `/users/:id` | update a user |
| DELETE | `/users/:id` | delete a user |

### Protected (login required, else 401)

| Method | URL |
|---|---|
| POST | `/secure/users` |
| GET | `/secure/users` |
| GET | `/secure/users/:id` |
| PUT | `/secure/users/:id` |
| DELETE | `/secure/users/:id` |

These use the **same controller functions** as the open routes. The only
difference is one `router.use(checkLoggedIn)` line in `secureRoutes.js`.

### Login / logout

| Method | URL |
|---|---|
| POST | `/login` |
| POST | `/logout` |

## Try it

```bash
# create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha","email":"asha@mail.com"}'

# get all users
curl http://localhost:3000/users

# get one
curl http://localhost:3000/users/1

# update
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha Rao"}'

# delete
curl -X DELETE http://localhost:3000/users/1
```

## The middleware demo

```bash
# 1. protected route while logged out -> 401
curl http://localhost:3000/secure/users

# 2. login
curl -X POST http://localhost:3000/login

# 3. exact same request as step 1 -> now works
curl http://localhost:3000/secure/users

# 4. logout -> back to 401
curl -X POST http://localhost:3000/logout
curl http://localhost:3000/secure/users
```

Steps 1 and 3 are the same request with different results. The controller and
model did not change at all - only the middleware let it through.

## Note for students

`isLoggedIn` is one variable shared by the whole server. If one person logs in,
everyone is logged in, and it resets when you restart the server. That is fine
for learning how middleware works - real apps use tokens or sessions instead.

When we swap in real login later, only `middlewares/auth.js` changes. The
routes, controllers and model stay exactly the same.

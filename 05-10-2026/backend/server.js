// Wires up the middleware, serves the one protected route, starts the server.
// All the login code is in auth.js.

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { router: authRoutes, ensureLoggedIn } = require('./auth');

const app = express();

app.use(express.json());

// ===================== STEP 2: TURN ON CORS =====================
// These two lines are commented out on purpose, so the class sees the
// failure first. Uncomment them, restart, refresh - and React can read
// our replies. credentials: true is what lets the login cookie through.
// ================================================================

const cors = require('cors');
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Our answers depend on who is logged in, so the browser must never
// reuse an old one. (Without this it can serve a cached /auth/me and the
// Step 2 demo appears to work even with CORS switched back off.)
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// gives each browser a cookie, and us somewhere to remember who it is
app.use(
  session({
    secret: 'classroom-secret-change-me',
    resave: false,
    saveUninitialized: false,
    // in production, across different sites: sameSite: 'none', secure: true
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 },
  })
);

// must come AFTER session - passport.session() reads req.session
app.use(passport.initialize());
app.use(passport.session());

// /auth/signup, /auth/login, /auth/logout, /auth/me
app.use('/auth', authRoutes);

// THE PROTECTED ROUTE.
// ensureLoggedIn either calls next() or answers 401. That one argument is
// the whole difference between a public and a protected endpoint.
app.get('/', ensureLoggedIn, (req, res) => {
  res.json({ message: `Hello ${req.user.email}, this message came from Express.` });
});

app.listen(3000, () => console.log('API running on http://localhost:3000'));

// Everything to do with logging in lives here:
// the user file, Passport, the gate, and the four auth routes.

const fs = require('fs');
const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

// --- our "database": a plain JSON file ---

function readUsers() {
  return JSON.parse(fs.readFileSync('./users.json', 'utf8'));
}

function findUser(email) {
  return readUsers().find((u) => u.email === email.toLowerCase());
}

// never send the password hash to the browser
function publicUser(user) {
  return { id: user.id, email: user.email };
}

// --- Passport: how to check an email and password ---

passport.use(
  new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    const user = findUser(email);

    // done(null, false) means "wrong credentials". That is not an error.
    // Same message for both cases, so we don't reveal which emails exist.
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return done(null, false, { message: 'Wrong email or password' });
    }

    return done(null, user);
  })
);

// at login: put just the id in the session
passport.serializeUser((user, done) => done(null, user.id));

// on every later request: turn that id back into req.user
passport.deserializeUser((id, done) => {
  done(null, readUsers().find((u) => u.id === id) || false);
});

// --- the gate: put this in front of any route that needs a login ---

function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();

  // We answer 401 and let React show the login page. A res.redirect()
  // would not work: axios follows it and hands React the login page's
  // HTML with status 200, which looks just like success.
  res.status(401).json({ error: 'You must be logged in to see this' });
}

// --- the routes ---

const router = express.Router();

router.post('/signup', (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Email and a 6+ character password are required' });
  }

  if (findUser(email)) {
    return res.status(409).json({ error: 'That email is already registered' });
  }

  const users = readUsers();

  const user = {
    id: users.length + 1,
    email: email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10), // never store the password itself
  };

  users.push(user);
  fs.writeFileSync('./users.json', JSON.stringify(users, null, 2));

  // log them in, so they don't have to type it all again
  req.logIn(user, (err) => {
    if (err) return next(err);
    res.status(201).json({ user: publicUser(user) });
  });
});

router.post('/login', (req, res, next) => {
  // Our own callback, so a wrong password gets a message React can show.
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info.message });

    // req.logIn is what creates the session and sets the cookie
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.json({ user: publicUser(user) });
    });
  })(req, res, next); // authenticate() returns middleware, so we call it
});

router.post('/logout', (req, res) => {
  req.logOut(() => req.session.destroy(() => res.json({ ok: true })));
});

// React asks this on page load: the cookie knows, React state does not
router.get('/me', (req, res) => {
  res.json({ user: req.isAuthenticated() ? publicUser(req.user) : null });
});

module.exports = { router, ensureLoggedIn };

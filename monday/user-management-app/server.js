// Main file - creates the app, connects the routes, starts the server

const express = require('express');
const userRoutes = require('./routes/userRoutes');
const secureRoutes = require('./routes/secureRoutes');
const { login, logout, getStatus } = require('./middlewares/auth');

const app = express();

// lets us read req.body as JSON
app.use(express.json());

// open routes  -> /users
app.use('/users', userRoutes);

// protected routes -> /secure/users
app.use('/secure/users', secureRoutes);

// login / logout so we can test the middleware
app.post('/login', (req, res) => {
  login();
  res.json({ message: 'Logged in', isLoggedIn: getStatus() });
});

app.post('/logout', (req, res) => {
  logout();
  res.json({ message: 'Logged out', isLoggedIn: getStatus() });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

// Main file - creates the app, connects the routes, starts the server

const express = require('express');
const userRoutes = require('./routes/userRoutes');

const app = express();

// lets us read req.body as JSON
app.use(express.json());

// open routes  -> /users
app.use('/users', userRoutes);

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});

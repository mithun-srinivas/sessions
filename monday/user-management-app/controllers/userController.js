// CONTROLLER - takes the request, uses the model, sends the response

const { readUsers, saveUsers } = require('../models/userModel');

// CREATE - POST /users
function createUser(req, res) {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'name and email are required' });
  }

  const users = readUsers();

  // next id = last user's id + 1 (don't use users.length + 1,
  // it repeats an id after you delete someone)
  let newId = 1;
  if (users.length > 0) {
    newId = users[users.length - 1].id + 1;
  }

  const newUser = {
    id: newId,
    name: name,
    email: email,
  };

  users.push(newUser);
  saveUsers(users);

  res.status(201).json(newUser);
}

// READ ALL - GET /users
function getAllUsers(req, res) {
  const users = readUsers();
  res.json(users);
}

// READ ONE - GET /users/:id
function getUser(req, res) {
  const users = readUsers();
  const user = users.find((u) => u.id == req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json(user);
}

// UPDATE - PUT /users/:id
function updateUser(req, res) {
  const users = readUsers();
  const user = users.find((u) => u.id == req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // only change what was sent
  if (req.body.name) user.name = req.body.name;
  if (req.body.email) user.email = req.body.email;

  saveUsers(users);
  res.json(user);
}

// DELETE - DELETE /users/:id
function deleteUser(req, res) {
  const users = readUsers();
  const index = users.findIndex((u) => u.id == req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  const deleted = users[index];
  users.splice(index, 1);
  saveUsers(users);

  res.json({ message: 'User deleted', user: deleted });
}

module.exports = { createUser, getAllUsers, getUser, updateUser, deleteUser };

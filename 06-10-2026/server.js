// A todo API backed by MongoDB. Five routes: create, read all, read one,
// update, delete.

const express = require('express');
const mongoose = require('mongoose');
const Todo = require('./todo');

const app = express();

// read JSON bodies into req.body
app.use(express.json());

// Mongoose throws two errors often enough to be worth naming:
//   CastError       - the id in the URL is not a valid MongoDB id
//   ValidationError - the document broke a schema rule (e.g. no title)
function sendError(res, err) {
  if (err.name === 'CastError') return res.status(400).json({ error: 'Not a valid id' });
  if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });

  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
}

// CREATE - POST /todos  { "title": "buy milk" }
app.post('/todos', async (req, res) => {
  try {
    const todo = await Todo.create({ title: req.body.title });
    res.status(201).json(todo);
  } catch (err) {
    sendError(res, err);
  }
});

// READ ALL - GET /todos
app.get('/todos', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 }); // newest first
    res.json(todos);
  } catch (err) {
    sendError(res, err);
  }
});

// READ ONE - GET /todos/:id
app.get('/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);

    // findById returns null when nothing matches - it does not throw
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    res.json(todo);
  } catch (err) {
    sendError(res, err);
  }
});

// UPDATE - PUT /todos/:id  { "title": "buy oat milk", "done": true }
app.put('/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      // Mongoose ignores undefined fields, so sending only { done: true }
      // leaves the title alone, and vice versa.
      { title: req.body.title, done: req.body.done },
      // new: give us the updated document back, not the old one
      // runValidators: apply the schema rules on updates too
      { new: true, runValidators: true }
    );

    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    res.json(todo);
  } catch (err) {
    sendError(res, err);
  }
});

// DELETE - DELETE /todos/:id
app.delete('/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);

    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    res.json({ deleted: todo });
  } catch (err) {
    sendError(res, err);
  }
});

// Connect to MongoDB FIRST, then start listening. If the database is not
// there we want to know straight away, not on the first request.
mongoose
  .connect('mongodb://127.0.0.1:27017/todo-app')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(3000, () => console.log('Todo API on http://localhost:3000'));
  })
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });

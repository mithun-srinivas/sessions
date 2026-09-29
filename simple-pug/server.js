// A tiny todo app - one page, one file.
// Everything is here on purpose, so you can read it top to bottom.

const express = require('express');

const app = express();

app.set('view engine', 'pug');                   // use Pug
app.set('views', './views');                     // where the .pug files are
app.use(express.urlencoded({ extended: true })); // read data sent by a form

// our todos live in a normal array (they disappear when you restart)
let todos = [
  { text: 'Learn Pug', done: true },
  { text: 'Build a todo app', done: false },
];

// SHOW the page
app.get('/', (req, res) => {
  res.render('index', { todos: todos });
});

// ADD a todo
app.post('/add', (req, res) => {
  if (req.body.text) {
    todos.push({ text: req.body.text, done: false });
  }
  res.redirect('/');
});

// TICK / UNTICK a todo
app.post('/done/:i', (req, res) => {
  const todo = todos[req.params.i];
  if (todo) {
    todo.done = !todo.done;
  }
  res.redirect('/');
});

// DELETE a todo
app.post('/delete/:i', (req, res) => {
  todos.splice(req.params.i, 1);
  res.redirect('/');
});

app.listen(3000, () => {
  console.log('Todo app running on http://localhost:3000');
});

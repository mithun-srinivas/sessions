# Simple Pug Todo App

The smallest possible Pug app: **one server file and one page**. Use this to
introduce Pug before showing the full MVC version in
[tuesday/blog-app](../tuesday/blog-app).

## Run it

```bash
npm install
npm start
```

Open http://localhost:3000

## Files

```
simple-pug/
├── server.js          # everything: setup, data, routes
└── views/
    └── index.pug      # the one and only page
```

There is no models/ or controllers/ folder here on purpose. Everything is in
`server.js` so you can read the whole app top to bottom in one go.

## What it does

- Shows a list of todos
- Add a todo with the form
- Tick / untick a todo (done ones get a line through them)
- Delete a todo with the **x** button

Todos live in a normal array in `server.js`, so they disappear when the server
restarts. That is fine for a first demo — saving to a file comes later.

## The three lines that turn on Pug

```js
app.set('view engine', 'pug');                   // use Pug for res.render
app.set('views', './views');                     // where the .pug files are
app.use(express.urlencoded({ extended: true })); // read data sent by a form
```

Forget that last one and `req.body` is `undefined` when the form submits.

## Things to point out in class

**1. Indentation instead of closing tags.** The whole page is one `index.pug`
file. Nothing is closed — the indentation says what goes inside what.

**2. `each` with `else`.** Delete every todo and the page says "Nothing to do."
That `else` belongs to the `each`, not to an `if`:

```pug
each todo, i in todos
  p= todo.text
else
  p Nothing to do.
```

**3. `if` inside a loop.** A finished todo gets a different class:

```pug
if todo.done
  span.done= todo.text
else
  span= todo.text
```

**4. Buttons are tiny forms.** A link sends a GET. To change something we need
a POST, and a form is the only way a plain HTML page can send one:

```pug
form(action="/delete/" + i, method="POST")
  button(type="submit") x
```

**5. Redirect after POST.** Every route that changes data ends with
`res.redirect('/')`. That is why the text box is empty again after you add a
todo, and why refreshing never adds the same todo twice.

## Exercises

1. Add a heading that shows how many todos are left.
2. Make the page say "All done!" when every todo is ticked.
3. Add an "Clear finished" button that removes all ticked todos.
4. Move the todos into a `todos.json` file so they survive a restart.
5. Split `server.js` into `models/`, `controllers/` and `routes/` — this turns
   it into the same shape as the blog app.

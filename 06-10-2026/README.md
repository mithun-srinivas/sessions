# Session 06-10-2026 — Express with Mongoose

> Session goal: by the end of this class a student can explain what
> Mongoose adds on top of MongoDB, write a schema, and build the five CRUD
> routes against a real database instead of a JSON file.

A todo API in two files. No frontend, no templates — just routes you can hit
with `curl`, so the whole lesson stays on the database.

```
06-10-2026/
├── server.js   the five routes + the connection   (~100 lines)
├── todo.js     the schema and model               (~30 lines)
└── package.json
```

---

## Run it

MongoDB has to be running first:

```bash
brew services start mongodb-community
```

Then:

```bash
npm install
npm start
```

You should see:

```
Connected to MongoDB
Todo API on http://localhost:3000
```

If MongoDB is not running you get this instead, and the process exits:

```
Could not connect to MongoDB: connect ECONNREFUSED 127.0.0.1:27017
```

That is deliberate — see [§5](#5-connect-first-then-listen).

## Routes

| Method | URL | Body | What it does |
|---|---|---|---|
| POST | `/todos` | `{ "title": "buy milk" }` | create one |
| GET | `/todos` | — | all todos, newest first |
| GET | `/todos/:id` | — | one todo |
| PUT | `/todos/:id` | `{ "title": "...", "done": true }` | update one |
| DELETE | `/todos/:id` | — | delete one |

### Try them

```bash
# create - copy the _id from the response
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"buy milk"}'

# read all
curl http://localhost:3000/todos

# read one
curl http://localhost:3000/todos/PASTE_ID_HERE

# update (send just the fields you want to change)
curl -X PUT http://localhost:3000/todos/PASTE_ID_HERE \
  -H "Content-Type: application/json" \
  -d '{"done":true}'

# delete
curl -X DELETE http://localhost:3000/todos/PASTE_ID_HERE
```

---

## 1. Why Mongoose?

MongoDB stores whatever you give it. That is the selling point and the
problem. Nothing stops you writing all of these into one collection:

```js
{ title: "buy milk", done: false }
{ titel: "buy bread" }              // typo - a brand new field
{ title: 42, done: "yes" }          // wrong types
{ }                                 // nothing at all
```

Then your code does `todo.title.toUpperCase()` and crashes in production.

**Mongoose is a layer in front of MongoDB that gives your documents a
shape.** You declare the shape once, and it:

- rejects documents that break the rules, before they reach the database
- fills in defaults
- converts types (`"true"` → `true`)
- gives you `Todo.find()` instead of hand-written queries

The word for this is an **ODM** — Object Document Mapper. (The SQL
equivalent is an ORM, like Sequelize or Prisma.)

## 2. The schema

```js
const todoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);
```

Four rules, and each one earns its place:

| | What it does | Try it |
|---|---|---|
| `required: true` | no title, no save | `POST /todos` with `{}` → 400 |
| `trim: true` | strips surrounding spaces | send `"  milk  "`, read back `"milk"` |
| `default: false` | a new todo is never done | create one, look at `done` |
| `timestamps: true` | adds `createdAt`, `updatedAt` | update one, watch `updatedAt` move |

Worth demoing: `trim` plus `required` together reject `{"title":"   "}`,
because trimming happens first and leaves an empty string.

## 3. The model

```js
module.exports = mongoose.model('Todo', todoSchema);
```

A schema is just a description. A **model** is the thing you call methods on.

The name matters more than it looks: `'Todo'` is lower-cased and pluralised
by Mongoose, so the documents land in a collection called **`todos`**. Show
the class:

```bash
mongosh todo-app --eval 'db.todos.find()'
```

Same data, seen from underneath. Nothing magic is happening.

## 4. The five methods

| Route | Mongoose call |
|---|---|
| create | `Todo.create({ title })` |
| read all | `Todo.find().sort({ createdAt: -1 })` |
| read one | `Todo.findById(id)` |
| update | `Todo.findByIdAndUpdate(id, changes, { new: true, runValidators: true })` |
| delete | `Todo.findByIdAndDelete(id)` |

Three things in that table trip people up.

**`findById` returns `null` when nothing matches — it does not throw.** So
every `:id` route needs the same two lines:

```js
const todo = await Todo.findById(req.params.id);
if (!todo) return res.status(404).json({ error: 'Todo not found' });
```

**`{ new: true }` on update.** Without it, `findByIdAndUpdate` hands back the
document as it was *before* the change, which looks like the update silently
failed. Delete the option and watch the class get confused — then put it back.

**`{ runValidators: true }` on update.** Schema rules are checked on
`create` automatically, but **not** on update unless you ask. Without it you
can `PUT {"title":""}` straight past `required: true`.

Also note that update takes only what you send:

```bash
curl -X PUT .../todos/ID -d '{"done":true}'    # title is untouched
```

That works because Mongoose ignores `undefined` fields in the update object,
and `req.body.title` is `undefined` when you did not send it.

## 5. Connect first, then listen

```js
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
```

The database you name — `todo-app` — does not need to exist. MongoDB creates
it on the first write.

Starting the server *inside* `.then()` means we never accept a request we
cannot serve. The alternative, `app.listen()` at the top level with
`connect()` running alongside, starts a server that answers every request
with a 500 until the database turns up, and that is a miserable thing to
debug.

## 6. The two errors worth naming

```js
function sendError(res, err) {
  if (err.name === 'CastError') return res.status(400).json({ error: 'Not a valid id' });
  if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });

  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
}
```

| Error | When | Status |
|---|---|---|
| `CastError` | the id is not a valid MongoDB id — `/todos/banana` | 400 |
| `ValidationError` | a schema rule failed — no title | 400 |
| anything else | our bug | 500 |

Both are the **client's** mistake, so both are 400, not 500. A missing todo
with a *valid-looking* id is different again — that is a 404, and it is
handled by the `if (!todo)` check, not here.

Try all three:

```bash
curl -i http://localhost:3000/todos/banana                    # 400 CastError
curl -i -X POST http://localhost:3000/todos -d '{}' \
     -H "Content-Type: application/json"                      # 400 ValidationError
curl -i http://localhost:3000/todos/000000000000000000000000  # 404
```

## 7. `async`/`await` and why every route has a `try`

Every database call returns a promise, so every handler is `async`.

Express 4 does **not** catch errors thrown inside an `async` handler. Leave
out the `try`/`catch`, request `/todos/banana`, and the rejected promise goes
unhandled — which on current Node versions **kills the whole server process**:

```
CastError: Cast to ObjectId failed for value "banana" (type string)
    at path "_id" for model "Todo"
```

curl reports a dropped connection, the terminal shows that stack trace, and
the API is simply gone for everyone until you restart it. One bad URL from
one user takes the server down. That is why all five routes look like this:

```js
app.get('/todos/:id', async (req, res) => {
  try {
    // ...
  } catch (err) {
    sendError(res, err);
  }
});
```

(Express 5 changed this and forwards async errors for you. Good thing to
mention, not to rely on yet.)

---

## Common mistakes

1. **Forgetting `express.json()`** — `req.body` is `undefined`, so every
   create fails validation with "title is required".
2. **Forgetting `{ new: true }`** — the update works, but the response shows
   the old values.
3. **Forgetting `{ runValidators: true }`** — updates skip the schema rules.
4. **Expecting `findById` to throw on a missing document** — it returns
   `null`.
5. **Returning 500 for a bad id** — that is the caller's mistake: 400.
6. **`app.listen()` before the database is connected** — see §5.
7. **Thinking the model name is the collection name** — `'Todo'` becomes
   `todos`.
8. **No `try`/`catch` in an `async` route on Express 4** — the unhandled
   rejection crashes the server process, not just that one request.

## Exercises

1. Add a `PATCH /todos/:id/toggle` route that flips `done`. Which Mongoose
   call is cleanest?
2. Add `GET /todos?done=true` so the list can be filtered. (Hint: pass an
   object to `find()`.)
3. Add a `priority` field that may only be `'low'`, `'medium'` or `'high'`.
   Look up the `enum` schema option.
4. Make `title` at least 3 characters with `minlength`, and check the error
   message you get back.
5. Add `DELETE /todos` that clears all completed todos in one call. Look up
   `deleteMany`.
6. Move the connection string into an environment variable so it is not
   hard-coded.
7. The `__v` field in every response is Mongoose's version key. Find out
   what it is for, then hide it from responses.
8. Harder: split the five routes out of `server.js` into a `routes.js` using
   `express.Router()`, the way we did with `auth.js` yesterday.

## Cheat sheet

```js
// connect
await mongoose.connect('mongodb://127.0.0.1:27017/todo-app');

// schema + model
const schema = new mongoose.Schema({ title: { type: String, required: true } },
                                   { timestamps: true });
const Todo = mongoose.model('Todo', schema);   // -> the "todos" collection

// create
await Todo.create({ title: 'buy milk' });

// read
await Todo.find();                             // all
await Todo.find({ done: true });               // filtered
await Todo.find().sort({ createdAt: -1 });     // newest first
await Todo.findById(id);                       // null if missing

// update
await Todo.findByIdAndUpdate(id, { done: true }, { new: true, runValidators: true });

// delete
await Todo.findByIdAndDelete(id);
await Todo.deleteMany({ done: true });
```

```bash
# look at the data from underneath
mongosh todo-app --eval 'db.todos.find()'

# start over
mongosh todo-app --eval 'db.dropDatabase()'
```

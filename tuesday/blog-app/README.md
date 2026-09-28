# Blog App (Express + Pug)

A small server-rendered blog for the Tuesday session on
[Pug with Express](../PUG-with-Express.md). Posts are stored in a plain JSON
file — same idea as Monday's user app, but the pages are real HTML instead of
JSON.

## Run it

```bash
npm install
npm start
```

Open http://localhost:3000

Run `npm start` from inside this folder. The model reads `./posts.json`, which
means "the folder you started the server from".

## Files

```
blog-app/
├── server.js                       # sets up Pug, connects the routes
├── posts.json                      # our "database" (starts as [])
├── models/postModel.js             # M - reads/writes posts.json
├── controllers/postController.js   # C - gets data, calls res.render
├── routes/postRoutes.js            # which URL runs which function
└── views/                          # V - the Pug templates
    ├── layout.pug                  # shared page frame (header + styles)
    ├── index.pug                   # home page, lists all posts
    ├── post.pug                    # one post
    └── new.pug                     # the write-a-post form
```

Compare this with Monday's user app: **everything is the same except the
`views/` folder.** The only real change is that controllers end with
`res.render(...)` instead of `res.json(...)`.

## Pages

| Method | URL | What it does |
|---|---|---|
| GET | `/` | home page, lists all posts |
| GET | `/new` | show the write-a-post form |
| POST | `/new` | create the post, then redirect home |
| GET | `/post/:id` | show one post |
| POST | `/post/:id/delete` | delete the post, then redirect home |

## The three lines that turn on Pug

In `server.js`:

```js
app.set('view engine', 'pug');                    // use Pug for res.render
app.set('views', './views');                      // where the .pug files live
app.use(express.urlencoded({ extended: true }));  // read data sent by a form
```

That last one is easy to forget. Without it `req.body` is `undefined` when the
form submits.

## Two things to demo in class

**1. Pug escapes HTML for you.** Write a post with this as the title:

```
<script>alert(1)</script>
```

No alert box appears — it shows up as plain text. View the page source and
you'll see `&lt;script&gt;`. That is `=` and `#{}` protecting you from XSS for
free. (`!=` turns the protection off, so never use it on user input.)

**2. Redirect after POST.** `createPost` ends with `res.redirect('/')`. Comment
that out, render the home page instead, submit the form, then hit refresh — the
browser asks to resubmit and you get a duplicate post. Put the redirect back and
refreshing is harmless.

## Exercises

See Part 10 of [PUG-with-Express.md](../PUG-with-Express.md). Good ones to start:

1. Add a footer with the year to `layout.pug`. How many files did you edit?
2. Show the post count in the header: `My Blog (3 posts)`.
3. Add an Edit button that loads a post back into the form.
4. Move the CSS out of `layout.pug` into `public/style.css` and serve it with
   `express.static`.

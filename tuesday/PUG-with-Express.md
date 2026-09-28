# Tuesday Session — Pug with Express

> Session goal: by the end of this class a student can read and write Pug
> templates, pass data into them from a controller, reuse a layout across
> pages, and explain where Pug sits in the MVC pattern we learned on Monday.

**Prerequisite:** Monday's session on [REST & MVC](../monday/REST-and-MVC.md).

---

## Table of contents

1. [Part 1 — Why a template engine?](#part-1--why-a-template-engine)
2. [Part 2 — Pug syntax](#part-2--pug-syntax)
3. [Part 3 — Passing data from the controller](#part-3--passing-data-from-the-controller)
4. [Part 4 — Conditionals and loops](#part-4--conditionals-and-loops)
5. [Part 5 — Layouts, includes and mixins](#part-5--layouts-includes-and-mixins)
6. [Part 6 — Forms](#part-6--forms)
7. [Part 7 — Wiring Pug into Express](#part-7--wiring-pug-into-express)
8. [Part 8 — Common mistakes](#part-8--common-mistakes)
9. [Part 9 — Live coding plan](#part-9--live-coding-plan)
10. [Part 10 — Exercises & quiz](#part-10--exercises--quiz)
11. [Cheat sheet](#cheat-sheet)

---

# Part 1 — Why a template engine?

## 1.1 Start with the problem

On Monday our controllers ended like this:

```js
res.json(users);
```

That is perfect for another program. But a human opening the site in a browser
wants a **page**, not raw JSON. So how do we send HTML?

The naive way:

```js
res.send('<h1>' + post.title + '</h1><p>' + post.body + '</p>');
```

Ask the class what is wrong with that:

- Unreadable the moment the page has more than three tags.
- No way to reuse the header and footer across pages.
- You have to remember every closing tag.
- If `post.title` contains `<script>`, you just shipped a security hole.

## 1.2 The fix

A **template engine** lets you write the page in a file, leave gaps where the
data goes, and hand it data at render time.

```
   controller  ──►  template  ──►  finished HTML  ──►  browser
   (the data)       (the shape)
```

**Pug** is one such engine for Node. It was called *Jade* until 2016, so old
tutorials and Stack Overflow answers use that name — same thing.

## 1.3 Where Pug fits in MVC

On Monday we asked *"where is the View in a JSON API?"* and answered: the JSON
itself. Today the View becomes a real, separate thing.

| | Monday (JSON API) | Tuesday (Pug app) |
| --- | --- | --- |
| Model | `models/userModel.js` | `models/postModel.js` |
| Controller | ends with `res.json(...)` | ends with `res.render(...)` |
| **View** | the JSON shape | **`views/*.pug`** |

**This is the key idea of today's session:** the model does not change, the
routes do not change, and the controller barely changes. Only the last line of
each controller function is different. The V in MVC finally has its own folder.

---

# Part 2 — Pug syntax

## 2.1 The one rule: indentation replaces closing tags

HTML:

```html
<ul>
  <li>Tea</li>
  <li>Coffee</li>
</ul>
```

Pug:

```pug
ul
  li Tea
  li Coffee
```

Whatever is indented *under* a tag goes *inside* that tag. There are no closing
tags because the indentation already says where things end.

Warn them now: **be consistent with indentation.** Mixing tabs and spaces is
the number one Pug error in week one.

## 2.2 Tags and text

```pug
h1 My Blog
p This is a paragraph.
```

```html
<h1>My Blog</h1>
<p>This is a paragraph.</p>
```

Text goes on the same line as the tag. For a long block of text, use a dot:

```pug
p.
  This is a longer paragraph.
  It can run across several lines
  without repeating the p tag.
```

## 2.3 Attributes

Attributes go in brackets, separated by commas:

```pug
a(href="/about", target="_blank") About us
input(type="text", name="title")
img(src="/cat.png", alt="A cat")
```

```html
<a href="/about" target="_blank">About us</a>
<input type="text" name="title">
<img src="/cat.png" alt="A cat">
```

## 2.4 Classes and ids — the shortcut

```pug
div.card
div#header
p.date.small Posted today
```

```html
<div class="card"></div>
<div id="header"></div>
<p class="date small">Posted today</p>
```

And because `div` is the default tag, you can drop it entirely:

```pug
.card
#header
```

...produces the same `<div class="card">` and `<div id="header">`.

## 2.5 Comments

```pug
// this comment DOES appear in the HTML source
//- this comment does NOT appear in the HTML source
```

Use `//-` for notes to yourself and your teammates.

## 2.6 Side-by-side reference

| HTML | Pug |
| --- | --- |
| `<h1>Hi</h1>` | `h1 Hi` |
| `<p class="date">x</p>` | `p.date x` |
| `<div id="main"></div>` | `#main` |
| `<a href="/">Home</a>` | `a(href="/") Home` |
| `<br>` | `br` |
| `<!-- note -->` | `// note` |

---

# Part 3 — Passing data from the controller

## 3.1 `res.render`

```js
res.render('index', { title: 'My Blog', posts: posts });
//          ^view      ^the data the view can use
```

Express looks for `views/index.pug`, runs it with that object, and sends the
resulting HTML. The keys of the object become variables inside the template —
these are called **locals**.

## 3.2 Three ways to print a value

```pug
h2= post.title                       //- = means "run this as JavaScript"
p Posted on #{post.date}             //- #{} interpolates inside text
p!= post.htmlContent                 //- != prints WITHOUT escaping (careful!)
```

| Syntax | Use it when |
| --- | --- |
| `= value` | the whole content of the tag is the value |
| `#{value}` | the value sits inside other text |
| `!= value` | you need raw HTML — **only for content you trust** |

## 3.3 The `=` vs no-`=` trap

This trips up every beginner:

```pug
h2 post.title      //- prints the literal text "post.title"  ✗
h2= post.title     //- prints the actual title               ✓
```

Without the `=`, Pug treats it as plain text.

## 3.4 Escaping — a two-minute security demo

Run this live. Create a post whose title is:

```
<script>alert(1)</script>
```

Then open the home page. The title shows up as *visible text*, and no alert
box appears. View the page source and you will see:

```html
<h2>&lt;script&gt;alert(1)&lt;/script&gt;</h2>
```

Pug escaped the dangerous characters automatically. That is **`=` and `#{}`
protecting you from a cross-site scripting attack**, for free.

Now say the important half: **`!=` turns that protection off.** Only ever use
it on HTML you generated yourself, never on anything a user typed.

---

# Part 4 — Conditionals and loops

## 4.1 `if` / `else`

```pug
if posts.length === 0
  p.empty No posts yet. Write the first one!
else
  p You have #{posts.length} posts.
```

Also available: `unless` (the opposite of `if`).

## 4.2 `each` — the one you will use constantly

```pug
each post in posts
  article
    h2= post.title
    p= post.body
```

This renders one `<article>` per item in the array. With the index:

```pug
each post, i in posts
  h2 #{i + 1}. #{post.title}
```

## 4.3 `each ... else`

A neat shortcut that handles the empty case for you:

```pug
each post in posts
  h2= post.title
else
  p.empty No posts yet.
```

## 4.4 How much logic belongs in a view?

Give them a firm rule:

> Views may **choose** and **repeat**. Views must not **calculate** or
> **fetch**.

Looping over posts is fine. Sorting them, filtering them, or reading a file is
the controller's or model's job. If a template starts to look clever, move the
cleverness up a layer.

---

# Part 5 — Layouts, includes and mixins

## 5.1 The repetition problem

Every page needs `<!DOCTYPE html>`, a `<head>`, the site header, the nav links.
Copying that into four templates means fixing every bug four times.

## 5.2 `extends` and `block`

**`views/layout.pug`** — the frame, with a hole in it:

```pug
doctype html
html
  head
    title= title
  body
    header
      h1
        a(href="/") My Blog
      a(href="/new") Write a post
    main
      block content
```

**`views/index.pug`** — fills the hole:

```pug
extends layout

block content
  each post in posts
    h2= post.title
```

`block content` in the layout is the slot. `block content` in the child is what
goes into it. Every page in our blog app does this, which is why the header
appears everywhere but is written only once.

## 5.3 `include` — pasting in a fragment

For a chunk that is not a slot but a snippet:

```pug
//- views/footer.pug
footer
  p © 2026 My Blog
```

```pug
include footer
```

Difference worth stating clearly:

- **`extends`** — "I am a page that fits inside this frame."
- **`include`** — "paste this file's contents right here."

## 5.4 `mixin` — a reusable function

```pug
mixin postCard(post)
  article
    h2= post.title
    p.date= post.date

//- use it
each post in posts
  +postCard(post)
```

Mention mixins, do not dwell on them. Students reach for them naturally once a
template repeats itself.

---

# Part 6 — Forms

## 6.1 Forms send urlencoded data, not JSON

This is the difference from Monday that catches people out. On Monday Postman
sent JSON, so we used:

```js
app.use(express.json());
```

An HTML form sends data in a different format, so today we need:

```js
app.use(express.urlencoded({ extended: true }));
```

Leave that line out and `req.body` is `undefined`. Demo it by commenting the
line out and submitting the form — then put it back.

## 6.2 `name` is what matters

```pug
form(action="/new", method="POST")
  input(type="text", name="title")
  textarea(name="body")
  button(type="submit") Publish
```

The `name` attribute becomes the key in `req.body`:

```js
req.body.title   // whatever was typed in the input
req.body.body    // whatever was typed in the textarea
```

`id` is for labels and CSS. **`name` is for the server.** A field with no
`name` is simply not sent.

## 6.3 Browsers can only send GET and POST

On Monday we happily used `PUT` and `DELETE`. An HTML form cannot do that —
`method` accepts only `GET` or `POST`.

That is why deleting a post in our app looks like this:

```pug
form(action="/post/" + post.id + "/delete", method="POST")
  button(type="submit") Delete this post
```

We keep the REST-ish URL but use POST, because that is what the browser can
send. (Real projects add a library called `method-override` to work around it —
worth a mention, not worth installing today.)

## 6.4 Redirect after POST

Look at the end of `createPost`:

```js
res.redirect('/');
```

Ask the class why we redirect instead of rendering. Then demo it: comment the
redirect out, `res.render('index', ...)` instead, submit the form, and press
**refresh**. The browser asks "resubmit form?" and creates a duplicate post.

With the redirect, the browser's address bar ends on a plain `GET /`, so
refreshing is harmless. This pattern has a name: **POST → Redirect → GET**.

---

# Part 7 — Wiring Pug into Express

## 7.1 Three lines

```bash
npm install pug
```

```js
app.set('view engine', 'pug');   // use Pug for res.render
app.set('views', './views');     // where the .pug files live
```

That is the whole setup. You never `require('pug')` yourself — Express loads it
when it sees the `view engine` setting.

## 7.2 Our folder structure

```
blog-app/
├── server.js                       # sets up Pug, connects routes
├── posts.json                      # our "database": starts as []
├── models/
│   └── postModel.js                # M — reads and writes posts.json
├── controllers/
│   └── postController.js           # C — gets data, calls res.render
├── routes/
│   └── postRoutes.js               # which URL runs which function
└── views/                          # V — the Pug templates
    ├── layout.pug                  # the shared page frame
    ├── index.pug                   # home page, lists all posts
    ├── post.pug                    # one post
    ├── new.pug                     # the write-a-post form
    └── 404.pug                     # post not found
```

Compare this with Monday's folder listing. **Everything is the same except the
new `views/` folder.** That is the point.

## 7.3 The routes

| Method | URL | What it does |
| --- | --- | --- |
| `GET` | `/` | home page, lists all posts |
| `GET` | `/new` | show the write-a-post form |
| `POST` | `/new` | create the post, then redirect |
| `GET` | `/post/:id` | show one post |
| `POST` | `/post/:id/delete` | delete, then redirect |

---

# Part 8 — Common mistakes

Put this on a slide. Students will hit every one of these.

| Symptom | Cause | Fix |
| --- | --- | --- |
| Page shows the literal text `post.title` | missing `=` | `h2= post.title` |
| `Cannot find module 'pug'` | not installed | `npm install pug` |
| `Failed to lookup view "index"` | wrong name or wrong folder | check `views/index.pug` and `app.set('views', ...)` |
| `req.body` is `undefined` | no body parser | `app.use(express.urlencoded({ extended: true }))` |
| Form submits but a field is missing | input has no `name` | add `name="title"` |
| `unexpected token "indent"` | inconsistent indentation | pick spaces or tabs, never both |
| Tags nest wrongly | indented too far or not far enough | indentation *is* the nesting |
| Refresh creates a duplicate post | no redirect after POST | `res.redirect('/')` |
| `title` is blank on the page | controller did not pass it | add it to the `res.render` object |

---

# Part 9 — Live coding plan

Roughly 60 minutes.

| # | Step | Min | Talking point |
| --- | --- | --- | --- |
| 1 | `npm install express pug`, set the two `app.set` lines | 5 | Three lines is the whole setup |
| 2 | One route rendering a hard-coded `index.pug` | 8 | Write HTML with no angle brackets |
| 3 | Pass `title` from the controller, print it with `=` | 7 | Locals; the `=` trap |
| 4 | Read `posts.json` in the model, loop with `each` | 10 | The model is unchanged from Monday |
| 5 | Pull the frame out into `layout.pug` with `extends` | 10 | Write the header once |
| 6 | Add `/post/:id` and the 404 view | 8 | Same `req.params` as Monday |
| 7 | Add the form and `POST /new` | 10 | `urlencoded`, `name`, redirect |
| 8 | XSS demo: post a `<script>` title | 2 | Pug escapes for free |

**Demo tip:** keep the browser and `posts.json` side by side, exactly like
Monday. Students seeing the file change is what makes it click.

---

# Part 10 — Exercises & quiz

## 10.1 Exercises

1. **Easy** — Add a footer with the year to `layout.pug` so it shows on every
   page. Which file do you edit? How many?
2. **Easy** — Show the post count in the header: `My Blog (3 posts)`.
3. **Easy** — On the home page, show only the first 100 characters of each
   post body. Should the shortening happen in the view or the controller?
4. **Medium** — Add an "Edit" button that loads the post into the form and
   saves the changes. Which new routes do you need?
5. **Medium** — Move the article markup into a `mixin` and use it on both the
   home page and the single-post page.
6. **Medium** — Move the CSS out of `layout.pug` into `public/style.css` and
   serve it with `express.static`. Link it from the layout.
7. **Hard** — Add a `?search=` box that filters posts by title. Where does the
   filtering belong?
8. **Hard** — Serve the same blog data as JSON at `/api/posts`, reusing the
   same model. Two views, one model — explain why that is easy.

## 10.2 Quiz

1. What replaces closing tags in Pug?
2. What is the difference between `h2 post.title` and `h2= post.title`?
3. What is the difference between `extends` and `include`?
4. Why does a form need `express.urlencoded` instead of `express.json`?
5. Which attribute decides the key in `req.body` — `id` or `name`?
6. Why can't an HTML form send a `DELETE` request?
7. Why do we redirect after creating a post instead of rendering?
8. When is `!=` dangerous?

<details>
<summary>Answers</summary>

1. Indentation. Whatever is indented under a tag is inside that tag.
2. The first prints the literal text `post.title`. The second runs it as
   JavaScript and prints the actual title.
3. `extends` fills named `block`s in a parent layout — for whole pages.
   `include` pastes a file's contents at that spot — for fragments.
4. Because HTML forms send data as urlencoded, not as JSON. Without the right
   parser `req.body` is `undefined`.
5. `name`. `id` is only for labels and CSS.
6. The HTML `method` attribute only accepts `GET` and `POST`. We use `POST` to
   a `/delete` URL instead.
7. So the browser lands on a `GET`, and refreshing the page does not resubmit
   the form and create a duplicate. POST → Redirect → GET.
8. `!=` prints without escaping, so any HTML a user typed would actually run.
   Only use it on HTML you built yourself.

</details>

---

# Cheat sheet

```pug
//- tags, text, attributes
h1 My Blog
p.date Posted today
a(href="/new") Write a post

//- printing data
h2= post.title
p Posted on #{post.date}

//- conditionals
if posts.length === 0
  p.empty Nothing here yet.

//- loops
each post in posts
  h2= post.title

//- layout
extends layout
block content
  p Page content goes here.
```

```js
// express side
app.set('view engine', 'pug');
app.set('views', './views');
app.use(express.urlencoded({ extended: true }));

res.render('index', { title: 'My Blog', posts: posts });
res.redirect('/');
```

**Pug in one breath:** indentation instead of closing tags, `=` to print data,
`each` to repeat, `extends` to reuse the page frame.

**The MVC point:** Monday's controller ended with `res.json`. Today's ends with
`res.render`. The model never noticed.

# Frontend (React + axios)

The React half of the [CORS and Authentication](../README.md) session. Vite,
axios, one component per page. No router — logged in or not is just a piece of
state in `App.jsx`.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. **Start the backend first**, in another terminal:

```bash
cd ../backend && npm install && npm start
```

The port is pinned in `vite.config.js` (`strictPort: true`) because Express
allows exactly `http://localhost:5173`. If Vite silently moved to 5174 the
origin would stop matching, and you would spend the lesson debugging the wrong
thing.

## Files

| File | Lines | What's in it |
|---|---|---|
| `src/api.js` | 18 | the axios instance — the CORS lesson lives here |
| `src/App.jsx` | 41 | asks who we are, picks a page |
| `src/Login.jsx` | 57 | the login form |
| `src/Signup.jsx` | 59 | the signup form |
| `src/Home.jsx` | 44 | the protected page |
| `src/main.jsx` | 6 | mounts `<App />` |

There is no CSS. The pages are plain HTML — headings, forms, labels and
buttons — so nothing on screen distracts from the requests being made. Styling
it is exercise 6.

## `api.js` — the four lines that matter

```js
export const api = axios.create({
  baseURL: 'http://localhost:3000',  // a DIFFERENT ORIGIN -> CORS applies
  withCredentials: true,             // send the session cookie
});
```

`baseURL` on port 3000 while the page is on 5173 is what makes every call
cross-origin. `withCredentials` is what lets the cookie travel. Express needs
its matching half — `cors({ credentials: true })` and an exact `origin` — or
the cookie is dropped and every request after login is a 401.

`api.js` also exports `errorText(err)`, which the pages use to turn an axios
error into something a human can read.

## How the four files fit together

```
                   App.jsx
         GET /auth/me - am I logged in?
                      │
          ┌───────────┼───────────┐
       error        user        no user
          │           │           │
   "Network Error"  Home.jsx   Login.jsx ⇄ Signup.jsx
     (Step 1)       GET /      POST /auth/login
                    /auth/logout  POST /auth/signup
```

**`App.jsx`** asks `GET /auth/me` once on mount, because the cookie knows
whether you are logged in but React state does not survive a refresh. Three
one-line decisions follow:

```jsx
if (loading) return <p>Loading…</p>;
if (error)   return <p><strong>{error}</strong></p>;   // Step 1
if (user)    return <Home ... />;
```

The `loading` flag is not decoration — without it the login form flashes on
every refresh, even when you are logged in.

**`Login.jsx`** and **`Signup.jsx`** each own their own email, password and
error state, and post to their own endpoint. On success they call
`onDone(user)`, which is `App`'s `setUser` — and that is what swaps the form
for `Home`.

**`Home.jsx`** fetches the protected message. If that comes back `401` (the
session expired while the page was open) it calls `onLoggedOut()`, and the
login form is back on the next render.

That `setUser(null)` **is** the "redirect to the login page". The server says
*what* is wrong (401); the client decides *where* to go. In a bigger app this
would be React Router's `<Navigate to="/login" />`; the logic is identical.

## Reading axios errors

```js
export function errorText(err) {
  if (err.response) return err.response.data.error || 'Request failed';
  return 'Network Error - is Express running, and is CORS turned on?';
}
```

| | `err.response` |
|---|---|
| CORS block | **undefined** |
| Express not running | **undefined** |
| 401 from Express | `{ status: 401, data: { error } }` |

A CORS block and a dead server are **indistinguishable** from JavaScript — the
browser will not tell the page why it was blocked. The only place the real
reason appears is the console, which is exactly why Step 1 of the session is
"open DevTools".

## Things to demo

**1. Step 1 of the session.** With the CORS lines still commented out in
`backend/server.js`, the page shows *Network Error* and the console shows the
CORS message. The request reached Express — check its terminal.

**2. Remove `withCredentials: true` from `api.js`.** Log in: it returns `200`,
and the very next request is `401`. Nothing appears in the console. This is the
bug students will actually hit, and the symptom looks nothing like the cause.

**3. Watch the cookie.** DevTools → Network → the `/` request → Request
Headers. There should be a `Cookie: connect.sid=...` line. No `Cookie:` line
means a credentials switch is missing.

**4. Two different CORS errors.** `GET /auth/me` is a *simple* request, so it
fails with "No 'Access-Control-Allow-Origin' header is present".
`POST /auth/login` sends `Content-Type: application/json`, so it is
*preflighted* and fails with "Response to preflight request doesn't pass access
control check" — the real POST never left the browser.

**5. One axios instance, three pages.** `Login`, `Signup` and `Home` contain no
CORS code at all. It is configured once in `api.js` and every component gets it
for free.

## Exercises

See Part 10 of the [session notes](../README.md). Good ones to start with:

1. Disable the submit button while a request is in flight. (Add a `busy`
   state — it is deliberately left out to keep the forms short.)
2. Add a `GET /secret` route to the backend behind `ensureLoggedIn`, and a
   `Secret.jsx` page with a button that fetches it.
3. `Login.jsx` and `Signup.jsx` are nearly identical. Pull the shared parts
   into one `AuthForm` component — then argue about whether that was an
   improvement for someone reading the code for the first time.
4. Drop the backend's session `maxAge` to ten seconds, log in, wait, then
   click. Trace how the 401 in `Home.jsx` becomes a login form.
5. Replace the `page` state in `App.jsx` with React Router and real `/login`
   and `/signup` URLs.
6. Make it look like something. Add a `styles.css`, import it in `main.jsx`,
   and style it with element selectors only — no `className` anywhere.

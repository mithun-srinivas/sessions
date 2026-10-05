import { useEffect, useState } from 'react';

import { api, errorText } from './api.js';
import Login from './Login.jsx';
import Signup from './Signup.jsx';
import Home from './Home.jsx';

// App only decides which page to show. The three pages do the work.
export default function App() {
  const [user, setUser] = useState(null); // null = not logged in
  const [page, setPage] = useState('login'); // 'login' or 'signup'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // On load, ask who we are. The cookie knows; React state does not
  // survive a refresh.
  //
  // useEffect cannot be async itself - React expects it to return either
  // nothing or a cleanup function - so we declare an async function
  // inside it and call it.
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (err) {
        setError(errorText(err));
      } finally {
        setLoading(false); // runs whether it worked or not
      }
    }

    loadUser();
  }, []);

  function handleLoggedOut() {
    setUser(null);
    setPage('login'); // so logging out always lands on the login form
  }

  // without this the login form flashes on every refresh
  if (loading) return <p>Loading…</p>;

  // this is the screen you get in Step 1, before CORS is turned on
  if (error) return <p><strong>{error}</strong></p>;

  // Logged in? the message. Otherwise the login page. That is the
  // "else redirect to login": Express decides, React renders.
  if (user) return <Home user={user} onLoggedOut={handleLoggedOut} />;
  if (page === 'signup') return <Signup onDone={setUser} onSwitch={() => setPage('login')} />;
  return <Login onDone={setUser} onSwitch={() => setPage('signup')} />;
}

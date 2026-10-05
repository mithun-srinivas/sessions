import { useEffect, useState } from 'react';

import { api, errorText } from './api.js';

// The protected page. The cookie travels automatically, because of
// withCredentials in api.js.
export default function Home({ user, onLoggedOut }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMessage() {
      try {
        const res = await api.get('/');
        setMessage(res.data.message);
      } catch (err) {
        // 401 = the session expired. Clearing the user brings Login back.
        if (err.response && err.response.status === 401) onLoggedOut();
        else setError(errorText(err));
      }
    }

    loadMessage();
  }, []);

  async function handleLogout() {
    await api.post('/auth/logout');
    onLoggedOut();
  }

  return (
    <div>
      <p>
        Logged in as {user.email} <button onClick={handleLogout}>Log out</button>
      </p>

      <h1>The message</h1>

      {error && <p><strong>{error}</strong></p>}
      <p>{message || 'Loading…'}</p>

      <p>
        This came from <code>GET http://localhost:3000/</code> — a different
        origin from this page, behind <code>ensureLoggedIn</code>.
      </p>
    </div>
  );
}

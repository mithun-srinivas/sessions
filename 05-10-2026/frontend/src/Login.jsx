import { useState } from 'react';

import { api, errorText } from './api.js';

export default function Login({ onDone, onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser reloading the page

    try {
      const res = await api.post('/auth/login', { email, password });

      // Express has set the cookie. Telling App who we are shows Home.
      onDone(res.data.user);
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Log in</h1>

      {error && <p><strong>{error}</strong></p>}

      <p>
        <label>
          Email <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
      </p>

      <p>
        <label>
          Password{' '}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
      </p>

      <button type="submit">Log in</button>

      <p>
        No account yet?{' '}
        <button type="button" onClick={onSwitch}>
          Sign up
        </button>
      </p>
    </form>
  );
}

import { useState } from 'react';

import { api, errorText } from './api.js';

// Same as Login, but posts to /auth/signup. The server logs you in as
// soon as the account exists, so there is no extra "now log in" step.
export default function Signup({ onDone, onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const res = await api.post('/auth/signup', { email, password });
      onDone(res.data.user);
    } catch (err) {
      setError(errorText(err)); // e.g. "That email is already registered"
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Sign up</h1>

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
            minLength={6}
            required
          />
        </label>{' '}
        (at least 6 characters)
      </p>

      <button type="submit">Create account</button>

      <p>
        Already have an account?{' '}
        <button type="button" onClick={onSwitch}>
          Log in
        </button>
      </p>
    </form>
  );
}

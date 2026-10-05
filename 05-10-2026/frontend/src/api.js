import axios from 'axios';

// baseURL points at a DIFFERENT ORIGIN from this page (port 3000, not
// 5173). That is what makes every call below a CORS request.
//
// withCredentials sends the login cookie. Express needs its matching
// half: cors({ origin: '...', credentials: true }).
export const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
});

// A real HTTP answer lands on err.response. A CORS block has none - the
// browser refuses to show it to us - so all we get is "Network Error".
export function errorText(err) {
  if (err.response) return err.response.data.error || 'Request failed';
  return 'Network Error - is Express running, and is CORS turned on?';
}

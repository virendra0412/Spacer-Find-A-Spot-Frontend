import { client } from './client';

// Public endpoint — no auth needed. Used to preview "you'll pay ₹X"
// before booking, computed the exact same way the server will actually
// charge (see spacer-backend/src/config/fees.js), so this never drifts
// out of sync with a hardcoded copy of the formula.
export function estimateFees(subtotal) {
  return client.get('/fees/estimate', { params: { subtotal } }).then((r) => r.data);
}

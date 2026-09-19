import { client } from './client';

export const DISPUTE_CATEGORIES = [
  { value: 'spot_occupied', label: 'Spot was occupied' },
  { value: 'no_show_host', label: 'Host never showed / gave access' },
  { value: 'no_show_driver', label: 'Driver never showed' },
  { value: 'payment_issue', label: 'Payment issue' },
  { value: 'damage', label: 'Damage to vehicle or property' },
  { value: 'other', label: 'Something else' },
];

export function raiseDispute(bookingId, { category, description }) {
  return client.post(`/bookings/${bookingId}/dispute`, { category, description }).then((r) => r.data);
}

export function myDisputes() {
  return client.get('/users/me/disputes').then((r) => r.data);
}

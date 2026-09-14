import { client } from './client';

export function getPayment(bookingId) {
  return client.get(`/payments/${bookingId}`).then((r) => r.data);
}

export function markPaid(bookingId) {
  return client.post(`/payments/${bookingId}/mark-paid`).then((r) => r.data);
}

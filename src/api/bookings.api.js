import { client } from './client';

export function createBooking({ listingId, startAt, endAt }) {
  return client
    .post('/bookings', { listing_id: listingId, start_at: startAt, end_at: endAt })
    .then((r) => r.data);
}

export function myBookings() {
  return client.get('/bookings/mine').then((r) => r.data);
}

export function getBooking(id) {
  return client.get(`/bookings/${id}`).then((r) => r.data);
}

export function startBooking(id) {
  return client.post(`/bookings/${id}/start`).then((r) => r.data);
}

export function endBooking(id) {
  return client.post(`/bookings/${id}/end`).then((r) => r.data);
}

export function extendBooking(id, additionalHours) {
  return client.post(`/bookings/${id}/extend`, { additional_hours: additionalHours }).then((r) => r.data);
}

export function cancelBooking(id) {
  return client.post(`/bookings/${id}/cancel`).then((r) => r.data);
}

export function reviewBooking(id, { rating, comment }) {
  return client.post(`/bookings/${id}/review`, { rating, comment }).then((r) => r.data);
}

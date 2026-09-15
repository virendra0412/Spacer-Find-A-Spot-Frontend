import { client } from './client';

export function getMe() {
  return client.get('/users/me').then((r) => r.data);
}

export function updateMe(payload) {
  return client.patch('/users/me', payload).then((r) => r.data);
}

export function getMyStats() {
  return client.get('/users/me/stats').then((r) => r.data);
}

export function getMyReviews() {
  return client.get('/users/me/reviews').then((r) => r.data);
}

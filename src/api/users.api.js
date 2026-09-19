import { client } from './client';

export function getMe() {
  return client.get('/users/me').then((r) => r.data);
}

export function updateMe(data) {
  return client.patch('/users/me', data).then((r) => r.data);
}

export function getMyStats() {
  return client.get('/users/me/stats').then((r) => r.data);
}

export function getMyReviews() {
  return client.get('/users/me/reviews').then((r) => r.data);
}

export function getMyVerification() {
  return client.get('/users/me/verification').then((r) => r.data);
}

export function submitVerification({ document, selfie }) {
  const form = new FormData();
  form.append('document', {
    uri: document.uri,
    name: document.fileName || 'identity-document.jpg',
    type: document.mimeType || 'image/jpeg',
  });
  form.append('selfie', {
    uri: selfie.uri,
    name: selfie.fileName || 'identity-selfie.jpg',
    type: selfie.mimeType || 'image/jpeg',
  });
  return client.post('/users/me/verification', form).then((r) => r.data);
}
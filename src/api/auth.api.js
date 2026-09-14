import { client } from './client';

export function signup({ name, phone, password, email }) {
  return client
    .post('/auth/signup', { name, phone, password, email })
    .then((r) => r.data);
}

export function login({ phone, password }) {
  return client.post('/auth/login', { phone, password }).then((r) => r.data);
}

export function refresh(refreshToken) {
  return client.post('/auth/refresh', { refreshToken }).then((r) => r.data);
}

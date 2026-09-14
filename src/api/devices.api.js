import { client } from './client';

export function registerDevice(expoPushToken) {
  return client.post('/devices', { expo_push_token: expoPushToken }).then((r) => r.data);
}

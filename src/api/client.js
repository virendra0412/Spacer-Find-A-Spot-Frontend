import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Point this at your backend. Expo Go on a physical phone can't reach
// "localhost" on your laptop — use your machine's LAN IP (e.g. 192.168.x.x)
// or a deployed URL. See the frontend plan doc, section 7.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://spacer-find-a-spot-backend.onrender.com';

const ACCESS_KEY = 'spacer_access_token';
const REFRESH_KEY = 'spacer_refresh_token';

export async function getTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  return { accessToken, refreshToken };
}

export async function setTokens({ accessToken, refreshToken }) {
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  }
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export const client = axios.create({ baseURL: API_URL });

// Dev-only request/response logging — shows up right in the Expo terminal
// (or the in-app dev menu's logs) while you test, so you don't need a
// separate tool to see what the app is actually sending/receiving.
if (__DEV__) {
  client.interceptors.request.use((config) => {
    config.metadata = { startedAt: Date.now() };
    const body = config.data ? ` ${JSON.stringify(config.data)}` : '';
    console.log(`→ ${config.method?.toUpperCase()} ${config.url}${body}`);
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      const ms = Date.now() - (response.config.metadata?.startedAt ?? Date.now());
      console.log(`← ${response.status} ${response.config.url} (${ms}ms)`);
      return response;
    },
    (error) => {
      const cfg = error.config || {};
      const ms = Date.now() - (cfg.metadata?.startedAt ?? Date.now());
      const status = error.response?.status ?? 'ERR';
      const message = error.response?.data?.error || error.message;
      console.log(`✕ ${status} ${cfg.url} (${ms}ms) — ${message}`);
      return Promise.reject(error);
    }
  );
}

client.interceptors.request.use(async (config) => {
  const { accessToken } = await getTokens();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Queue concurrent requests that 401 while a single refresh is in flight,
// so a screen firing several requests at once doesn't trigger multiple
// simultaneous refresh calls.
let refreshPromise = null;

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    const { refreshToken } = await getTokens();
    if (!refreshToken) {
      await clearTokens();
      return Promise.reject(error);
    }

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_URL}/auth/refresh`, { refreshToken })
          .finally(() => { refreshPromise = null; });
      }
      const { data } = await refreshPromise;
      await setTokens({ accessToken: data.accessToken });
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return client(original);
    } catch (refreshErr) {
      await clearTokens();
      return Promise.reject(refreshErr);
    }
  }
);

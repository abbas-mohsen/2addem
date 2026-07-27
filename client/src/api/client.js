import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

/* The access token lives in memory only (never localStorage) — the refresh
   cookie is what survives a reload. */
let accessToken = null;
let onSessionLost = () => {};

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function onUnauthorized(handler) {
  onSessionLost = handler;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

// A single in-flight refresh, shared by every request that got a 401.
let refreshPromise = null;

function refreshSession() {
  refreshPromise ??= api
    .post('/auth/refresh')
    .then((response) => {
      const token = response.data.data.accessToken;
      setAccessToken(token);
      return token;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthCall = AUTH_ENDPOINTS.some((endpoint) => original?.url?.includes(endpoint));

    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      try {
        await refreshSession();
        return api(original);
      } catch {
        setAccessToken(null);
        onSessionLost();
      }
    }

    return Promise.reject(error);
  }
);

export { refreshSession };

/* This module cannot use hooks, so the i18n provider pushes the translated
   fallbacks in whenever the locale changes. */
let fallbacks = {
  generic: 'Something went wrong. Please try again.',
  network: 'Cannot reach the server.',
};

export function setErrorFallbacks(next) {
  fallbacks = next;
}

/* Server errors always arrive as { error: { message, details } }; components
   should never have to dig through the axios shape. */
export function errorMessage(error, fallback) {
  const payload = error?.response?.data?.error;
  if (payload?.details?.length) return payload.details[0].message;

  if (payload?.message) return payload.message;
  if (error?.message === 'Network Error') return fallbacks.network;

  return fallback ?? fallbacks.generic;
}

export function fieldErrors(error) {
  const details = error?.response?.data?.error?.details;
  if (!Array.isArray(details)) return {};
  return Object.fromEntries(details.map((detail) => [detail.field, detail.message]));
}

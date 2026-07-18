import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { TokenService } from '@/src/services/token.service';
import { emitUnauthorized } from '@/src/api/auth-events';

/* =========================================================
   CONFIG
========================================================= */

const API_URL =
  (import.meta.env.VITE_API_URL as string) ||
  'http://localhost:5000/api/v1';

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

export const apiClient = axios.create({
  baseURL: API_URL,
  // Access/refresh/CSRF tokens live in httpOnly (or CSRF-only) cookies set by
  // the backend — withCredentials is what makes the browser attach and store
  // them automatically. There is no token for this client to read or set.
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* =========================================================
   REFRESH STATE
========================================================= */

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

let requestQueue: Array<{
  resolve: () => void;
  reject: (error: any) => void;
}> = [];

/* =========================================================
   QUEUE
========================================================= */

function processQueue(error: any) {
  requestQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve();
  });

  requestQueue = [];
}

/* =========================================================
   REQUEST INTERCEPTOR
========================================================= */

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Double-submit CSRF: mutating requests must echo the (non-httpOnly)
    // csrf_token cookie back as a header — see backend/src/middleware/csrf.ts.
    if (config.method && MUTATING_METHODS.has(config.method) && config.headers) {
      const csrfToken = TokenService.getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================================================
   RESPONSE INTERCEPTOR
========================================================= */

apiClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    if (!originalRequest) return Promise.reject(error);

    const url = originalRequest.url || '';

    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password');

    if (isAuthRoute) return Promise.reject(error);

    /* =====================================================
       HANDLE 401
    ===================================================== */
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!isRefreshing) {
          isRefreshing = true;

          refreshPromise = (async () => {
            // No body needed — the refresh cookie carries the token, and the
            // response's Set-Cookie headers update the browser's cookie jar
            // (new access/refresh/csrf cookies) automatically.
            await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
            return true;
          })();

          await refreshPromise;

          isRefreshing = false;
          refreshPromise = null;

          processQueue(null);

          return apiClient(originalRequest);
        }

        return new Promise((resolve, reject) => {
          requestQueue.push({
            resolve: () => resolve(apiClient(originalRequest)),
            reject,
          });
        });
      } catch (err) {
        isRefreshing = false;
        refreshPromise = null;

        processQueue(err);

        emitUnauthorized();

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

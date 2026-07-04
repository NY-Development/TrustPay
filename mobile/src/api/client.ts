import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { TokenService } from '@/src/services/token.service';
import { emitUnauthorized } from '@/src/api/auth-events';

/* =========================================================
   CONFIG
========================================================= */

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'http://192.168.1.4:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
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
let refreshPromise: Promise<string | null> | null = null;

let requestQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

/* =========================================================
   QUEUE
========================================================= */

function processQueue(error: any, token: string | null) {
  requestQueue.forEach((p) => {
    if (error) p.reject(error);
    else if (token) p.resolve(token);
  });

  requestQueue = [];
}

/* =========================================================
   REQUEST INTERCEPTOR
========================================================= */

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await TokenService.getAccessToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
            const refreshToken = await TokenService.getRefreshToken();
            if (!refreshToken) throw new Error('No refresh token');

            const res = await axios.post(
              `${API_URL}/auth/refresh`,
              { refreshToken },
              { withCredentials: true }
            );

            const data = res.data?.data ?? res.data;

            const newAccessToken = data?.accessToken;
            const newRefreshToken = data?.refreshToken;

            if (typeof newAccessToken === 'string') {
              await TokenService.saveAccessToken(newAccessToken);
            }

            if (typeof newRefreshToken === 'string') {
              await TokenService.saveRefreshToken(newRefreshToken);
            }

            return newAccessToken ?? null;
          })();

          const newToken = await refreshPromise;

          isRefreshing = false;
          refreshPromise = null;

          processQueue(null, newToken);

          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }

          throw new Error('Refresh failed');
        }

        return new Promise((resolve, reject) => {
          requestQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      } catch (err) {
        isRefreshing = false;
        refreshPromise = null;

        processQueue(err, null);

        await TokenService.clearTokens();

        emitUnauthorized();

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);
// Falling back to Bearer-token auth (like mobile already does) instead of
// httpOnly cookies — the deployed frontend and backend are on different
// registrable domains, and browsers increasingly block third-party cookies
// outright regardless of correct SameSite/Secure attributes, which made the
// cookie-based flow silently fail in production no matter how it was
// configured. A Bearer header isn't a cookie, so it isn't subject to that at
// all. This does mean tokens are readable by any JS running on the page
// (XSS exposure) — see SECURITY.md for the trade-off and how to revisit this
// once the deployment sits behind a single origin (e.g. the Vercel rewrite
// proxy in frontend/vercel.json, once that path is confirmed working).
const ACCESS = 'accessToken';
const REFRESH = 'refreshToken';

export const TokenService = {
  getAccessToken: (): Promise<string | null> =>
    Promise.resolve(localStorage.getItem(ACCESS)),

  getRefreshToken: (): Promise<string | null> =>
    Promise.resolve(localStorage.getItem(REFRESH)),

  saveAccessToken: (token: string): Promise<void> => {
    localStorage.setItem(ACCESS, token);
    return Promise.resolve();
  },

  saveRefreshToken: (token: string): Promise<void> => {
    localStorage.setItem(REFRESH, token);
    return Promise.resolve();
  },

  clearTokens: async (): Promise<void> => {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};

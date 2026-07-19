// Access/refresh tokens live exclusively in httpOnly cookies set by the
// backend (see backend/src/utils/auth.ts) — JS never sees their values, so
// there's nothing for this module to store. The only thing readable from JS
// is the (deliberately non-httpOnly) CSRF cookie, echoed back as a header on
// mutating requests per the double-submit pattern the backend expects.
const CSRF_COOKIE = 'csrf_token';

const readCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export const TokenService = {
  getCsrfToken: (): string | null => {
    const token = readCookie(CSRF_COOKIE);
    console.log("CSRF Token retrieved:", token); // Debugging: Check if this logs 'null'
    return token;
  },
};

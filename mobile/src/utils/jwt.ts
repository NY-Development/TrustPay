// Decodes the payload of a JWT client-side (no signature verification —
// that's the server's job). Used only to read the `exp` claim for UX like
// the session-expiry countdown; never trust this for authorization.
export function decodeJwtExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );

    const decoded = JSON.parse(json);
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

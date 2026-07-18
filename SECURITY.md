# Security Audit & Hardening — 2026-07-18

Full-stack pass across `backend`, `frontend`, and `mobile` ahead of onboarding real users. This document records what was found, what was fixed, what was deliberately deferred, and the operational requirements the fixes introduce.

## Summary

The headline finding: **the backend already implemented httpOnly-cookie auth** (`backend/src/utils/auth.ts`), but the web frontend ignored it and stored both access/refresh tokens in `localStorage`, manually attaching them as a `Bearer` header — the actual XSS-to-account-takeover exposure. That's now fixed: web auth is cookie-only, with CSRF protection added to cover the gap that closing off `localStorage` opens up. Mobile was already correct (`expo-secure-store`, never `localStorage`) and needed no auth architecture change.

Two live bugs were found and fixed along the way (not originally in scope, but blocking or actively dangerous):
1. **`COOKIE_DOMAIN` defaulted to `"localhost"`** and was always passed to `res.cookie()`. In production, a `Domain=localhost` attribute doesn't match the real host, so the browser silently drops the cookie — auth would have appeared to work in every manual test (the JSON body still contains the tokens) while actually being broken. This was reproduced live while writing the backend test suite (see below).
2. **`Branch.branchCode` had a database-wide unique index but was generated per-owner** (`RTL-001`, `RTL-002`, ...). Two different companies of the same type would collide on their first branch code and registration would fail with a 500. Found by the new `branch.test.ts` suite, not by manual testing — a two-owner test scenario reproduced it immediately.

## Fixed

### Backend
| Finding | Fix | File |
|---|---|---|
| `COOKIE_DOMAIN` defaulted to `localhost`, breaking cookies in prod | Made it optional with no default; only passed to `res.cookie()` when explicitly set | `src/config/env.ts`, `src/utils/auth.ts` |
| Cross-site cookie topology (web + API on separate `*.vercel.app` sites) | `sameSite: 'none'` + `secure: true` in production (paired, as browsers require); `lax` in dev | `src/utils/auth.ts` |
| No CSRF protection once cookies became the sole web auth mechanism | Double-submit cookie: non-httpOnly `csrf_token` cookie, `X-CSRF-Token` header required on mutating requests when there's no `Authorization: Bearer` header (i.e. a cookie-driven, non-mobile client) | `src/middleware/csrf.ts`, `src/utils/auth.ts` |
| `authenticate` checked the cookie before the `Authorization` header | Flipped to header-first — a stray platform cookie on mobile (it also sends `withCredentials: true`) could otherwise shadow a freshly-refreshed Bearer token | `src/middleware/auth.ts` |
| Password-reset token signed with the same secret and no type tag as an access token | Added a `purpose: 'password_reset'` claim, checked on verify | `src/api/controllers/auth.controller.ts` |
| Login/forgot-password/reset-password/verify-otp only rate-limited in production, and only via the generic global limiter | Dedicated `authRateLimiter` (configurable via `AUTH_RATE_LIMIT_MAX`/`_WINDOW_MS`), active in every environment | `src/middleware/security.ts`, `src/api/routes/auth.routes.ts` |
| No explicit request body size limit | `express.json({ limit: '2mb' })` / `urlencoded` (was relying on Express's undocumented 100kb default) | `src/app.ts` |
| Contact-form / OTP email HTML built by interpolating `subject`/`text` unescaped | Added `escapeHtml()`, applied at the single choke point (`sendEmail`) so every caller is covered | `src/utils/email.ts` |
| No CSP on the JSON API (defense in depth; low priority for an API-only service) | Conservative `helmet({ contentSecurityPolicy: {...} })` | `src/middleware/security.ts` |
| `branchCode` unique index scoped globally instead of per-owner | Compound `{ ownerId, branchCode }` unique index | `src/models/Branch.ts` |

### Frontend (web)
| Finding | Fix | File |
|---|---|---|
| Access/refresh tokens stored in `localStorage` (XSS-readable) | Removed entirely — cookies are httpOnly, JS never touches the token values | `src/services/token.service.ts`, `src/api/client.ts`, `src/store/authStore.ts` |
| `logout()` never called the backend, so cookies/refresh token were never actually invalidated | Now calls `authApi.logout()` first — required once cookies are httpOnly, since only the server can clear them | `src/store/authStore.ts` |
| No CSP | Baseline `<meta http-equiv="Content-Security-Policy">` (see caveats below) | `index.html` |
| `employee.api.ts` / `branch.api.ts` / `communication.api.ts` double-prefixed requests (`baseURL` already includes `/api/v1`) — these endpoints were silently 404ing | Stripped the redundant prefix | `src/api/employee.api.ts`, `branch.api.ts`, `communication.api.ts` |
| Full verification API response logged to console unconditionally | Gated behind `import.meta.env.DEV` | `src/api/verification.api.ts` |
| ~30 page components statically imported into one ~1.72MB bundle | `React.lazy` + `Suspense` per route (see `PERFORMANCE.md`) | `src/App.tsx` |

**Reviewed, not changed:** `src/components/ui/chart.tsx` uses `dangerouslySetInnerHTML` to inject a generated `<style>` block from a developer-supplied `ChartConfig` (colors/theme strings), not end-user input — low risk, left as-is rather than reworking working shadcn/ui-generated code.

### Mobile
| Finding | Fix | File |
|---|---|---|
| `usesCleartextTraffic: true` hardcoded (permits plaintext HTTP app-wide) even though shipped builds already point at an `https://` API | Derived from the effective API URL — only `true` when it's `http://` (local dev) | `app.config.js` |
| Push token / full verification response logged unconditionally | Gated behind `__DEV__` | `src/api/verification.api.ts`, `src/hooks/useNotifications.ts`, `src/providers/NotificationProvider.tsx` |

**Reviewed, not changed:** token storage (already `expo-secure-store`, never `AsyncStorage`); the Firebase Admin SDK service-account key file on disk (gitignored, not committed); `react-native-webview` (installed but unused — no `WebView` in the codebase).

## Operational requirements this introduces

- **Do not set `COOKIE_DOMAIN`** in the deployed backend's environment unless the frontend and API are both subdomains of a shared parent domain (e.g. `app.trustpay.com` + `api.trustpay.com`, with `COOKIE_DOMAIN=.trustpay.com`). Leaving it unset is correct for the current default `*.vercel.app` topology.
- **`CORS_ORIGIN`** must list the exact deployed frontend origin(s) — cookies alone don't gate access; CORS is what stops an arbitrary origin from making credentialed requests in the first place.
- **CSP `connect-src`** in `frontend/index.html` is a static value (`http://localhost:5000`, `https://trust-pay-api.vercel.app`) — a meta-tag CSP can't read env vars, so if the API origin changes, this needs a manual update. It also can't express `frame-ancestors` (meta tags don't support that directive at all). For real production hardening, set CSP via HTTP response headers at the hosting layer (e.g. `frontend/vercel.json` → `headers`) in addition to (or instead of) the meta tag.
- Any new mutating (POST/PUT/PATCH/DELETE) endpoint reachable from the web app will require the frontend to send `X-CSRF-Token` — it already happens automatically via `apiClient`'s request interceptor, no per-call changes needed.

## Test coverage for these fixes

`backend/tests/auth.test.ts` has explicit CSRF tests (missing header → 403, mismatched header → 403, correct header → 200, GET exempted) and a cookie-lifecycle test (login → `/auth/me` → refresh → logout → subsequent `/auth/me` fails). See `backend/TESTING.md`.

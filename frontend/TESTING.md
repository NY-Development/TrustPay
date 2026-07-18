# Frontend (Web) Testing

Stack: **Vitest** + **React Testing Library** + **@testing-library/user-event** + **MSW** (Mock Service Worker — intercepts real `fetch`/XHR calls at the network layer, so components/hooks/the axios client all exercise their real code paths against a fake server instead of mocked modules).

## Running

```bash
cd frontend
npm install
npm test              # run once
npm run test:watch    # re-run on file changes
npm run test:coverage # run with a coverage report (text + html in coverage/)
```

## Layout

- `src/tests/setup.ts` — registers `@testing-library/jest-dom` matchers and starts/stops the MSW server around the whole run (`onUnhandledRequest: 'error'` — a request to an endpoint with no handler fails the test loudly instead of silently hitting the real network).
- `src/tests/mocks/handlers.ts` / `server.ts` — the fake backend. Add a handler here for any new endpoint a test needs to hit.
- `src/tests/pages/LoginPage.test.tsx` — owner/employee mode toggle, successful login + redirect, invalid-credentials error state.
- `src/tests/pages/EmployeesPage.test.tsx` — list rendering, invite-form validation, successful invite.
- `src/tests/pages/EmployeeDetailPage.test.tsx` — detail rendering, deactivate action, reset-password validation.
- `src/tests/client.test.ts` — the axios client itself: CSRF header attached on mutating requests only, and the silent-refresh-then-retry behavior on a 401 (including the failure path, so it doesn't loop when refresh itself fails).

## Why MSW instead of mocking `apiClient` or the hooks

The auth rewrite this session moved tokens out of `localStorage` and into httpOnly cookies, with a CSRF header the client has to compute and attach itself. Mocking hooks or `apiClient` directly would hide bugs in exactly that plumbing. MSW intercepts at the network boundary, so `client.test.ts` proves the *real* interceptor logic (reading `document.cookie`, retrying after a silent refresh) actually works — not a stand-in for it.

## Adding a new test

Add any new endpoint(s) it needs to `src/tests/mocks/handlers.ts` (or override per-test with `server.use(...)` for a one-off response, e.g. an error case — see `client.test.ts` for examples), then render the component wrapped in `QueryClientProvider` + `MemoryRouter` the way the existing page tests do. If the component reads `useAuthStore` directly, set the zustand state you need with `useAuthStore.setState({...})` before rendering — it's a module-level store, no provider needed.

## What isn't covered yet

Branch pages, verification pages, analytics/notifications/communications, and admin pages have no tests yet — see `docs/TEST_COVERAGE_PLAN.md` at the repo root for the phased plan (Phase 3 covers these, following the exact pattern established here).

# Phased Plan: From Foundation to Comprehensive Test Coverage

## Where this picks up from

As of 2026-07-18, all three apps have a working, documented test foundation (see `backend/TESTING.md`, `frontend/TESTING.md`, `mobile/TESTING.md`):

- **Backend**: Jest + Supertest + a real in-memory MongoDB, covering auth (register/login/refresh/logout/CSRF/password-reset), employee CRUD + access control, and branch CRUD + access control. 42 tests, all passing.
- **Frontend**: Vitest + React Testing Library + MSW, covering login, the employee list/invite/detail pages, and the axios client's CSRF/refresh interceptor logic. 14 tests, all passing.
- **Mobile**: Jest (`jest-expo`) + React Native Testing Library, covering the auth store, the employee hooks, and one proven screen-render smoke test.

That foundation deliberately covers the highest-risk flows (auth, access control, the employee feature built this session) rather than the whole app. This document is the plan for closing the rest of the gap, in priority order. Each phase is independently shippable — you don't need to do them in one sitting, and a later phase doesn't block on an earlier one being "complete," just "started" (the patterns need to exist to copy from).

**Read this before starting any phase**: every phase below follows a pattern already proven in the foundation suite. Don't invent a new testing approach per phase — copy the nearest existing test file and adapt it. That's what keeps this tractable.

---

## Phase 1 — Backend: core business logic (verification, subscriptions)

**Why first**: the payment-verification flow is the actual product — it's currently the least-tested part of the backend despite being the highest business risk. A bug in auth locks someone out; a bug in verification either lets a fraudulent payment through or blocks a real one.

**What to cover**:
- `src/api/controllers/verification.controller.ts` + `src/services/verification.service.ts` — the core "verify a payment reference against the bank" flow, both the happy path and the failure modes (invalid reference, provider timeout/error, duplicate verification attempt).
- `src/api/controllers/subscription.controller.ts` — trial-to-paid transition, payment verification for subscription top-up, expiry handling.
- `src/services/communication.service.ts` / `notification.service.ts` — message send + read-state, push notification dispatch (mock the Expo push SDK call itself — don't actually send).

**How to implement**:
- Same Supertest + `registerOwner()` pattern as `tests/employee.test.ts`. New helper additions to `tests/helpers.ts`: a `createVerification()` helper analogous to `registerOwner()`.
- The external bank verification API (`@creofam/verifier` / Verify.et) must be mocked — it's a real third-party HTTP call. Follow the `jest.mock('../src/utils/email', ...)` pattern from `auth.test.ts`: `jest.mock('../src/services/<whatever calls the external API>')`, control its resolved/rejected value per test.
- For the "provider is down" and "invalid reference" cases, this is where you want explicit unit tests (no DB, no HTTP) of the pure logic in `verification.service.ts` that decides how to interpret the provider's response — mirror `tests/unit/auth.utils.test.ts`.

**What a green suite proves**: that a payment reference actually gets verified/rejected correctly, that a flaky third-party API doesn't corrupt verification state, and that subscription status transitions happen on the conditions they're supposed to (not, e.g., silently granting access on a provider timeout).

**Estimated scope**: ~3-4 new test files, ~25-35 tests. This is the biggest phase — budget accordingly.

---

## Phase 2 — Backend: authorization matrix + input validation

**Why second**: Phase 1 covers the "does the feature work" question for the highest-value feature; this phase covers "can someone who shouldn't be able to do X, do X" — systematically, across *every* route, not just the ones already spot-checked in the foundation suite.

**What to cover**:
- A **table-driven 403/404 test**: for every route in `src/api/routes/*.routes.ts`, assert that every actor type *other than* the ones allowed gets rejected. Concretely: build a small table `[{ method, path, allowedActors: ['owner'] }, ...]` and a loop that, for each entry, logs in as every actor type *not* in `allowedActors` and asserts a 403 (or 401 if unauthenticated). This catches the class of bug where a route forgets to apply `requireOwner`/`requireBranchAccess` — exactly the kind of mistake that's easy to make and easy to miss in manual testing.
- Zod validation rejection tests: for each validator in `src/api/validators/*.validator.ts`, one test per required field asserting a 400 when it's missing/malformed (e.g. `branchCode` regex, `email` format, `role` enum). These are cheap, fast, and catch validator/schema drift.
- Rate-limiter trip tests: assert that hitting `authRateLimiter`'s configured `max` on `/auth/login/owner` actually returns 429 on the next attempt. (The foundation suite deliberately sets `AUTH_RATE_LIMIT_MAX` very high in `.env.test` so unrelated tests don't trip it — this phase adds one dedicated test file that lowers it via `process.env` override or a separate app instance to actually exercise the limit.)

**How to implement**: this is the one phase that benefits from a small custom test utility rather than copy-pasting the existing pattern — write a `tests/helpers/authMatrix.ts` that takes a route table and runs the loop. Keep it simple (a `for` loop over an array + `it.each`), not a framework.

**What a green suite proves**: that access control isn't just "tested for the routes someone remembered to test" — it's asserted for every route, mechanically, so a future route that forgets its auth middleware fails CI instead of shipping.

**Estimated scope**: 1 route-matrix test file (~40-60 assertions via `it.each`, not 40-60 hand-written tests), 1 validation test file per resource (~4-6 files), 1 rate-limit test file.

---

## Phase 3 — Frontend: remaining pages

**Why third**: the web app's other pages (branches, verification, analytics, notifications, communications, admin) have the same shape as the employee pages already tested — this is breadth, not new technique.

**What to cover**, in priority order (matching Phase 1's backend priority — verification first):
1. `VerificationPage`, `ManualVerificationPage`, `VerificationDetailPage` — the core product flow, on web.
2. `BranchesPage`, `BranchDetailPage` — already has backend coverage (Phase 1 of the original foundation); add the frontend layer.
3. `NotificationsPage`, `CommunicationsPage` — list/read-state, send.
4. `AnalyticsPage`, `ExportPage` — lower risk (read-only reporting views); lighter touch (render + key-metric assertions) is fine here.
5. Admin pages (`AdminUsersPage`, `AdminVerificationsPage`, `AdminSubscriptionsPage`, etc.) — same pattern, gated by an admin-role check in the test setup.

**How to implement**: literally the `EmployeesPage.test.tsx` / `EmployeeDetailPage.test.tsx` pattern — MSW handlers for whatever endpoints the page calls (add them to `src/tests/mocks/handlers.ts`), `QueryClientProvider` + `MemoryRouter` wrapper, `useAuthStore.setState(...)` for whatever actor/role the test needs.

**What a green suite proves**: every dashboard page renders correctly from real API responses and its primary actions (create/update/delete/filter) actually call the right endpoint with the right payload.

**Estimated scope**: ~10-12 new test files, following the existing 3-4-tests-per-page density from the foundation.

---

## Phase 4 — Frontend: end-to-end smoke (Playwright)

**Why fourth**: everything above tests components and API contracts in isolation (MSW fakes the backend). This phase is the first point where the *real* backend, *real* browser, and *real* frontend are wired together — catching integration bugs that per-layer mocking structurally cannot (e.g. the CSRF-cookie-domain bug this session found via the backend test suite would *also* have been caught here, from the browser's actual perspective).

**What to cover**: one golden-path spec — register → invite an employee → log out → log in as that employee → verify a payment → log out. This is deliberately one long spec, not many small ones; the point is proving the seams work together, not re-testing individual page logic (that's Phase 3's job).

**How to implement**:
- Add Playwright (`@playwright/test`) to `frontend/`.
- Run against a real backend pointed at a disposable test database (mongodb-memory-server started as a standalone process, or a dedicated test MongoDB — not the dev database).
- This is the first place `SameSite=None` cookie behavior and the CSP meta tag can be verified against a *real* browser rather than jsdom/Supertest approximations — worth an explicit assertion that `document.cookie` does NOT contain `accessToken`/`refreshToken` after login (proving the httpOnly migration actually holds under a real browser, not just the mocked test environment).

**What a green suite proves**: the whole system — real browser, real network requests, real cookies, real backend, real (test) database — works together for the flow that matters most.

**Estimated scope**: 1 spec file, but real setup cost (test database lifecycle, environment wiring). Budget a full session for the setup alone before the spec itself.

---

## Phase 5 — Mobile: screen-by-screen expansion

**Why fifth**: the foundation's mobile smoke test (`app/invite-employee.test.tsx`) proves the RNTL + nativewind + expo-router harness works. This phase uses that proven harness to add real coverage, screen by screen, prioritized by usage.

**Priority order**:
1. Verification scan/OCR flow (`app/(tabs)/verify/scan.tsx`, `ocr.tsx`) — the core mobile product flow, and also the two screens touched by this session's `expo-image` swap (worth a regression test that images still render correctly).
2. `employees.tsx`, `employee-detail.tsx` — same feature as the foundation's web coverage; now do the mobile side.
3. Branch management screens.
4. Communications screens.

**How to implement**: exactly the `invite-employee.test.tsx` pattern — mock `nativewind`, `expo-router`, the relevant store slice, and the relevant API/hook module at the top of the file. For the camera/OCR screens specifically, `expo-camera` and any ML/OCR native modules will need explicit mocks (they won't render in a JS-only test environment) — mock them to return a canned image URI and skip straight to testing the post-capture UI state, rather than trying to simulate the camera itself.

**What a green suite proves**: the mobile screens actually render and wire up to the right hooks/actions — same guarantee Phase 3 gives the web app.

**Estimated scope**: ~6-8 screen test files. Expect the camera/OCR screens to take disproportionately longer than the others due to native-module mocking.

---

## Phase 6 — Mobile: end-to-end smoke (Detox or Maestro)

**Why sixth**: same rationale as Phase 4, for mobile. RNTL tests (Phases 5) run in a JS environment with mocked native modules; this phase runs on a real simulator/emulator (or device) with the real native layer.

**How to implement**: **Maestro** is the lower-setup-cost option (YAML flow files, no native build config beyond what already exists) and is generally the better fit unless the team already has Detox expertise — recommend starting there rather than Detox. One flow: the same golden path as Phase 4 (register/login → invite → verify → logout), run against a real Expo dev build.

**What a green suite proves**: the app actually works on a real device/simulator, including the native modules (camera, secure storage, push permissions) that every JS-level test in Phases 5 necessarily mocks around.

**Estimated scope**: 1 flow, but similar setup-cost caveat as Phase 4 — the infrastructure (device/simulator provisioning, a reachable test backend) is the real cost, not the flow itself.

---

## Phase 7 — CI wiring

**Why last**: CI enforcement is only valuable once there's something worth enforcing — wiring it up before Phase 1 just means a green checkmark on a suite that doesn't cover the product's actual risk surface.

**What to do**:
- A workflow (GitHub Actions or equivalent) that runs, on every PR: `backend` typecheck + test, `frontend` typecheck + test, `mobile` typecheck + test, in parallel jobs.
- Once Phases 1-3 land and coverage is meaningful (not before — an early coverage gate just pressures people into padding numbers with low-value tests), add a coverage threshold as a merge gate. Start low (e.g. 40-50% on the areas covered by Phases 1-3) and ratchet up over time rather than picking an aspirational number up front.
- Phases 4 and 6 (E2E) are usually *not* run on every PR (too slow, need real infra) — run them on a schedule (nightly) or on merge to main instead.

**What this proves**: that the coverage built in Phases 1-6 actually stays true over time, instead of quietly rotting as the codebase changes underneath it.

---

## Summary table

| Phase | Area | Priority driver | Rough size |
|---|---|---|---|
| 1 | Backend verification/subscription core | Highest business risk, least covered | Largest |
| 2 | Backend authorization matrix + validation | Systematic access-control guarantee | Medium |
| 3 | Frontend remaining pages | Breadth, proven pattern | Large |
| 4 | Frontend E2E (Playwright) | Catches cross-layer bugs unit/integration can't | Small spec, large setup |
| 5 | Mobile remaining screens | Breadth, proven harness | Medium-large |
| 6 | Mobile E2E (Maestro/Detox) | Real-device guarantee | Small flow, large setup |
| 7 | CI wiring | Keeps 1-6 from rotting | Small |

# Backend Testing

Stack: **Jest** + **ts-jest** + **Supertest** (real HTTP-style requests against the Express app) + **mongodb-memory-server** (a real, ephemeral MongoDB — not mocked).

## Running

```bash
cd backend
npm install
npm test              # run once
npm run test:watch    # re-run on file changes
npm run test:coverage # run with a coverage report
```

No local MongoDB, no `.env` setup, and no network access is required — `mongodb-memory-server` downloads and boots a real `mongod` binary on first run (cached afterwards) and each test file gets its own throwaway database. `tests/.env.test` supplies dummy values for the env vars `src/config/env.ts` requires at import time (JWT secrets, etc.) — see `tests/setup.ts` for how it's loaded ahead of everything else.

## Layout

- `tests/setup.ts` — starts/stops the in-memory MongoDB per test file, wipes all collections after every test (`afterEach`) so tests never see another test's leftover data.
- `tests/helpers.ts` — `registerOwner()` (creates a fresh owner + initial branch via a cookie-jar-backed Supertest agent, mirroring how the web frontend actually authenticates), `loginEmployee()`, and `getCookieValue()` (reads a specific cookie out of a response's raw `Set-Cookie` headers — used to grab the CSRF token the way the frontend does).
- `tests/auth.test.ts` — register, login (owner + employee), the cookie session lifecycle (login → `/auth/me` → refresh → logout), the CSRF double-submit middleware, and the forgot/verify/reset-password flow.
- `tests/employee.test.ts` — invite (owner-only, branch-ownership-checked), list scoping (an owner only sees their own employees; an employee only sees their own branch), the full lifecycle (update/deactivate/activate/reset-password/move-branch/delete), and the cross-owner/cross-actor 403 boundaries.
- `tests/branch.test.ts` — create/update/deactivate, settlement account add/remove, and ownership-boundary 403s.
- `tests/unit/auth.utils.test.ts` — a pure unit test (no DB) of `generateTokens`.

## Why Supertest + a real in-memory DB instead of mocking the models

Most of what actually breaks in this app lives in the interaction between the auth middleware, the CSRF middleware, Mongoose's `unique` indexes, and role-scoped queries — none of which a mocked-model unit test would catch. Case in point: writing `tests/branch.test.ts` surfaced a real bug (branchCode had a database-wide unique index but was generated per-owner, so two different companies of the same type would collide on their first branch code) that a mocked test would have hidden entirely. Prefer this integration style for anything touching auth, access control, or a Mongoose schema constraint.

## Adding a new test

Follow the pattern in `tests/employee.test.ts`: call `registerOwner()` (or `loginEmployee()`) to get an authenticated Supertest `agent` + `csrfToken`, then issue requests through that `agent`, attaching `.set('X-CSRF-Token', csrfToken!)` on every mutating (POST/PUT/PATCH/DELETE) request — the CSRF middleware will 403 you otherwise, exactly like it would a real cookie-authenticated browser request missing the header.

## What isn't covered yet

Verification/payment core logic, subscriptions, communications, notifications, and the full authorization matrix across every route are not covered by this foundation suite — see `docs/TEST_COVERAGE_PLAN.md` at the repo root for the phased plan to get there.

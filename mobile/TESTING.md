# Mobile Testing

Stack: **Jest** (`jest-expo` preset) + **React Native Testing Library**.

## Running

```bash
cd mobile
npm install
npm test              # run once
npm run test:watch    # re-run on file changes
npm run test:coverage # run with a coverage report
```

## A note on the setup (read this before adding `jest` as a dependency elsewhere)

`jest-expo` ships its own `bin/jest` script and pins internal `jest-*` packages to the Jest **29** line. If `jest` itself isn't installed as a direct dependency, `npx jest` resolves to `jest-expo`'s wrapper and fails with `Cannot find module 'jest/package.json'`; if you install the latest `jest` (30.x) instead, the version skew against `jest-expo`'s internal `jest-runtime`/`jest-snapshot` breaks with cryptic internal errors (`clearMocksOnScope is not a function`). This project pins `"jest": "^29.7.0"` as a devDependency for exactly this reason — don't bump it independently of `jest-expo`.

Also: `.ts` (non-`.tsx`) test files that use `x as jest.Mocked<typeof x>` fail to parse under this project's Babel config (a JSX/generics ambiguity in how `babel-preset-expo` handles `.ts` files) — use `jest.mocked(x)` instead, which is equivalent and doesn't hit the parser issue. See the existing tests for the pattern.

## Layout

- `src/store/authStore.test.ts` — `setUser` persists tokens to `expo-secure-store`, `hydrate` (no token / valid token / expired token), `logout`, the re-entrant logout guard. The API layer (`authApi`, `branchApi`) is mocked with `jest.mock(...)`; `@react-native-async-storage/async-storage` uses its official Jest mock.
- `src/hooks/useEmployee.test.tsx` — `useEmployees`/`useEmployeeDetail` against a mocked `employeeApi`, wrapped in a real `QueryClientProvider` (via `@testing-library/react-native`'s `renderHook`) so the actual React Query cache/mutation behavior is exercised, not just the mock calls.
- `app/invite-employee.test.tsx` — a smoke render test for the invite screen, with `nativewind`, `expo-router`, `authStore`, and `useEmployee` mocked at the module level. This exists to prove the RNTL + nativewind + expo-router mocking harness actually renders a real screen end-to-end — treat it as the template for adding more screen tests, not as meaningful coverage on its own.

## Why hook/store tests instead of broad screen rendering

Screens in this app combine nativewind (custom `className` styling via Babel/cssInterop), expo-router (file-based routing, hard to fully simulate), and native modules (camera, secure storage, notifications) — getting all of that working reliably for every screen is a bigger, more fragile undertaking than the time available for this foundation pass. Hook and store tests cover the actual business logic (API calls, state transitions, query invalidation) with a much better reliability-to-effort ratio; the one smoke test proves the harness for screen-level tests works when you're ready to add more.

## What isn't covered yet

Broader screen coverage (verification scan/OCR flow, branch management, communications) and native-module-heavy flows are not covered — see `docs/TEST_COVERAGE_PLAN.md` at the repo root (Phase 5) for the plan to extend this screen-by-screen on top of the now-proven harness.

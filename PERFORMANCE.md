# Performance Pass — 2026-07-18

## Web

**Before:** `frontend/src/App.tsx` statically imported all ~30 page components (public, auth, dashboard, admin). Confirmed via `dist/assets` from the last production build: one dominant bundle, `index-CpVxmzKK.js` at **1,759,135 bytes (~1.72MB)**, loaded in full on every visit regardless of which page was requested.

**Fix:** every page component (everything under `src/pages/**`, excluding layouts and small shared components) now goes through `React.lazy(() => import(...))`, with a single `<Suspense>` boundary wrapping `<Routes>` in `App.tsx`. Each route becomes its own chunk — a visitor hitting `/login` no longer downloads the admin dashboard, the analytics charts, or the export-center code.

Not changed:
- Images: no `<img>` in the codebase currently needs `loading="lazy"` treatment beyond what's already there (spot-checked; nothing egregious found).
- No CDN/preloading changes — out of scope for this pass; revisit once real traffic patterns are known (e.g. `<link rel="modulepreload">` for the most-hit route after login).

**Verify:** `npm run build` in `frontend/`, then check `dist/assets/` — you should see many small per-route chunks instead of one large bundle.

## Mobile

- **Route-level code splitting**: already handled by `expo-router`'s file-based routing (confirmed — no change needed).
- **Image caching**: `expo-image` was already a dependency but unused everywhere (all screens used plain React Native `Image`, which has no disk/memory cache). Swapped the two screens that render **remote** (`source={{ uri: ... }}`) images — `mobile/app/(tabs)/verify/scan.tsx` and `mobile/app/(tabs)/verify/ocr.tsx`, the scan/receipt-preview flow — to `expo-image` via a small `nativewind`-compatible wrapper (`mobile/components/ui/expo-image.tsx`, following the existing `cssInterop` pattern used for icons). The other ~38 files that render `Image` only display local bundled assets (`require(...)`) — no caching benefit there, so they weren't touched.
- **Lists**: the employees list already uses `FlatList` correctly (not a ScrollView-of-items anti-pattern).

## Backend

Not in scope for this pass (no evidence of a performance problem — no slow endpoints reported, indexes already exist on the hot query paths). Compression (`compression()`) and connection pooling (`maxPoolSize: 10`) were already in place before this session.

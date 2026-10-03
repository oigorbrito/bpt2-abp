## 2024-05-24 - Defaulting to cache: 'no-store' for static backend API fetches
**Learning:** Next.js frontend defaults to cache: 'no-store' for static backend API fetches, which bypasses built-in revalidation logic.
**Action:** Exclusively rely on Next.js server-side cache/revalidation (next: { revalidate: [seconds] }) for static data fetches.

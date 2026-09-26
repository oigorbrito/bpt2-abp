## 2024-05-24 - Next.js Cache No-Store Anti-Pattern for Static Fetches
**Learning:** A common performance anti-pattern in the Next.js frontend (`public-web`) is defaulting to `cache: 'no-store'` for static backend API fetches like vehicle catalogs. This causes unbounded redundant calls to the backend on every page load/request for data that rarely changes.
**Action:** Exclusively rely on Next.js server-side cache/revalidation (`next: { revalidate: [seconds] }`) for static data. Do not use custom in-memory Map caching.

## 2024-05-24 - Static Backend API Fetch Caching
**Learning:** Defaulting to `cache: 'no-store'` for static backend API fetches is an anti-pattern that causes unnecessary roundtrips. Custom in-memory Map caching is also problematic as it bypasses built-in revalidation logic and causes memory leaks.
**Action:** Exclusively rely on Next.js server-side cache/revalidation (e.g., `next: { revalidate: 3600 }`) for static backend API fetches to optimize performance.

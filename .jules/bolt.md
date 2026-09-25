## 2024-09-25 - Avoid `cache: 'no-store'` for static backend API fetches
**Learning:** Defaulting to `cache: 'no-store'` for static backend API fetches (e.g. fetching catalogs, listings, or seller profiles) is a severe anti-pattern in the Next.js frontend (`public-web`). It bypasses built-in revalidation logic and causes unbounded memory leaks or degraded performance due to redundant network calls.
**Action:** Exclusively rely on Next.js server-side cache/revalidation (`next: { revalidate: [seconds] }`) for backend fetching to improve performance.

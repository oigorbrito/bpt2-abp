## 2024-09-30 - Next.js Caching Anti-Pattern
**Learning:** Defaulting to `cache: 'no-store'` for static backend API fetches (like the vehicle catalog) causes unnecessary backend requests on every page load and bypasses built-in revalidation logic. Implementing custom in-memory caching for these bypasses the framework's logic and can cause unbounded memory leaks.
**Action:** Exclusively rely on Next.js server-side cache/revalidation (`next: { revalidate: [seconds] }`) for static data fetches to improve performance and prevent memory leaks.

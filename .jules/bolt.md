## 2024-05-24 - Next.js Default No-Store Anti-Pattern
**Learning:** The Next.js frontend (`public-web`) frequently defaults to `cache: 'no-store'` for highly static backend API fetches (like the vehicle catalog). This bypasses Next.js's powerful Data Cache, leading to unnecessary backend load and slower response times for static data.
**Action:** Exclusively rely on Next.js server-side cache/revalidation (`next: { revalidate: [seconds] }`) for static data instead of `cache: 'no-store'` or custom in-memory caching to optimize performance without risking unbounded memory leaks.

## 2024-05-27 - Caching Default Anti-Pattern
**Learning:** Defaulting to `cache: "no-store"` for static data like the vehicle catalog causes unnecessary backend load.
**Action:** Use Next.js `next: { revalidate: [seconds] }` for server caching of static data, and a simple in-memory `Map` for client-side component memoization of repetitive queries.

## 2024-05-24 - Static Backend API Fetches should use ISR
**Learning:** Defaulting to `cache: 'no-store'` for static backend API fetches (like the vehicle catalog) is a performance anti-pattern in the Next.js frontend (`public-web`). It causes unnecessary backend hits for highly static data.
**Action:** Use Next.js server-side revalidation (e.g., `next: { revalidate: 3600 }`) and client-side `Map` memoization for repetitive queries instead of `cache: 'no-store'` for static catalog data.

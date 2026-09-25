## 2025-02-14 - Prevent Protocol-Relative URLs in Local Redirects
**Vulnerability:** Open Redirect via protocol-relative URLs (`//evil.com`) bypassing the `startsWith("/")` check.
**Learning:** Checking if a redirect URL `startsWith("/")` is insufficient because browsers treat `//` as a protocol-relative URL to `http(s)://`, allowing navigation to external sites.
**Prevention:** Always combine `startsWith("/")` with `!startsWith("//")` when validating local redirect destinations.

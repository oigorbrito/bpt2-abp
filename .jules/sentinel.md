## 2024-05-24 - Open Redirect via Protocol-Relative URLs
**Vulnerability:** Local redirect validation in Next.js using only `url.startsWith("/")` is vulnerable to open redirects via protocol-relative URLs (e.g., `//evil.com`).
**Learning:** Protocol-relative URLs bypass basic single-slash checks because they start with a slash, but the browser interprets them as external links.
**Prevention:** Always check that the URL does not start with a double slash (`!url.startsWith("//")`) in addition to checking that it starts with a single slash.

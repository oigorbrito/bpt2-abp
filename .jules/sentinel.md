
## 2025-02-27 - Open Redirect in Next.js Callback
**Vulnerability:** Open redirect in OAuth callback due to incomplete URL validation (`startsWith("/")`).
**Learning:** Protocol-relative URLs (e.g., `//evil.com`) also start with `/` and bypass basic slash checks.
**Prevention:** Always check `!url.startsWith("//")` along with `url.startsWith("/")` when validating local redirects.

## 2025-02-18 - Open Redirect via Protocol-Relative URLs
**Vulnerability:** Found an open redirect vulnerability in `public-web/app/anuncios/[id]/page.tsx` and `public-web/app/favoritos/callback/page.tsx` where the `returnTo` parameter was only checked to start with a single slash (`returnTo.startsWith("/")`).
**Learning:** Checking for a single slash is insufficient because protocol-relative URLs (e.g., `//malicious.com`) also start with a slash and are treated as valid URLs by browsers, allowing attackers to redirect users to arbitrary external domains.
**Prevention:** When validating local redirect URLs, explicitly ensure the string does not start with a double slash (`!url.startsWith("//")`) along with the single slash check.

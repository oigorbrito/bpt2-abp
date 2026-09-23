## 2023-10-24 - Protocol-Relative URL Bypass for `startsWith("/")` Check
**Vulnerability:** Open Redirect vulnerability in `favoritos` and `anuncios` callback pages.
**Learning:** Checking `returnTo.startsWith("/")` is not sufficient to prevent external redirects, as protocol-relative URLs like `//malicious.com` or `/\malicious.com` will bypass the check and redirect users to external domains.
**Prevention:** Use a stricter check to ensure it doesn't start with `//` or `/\` (e.g., `returnTo.startsWith("/") && !returnTo.startsWith("//") && !returnTo.startsWith("/\\")`) or use the URL constructor to validate the host. Add inline comments explaining the rationale for the bypass checks.

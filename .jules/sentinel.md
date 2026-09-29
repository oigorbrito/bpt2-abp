## 2024-05-15 - Prevent Open Redirect Via Double Slash in Return URLs
**Vulnerability:** Open Redirect vulnerability where `returnTo` URLs starting with `//` (protocol-relative URLs) bypass basic `startsWith("/")` checks.
**Learning:** Checking if a URL `startsWith("/")` is not enough to ensure it is a local path, because `//example.com` also starts with `/` but redirects to an external site.
**Prevention:** Always validate local redirect URLs by explicitly ensuring the string does not start with a double slash (`!url.startsWith("//")`) along with the single slash check (`url.startsWith("/")`).

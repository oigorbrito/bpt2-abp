## 2024-11-20 - Open Redirect via Protocol-Relative URLs
**Vulnerability:** Open Redirect vulnerability in `public-web` frontend using protocol-relative URLs (e.g., `//evil.com`).
**Learning:** The previous validation only checked if `returnTo.startsWith("/")`, which fails to block double-slash protocol-relative URLs.
**Prevention:** Ensure local relative URL validation uses both `startsWith("/")` and `!startsWith("//")` to block protocol-relative URLs.

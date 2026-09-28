## 2024-05-18 - Prevent Open Redirect via Protocol-Relative URLs in Local Redirects
**Vulnerability:** Open Redirect vulnerability in `returnTo` redirect handling, allowing attackers to redirect users to malicious external domains via protocol-relative URLs (e.g. `//attacker.com`).
**Learning:** Checking if a local URL starts with a single slash (`url.startsWith("/")`) is insufficient to verify it is local, because protocol-relative URLs also start with a single slash (as part of double slashes `//`).
**Prevention:** Explicitly check that local URLs do not start with a double slash (`!url.startsWith("//")`) when performing the single slash check.

## 2024-03-21 - Protocol-Relative URL Open Redirect
**Vulnerability:** Open redirect vulnerability via `returnTo` parameters that check `startsWith("/")` but fail to check `!startsWith("//")`.
**Learning:** `startsWith("/")` is not sufficient validation for local URLs because `//example.com` (a protocol-relative URL) satisfies `startsWith("/")` and allows an attacker to redirect users to a malicious site.
**Prevention:** When validating local redirect URLs, explicitly ensure the string does not start with a double slash (`!url.startsWith("//")`) along with the single slash check (`url.startsWith("/")`).

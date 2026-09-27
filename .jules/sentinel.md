## 2025-02-14 - Open Redirect Vulnerability via Protocol-Relative URLs
**Vulnerability:** Open Redirect vulnerability where attackers can bypass standard local path validation (`startsWith("/")`) by using protocol-relative paths (`//evil.com`).
**Learning:** Checking if a redirect URL `startsWith("/")` is insufficient because a double slash (`//`) also starts with a single slash but acts as an absolute URL that shifts the protocol to match the current page's protocol.
**Prevention:** Always validate that local paths not only start with a single slash (`startsWith("/")`) but also do not start with a double slash (`!startsWith("//")`).

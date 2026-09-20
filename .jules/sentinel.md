## 2025-02-18 - Fix Open Redirect Vulnerability in Auth Callback
**Vulnerability:** Open redirect vulnerability via loosely validated `returnTo` state in OpenIddict auth callback.
**Learning:** `startsWith("/")` is not sufficient to validate local paths as it permits protocol-relative URLs (`//evil.com` or `/\evil.com`), bypassing security intent.
**Prevention:** Always strengthen path validations with strict exclusions (`!startsWith("//")` and `!startsWith("/\\")`) when determining safe relative redirects.

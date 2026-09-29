## 2024-05-19 - Screen Reader Accessibility for Dynamic Error Messages
**Learning:** Dynamic error messages (like those generated after an auth failure) are not automatically announced by screen readers if they are simply inserted into the DOM. This can leave visually impaired users unaware of critical state changes.
**Action:** When adding conditional error messages to the UI (e.g., `{error ? <p className="error">{error}</p> : null}`), explicitly include `role="alert"` or `aria-live="assertive"` so screen readers proactively read the update.

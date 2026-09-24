## 2024-05-24 - Missing ARIA alert on asynchronous button errors
**Learning:** Found that secondary action buttons performing async requests (like signaling or favoriting an item) dynamically rendered error text below the button when failing, but screen readers weren't notified as there was no ARIA live region.
**Action:** Always add `role="alert"` (or `aria-live="assertive"`) to asynchronously injected error messages tied to button clicks so screen reader users are immediately informed of the failure.

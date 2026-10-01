## 2024-10-24 - Accessibility improvements for toggle buttons and error messages
**Learning:** Explicitly stating `aria-pressed` on toggle buttons significantly improves the experience for screen readers, ensuring they understand the current state. Furthermore, error messages must use `role="alert"` to ensure they are immediately announced when they dynamically appear.
**Action:** Always add `aria-pressed` on toggle buttons and `role="alert"` to dynamically rendered error messages in React components.

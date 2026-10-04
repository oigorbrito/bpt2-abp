## 2026-10-04 - Missing ARIA attributes in User Settings Toggles
**Learning:** Found a recurring pattern in the Buyer settings (saved searches) where state-toggling buttons change their visual label but lacked the semantic `aria-pressed` attribute, leaving screen readers without a standard state indicator.
**Action:** Always include `aria-pressed` for toggle buttons in the BPT2 React components, even when the text label changes dynamically.

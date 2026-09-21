## 2026-09-21 - Focus visible style for keyboard navigation
**Learning:** This app's interactive elements globally lacked `focus-visible` styles, leading to poor keyboard navigation accessibility.
**Action:** Always verify if `:focus-visible` is implemented alongside `:hover` styles, or globally applied to interactive elements like `a` and `button` across the UI. Added explicit outline styles in `globals.css` to fix this.

## 2025-01-24 - Focus visible styles missing on primary actions
**Learning:** Found that `primary-action` and `secondary-action` buttons lacked `:focus-visible` styling, hindering keyboard accessibility. Added `outline` styles specifically for keyboard users using the `:focus-visible` pseudoclass.
**Action:** Always check interactive elements for visible focus states and apply them consistently when not present.

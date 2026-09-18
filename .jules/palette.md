## 2024-05-24 - Missing Focus Visible on Buttons
**Learning:** Found multiple button classes (`.primary-action`, `.secondary-action`, `.whatsapp-cta`, `.submitFilters`) that lacked distinct keyboard focus states and mouse hover states, reducing accessibility and clarity.
**Action:** Implemented `:hover` and `:focus-visible` styles on all main action buttons using the existing design language (e.g., `outline-offset`) to ensure uniform keyboard navigability and better visual feedback.

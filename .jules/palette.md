## 2024-05-18 - Loading and Alert Roles for Action Buttons
**Learning:** Found that secondary action buttons like Favorite and Report lacked a loading state (busy but no text feedback) and their error messages lacked `role="alert"`, meaning screen readers would not announce failures to users.
**Action:** Added `busy ? "Atualizando…" : ...` for text feedback during network operations and added `role="alert"` to error text elements for screen reader announcements in interactive components.

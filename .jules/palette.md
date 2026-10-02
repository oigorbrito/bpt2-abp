## 2024-10-24 - Dynamic Error Announcements
**Learning:** Dynamically rendered error messages often lack screen reader announcements if they don't have the appropriate ARIA roles, making them inaccessible to visually impaired users.
**Action:** Always use `role="alert"` for dynamically rendered error messages to ensure immediate and accurate screen reader announcements.

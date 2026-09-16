# Palette's Journal - Critical Learnings

## 2025-05-18 - Async Action Feedback Pattern in Public Listing Pages
**Learning:** In action components (like `FavoriteButton` and `ReportButton`), disabling the button during async operations without updating the label or adding `aria-busy` leaves users unsure if their interaction succeeded. Adding dynamic loading labels ("Salvando...", "Sinalizando...") alongside `aria-busy` and `role="alert"` for error messages provides immediate visual and screen-reader feedback.
**Action:** Always pair `disabled={busy}` on async trigger buttons with `aria-busy={busy}`, dynamic loading labels, and `role="alert"` on dynamically rendered error notices.

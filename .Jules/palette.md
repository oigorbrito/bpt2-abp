## 2025-05-18 - Clear Async Action Feedback in Buyer Listing Actions
**Learning:** In Next.js client components performing async actions (like favoriting or reporting a listing), disabling the button without changing its label or exposing `aria-busy` leaves screen reader users and visual users uncertain whether their click was registered.
**Action:** Always provide active text feedback (e.g., "Salvando…", "Sinalizando…"), set `aria-busy={busy}`, and expose error messages with `role="alert"`.

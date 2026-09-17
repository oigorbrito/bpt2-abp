## 2024-05-15 - Interactive Button Accessibility
**Learning:** Action buttons in Next.js client components using React state (like `busy`, `reported`, `favorite`) require dynamic ARIA attributes to accurately reflect their status to screen readers, and dynamically injected error messages need `role="alert"` to be immediately announced.
**Action:** Always add `aria-busy={busy}` and `aria-pressed={state}` to toggle/action buttons, and `role="alert"` to error feedback messages that appear after user interaction.

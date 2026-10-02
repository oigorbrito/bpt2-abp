# Palette's Journal

## 2025-05-18 - Action Buttons in Item Grids
**Learning:** In card grids (e.g. favorites or saved searches), generic action buttons like "Remover" lack context for screen readers when navigated out of DOM order, and lack loading feedback during async API calls.
**Action:** Always provide explicit `aria-label` including the item title, set `aria-busy={isProcessing}`, disable during flight, and update label text (e.g., "Removendo…") for instant visual feedback.

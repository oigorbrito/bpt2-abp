## 2024-10-01 - [Add Aria Labels to Listing Action Buttons]
**Learning:** Dense lists of repetitive buttons (e.g. Publish, Pause, Delete) create a poor screen reader experience because screen reader users navigate interactively and miss the context of each item if only standard text is used.
**Action:** Always add descriptive `aria-label` attributes to repetitive action buttons and links within lists using row-specific variable data (e.g. `aria-label={\`Publicar \${listing.title}\`}`).

---
version: 1
slug: "src-admin"
primary_target: "src/admin"
related_targets: []
---

# Surface brief: Larsen admin panel (/admin)

Scope: every screen and modal under `/admin`. Mode: Operate. Redesign with its own identity (user decision), light and dark.

Audience and job: Larsen staff. ADMIN (desktop) works leads, reports, catalog and users; INVENTARIO (phone/tablet in the warehouse) captures and consults units. Equal priority for desktop and mobile. Spanish UI.

Constraints: no emojis, symbols only (drawn SVG, one stroke weight); dark mode required; preserve every behavior, label, aria name and test hook; own identity, not the public site's look, but Larsen navy `#28327B` and red `#D81E2A` remain the brand colors.

## Direction contract

THESIS: A knitting chart. Every unit, lead and record is a cell on a visible technical grid, and its state is a drawn stitch symbol (ring, slash, dot, cross) readable without color. Refuses the generic admin: gray sidebar, white shadowed cards, colored pills, emoji icons.

OWN-WORLD: Deep-navy rail with an inverted paper cell for the active item; paper-cool ground carrying a faint 24px chart grid; solid white work plates with 1px square hairlines and no radius or shadow; Archivo for UI and Red Hat Mono for every numeral, serial and date; navy is the only action color, red is reserved for destructive and overdue; dark mode swaps to an ink-blue ground with a periwinkle accent.

STORY: Staff open the panel and know the numbers are right: the Dashboard draws the inventory as a chart of cells, the table rows carry a symbol per state, and the frequent action (change a unit's state, answer a lead) is one tap away at a desk or standing in a warehouse.

FIRST VIEWPORT: Left rail 256px (wordmark lockup built from a 3x3 L-shaped cell mark, grouped nav with drawn icons, user cell and theme switch at the bottom). Main: page title row with a strong hairline beneath it, then on the Dashboard a wide plate holding the unit chart (one cell per unit, symbol by state) with a three-row legend of mono counts, beside a Leads ledger plate. Mobile: 56px navy top bar with menu and theme buttons, the rail becomes a drawer; tables become stacked rows.

FORM: Knit chart / Jacquard card notation, ordered 5 of 7 on the author's list; seed key d0d77788.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

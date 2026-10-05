# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Larsen Italiana staff operating the `/admin` panel behind a login, in Spanish. Two roles: ADMIN (full panel) and INVENTARIO (inventory only). ADMIN works mostly at an office desktop; INVENTARIO captures and consults units from a phone or tablet. Desktop and mobile carry equal priority.

## Product Purpose

Larsen Italiana sells rebuilt knitting machinery. The public site generates leads; the admin panel is where the team works them and keeps the physical inventory honest: which units are available, reserved or sold, who changed what, and how long a unit has been held. Success is a team that finds a lead or a unit in seconds and trusts the numbers.

## Positioning

The admin tracks individual physical units (not just catalog entries) with state history, reserved-since dates, Excel/PDF exports and a monthly closing report emailed by a cron job.

## Capabilities and Constraints

- Pages: Dashboard, Inventario, Reportes, Productos, Máquinas, Marcas, Leads, Usuarios, Login, plus modals (change password, delete user with written confirmation).
- Custom form controls exist (Select, Combobox, DatePicker) with open/close animation.
- Leads nav item carries a new-leads counter.
- Stack: Vite, React 19, TypeScript, Tailwind CSS v4, React Router. The public site already ships light/dark tokens via `[data-theme]` and a `ThemeProvider` persisted under `larsen-theme`.
- Stoll is no longer handled. No prices on the site.
- UI copy is Spanish; code and docs are English.

## Brand Commitments

Larsen blue `#28327B` and Larsen red `#D81E2A` are the brand colors. The user asked for a corporate look that is not generic, no emojis (symbols only), and a dark mode. The admin gets its own identity rather than inheriting the public site's look (user decision, 2026-10-02).

## Evidence on Hand

Real data comes from the API (stats, leads, inventory units). No customer logos or testimonials are needed in the panel; do not invent any.

## Product Principles

- Trust the numbers: state and counts are legible at a glance and never ambiguous.
- Speed over ceremony: the frequent path (find a unit, change its state, answer a lead) takes the fewest steps.
- One panel, two postures: the same system works at a desk and standing in a warehouse.
- Corporate without template: restraint and precision carry the identity, not decoration.

## Accessibility & Inclusion

Dark mode is required. Keyboard focus must stay visible; state never relies on color alone.

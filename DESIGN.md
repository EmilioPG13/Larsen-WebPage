---
name: Larsen Admin
description: A knitting chart for the /admin panel; every record is a cell on a visible 24px grid and every state is a drawn stitch.
colors:
  chart-paper: "#eef0f5"
  chart-paper-dark: "#0b0e1c"
  plate: "#ffffff"
  plate-dark: "#131730"
  plate-header: "#f5f6fa"
  plate-header-dark: "#0f1328"
  ink: "#11131a"
  ink-dark: "#eef0fa"
  ink-secondary: "#3d4254"
  ink-secondary-dark: "#c4c9de"
  ink-muted: "#5b6175"
  ink-muted-dark: "#9aa0ba"
  ink-faint: "#8a90a8"
  ink-faint-dark: "#6a7298"
  hairline: "#d6dae7"
  hairline-dark: "#262c4d"
  hairline-strong: "#a9afc4"
  hairline-strong-dark: "#454d7c"
  control-edge: "#767d99"
  control-edge-dark: "#7580b8"
  chart-navy: "#28327b"
  chart-navy-hover: "#1d2562"
  chart-navy-dark: "#a3aeff"
  chart-navy-hover-dark: "#bcc4ff"
  on-navy: "#ffffff"
  on-navy-dark: "#0b0e1c"
  attention-red: "#c41c28"
  attention-red-dark: "#ff7a83"
  rail: "#141a47"
  rail-dark: "#070914"
  rail-ink: "#e8ebf8"
  rail-ink-dark: "#e4e7f7"
  rail-muted: "#a3aad6"
  rail-muted-dark: "#8f96ba"
  rail-active: "#f3f5fc"
  rail-active-dark: "#e4e7f7"
typography:
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.005em"
    fontVariation: "wdth 80"
  figure:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 650
    lineHeight: 1.1
  dialog-title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 650
    lineHeight: 1.2
    fontVariation: "wdth 82"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  body-small:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.09em"
    fontVariation: "wdth 92"
  numeral:
    fontFamily: "Red Hat Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  chart-module: "24px"
  page-gutter: "32px"
components:
  button:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "36px"
  button-primary:
    backgroundColor: "{colors.chart-navy}"
    textColor: "{colors.on-navy}"
    rounded: "{rounded.none}"
  button-primary-hover:
    backgroundColor: "{colors.chart-navy-hover}"
  button-danger:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.attention-red}"
    rounded: "{rounded.none}"
  button-small:
    typography: "{typography.body-small}"
    padding: "0 10px"
    height: "30px"
  input:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
    height: "38px"
  segmented-cell-active:
    backgroundColor: "{colors.chart-navy}"
    textColor: "{colors.on-navy}"
    padding: "0 14px"
    height: "34px"
  tag:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body-small}"
    rounded: "{rounded.none}"
    padding: "2px 8px 2px 6px"
  rail:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.rail-ink}"
    width: "256px"
  rail-link-active:
    backgroundColor: "{colors.rail-active}"
    textColor: "{colors.rail}"
    height: "40px"
  plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "20px"
  plate-head:
    backgroundColor: "{colors.plate-header}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.label}"
    padding: "12px 16px"
    height: "64px"
  table-head:
    backgroundColor: "{colors.plate-header}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    padding: "10px 16px"
  dialog:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
---

# Design System: Larsen Admin

Scope: this system applies only to `/admin`. The public site keeps its own look and its own tokens in `src/index.css`; nothing here redefines them. Admin tokens are all prefixed `--a-` (defined in `src/admin/admin.css`) so the two never collide. Light and dark follow `html[data-theme]`; the frontmatter lists each dark value with a `-dark` suffix.

## Overview

**Creative North Star: "The Knitting Chart"**

Every unit, lead and record is a cell on a visible technical grid, and its state is a drawn stitch symbol readable without color. The ground is cool paper carrying a faint 24px chart grid; work happens on solid white plates with 1px square hairlines; a deep-navy rail anchors the left edge. Navy is the only action color and red is reserved for destructive and overdue. The panel is an operating tool for Larsen staff (desktop admins, warehouse phones and tablets), so it is dense, legible and quiet, in Spanish.

Dark mode is a full second ground, not an inversion: an ink-blue paper with a periwinkle accent in place of navy and a soft coral in place of red.

**Key Characteristics:**
- Square everything: no radius, no soft card shadows; depth comes from hairlines and tonal plates.
- State is drawn (stitch marks), never only colored.
- Red Hat Mono for every numeral, serial and date; Archivo for everything else.
- One action color (navy, periwinkle in dark); red means destructive or overdue only.
- Focus is a printed bracket device, not a glow.

## Colors

A cool paper-and-navy palette with one attention red; everything else is an ink-blue neutral.

### Primary
- **Chart Navy** (`chart-navy`, periwinkle `chart-navy-dark` in dark): every action, selection and link: primary buttons, active segmented cell, link text, chart marks, checkbox accent, selected option. Hover deepens to `chart-navy-hover` (lightens in dark). Tints are alpha washes of the same navy (8% light, 12% dark) for hover rows, active options and the notice plate.

### Secondary
- **Attention Red** (`attention-red`, coral `attention-red-dark` in dark): destructive buttons, errors, overdue/held-too-long flags. Used as border (45-50% alpha), 8-12% wash and text, or as the solid danger button.

### Neutral
- **Chart Paper** (`chart-paper`): page ground with a 24px grid line (navy at 7.5% alpha light, periwinkle 6% dark).
- **Plate** (`plate`) and **Plate Header** (`plate-header`): work surfaces and their header/footer bands. In dark, inputs sit on `plate-header-dark` rather than the plate.
- **Ink / Secondary / Muted / Faint**: primary text; table body secondary and field labels; labels and placeholders; zero values (`.adm-dim`, color only).
- **Hairline / Hairline Strong**: row and plate dividers; page-head rule, table head rule, chart cell edge, dialog and popover edge.
- **Control Edge** (`control-edge`): borders of every interactive control, held at 3:1 on the plates.
- **Rail family** (`rail`, `rail-ink`, `rail-muted`, `rail-active`): the left rail and mobile top bar. The active item is an inverted paper cell (`rail-active` fill, `rail` text).

### Named Rules
**The Single Action Rule.** Navy is the only action color. A second accent for "variety" is not allowed.
**The Reserved Red Rule.** Red appears only for destructive actions, errors and overdue state. It is never decoration or a category color.
**The Shape-First Rule.** Meaning is carried by a stitch mark; color only reinforces it.

## Typography

**Display / Body Font:** Archivo (variable, `wdth` axis, with system-ui)
**Label/Mono Font:** Red Hat Mono (with ui-monospace stack), exposed as `--font-data` and applied through `.adm-num`

**Character:** Archivo is used condensed (wdth 80-92) for titles and labels so headings read like chart legends, and at normal width for body text. Red Hat Mono with tabular numerals gives every count, serial and date a ledger column feel.

### Hierarchy
- **Title** (650, 28px, 1.1, wdth 80): one per page, in the page head above the strong hairline.
- **Figure** (650, 26px): large report and login figures.
- **Dialog title** (650, 20px, wdth 82): modal heads.
- **Numeral** (Red Hat Mono 500, 18px, tabular): ledger values and legend counts; the same face at body size for serials and dates.
- **Body** (400-500, 14px, 1.5): default text, buttons, table cells, inputs.
- **Body small** (500-600, 13px): tags, field labels, notes, small buttons, theme switch.
- **Label** (600, 11px, 0.09em tracking, uppercase, wdth 92): panel titles, table heads, rail group names, definition terms. Muted ink.

### Named Rules
**The Mono Numeral Rule.** Any number, serial, or date is set in Red Hat Mono with tabular figures. Never in Archivo.
**The Five Sizes Rule.** The ramp is 11 / 13 / 14 / 18 / 26 (plus 20 for dialogs and 28 for the page title). Do not add in-between sizes.

## Layout

A 256px left rail (below the `lg` breakpoint it becomes a drawer opened from a 56px navy top bar with 44px touch buttons) and a main column capped at 1600px. Page padding is 16px/20px on mobile and 32px/28px from 640px, with 48-56px of bottom room. The page head is flex (stacked on mobile, row from 640px) with a 24px gap to content and a 1px strong hairline beneath. Plates stack with 16-24px gaps; plate bodies pad 16px (20px from 640px); panel heads are 64px tall. Spacing runs on 4/8/12/16/20/24, anchored to the 24px chart module of the background grid. Tables become stacked rows on narrow screens; the segmented filter row scrolls horizontally with an edge fade. On coarse pointers, controls grow to 44px (small buttons 40px, rail links 46px).

## Elevation & Depth

Flat and tonal. Plates sit on the paper ground separated only by a 1px hairline; headers and footers use a slightly different tonal band (`plate-header`). Soft shadows exist only on things that float over the page: dialogs (`0 18px 40px -12px rgba(5,8,30,0.45)`) and popovers (`0 14px 30px -10px rgba(5,8,30,0.4)`), each also edged with a strong hairline. Overlays dim the page with a navy-black scrim (50% light, 68% dark).

### Named Rules
**The Flat Plate Rule.** Plates, buttons, tags and inputs never carry a shadow. Only dialogs and popovers do, because they leave the plane.

## Shapes

Radius is 0 everywhere. Forms are squares, hairline rectangles and drawn geometry (circles inside the stitch marks only). Borders are always 1px; controls use `control-edge`, structure uses `hairline`. The timeline marks events with square 11px ticks on a 1px vertical rule (filled for the latest). Icons and marks share one drawing style: butt caps, mitered joins, 1.5 stroke.

## Components

### Stitch marks
The state vocabulary, drawn in a 16px box (rendered 14-18px) in `currentColor`: **ring** (circle outline), **slash** (ring crossed by a diagonal), **dot** (filled circle), **cross** (an X), **sq** (filled square), **sqslash**, **sqcheck**, **sqdash** (square outlines with a diagonal, check or dash), **alert** (square outline with an exclamation), and **check**. Each state of a unit or record gets one fixed mark; tags and table rows carry the mark beside the text.

### Rail
Navy-ink column with the company wordmark (`AdminLogo`, a white silhouette of the logo on the dark rail) over "Panel interno", grouped nav under 11px uppercase group labels, 40px links with 20px drawn icons, the active link an inverted paper cell, then a user cell and the theme switch (two equal cells, the live one filled paper) at the bottom.

### Plates
White squares with a 1px hairline. Optional head band (64px, plate-header tone, label-style title, 13px note beneath) and body padding 16-20px. A ledger variant lists label-left, mono-value-right rows separated by hairlines.

### Buttons
- **Shape:** square, 1px `control-edge` border, 36px high, 0 16px padding, 14px weight 500.
- **Primary:** navy fill, `on-navy` text, weight 600; hover deepens.
- **Default:** plate fill; hover shows the navy wash and a navy border.
- **Danger:** red text and red-line border with red wash on hover; a solid red variant is used for confirming destruction.
- **Small:** 30px, 13px. **Link action:** text-only navy with an underline that appears on hover.
- **Disabled:** 50% opacity.

### Inputs
Square, 1px `control-edge`, 38px, 8px 12px padding, plate fill (plate-header in dark). Hover darkens the border to muted ink. Focus is a 2px solid navy square outline offset 2px plus a navy border. Selects use a drawn chevron; popover options mark the active row with an inset bracket and the selected one in navy 600.

### Segmented groups
Filters and state pickers share one outer 1px `control-edge` border with 1px inner dividers, 34px cells, tabular numerals. The pressed cell is solid navy; hover is the navy wash. A fill variant gives equal cells for per-row state pickers on narrow screens.

### Tags
Square 1px tags, 13px 600, optional leading mark. Plain (control edge), navy (outline), red (wash) and solid navy tones.

### Tables
14px body, 12px 16px cells with hairline rows; head band in plate-header with 11px uppercase labels and a strong rule; row hover and selection use the navy wash.

### Dialogs
Scrim, then a square plate with a strong hairline and shadow: head band (20px title), 20px body, foot band with right-flowing actions on plate-header tone.

### Unit chart (signature)
The Dashboard draws inventory as a grid of 20px square cells with 4px gaps, so each cell sits on a 24px module matching the page grid. Each cell has a strong-hairline edge and carries the stitch mark for its state; `dot` cells take the navy wash and `slash` cells the plate-header tone. A legend of mono counts sits beside it.

### Focus brackets (signature)
Keyboard focus on buttons, links, rail items and segmented cells draws four printed corner brackets (8px arms, 2px thick, navy; rail ink on the rail; current color in a pressed segmented cell) 4px outside the control. Links use 6px arms. Inside list rows, options use an inset bracket at 2px. Text inputs are the exception and use the 2px square outline.

### Alerts and notices
Full-width plates with a leading mark: red wash with the alert mark for errors, navy wash with the check mark for confirmations.

## Do's and Don'ts

### Do:
- **Do** express every state as a stitch mark first and a color second.
- **Do** keep radius at 0 and borders at 1px hairlines.
- **Do** set every number, serial and date in Red Hat Mono tabular.
- **Do** use navy for all actions and red only for destructive and overdue.
- **Do** keep control borders at `control-edge` so controls hold 3:1 against the plates.
- **Do** give every new interactive element the bracket focus device (inputs: the 2px square outline).
- **Do** keep dark mode in lockstep: every new color needs a `[data-theme="dark"]` value.

### Don't:
- **Don't** use a gray sidebar, white shadowed cards, colored pills or emoji icons.
- **Don't** add shadows to plates, buttons or tags; only floating layers (dialogs, popovers) have one.
- **Don't** add a second accent color or use red as a category color.
- **Don't** draw icons with a different stroke weight, round caps, or fills beyond the mark vocabulary.
- **Don't** introduce type sizes outside 11 / 13 / 14 / 18 / 20 / 26 / 28.
- **Don't** reuse or restyle public-site tokens inside `/admin`, or admin tokens on the public site.

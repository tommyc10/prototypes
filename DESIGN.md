---
name: Imperial Ops
aesthetic: Midnight
version: 1.0
description: >
  A dense, keyboard-first operations dashboard. Near-black greys, hairline edges,
  one white accent, colour only for status. Calm until something needs a person.
source_of_truth:
  product: src/styles/theme.css, src/styles/ui.css, src/styles/shell.css (plain CSS, classes prefixed mn-)
  tailwind_port: ../../design-guides/imperial-ops-tailwind (Tailwind v4, hand-written components, no component library)
  shadcn_port: ../../design-guides/imperial-ops-design-system (Tailwind v4 + shadcn on Base UI)
  css_lessons: ../../design-guides/style-cheatsheet.html

colors:
  dark: # the home theme
    surface:
      l0: "#050505" # sidebar: heaviest material
      l1: "#0b0b0b" # list pane, code blocks
      l2: "#101010" # detail pane: the page itself
      l3: "#161616" # cards
      l4: "#1c1c1c" # raised controls, selected rows
      l5: "#242424" # hover on a raised control
    line:
      line: "rgba(255,255,255,0.07)" # dividers, card rings
      line-2: "rgba(255,255,255,0.11)" # buttons, fields, floating things
      line-3: "rgba(255,255,255,0.18)" # focused field, chart baseline
    text:
      fg: "#ededed" # what you read
      fg-2: "#a3a3a3" # supporting sentences
      fg-3: "#737373" # labels, meta, placeholders
      row-name: "#d6d6d6" # an unselected row's name
    status:
      green: "#45c47a" # active, validated, caught
      amber: "#e0a93e" # proposed, waiting
      orange: "#f08a4b" # warning, low confidence, needs a look
      red: "#f0565c" # danger, a real incident, reject
      orange-wash: "rgba(240,138,75,0.08)"
      red-wash: "rgba(240,86,92,0.08)"
      danger-fg: "#f68a8e" # red text on a red wash
      red-text: "#f3b4b6" # sentences on a red wash
      red-strong: "#fbd5d6" # bold text on a red wash
      orange-strong: "#f7c3a2" # bold text on an orange wash
    accent:
      primary: "#fafafa"
      primary-fg: "#0a0a0a"
      primary-hover: "#e2e2e2"
    material:
      glass: "rgba(24,24,24,0.78)" # action bar, decision form: blur 20px saturate 1.2
      glass-menu: "rgba(28,28,28,0.86)" # menus, popovers: blur 16px saturate 1.2
      glass-palette: "rgba(22,22,22,0.6)" # command palette: blur 40px saturate 1.8
      glass-toast: "rgba(28,28,28,0.88)" # toast: blur 20px
      glass-edge: "rgba(255,255,255,0.07)" # lit top edge on glass
      card-edge: "rgba(255,255,255,0.03)" # lit top edge on cards
      tint: "rgba(255,255,255,0.06)" # hover wash, key caps, empty tracks
      tint-2: "rgba(255,255,255,0.07)" # menu highlight, meter track
      well: "rgba(0,0,0,0.35)" # sunken: text fields
      well-2: "rgba(0,0,0,0.3)" # sunken: metric wells, segmented tracks
      scrim: "rgba(0,0,0,0.3)" # behind the command palette
      overlay: "rgba(0,0,0,0.45)" # behind a dialog
    focus:
      focus-ring: "rgba(255,255,255,0.45)" # 2px outline on anything pressable
      focus-glow: "rgba(255,255,255,0.05)" # 3px glow around a focused field
      selection: "rgba(255,255,255,0.22)"
    chart: # one grey ramp; brightest = most important
      tone-1: "#ededed"
      tone-2: "#9a9a9a"
      tone-3: "#646464"
      tone-4: "#2b2b2b"
  light: # same names, new values. Components never change.
    surface: { l0: "#efefef", l1: "#f7f7f7", l2: "#ffffff", l3: "#fafafa", l4: "#ececec", l5: "#e2e2e2" }
    line: { line: "rgba(0,0,0,0.07)", line-2: "rgba(0,0,0,0.1)", line-3: "rgba(0,0,0,0.2)" }
    text: { fg: "#171717", fg-2: "#525252", fg-3: "#737373", row-name: "#262626" }
    status: { green: "#1f9d55", amber: "#d4940f", orange: "#c2570c", red: "#d42a31", orange-wash: "rgba(194,87,12,0.07)", red-wash: "rgba(212,42,49,0.06)", danger-fg: "#c8232a", red-text: "#9f1d22", red-strong: "#7f1116", orange-strong: "#9a3f07" }
    accent: { primary: "#171717", primary-fg: "#ffffff", primary-hover: "#333333" }
    material: { glass: "rgba(255,255,255,0.8)", glass-menu: "rgba(255,255,255,0.88)", glass-palette: "rgba(255,255,255,0.6)", glass-toast: "rgba(255,255,255,0.9)", glass-edge: "rgba(255,255,255,0.9)", card-edge: "rgba(255,255,255,0.8)", tint: "rgba(0,0,0,0.04)", tint-2: "rgba(0,0,0,0.05)", well: "rgba(255,255,255,0.9)", well-2: "rgba(0,0,0,0.025)", scrim: "rgba(0,0,0,0.08)", overlay: "rgba(0,0,0,0.2)" }
    focus: { focus-ring: "rgba(0,0,0,0.4)", focus-glow: "rgba(0,0,0,0.05)", selection: "rgba(0,0,0,0.12)" }
    chart: { tone-1: "#171717", tone-2: "#737373", tone-3: "#b0b0b0", tone-4: "#dedede" }

typography:
  families:
    sans: "'Geist Variable', ui-sans-serif, system-ui, sans-serif"
    mono: "'Geist Mono Variable', ui-monospace, monospace"
  weights: [400, 500, 600] # never 700
  base: { size: 14px, line-height: 1.5, letter-spacing: 0 }
  scale: # token: size / weight / line-height / tracking
    hero: { size: 88px, weight: 600, line-height: 0.86, tracking: -0.055em, use: "one headline figure per report" }
    title: { size: 26px, weight: 600, line-height: 1.2, tracking: -0.025em, use: "page title; text-wrap: balance; max-width 760px" }
    chapter: { size: 20px, weight: 600, line-height: 1.25, tracking: -0.02em, use: "list title, chapter heading" }
    lead: { size: 17px, weight: 400, line-height: 1.62, tracking: -0.005em, color: fg-2, use: "the opening paragraph of a report" }
    card-title: { size: 15px, weight: 600, tracking: -0.01em, use: "a card's or form's title" }
    section: { size: 14px, weight: 600, tracking: -0.005em, use: "section heading inside a page" }
    body: { size: 14px, weight: 400, line-height: 1.6, color: fg-2, use: "sentences; max-width 68ch" }
    control: { size: 13px, weight: 500, use: "buttons, tabs, rows, menu items" }
    meta: { size: 12px, weight: 400, color: fg-3, use: "labels, meta lines, timestamps" }
    micro: { size: 11px, weight: 500, color: fg-2, use: "chips, key caps, axis labels" }
    id: { family: mono, size: 12px, color: fg-3, use: "RUL-0435, INC-40355" }
    stat: { size: 26px, weight: 600, line-height: 1.1, tracking: -0.03em, use: "the number in a stat card" }

rounded:
  xs: 4px # key caps, meters, checkboxes
  sm: 6px # menu items, the brand mark
  md: 7px # tabs, nav items, icon buttons
  lg: 9px # buttons, inputs, list rows, wells
  xl: 10px # text areas, callouts, code blocks, menus
  2xl: 12px # cards, tables, toasts
  3xl: 14px # glass bars, command palette, dialogs, lead cards
  pill: 999px # badges, dots, avatars
  data: 2px # chart bars only

spacing:
  unit: 2px # everything is a multiple of 2; most are 4, 8, 10, 12, 16
  gap: { hairline: 1px, tight: 2px, icon-label: 6px, control: 8px, cards: 10px, row: 12px, group: 16px, section: 32px }
  padding:
    card: "14px 16px"
    lead-card: "16px to 20px"
    list-row: "10px 10px 10px 12px"
    list-head: "18px 16px 12px"
    detail-pane: "28px 40px 48px"
    glass-bar: "10px 10px 10px 18px"
  shell: { sidebar: 240px, list: 380px, detail: 1fr, max-content: 960px, wide-rail: 380px }
  reading-width: 68ch

heights: # control heights
  kbd: 18px
  chip: 20px
  status-pill: 22px
  badge: 24px
  tab: 28px
  icon-button: 28px
  menu-item: 30px
  nav-item: 32px
  button: 34px
  input: 34px
  palette-item: 38px
  sticky-bar: 52px

elevation:
  flat: "no shadow. Sidebar, panes."
  card: "inset 0 1px 0 card-edge, inset 0 0 0 1px line"
  lead-card: "inset 0 1px 0 card-edge, inset 0 0 0 1px line-2"
  well: "inset 0 0 0 1px line, on a well fill"
  raised: "inset 0 0 0 1px line, on l4 (light: white + 0 1px 2px rgba(0,0,0,0.05))"
  glass: "inset 0 1px 0 glass-edge, 0 0 0 1px line-2, plus one drop shadow"
  shadow-pop: "0 16px 40px rgba(0,0,0,0.5)" # menus, toasts, tooltips
  shadow-float: "0 20px 48px rgba(0,0,0,0.55)" # the action bar
  shadow-palette: "0 24px 64px rgba(0,0,0,0.6)" # command palette, dialogs
  z-index: { sticky: 10, panel: 2, chart-tip: 5, scrim: 50, palette: 51, tour: 100 }

motion:
  easing:
    out: "cubic-bezier(0.23, 1, 0.32, 1)" # almost everything
    in-out: "cubic-bezier(0.77, 0, 0.175, 1)" # something moving from A to B on screen
    drawer: "cubic-bezier(0.32, 0.72, 0, 1)" # sheets and drawers
  duration:
    row-hover: 120ms
    colour: 150ms
    press: 160ms
    panel: 200ms
    arrive: 220ms
    columns: 240ms
    hold-to-confirm: 2000ms linear
  press-scale: 0.97 # 0.95 for icon buttons, 0.98 for wide controls

components:
  button: { height: 34px, radius: lg, padding: "0 14px", gap: 8px, type: control }
  button-primary: { fill: primary, text: primary-fg, hover: primary-hover, edge: none }
  button-secondary: { fill: l4, text: fg, hover: l5, edge: "inset ring line-2" }
  button-ghost: { fill: transparent, text: fg-2, hover: "l3 fill, fg text" }
  button-danger: { fill: red-wash, text: danger-fg, edge: "inset ring red 35%", hover: "red 14%" }
  icon-button: { size: 28px, radius: md, text: fg-2, hover: l3, press-scale: 0.95 }
  kbd: { height: 18px, min-width: 18px, radius: xs, fill: tint, edge: "inset ring line", type: micro }
  badge: { height: 24px, radius: pill, fill: l3, edge: "inset ring line", type: "12px/500", dot: 6px }
  status-pill: { height: 22px, radius: pill, fill: "status 10%", edge: "inset ring status 22%", text: status }
  chip: { height: 20px, radius: pill, type: micro }
  dot: { size: 8px, halo: "0 0 0 3px status 14%", inactive: "hollow, inset 1.5px fg-3" }
  tab: { height: 28px, radius: md, padding: "0 9px", text: fg-3, active: "l4 fill, inset ring line, fg text" }
  segmented: { track: "well-2 fill, inset ring line, radius lg, padding 2px", item: tab }
  search: { height: 34px, radius: lg, fill: l3, edge: "inset ring line", focus: "inset ring line-3 + 3px focus-glow" }
  input: { height: 34px, radius: lg, fill: well, edge: "inset ring line-2", focus: "inset ring line-3 + 3px focus-glow" }
  textarea: { radius: xl, padding: "10px 12px", fill: well, edge: "inset ring line-2", invalid: "inset ring red 60%" }
  list-row: { radius: lg, padding: "10px 10px 10px 12px", gap: 12px, hover: l3, selected: "l4 fill, inset ring line" }
  nav-item: { height: 32px, radius: md, text: fg-2, hover: "l3, fg", active: "l4, fg, weight 500" }
  card: { radius: 2xl, padding: "14px 16px", fill: l3, elevation: card }
  stat-card: { label: "12px/500 fg-3", value: stat, meter: "4px track tint-2, fill fg" }
  metric-well: { radius: lg, min-height: 40px, elevation: well, cell: "4px 14px, divider line" }
  callout: { radius: xl, padding: "11px 14px", fill: red-wash, edge: "inset ring red 20%", text: red-text }
  code-block: { radius: xl, padding: "14px 16px", fill: l1, edge: "inset ring line", type: "mono 12.5px / 1.85" }
  menu: { radius: xl, padding: 4px, min-width: 180px, material: glass-menu, item: "30px, radius sm, 13px/500 fg-2, highlight tint-2" }
  toast: { width: 340px, radius: 2xl, padding: "12px 14px", material: glass-toast }
  tooltip: { radius: lg, padding: "9px 11px", fill: l4, edge: "glass edge + ring line-2", shadow: shadow-pop, type: "12px fg-2" }
  table: { wrap: "radius 2xl, l3, inset ring line", head: "12px/400 fg-3", cell: "8px 12px, 13px fg-2, tabular-nums", row: "border-top line" }
  dialog: { radius: 3xl, fill: l2, edge: "ring line-2", shadow: shadow-palette, overlay: overlay }
  command-palette: { width: 620px, top: 16vh, radius: 3xl, material: glass-palette, search: 52px, item: "38px, radius 8px, 14px/500" }
  action-bar: { radius: 3xl, padding: "10px 10px 10px 18px", material: glass, shadow: shadow-float, position: "absolute, 24px from the pane's sides, 80px from its bottom" }
  hold-button: { height: 32px, radius: 8px, fill: "orange 10%", edge: "inset ring orange 45%", fill-on-hold: "orange, revealed left to right over 2s linear" }
---

# Imperial Ops design system

This file is the contract. If you are an agent asked to build or change something for
Imperial Ops, read it once from the top, then keep to it. If you are a person learning how
the system works, the lessons live in `design-guides/imperial-ops-design-system` (run it,
it teaches each idea beside a live demo) and `design-guides/style-cheatsheet.html`.

The values above are extracted from the shipped app (`src/`, ten thousand lines of CSS
across six pages), not invented. Where the app disagrees with itself, "Known gaps" at the
end says so and says which value wins.

## Overview

Imperial Ops is an operations dashboard: alert rules, incidents, change windows, and a
hindcast and forecast: what past tickets were caused by, and what the next weeks should hold. The person using it is on
shift, making decisions that hide or surface real pages. The look follows from that:

- **Calm.** Everything is grey until something needs a person. Then it is one colour, once.
- **Dense, not cramped.** 13px controls, 12px meta, 34px buttons, 32px nav rows.
- **Keyboard first.** Every primary action has a single key, shown on the control.
- **Evidence before action.** The decision is always in reach, but never the loudest thing
  until the person has read why.

### The recipe, in eight rules

If you remember nothing else, these eight produce something that belongs.

1. **Greys only.** Colour appears only when it means a status: green active, amber
   proposed, orange warning, red danger.
2. **Depth is a ladder of six greys.** `l0` is the heaviest (sidebar), `l5` the lightest
   (hover). To lift something, step up one rung.
3. **Edges are white at 7 to 18% opacity,** drawn as a 1px *inset* `box-shadow`, so they
   work on every rung and take no space.
4. **Cards catch light on their top edge.** A second inset shadow, 1px tall at 3% white.
5. **Anything floating is glass.** A see-through tint, a blur of what is behind, a brighter
   top edge, a ring and one big soft shadow.
6. **Text has three tones.** `fg`, `fg-2`, `fg-3`. Emphasis is weight (500 or 600), never a
   brighter colour. Bigger text gets tighter letter spacing.
7. **One white thing per screen.** The primary button is the only high-contrast element.
8. **Motion is short.** 120 to 240ms, easing out. Pressing shrinks a control to 97%. Hover
   moves one rung up the ladder.

## How the code is organised

The product is plain CSS. No Tailwind, no CSS-in-JS.

- A component gets its look from a **class** (`mn-btn`), its variant or state from a **data
  attribute** (`data-variant="primary"`, `data-active`, `data-selected`, `data-status`),
  and its colours from **tokens** (`var(--l3)`). Never a raw hex in a component.
- Shared pieces are prefixed `mn-`. Each page has its own prefix for its own pieces:
  `ol-` Hindcast and Forecast (one shared family), `al-` Alerts, `cw-` Change windows, `ic-` Incidents, `hm-` Home, `lg-` Sign in.
- Tokens: `src/styles/theme.css`. Shared pieces: `src/styles/ui.css`. Page frame:
  `src/styles/shell.css`. Command palette: `src/styles/palette.css`. OS preferences:
  `src/styles/accessibility.css`. Every other component keeps its CSS beside its `.tsx`.
- Each page is self-contained under `src/pages/<page>/` with `model/types.ts` (the
  contract), `data/mockData.ts` (what the backend replaces), `hooks/` and `components/`.
- Tokens are declared on `.mn` and again on `.mn-menu, .mn-palette, .mn-toast, .mn-tour`,
  because those render at the end of `<body>` and would not inherit them otherwise.
- The theme is `data-mn-theme="light"` on `<html>`; dark is the absence of it.
- Libraries: React 19, Base UI (`@base-ui/react`) for menus and popovers, `cmdk` for the
  palette, `sonner` for toasts, `lucide-react` for icons, `zustand` for the rules store.
  No chart library and no router: charts are divs and SVG, routes are the URL hash.

Building in Tailwind or shadcn instead? Use the port in
`design-guides/imperial-ops-design-system`: its `src/index.css` carries these same tokens
under the same names, and the table in "Using this with shadcn" maps every role.

## Colors

**The ladder.** Six surfaces, about six hex points apart, so layers are felt more than
seen. Material weight encodes hierarchy: the sidebar is darkest and heaviest, the detail
pane is lightest. Cards sit one rung above whatever they are on. Hover is one rung up:
`l3` on the page, `l5` on a raised control, `tint` on a card or on glass.

**Lines.** White at low opacity is always a little lighter than whatever it sits on, so
one token works on every rung. `line` for dividers and card rings, `line-2` when the edge
has to carry the shape alone (buttons, fields, anything floating), `line-3` for a focused
field.

**Text.** `fg` is what you read. `fg-2` is supporting sentences. `fg-3` is labels, meta
and placeholders. In a sentence, the important words are `fg` at weight 500 inside `fg-2`
text; nothing is ever brighter than `fg`.

**Status is the only colour.** See "Status" below for what each means and the pill formula.

**The accent is white.** `primary` on `primary-fg`. Reserve it for the single most
important action on screen, the brand mark and the toast's check.

**Light theme.** Same token names, inverted hierarchy: the sidebar is the darkest grey,
the page is paper white, near-black becomes the accent. Selected rows, active tabs and the
active nav item become white chips with `0 1px 2px rgba(0,0,0,0.05)`. Nothing in component
CSS changes except those few chip overrides.

## Typography

One family, Geist, at a 14px base; Geist Mono for identifiers and code. Three weights:
400 for sentences, 500 for controls and emphasis, 600 for headings and numbers.

- **Tracking tightens as size grows:** 0 at 14px and below, -0.005em at 14 to 17px
  headings, -0.01em at 15px, -0.02em at 20px, -0.025em at 26px, -0.03em on stat numbers,
  -0.055em on the 88px hero figure.
- **Numbers in a column use `font-variant-numeric: tabular-nums`** and are right-aligned.
- **Body copy stops at 68ch.** Headings use `text-wrap: balance`, lead paragraphs `pretty`.
- **One line with an ellipsis** needs `min-width: 0` on its flex or grid parent.
- **Icons** are lucide, stroke 2, sized 15px in controls (14px in dense rows, 16px in nav,
  12 to 13px beside meta text), coloured `fg-3` at rest and `fg` when active.

## Layout

**The shell** is a three-column grid filling the viewport: sidebar 240px, list 380px,
detail `1fr`. Only the panes scroll, never the page. `[` and `]` tuck the sidebar and the
list away; the grid columns animate over 240ms and the detail pane takes the room.

**A pane** is a flex column with `min-width: 0; min-height: 0`; its scrolling child is
`flex: 1; min-height: 0; overflow-y: auto`. A scrolling list fades at its edges with a
`mask-image` gradient (12px top, 16px bottom) instead of meeting a hard line.

**The detail pane** pads `28px 40px 48px` and caps content at 960px. It is a container
(`container: report / inline-size`), and layouts answer to *its* width, not the window's:
below 760px things stack, above 980px a second column appears, and the Rules page moves
the decision into a sticky 380px rail on the right.

**Spacing** is multiples of 2px: 8px inside a control, 10px between cards, 12px inside a
row, 16px between groups, 32px between sections.

**Floating things anchor to their pane**, not the window: the pane is `position:
relative`, the glass action bar is `absolute`, 24px from the sides and 80px from the
bottom, and the scroll area gets enough bottom padding that content can clear it.

## Elevation and materials

There are five materials. Pick by what the thing *is*, not how you want it to look.

| Material | Recipe | Used for |
| --- | --- | --- |
| Flat | A ladder rung, a 1px `line` border between panes | Sidebar, list pane, detail pane |
| Card | `l3` + lit top edge + inset ring `line` | Stat cards, panels, tables |
| Well | `well-2` (fields: `well`) + inset ring `line` | Metric strips, segmented tracks, text fields |
| Raised | `l4` + inset ring `line` | Selected rows, active tabs, the everyday button |
| Glass | tint + `backdrop-filter` + lit top edge + ring `line-2` + drop shadow | Action bar, menus, palette, toasts |

- **Only floating things get a drop shadow.** Nothing that sits on the page has one.
- **Glass gets thinner as blur gets heavier:** the palette is the thinnest tint (60%) with
  the heaviest blur (40px, saturate 1.8); menus are 86% with 16px.
- **Tooltips are solid** (`l4`) with the glass edge and shadow, because bright chart marks
  would wash through real glass.
- **Dialogs are solid** `l2` with a ring and `shadow-palette`, over a plain dim. The page
  behind a dialog is dimmed, never blurred; blur belongs to the thing floating.
- Text on translucent material goes one weight heavier (500), so it holds up.

## Shapes

Seven radii and a pill, in the frontmatter under `rounded`. Radius follows size: the
smaller the thing, the smaller the corner. A child's radius is never larger than its
parent's. Chart bars use 2px. Nothing else is outside the scale.

## Components

Every recipe is in the frontmatter under `components`, and the live versions are in the
design system app. The rules that the values do not carry:

**Buttons.** Four kinds. *Primary* (white) is the one action the screen exists for; at
most one per view. *Secondary* (raised grey) is every other button. *Ghost* is cancel and
toolbar icons. *Danger* is a red wash with a red ring, never a solid red block. A button's
shortcut sits inside it as a key cap, on the right. Disabled is 40% opacity. There is no
loading spinner inside buttons: a decision resolves into a toast.

**Status dot, badge, pill, chip.** The dot (8px, with a 3px halo at 14%) carries status in
a list row; inactive is a hollow ring. The badge (24px, card-coloured) carries a small dot
and a word in a header. The status pill (22px) is the colour at 10% fill, 22% ring, 100%
text. The chip (20px, 11px text) is the quietest. Always a word or icon with the colour.

**Tabs and segmented control.** Tabs are bare, 28px, `fg-3`; the chosen one is a raised
chip. A count sits beside the label, lighter, in tabular figures. When tabs choose a
*mode* (a time range, a version), put them in a sunken well track.

**Fields.** Search boxes are card-coloured with a `line` ring and a `/` key cap on the
right. Text fields are wells with a `line-2` ring. Focus is a `line-3` ring plus a 3px
glow at 5%; invalid is a red ring at 60%. Placeholders are `fg-3`.

**List row.** Status dot, then name over a mono ID and meta line, then a right-aligned
number. Hover is `l3`, selected is `l4` with a ring. Unselected names are `row-name`, a
shade under `fg`, so the selected row reads brightest without colour.

**Stat card and metric well.** Label small and quiet (12px/500 `fg-3`), number big and
tight (26px/600, tracking -0.03em). A meter is a 4px track filled with `fg`, scaled with
`transform: scaleX()`. When a number is a problem, only the number changes colour.

**Callout.** A wash with a ring at 20%: red for "this would have hidden a real incident",
orange for an override. Bold words inside use the `-strong` token.

**Menu, toast, tooltip, dialog, palette.** Materials as above. Menus scale in from their
trigger (0.96 to 1, 150ms). The toast is 340px, bottom right, with a white check disc.
The palette opens with no animation at all: it is used a hundred times a day.

**Hold to confirm.** Overriding a safety check needs a two-second hold. The fill is a
solid copy of the button clipped away from the right; holding reveals it linearly (it is a
timer), letting go snaps it back in 200ms, completing turns it green.

## Status

| Colour | Means | Never means |
| --- | --- | --- |
| Green | Active, validated, caught by a rule | "Good" in general, or decoration |
| Amber | Proposed, waiting for a decision | A warning |
| Orange | Warning: low confidence, past its planned end, an override | An error |
| Red | Danger: a real incident, a page that would be hidden, reject | "Important" |

Status colour goes on the smallest thing that carries the meaning: a dot, a number, a
pill. Never a card's background, never a heading. In charts, one series may take a status
colour (what the rule caught, in green); every other series is a grey from the tone ramp.

## Motion

- **Easing out for almost everything** (`cubic-bezier(0.23, 1, 0.32, 1)`): it starts fast,
  so the interface feels like it answered immediately.
- **Durations by size:** 120ms row hover, 150ms colour, 160ms press, 200ms panels, 220ms
  the decision form, 240ms shell columns. Interface transitions stay under 320ms; only data
  stories (the incident journey, a chart drawing itself) run longer.
- **Only `transform`, `opacity`, `filter` and colour animate.** The one exception is the
  shell's `grid-template-columns`.
- **Press:** `scale(0.97)` on `:active`. **Hover** only inside
  `@media (hover: hover) and (pointer: fine)`.
- **Arriving:** `@starting-style { opacity: 0; transform: translateY(8px) scale(0.99);
  filter: blur(4px) }`. Menus use Base UI's `data-starting-style` / `data-ending-style`.
- **Keyboard-opened things appear instantly;** pointer-opened things animate. The decision
  form gets `data-animate` only when opened with the mouse.
- **Reduced motion:** movement is removed, a short opacity fade may stay.
- **The beam** (`mn-beam`) is a 1px grey light that travels round an element's edge. It has two
  uses and no others: the backtest well while the rule engine is working, and the overnight
  block for as long as it has suggestions waiting. It always marks a state that ends, and it
  travels slowly (5 to 9 seconds a lap). Never on a button, never as decoration.
- **Waiting for something fetched** shows at once what is already known and holds a grey
  `tint` bar where each fetched word will land; the sentence where the answer goes says what
  is being fetched, in `fg-3`. The incident journey is the first: its line is drawn empty and
  its own dot runs it end to end (1.6s a pass), each mark ringing as it passes. That light is
  the journey's, not the beam. Waiting is a state, not an entrance, so it looks the same from
  the keyboard; only the arrival differs (a pointer pick rises in over 220ms and plays the
  journey, a key shows it at once). Reduced motion: the line holds still and the sentence
  breathes.
- **Theme switch** dissolves through the View Transitions API over 200ms.

## Interaction patterns

**Keyboard.** One listener per page (`useKeyboardShortcuts`) decides who gets each key, in
order: the tour, `⌘K`, the open palette, an open decision (only `Esc` and `⌘↵`), a popup
that owns its keys, a focused field (`Esc`, `↵`, `↓` leave it), then the page's own map.

| Key | Does |
| --- | --- |
| `J` / `K` or `↓` / `↑` | Next / previous item in the list |
| `/` | Focus search |
| `⌘K` | Command palette |
| `A` `X` `E` `D` | Approve, reject, activate, deactivate (Rules) |
| `O` `P` `X` `T` | Jump to the overnight suggestions; propose, dismiss or tighten the one selected (Rules) |
| `[` `]` | Tuck away the sidebar / the list |
| `?` | Start the guided tour |
| `Esc` | Step back one layer |
| `⌘↵` | Submit the open decision |

The list footer always shows the page's keys as key caps. A shortcut that exists but is
not shown does not exist.

**List and detail.** The list drives the detail pane. Selection is in the URL
(`#/rules/RUL-0428`), so every state is linkable and Back works.

**Making a decision.** Pressing Approve opens a glass form over the detail pane; it never
navigates away from the evidence. Every change needs a written reason of at least 12
characters; a counter shows `7/12` then a green check. If the rule fails a safety check,
an orange override row appears and the person must hold for two seconds. The result is a
toast.

**Feedback.** Hover within 120ms, press immediately, result as a toast. Errors appear
beside the field that caused them, in a sentence that says what to do.

**Empty and waiting.** An empty list says what would appear here and how to get it, in
`fg-3`, centred, with no illustration. Waiting states say what is being computed.

**Tours.** `?` starts a guided tour: the page dims and blurs, a spotlight glides between
real elements (320ms, in-out), and a glass card explains each one.

## Charts

No chart library. Bars are divs, lines are SVG, everything is drawn with the same tokens.

- One grey ramp (`tone-1` to `tone-4`), brightest for what matters most. At most one
  series takes a status colour.
- Label directly on or beside the marks. Legends are a row of 8px squares with 12px text.
- Axis text is 11 to 12px `fg-3`; gridlines are `line`; the baseline is `line-3`.
- Bars have 2px top corners. The current period is `fg`, the past is `tone-4`.
- Tooltips are the solid tooltip recipe, and list every series with tabular figures.
- A chart offers a table view of the same numbers.
- The ramp carries an *order* (caught, partly caught, missed), not unrelated categories.
  Three series at most; beyond that, split into small charts.

## Voice

- Plain sentences that say what happened and what it means: "56 alerts reached a person
  in the last hour, out of 699."
- The numbers that matter are `fg` and weight 600 inside an `fg-2` sentence.
- Sentence case everywhere. No exclamation marks. British spelling.
- Labels are nouns ("Confidence", "Escalated"); buttons are verbs ("Approve", "Reject").
- IDs are mono (`RUL-0435`). Dates are `28 Sept`. Durations are `14 min`, `1h 21m`.
  Big numbers have separators: `14,568`.

## Accessibility

- Anything pressable shows `outline: 2px solid focus-ring; outline-offset: 2px` on
  `:focus-visible` (`-2px` for rows inside a list). Fields show the ring and glow instead.
- `prefers-reduced-transparency` and `prefers-contrast: more` turn glass into solid `l4`;
  more contrast also lifts `fg-2`, `fg-3` and the line tokens.
- `prefers-reduced-motion` removes movement.
- Status is never colour alone: there is always a word, an icon or a shape change.
- Measured contrast in dark: `fg` on `l2` 16.3:1, `fg-2` on `l2` 7.5:1, `fg-3` on `l2`
  4.0:1 and on a card 3.8:1. See Known gaps.

## Do's and Don'ts

**Do**

- Use a token for every colour, including inside `rgba()` washes where one exists.
- Step up exactly one rung to lift, and use `tint` when you are already on a card.
- Draw edges as inset `box-shadow`, and dividers as a 1px `line` border.
- Give every primary action a single key and show it on the button.
- Keep one primary button per view.
- Put the important number in `fg` at 600; let everything around it go quiet.
- Animate only transform, opacity, filter and colour.

**Don't**

- Don't use colour for anything that is not a status. No blue links, no brand tint.
- Don't put a drop shadow on anything that sits on the page.
- Don't use pure black or pure white as a surface in dark.
- Don't make text brighter than `fg` for emphasis. Change the weight.
- Don't use weight 700, uppercase labels or letter-spaced caps.
- Don't blur the page behind a dialog.
- Don't animate the command palette, or anything opened from the keyboard.
- Don't add a radius, height or font size that is not in the scale.
- Don't add a chart library, and don't colour series decoratively.
- Don't use a solid red or green fill for a button or a card.

## Using this with Tailwind

`design-guides/imperial-ops-tailwind` is the same system as Tailwind v4 classes with no
component library. Its `src/index.css` carries these tokens under the same names, each
registered as a class (`bg-l3`, `text-fg-2`, `inset-ring-line`, `rounded-lg`, `shadow-pop`,
`ease-out`), plus the materials and type styles as one-word utilities (`surface-card`,
`surface-well`, `glass-bar`, `glass-menu`, `type-title`, `type-meta`). Its `src/components`
are short hand-written files: a base class string, a lookup table of variants, and
`className` for placement only. `<Button>` with no variant is the everyday grey button;
`variant="primary"` is the single main action. Behaviour for menus, popovers, tooltips and
dialogs comes from Base UI, the palette from `cmdk`, toasts from `sonner`, as in the product.

## Using this with shadcn

The port in `design-guides/imperial-ops-design-system` is shadcn's `base-nova` style on
Base UI, with all components installed and restyled. Its `src/index.css` is the theme.

| Imperial Ops token | shadcn variable | Tailwind class |
| --- | --- | --- |
| `l2` | `--background` | `bg-background` |
| `fg` | `--foreground`, `--card-foreground`, `--popover-foreground` | `text-foreground` |
| `l3` | `--card`, `--muted` | `bg-card`, `bg-muted` |
| `glass-menu` | `--popover` | `bg-popover` |
| `primary` / `primary-fg` | `--primary` / `--primary-foreground` | `bg-primary`, `text-primary-foreground` |
| `l4` | `--secondary` | `bg-secondary` |
| `fg-2` | `--muted-foreground` | `text-muted-foreground` |
| `tint-2` | `--accent` | `bg-accent` |
| `red` | `--destructive` | `text-destructive` |
| `line` | `--border` | `border-border` |
| `line-2` | `--input` | `border-input` |
| `focus-ring` | `--ring` | `outline-ring` |
| `l0` | `--sidebar` | `bg-sidebar` |
| tone ramp + green | `--chart-1` to `--chart-5` | `fill-chart-1` |

Every primitive is also a class under its own name (`bg-l4`, `text-fg-3`,
`inset-ring-line-2`, `shadow-pop`, `inset-shadow-edge`, `ease-out`), and the materials are
one-word utilities: `surface-card`, `surface-lead`, `surface-well`, `surface-raised`,
`glass-bar`, `glass-menu`, `glass-palette`, `glass-toast`, `surface-tip`,
`surface-dialog`. Type styles are `type-title`, `type-body`, `type-meta` and so on.

| Imperial Ops piece | shadcn component |
| --- | --- |
| Primary / everyday / ghost / danger button | `Button` `default` / `secondary` / `ghost` / `destructive` |
| Icon button | `Button variant="ghost" size="icon-sm"` |
| Key cap | `Kbd` |
| Badge with dot / neutral chip | `Badge variant="secondary"` / `variant="outline"` |
| Status pills | `Badge variant="success" \| "pending" \| "warning" \| "destructive"` |
| Bare tabs / segmented control | `Tabs` with `TabsList variant="line"` / default |
| Search box / text field | `InputGroup` / `Input`, `Textarea` |
| Card, stat card | `Card` |
| Callout | `Alert variant="destructive" \| "warning"` |
| Menu | `DropdownMenu` |
| Command palette | `CommandDialog` |
| Toast | `toast` from the `toast` component |
| Tooltip | `Tooltip` |
| Incident popup | `Dialog` |
| Sidebar | `Sidebar` |

## Checklist before you say it is done

- [ ] No raw hex or `rgb()` in component code; every colour is a token.
- [ ] No colour that is not a status. One primary button at most.
- [ ] Every radius, control height and font size is in the scale.
- [ ] No drop shadow on anything that is not floating.
- [ ] Hover, pressed, focus-visible, disabled and selected all exist and match the recipes.
- [ ] Hover rules sit inside `(hover: hover) and (pointer: fine)`.
- [ ] Numbers in columns are tabular and right-aligned.
- [ ] Works in dark and light, and with reduced motion and reduced transparency.
- [ ] The primary action has a key, and the key is visible.
- [ ] Nothing overflows the pane at 760px wide; long names truncate with an ellipsis.
- [ ] Copy is sentence case, plain, and says what the number means.

## Known gaps

Honest notes from auditing the shipped CSS. The scale above is the rule; these are where
the app has drifted from it. Match the scale, not the drift.

- **Font-size half steps.** The app uses 11.5px (22 times), 12.5px (20 times) and 13.5px
  (6 times) alongside 11, 12, 13 and 14. Treat them as the nearest whole step, except the
  code block's 12.5px, which is deliberate.
- **Radius 8px** appears 12 times (search box, palette items, the hold button) between
  `md` 7px and `lg` 9px. New work uses `lg`. 5px and 3px appear on a few chart marks.
- **Status alphas are written by hand.** `rgba(240, 86, 92, 0.35)` and friends repeat
  across files instead of deriving from `--red`. In CSS, prefer
  `color-mix(in srgb, var(--red) 35%, transparent)`; in Tailwind, `ring-red/35`.
- **The chart tones are not a categorical palette.** Checked for colour-vision
  deficiency, green against `tone-2` scores 7.5 (acceptable only with a second cue) and
  `tone-3` is 2.9:1 against the surface. That is why direct labels, a legend, 2px gaps and
  a table view are requirements, not polish.
- **Per-page chart tokens duplicate each other.** `--al-paged` and friends name the same
  greys as `tone-1` to `tone-4`, which are now tokens in `theme.css`. New charts use those.
- **Light-theme chips are raw `#ffffff`** in five component files. The port names it `chip`.
- **`fg-3` on dark surfaces is 4.0:1** (3.8:1 on a card), under the 4.5:1 that WCAG AA asks
  of small text. It is used for labels and meta, never for sentences; `prefers-contrast:
  more` lifts it to `#9a9a9a` (about 6.8:1). Do not use `fg-3` for anything a person must read to do their job.
- **`primary-hover` is the only hover with its own token.** Every other hover is a rung.
- **z-index is ad hoc** (1, 2, 5, 10, 50, 51, 100). The values in `elevation.z-index` are
  the ones in use; do not add new ones between them.
- **No form library, and one loading skeleton.** The incident page's waiting journey (see
  Motion) is the only shipped loading state. The port's `Field` and `Skeleton` are styled to
  fit, but nothing has checked the port's `Skeleton` against those bars.

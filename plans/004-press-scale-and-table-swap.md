# 004 — Firmer row press, and a crossfade between chart and table

- **Status**: DONE
- **Commit**: de3a3c2 (plus uncommitted working tree: `src/pages/outlook/` is not yet committed; the excerpts below are the code as of 23 Oct 2026)
- **Severity**: LOW (press scale) + missed opportunity (chart/table swap)
- **Category**: Cohesion & tokens; Missed opportunities
- **Estimated scope**: 4 files, ~40 lines

## Problem

**A. The row press is too small to feel.** The root-cause rows and the service rows shrink to 99% when pressed. That is imperceptible, and DESIGN.md sets wide controls at 0.98 ("press-scale: 0.97 # 0.95 for icon buttons, 0.98 for wide controls").

```css
/* src/pages/outlook/components/CauseList/CauseList.css:34-36 — current */
.ol-cause:active:not(.ol-cause-head) {
  transform: scale(0.99);
}
```

```css
/* src/pages/outlook/components/ServiceRisk/ServiceRisk.css:34-36 — current */
.ol-risk-row:active {
  transform: scale(0.99);
}
```

**B. Chart ↔ table teleports.** Four panels offer a table view of their chart (weekly tickets, tickets a week, where they'll land, causes ahead). The switch replaces the panel body and the button's icon with no bridge.

```tsx
/* src/pages/outlook/components/Panel/Panel.tsx:37-50 — current */
            <button
              className="mn-icon-btn ol-panel-toggle"
              aria-pressed={asTable}
              aria-label={asTable ? 'Show as chart' : 'Show as table'}
              title={asTable ? 'Show as chart' : 'Show as table'}
              onClick={() => setAsTable((on) => !on)}
            >
              {asTable ? <ChartColumn size={14} /> : <Table2 size={14} />}
            </button>
          )}
        </span>
      </header>
      <div className="ol-panel-body">{asTable ? <div className="ol-table-wrap">{table}</div> : children}</div>
```

It's used occasionally, by pointer. Purpose: preventing a jarring change. The swap must not replay the chart's entrance draw; plan 001 already ensures that by clearing `data-animate` once the entrance has played.

## Target

- **A.** `transform: scale(0.98)` on both `:active` rules. The existing `transition: … transform 160ms var(--ease-out)` stays.
- **B. Body.** After the reader toggles, and only then (not on first mount, which the panel's own entrance covers), the new view arrives via `@starting-style`: from `opacity: 0; filter: blur(2px)` with `transition: opacity 180ms var(--ease-out), filter 180ms var(--ease-out)`. The old view leaves instantly. The blur bridges the two states, so the eye reads one change, not two overlapping views.
- **B. Icon.** Both icons are rendered in the same grid cell. The one not in use sits at `opacity: 0; transform: scale(0.9)`. They cross over with `transition: opacity 150ms var(--ease-out), transform 150ms var(--ease-out)`.
- **Reduced motion:** body is opacity only, 150ms (no blur). Icon is opacity only, with no scale.

## Repo conventions to follow

- Arrivals use `@starting-style` (DESIGN.md Motion: "Arriving: `@starting-style { opacity: 0; transform: translateY(8px) scale(0.99); filter: blur(4px) }`"). Here there's no movement, just opacity and a 2px blur, because the panel doesn't move.
- State in data attributes (`data-swapped`), styled in the component's own CSS (`Panel.css`).
- Easing token `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` lives in `src/styles/base.css:4`.

## Steps

1. `src/pages/outlook/components/CauseList/CauseList.css`: in `.ol-cause:active:not(.ol-cause-head)`, change `scale(0.99)` to `scale(0.98)`.
2. `src/pages/outlook/components/ServiceRisk/ServiceRisk.css`: in `.ol-risk-row:active`, change `scale(0.99)` to `scale(0.98)`.
3. `src/pages/outlook/components/Panel/Panel.tsx`:
   - Below `const [asTable, setAsTable] = useState(false);` add:
     ```tsx
     // Set once the reader has switched views, so only their switches cross-fade, not the first mount.
     const [swapped, setSwapped] = useState(false);
     ```
   - Change the button's `onClick` to `onClick={() => { setSwapped(true); setAsTable((on) => !on); }}`.
   - Replace the icon expression `{asTable ? <ChartColumn size={14} /> : <Table2 size={14} />}` with both icons:
     ```tsx
     <ChartColumn size={14} className="ol-toggle-chart" aria-hidden />
     <Table2 size={14} className="ol-toggle-table" aria-hidden />
     ```
   - Replace the body line with:
     ```tsx
     <div className="ol-panel-body" data-swapped={swapped || undefined}>
       <div className="ol-panel-view" key={asTable ? 'table' : 'chart'}>
         {asTable ? <div className="ol-table-wrap">{table}</div> : children}
       </div>
     </div>
     ```
4. `src/pages/outlook/components/Panel/Panel.css`:
   - After the `.ol-panel-body { … }` rule, add:
     ```css
     /* Whichever view is showing fills the body, so a chart can still size itself to it. */
     .ol-panel-view {
       display: flex;
       flex-direction: column;
       flex: 1;
       min-height: 0;
     }

     /* After the reader switches between chart and table, the new view fades in through a
      * slight blur, so the swap reads as one change rather than two views overlapping. */
     .ol-panel-body[data-swapped] > .ol-panel-view {
       transition:
         opacity 180ms var(--ease-out),
         filter 180ms var(--ease-out);
     }

     @starting-style {
       .ol-panel-body[data-swapped] > .ol-panel-view {
         opacity: 0;
         filter: blur(2px);
       }
     }
     ```
   - After the `.ol-panel-toggle:focus-visible { … }` rule, add:
     ```css
     /* The two icons share one cell and cross over: the one not in use shrinks a little and fades. */
     .ol-panel-toggle svg {
       grid-area: 1 / 1;
       transition:
         opacity 150ms var(--ease-out),
         transform 150ms var(--ease-out);
     }

     .ol-panel-toggle[aria-pressed='false'] .ol-toggle-chart,
     .ol-panel-toggle[aria-pressed='true'] .ol-toggle-table {
       opacity: 0;
       transform: scale(0.9);
     }

     @media (prefers-reduced-motion: reduce) {
       .ol-panel-body[data-swapped] > .ol-panel-view {
         transition: opacity 150ms ease;
       }
       @starting-style {
         .ol-panel-body[data-swapped] > .ol-panel-view {
           filter: none;
         }
       }
       .ol-panel-toggle svg {
         transition: opacity 150ms ease;
       }
       .ol-panel-toggle[aria-pressed='false'] .ol-toggle-chart,
       .ol-panel-toggle[aria-pressed='true'] .ol-toggle-table {
         transform: none;
       }
     }
     ```

## Boundaries

- Do NOT change the panel's entrance (`.ol-panel` keyframes in `charts.css`) or any chart component.
- Do NOT change `.ol-table-wrap` styles.
- `.mn-icon-btn` is shared app-wide (`src/styles/ui.css`). Do NOT edit it; scope everything to `.ol-panel-toggle`.
- Requires plan 001. Without it, switching back to the chart replays its full draw. If `data-animate='swap'` does not appear in `src/pages/outlook/components/charts/charts.css`, STOP and report.
- If a step doesn't match the code you find (drift), STOP and report instead of improvising.

## Verification

- **Mechanical**: `./node_modules/.bin/tsc -b --pretty false` exits 0. `./node_modules/.bin/vite build --outDir /tmp/outlook-check --emptyOutDir` ends with `✓ built`.
- **Feel check** (`#/outlook`, then `#/outlook/forecast`):
  - Press and hold a root-cause row, then a service row: each visibly gives a little (98%), and both release smoothly.
  - Click the table icon on "Tickets, week by week": the table fades in through a slight blur in under a fifth of a second, the icon crosses from table to chart, and the panel keeps its size.
  - Click it again: the chart fades back in already drawn (no bars growing, no line wipe).
  - On first page load, the panel bodies do not fade separately from the panels' own entrance.
  - In DevTools → Animations at 10%: the body transition is 180ms on opacity and filter only, and the icon transition is 150ms on opacity and transform only.
  - With `prefers-reduced-motion: reduce` emulated: the switch is a plain 150ms fade, with no blur and no icon scale.
  - Spam-click the toggle: each click shows the right view, and nothing is left half-faded.
- **Done when**: every check above holds, in dark and light theme.

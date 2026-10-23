# 001 — Play the outlook's entrance once, and swap quickly after

- **Status**: DONE
- **Commit**: de3a3c2 (plus uncommitted working tree: `src/pages/outlook/` is not yet committed; the excerpts below are the code as of 23 Oct 2026)
- **Severity**: HIGH
- **Category**: Purpose & frequency
- **Estimated scope**: 2 files, ~40 lines

## Problem

The Hindcast & forecast page (`#/outlook`) draws itself in on arrival: panels rise in on a stagger, bars grow, lines are wiped in left to right, and the forecast line follows the history past today. That story is right for arriving. It is wrong for everything after, for two reasons.

**1. It replays on every pointer change.** Changing the view, service, lookback or horizon with the mouse remounts the grid with `data-animate` on, so the whole story plays again: about 1.48s on the forecast (the late wipe starts at 960ms and runs 520ms). People flick between 12w / 26w / 52w tens of times a day.

```tsx
/* src/pages/outlook/OutlookPage.tsx:59 — current */
  const [animate, setAnimate] = useState(true);
```

```tsx
/* src/pages/outlook/OutlookPage.tsx:84-89 — current */
  /** Change something the whole page shows. From the pointer it draws itself in; from a key it's instant. */
  const scope = (fn: () => void, pointer: boolean) => {
    setAnimate(pointer);
    fn();
  };
  const goView = (next: View, pointer: boolean) => next !== view && scope(() => setView(next), pointer);
```

```tsx
/* src/pages/outlook/OutlookPage.tsx:218 and :277 — current */
            <div className="ol-grid" data-view="hindcast" data-animate={animate || undefined} key={`h-${serviceId}-${weeks}`}>
            <div className="ol-grid" data-view="forecast" data-animate={animate || undefined} key={`f-${serviceId}-${weeks}-${horizon}`}>
```

**2. `data-animate` never turns off.** Any element that mounts later inside the grid picks up the entrance keyframes, even when a key caused the mount:
- J / K / Esc change the root cause → `PatternList` remounts its cards → every evidence square fades in again (`src/pages/outlook/components/PatternList/PatternList.tsx:28`, `className="ol-fade"`: 360ms plus 14ms per square). Keyboard actions must never animate.
- Switching a panel from table back to chart (`src/pages/outlook/components/Panel/Panel.tsx:50`) remounts the chart and replays its whole draw.

The entrance CSS, `src/pages/outlook/components/charts/charts.css:596-682` — current (abridged to the selectors; keep every value):

```css
[data-animate] .ol-panel,
[data-animate] .ol-kpi {
  animation: ol-arrive 220ms var(--ease-out) both;
  animation-delay: calc(var(--i, 0) * 40ms);
}
[data-animate] .ol-grow { animation: ol-grow-y 560ms var(--ease-out) both; animation-delay: calc(120ms + var(--i, 0) * 9ms); }
[data-animate] .ol-grow-x { animation: ol-grow-x 520ms var(--ease-out) both; animation-delay: calc(140ms + var(--i, 0) * 30ms); }
[data-animate] .ol-fade { animation: ol-fade 360ms var(--ease-out) both; animation-delay: calc(160ms + var(--i, 0) * 14ms); }
[data-animate] .ol-wipe { animation: ol-wipe 900ms var(--ease-in-out) both; animation-delay: 160ms; }
[data-animate] .ol-wipe[data-late] { animation-duration: 520ms; animation-delay: 960ms; }

@media (prefers-reduced-motion: reduce) {
  [data-animate] .ol-panel,
  [data-animate] .ol-kpi,
  [data-animate] .ol-grow,
  [data-animate] .ol-grow-x,
  [data-animate] .ol-fade,
  [data-animate] .ol-wipe {
    animation: ol-fade 150ms ease both;
    animation-delay: 0ms;
  }
}
```

## Target

Three motion states for the grid, held in one piece of state:

| State | When | What plays |
| --- | --- | --- |
| `'story'` | The page first mounts | The full entrance, exactly as today |
| `'swap'` | A pointer change of view, service, lookback or horizon (including the "In the forecast →" / "← PAT-xx" hand-offs and clicking a service row) | Panels and stat cards fade in over **180ms**, `var(--ease-out)`, from `opacity: 0; filter: blur(2px)`. No stagger, no bar growth, no line wipes. |
| `null` | A key press, a ⌘K command, and **after either of the above has finished** | Nothing |

The attribute is one-shot: it is removed when its motion has finished (1600ms after `'story'`, 400ms after `'swap'`), so anything that mounts later inside the grid never animates.

The longest story animation ends at 1480ms (the late wipe: 960ms delay + 520ms), so removing the attribute at 1600ms never cuts a running animation. Every animation uses `fill-mode: both`, so removing it leaves each element at its end state.

## Repo conventions to follow

- Easing tokens already exist in `src/styles/base.css:4-6`: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1);`, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);`. Use them; add none.
- State in data attributes, styled by attribute value: e.g. `.ol-pill[data-tone='warn']` in `src/pages/outlook/OutlookPage.css`.
- DESIGN.md: "Keyboard-opened things appear instantly; pointer-opened things animate." and "Reduced motion: movement is removed, a short opacity fade may stay."

## Steps

1. **`src/pages/outlook/OutlookPage.tsx`**: replace the `animate` state (line 59, with its comment on line 58) with:
   ```tsx
   // How the next grid arrives: the full story on first arrival, a quick swap after a pointer
   // change, nothing after a key. One-shot: it's cleared once its motion has played.
   const [motion, setMotion] = useState<'story' | 'swap' | null>('story');
   ```
2. **Same file**: replace the `scope` function (lines 84-88) with:
   ```tsx
   /** Change something the whole page shows. From the pointer it swaps in quickly; from a key it's instant. */
   const scope = (fn: () => void, pointer: boolean) => {
     setMotion(pointer ? 'swap' : null);
     fn();
   };
   ```
   Leave `goView` (line 89) as it is.
3. **Same file**: directly after the `hc` / `fc` `useMemo` lines (around line 65), add the grid key and the one-shot clear:
   ```tsx
   const gridKey = view === 'hindcast' ? `h-${serviceId}-${weeks}` : `f-${serviceId}-${weeks}-${horizon}`;

   // Let go of the motion once it has played, so nothing that mounts later animates.
   useEffect(() => {
     if (!motion) return;
     const t = setTimeout(() => setMotion(null), motion === 'story' ? 1600 : 400);
     return () => clearTimeout(t);
   }, [gridKey, motion]);
   ```
4. **Same file**: on both grid divs (lines 218 and 277), replace `data-animate={animate || undefined}` with `data-animate={motion ?? undefined}` and the `key={…}` expression with `key={gridKey}`.
5. **Same file**: confirm nothing else references `animate` / `setAnimate` (run `grep -n "setAnimate\|\banimate\b" src/pages/outlook/OutlookPage.tsx`; expect no output).
6. **`src/pages/outlook/components/charts/charts.css`**: in the entrance block (lines 596-682):
   - Change every selector that starts `[data-animate] ` to start `[data-animate='story'] ` (six rules: `.ol-panel, .ol-kpi`, `.ol-grow`, `.ol-grow-x`, `.ol-fade`, `.ol-wipe`, `.ol-wipe[data-late]`). Keep every value unchanged.
   - After the `.ol-wipe[data-late]` rule, add:
     ```css
     /* After a pointer change: the new figures fade in, quickly and all at once. */
     [data-animate='swap'] .ol-panel,
     [data-animate='swap'] .ol-kpi {
       animation: ol-swap 180ms var(--ease-out) both;
     }
     ```
   - After `@keyframes ol-fade { … }`, add:
     ```css
     @keyframes ol-swap {
       from {
         opacity: 0;
         filter: blur(2px);
       }
     }
     ```
   - In the `@media (prefers-reduced-motion: reduce)` block, change the selector list to cover both states, keeping the body (`animation: ol-fade 150ms ease both; animation-delay: 0ms;`):
     ```css
     [data-animate] .ol-panel,
     [data-animate] .ol-kpi,
     [data-animate='story'] .ol-grow,
     [data-animate='story'] .ol-grow-x,
     [data-animate='story'] .ol-fade,
     [data-animate='story'] .ol-wipe {
     ```
   - Rewrite the block's header comment (lines 596-602) to say: the full story plays only when the page first arrives; a pointer change of view or scope swaps the panels in over 180ms; a key press, ⌘K, and anything that mounts after the motion has played show at once.

## Boundaries

- Do NOT change any duration, delay, easing or keyframe of the story itself.
- Do NOT touch `TopBar.css`, `OutlookPage.css`, `Panel.tsx` or any other file. Plans 002–004 cover those.
- Do NOT add dependencies. Do NOT change markup beyond the attribute and key on the two grid divs.
- If a step doesn't match the code you find (drift), STOP and report instead of improvising.

## Verification

- **Mechanical**: from the repo root, `./node_modules/.bin/tsc -b --pretty false` exits 0. `./node_modules/.bin/vite build --outDir /tmp/outlook-check --emptyOutDir` ends with `✓ built`.
- **Feel check** (`./node_modules/.bin/vite`, open `#/outlook`):
  - Load the page: the full story plays (panels rise in on a stagger, bars grow, lines draw, then the forecast extends past "Today" on the Forecast view).
  - Click **26w → 12w**: the panels fade in once, in well under half a second, with no bars growing and no lines drawing.
  - Click the **Forecast** tab: the same quick swap, not the story.
  - Press **H** and **F**: the view changes instantly, with no fade.
  - On the Hindcast, press **J** repeatedly: the "What repeats" cards change with no fade on the evidence squares.
  - Toggle the weekly chart to table and back: the chart reappears already drawn.
  - In DevTools → Animations, set playback to 10% and click 26w → 52w: only `ol-swap` runs, on the panels and stat cards. Check in the Elements panel that `data-animate` disappears from `.ol-grid` about 0.4s later.
  - DevTools → Rendering → emulate `prefers-reduced-motion: reduce`: the arrival and the swap are both a 150ms opacity fade, with no blur, scale or movement.
- **Done when**: every check above holds. `grep -n "data-animate\] " src/pages/outlook/components/charts/charts.css` only matches the two reduced-motion lines for `.ol-panel` and `.ol-kpi`.

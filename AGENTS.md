# Imperial Ops

Read [DESIGN.md](DESIGN.md) before building or changing any UI here. It is the contract for
how this product looks and behaves, and it ends with a checklist to run before you say a
piece of work is done.

- Plain CSS: classes prefixed `mn-`, state in data attributes, colours only from the tokens
  in `src/styles/theme.css`. No Tailwind in the app.
- Each page is self-contained under `src/pages/<page>/`.
- `design-system/` is the same system as Tailwind v4 and hand-written components, with a
  lesson beside every idea. It's its own package (`npm install` there) and the app never
  imports it. When a change touches `DESIGN.md` or `theme.css`, bring `design-system/` along
  in the same commit: `npm run sync:design` there, and mirror any token in its `src/index.css`.

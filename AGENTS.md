# Imperial Ops

Read [DESIGN.md](DESIGN.md) before building or changing any UI here. It is the contract for
how this product looks and behaves, and it ends with a checklist to run before you say a
piece of work is done.

- Plain CSS: classes prefixed `mn-`, state in data attributes, colours only from the tokens
  in `src/styles/theme.css`. No Tailwind in this repo.
- Each page is self-contained under `src/pages/<page>/`.
- The same system as Tailwind + shadcn, with a lesson beside every idea, lives in
  `../../design-guides/imperial-ops-design-system`.

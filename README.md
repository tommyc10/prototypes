# Imperial Ops

An operations dashboard exploration with rule governance, historical replay (Hindcast), shared navigation, light/dark themes and guided tours.

```sh
npm install
npm run dev      # http://localhost:5188
npm run build
```

Open `/#/rules` or `/#/hindcast`. The source lives in `src/`; guided tours live in `tours/`. The Rules page keeps its domain-specific `src/pages/rule-management/` name.

The project was previously called `rule-management`. Its original Git history and existing uncommitted changes are retained. Its standalone stories now live in [../../scroll-demos](../../scroll-demos/README.md), with their own extracted Git history. Their earlier history also remains available here through `git log --all -- stories/`.

The [style cheat sheet](../../design-guides/style-cheatsheet.html) and its [promo film](../../design-guides/cheatsheet-film/README.md) live alongside the other design learning material. Shared agent skills are inherited from `ui-ux-inspiration/.agents` and `.claude`; the scroll-story skill is maintained in `Developer/skills/scroll-story`.

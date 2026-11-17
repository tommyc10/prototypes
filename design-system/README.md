# Imperial Ops design system, Tailwind edition

The look and behaviour of [Imperial Ops](..) as Tailwind v4
classes and hand-written React components. No component library.

| Part | What it is | Where |
| --- | --- | --- |
| The contract | Every token and rule, in one file an agent can read | [`DESIGN.md`](DESIGN.md) (a copy of [`../DESIGN.md`](../DESIGN.md)) |
| The theme | Tokens, scales and recipes, in the order a system is built | [`src/index.css`](src/index.css) |
| The components | Seventeen short files, each a base class string plus a lookup table of variants | [`src/components`](src/components) |
| The lessons | A 19-section page: every idea live, with a note on how to do it yourself | [`src/showcase`](src/showcase) |

## Look at it

```sh
npm install
npm run dev          # http://localhost:5191
```

Or run `npm run build:file` for the whole page as one HTML file that opens without a server.
It lands in `dist-single/index.html`, which Git ignores: share it, don't commit it.

## Copy it into another app

The other app needs React and Tailwind v4.

1. Copy `src/index.css`, `src/components/` and `src/lib/utils.ts`.
2. `npm install @base-ui/react cmdk sonner lucide-react @fontsource-variable/geist @fontsource-variable/geist-mono`
3. Point an `@/` alias at `src` (in `vite.config.ts` and `tsconfig`), or change the imports to
   relative paths.
4. Put `class="dark"` on `<html>` (leave it off for the light theme), import `index.css` once,
   and render `<Toaster />` and `<TooltipProvider>` at the root, as `src/App.tsx` does.
5. Copy `DESIGN.md` to the new repo's root for agents.

You can take only the components you use. `index.css` is the part that carries the look.

## What depends on what

| Library | Used by | Why |
| --- | --- | --- |
| `@base-ui/react` | `overlays.tsx` | Positioning, focus and keyboard handling for menus, popovers, tooltips and dialogs. It has no styles of its own. |
| `cmdk` | `command-palette.tsx` | Search and arrow keys in the palette |
| `sonner` | `toast.tsx` | When a toast appears and leaves |
| `lucide-react` | Icons | |

Everything else (button, badge, tabs, fields, cards, table, list row, stat card, status dot,
hold-to-confirm, charts, skeleton, sidebar pieces) is plain React and Tailwind classes.

## One rule about `className`

Components accept `className` for placing them (width, margin, flex). It is not for restyling:
two Tailwind classes that set the same property do not reliably override each other. If you
want a different look, add a variant to the component's lookup table.

## Keeping it in step with the app

The app is the source of truth. When a change there touches `DESIGN.md` or
`src/styles/theme.css`, the same change lands here in the same commit:

- `npm run sync:design` copies `../DESIGN.md` over this folder's copy.
- A new or changed token goes into `src/index.css` twice (light and dark), plus a
  `--color-NAME` line in `@theme inline` if it should become a class.
- A new pattern gets a component or recipe here, and an entry in the showcase.

Known gap: the "In plain CSS" sections (`src/showcase/product-css`) quote the app's CSS as it
was in October 2026, including the old Hindcast's `hc-` classes. The lessons hold, but the
class names and some values no longer match `src/`.

The same system ported onto shadcn, with every shadcn component themed, is outside this repo
in `~/Developer/ui-ux-inspiration/design-guides/imperial-ops-design-system`.

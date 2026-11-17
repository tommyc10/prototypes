/* Glass, taken apart: four sliders for the four numbers that make it, and the CSS and
 * Tailwind they come to. The tint's colour follows the theme, read from the --glass token. */
import * as React from "react"
import { TriangleAlertIcon } from "lucide-react"

import { Button } from "@/components/button"
import { Callout } from "@/components/card"
import { Code } from "./doc"
import { useToken } from "./swatch"

type Glass = { tint: number; blur: number; saturate: number; edge: number }

const PRESETS: [string, Glass][] = [
  ["Action bar", { tint: 0.78, blur: 20, saturate: 1.2, edge: 0.07 }],
  ["Menu", { tint: 0.86, blur: 16, saturate: 1.2, edge: 0.07 }],
  ["Palette", { tint: 0.6, blur: 40, saturate: 1.8, edge: 0.07 }],
  ["Toast", { tint: 0.88, blur: 20, saturate: 1, edge: 0.07 }],
]

const SLIDERS: { key: keyof Glass; label: string; min: number; max: number; step: number; unit?: string }[] = [
  { key: "tint", label: "Tint opacity", min: 0, max: 1, step: 0.01 },
  { key: "blur", label: "Blur", min: 0, max: 60, step: 1, unit: "px" },
  { key: "saturate", label: "Saturation", min: 0.5, max: 2.5, step: 0.1 },
  { key: "edge", label: "Top edge", min: 0, max: 0.4, step: 0.01 },
]

const BEHIND = [
  "bg-[linear-gradient(90deg,var(--green),var(--amber))]",
  "bg-l4 inset-ring inset-ring-line",
  "bg-[linear-gradient(90deg,var(--orange),var(--red))]",
  "bg-fg",
  "bg-l4 inset-ring inset-ring-line",
  "bg-[linear-gradient(90deg,#5b8def,#b072f0)]",
]

export function GlassPlayground() {
  const ref = React.useRef<HTMLDivElement>(null)
  const [glass, setGlass] = React.useState(PRESETS[0][1])
  const { tint, blur, saturate, edge } = glass
  // "rgba(24, 24, 24, 0.78)" -> "24, 24, 24": the theme's glass colour without its opacity.
  const rgb = useToken("glass", ref).match(/\d+/g)?.slice(0, 3).join(", ") ?? "24, 24, 24"
  const filter = `blur(${blur}px) saturate(${saturate})`

  const css = `.my-glass {
  /* where it sits: pinned inside a position: relative parent */
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 24px;
  padding: 10px 10px 10px 18px;
  border-radius: 14px;

  /* 1. see-through tint */
  background: rgba(${rgb}, ${tint});

  /* 2 + 3. blur what is behind, keep its colour alive */
  -webkit-backdrop-filter: ${filter};
  backdrop-filter: ${filter};

  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, ${edge}), /* 4. lit top edge */
    0 0 0 1px var(--line-2),                 /*    outer ring */
    var(--shadow-float);                     /* 5. soft drop shadow */
}`
  const tailwind = `absolute inset-x-6 bottom-6 rounded-3xl py-2.5 pr-2.5 pl-4.5 bg-[rgba(${rgb.replaceAll(" ", "")},${tint})] inset-shadow-[0_1px_0_rgba(255,255,255,${edge})] ring-1 ring-line-2 shadow-float backdrop-blur-[${blur}px] backdrop-saturate-[${saturate}]`

  return (
    <div ref={ref} className="grid items-start gap-3.5 *:min-w-0 xl:grid-cols-2">
      <div className="flex flex-col gap-2.5">
        <div className="relative overflow-hidden rounded-3xl bg-l2 inset-ring inset-ring-line">
          <div className="h-[360px] overflow-y-auto px-5 pt-5 pb-30 [scrollbar-width:none]">
            <h4 className="mb-2.5 text-xl font-semibold tracking-[-0.02em]">Scroll me under the bar</h4>
            <p className="type-body mb-3.5 max-w-[68ch]">
              Glass only looks like glass when something sits behind it. On a flat surface it is just a grey box.
            </p>
            <Callout tone="danger" icon={<TriangleAlertIcon />} title="3 real incidents would have been hidden" />
            {BEHIND.map((fill, i) => (
              <div key={i} className={`mt-2.5 h-16 rounded-2xl ${fill}`} />
            ))}
          </div>
          <div
            className="absolute inset-x-4 bottom-4 flex items-center gap-2 rounded-3xl py-2.5 pr-2.5 pl-4.5"
            style={{
              background: `rgba(${rgb}, ${tint})`,
              backdropFilter: filter,
              WebkitBackdropFilter: filter,
              boxShadow: `inset 0 1px 0 rgba(255, 255, 255, ${edge}), 0 0 0 1px var(--line-2), var(--shadow-float)`,
            }}
          >
            <span className="flex-1 text-sm font-medium text-fg-2">Proposed 2 days ago</span>
            <Button variant="danger">Reject</Button>
            <Button variant="primary">Approve</Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-l1 inset-ring inset-ring-line">
          <div className="flex h-8.5 items-center gap-1 border-b pr-1.5 pl-3.5 text-xs text-fg-3">
            <span className="flex-1 truncate"><b className="font-medium text-fg-2">Presets</b> from the app</span>
            {PRESETS.map(([name, preset]) => (
              <button
                key={name}
                className="flex h-6 items-center rounded-sm px-2 text-xs font-medium text-fg-2 transition-colors duration-150 hover:bg-l4 hover:text-fg"
                onClick={() => setGlass(preset)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="grid gap-3 p-4">
            {SLIDERS.map(({ key, label, unit = "", ...range }) => (
              <label key={key} className="grid grid-cols-[110px_minmax(0,1fr)_48px] items-center gap-3 text-sm text-fg-2">
                {label}
                <input
                  type="range"
                  className="w-full accent-fg"
                  {...range}
                  value={glass[key]}
                  onChange={(e) => setGlass({ ...glass, [key]: Number(e.target.value) })}
                />
                <output className="text-right font-mono text-xs font-medium text-fg">{glass[key]}{unit}</output>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <Code title={<><b>CSS</b> from the sliders</>} code={css} />
        <Code title={<><b>Tailwind</b> from the sliders</>} code={tailwind} wrap />
      </div>
    </div>
  )
}

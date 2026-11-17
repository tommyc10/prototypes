/* Charts without a chart library: bars are divs, sized with flex and percentages.
 * One grey ramp; at most one series takes a status colour. */
import { cn } from "@/lib/utils"

/** Weekly bars: the past is quiet, the current week is the text colour. */
export function WeeklyBars({
  values,
  from,
  to = "This week",
  className,
}: {
  values: number[]
  from: string
  to?: string
  className?: string
}) {
  const max = Math.max(...values, 1)
  return (
    <figure className={cn("m-0", className)}>
      <div className="flex h-[72px] items-end gap-[6%] border-b border-line-3 px-[2.5%]">
        {values.map((value, i) => (
          <div
            key={i}
            title={`${value}`}
            className={cn(
              "flex-1 rounded-t-[2px] transition-colors duration-150",
              i === values.length - 1 ? "bg-fg" : "bg-tone-4 hover:bg-tone-3"
            )}
            style={{ height: `${Math.max((value / max) * 100, 2)}%` }}
          />
        ))}
      </div>
      <figcaption className="mt-2 flex justify-between text-[11px] text-fg-3">
        <span>{from}</span>
        <span>{to}</span>
      </figcaption>
    </figure>
  )
}

export type Part = { label: string; value: number; tone: "green" | "tone-2" | "tone-3" | "tone-1" }

const FILL: Record<Part["tone"], string> = {
  green: "bg-green",
  "tone-1": "bg-tone-1",
  "tone-2": "bg-tone-2",
  "tone-3": "bg-tone-3",
}

/** One bar split into parts, with the numbers written under it: no legend to decode. */
export function SplitBar({ parts, className }: { parts: Part[]; className?: string }) {
  const total = parts.reduce((sum, part) => sum + part.value, 0)
  return (
    <div className={cn("surface-card p-4", className)}>
      <div className="flex h-4 gap-0.5 overflow-hidden rounded-xs">
        {parts.map((part) => (
          <div key={part.label} className={FILL[part.tone]} style={{ flex: part.value }} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {parts.map((part) => (
          <div key={part.label} className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-fg-2">
              <span className={cn("size-2 shrink-0 rounded-[2px]", FILL[part.tone])} />
              <span className="truncate">{part.label}</span>
            </div>
            <div className="type-stat-sm mt-1 tabular-nums">
              {part.value.toLocaleString("en-GB")}
            </div>
            <div className="mt-1 text-xs text-fg-3">{Math.round((part.value / total) * 100)}% of cancelled</div>
          </div>
        ))}
      </div>
    </div>
  )
}

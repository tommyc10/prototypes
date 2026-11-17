/* Numbers. A stat card is a label (small, quiet) over a value (big, tight), optionally
 * with a meter. A metric well is the sunken strip of numbers. */
import * as React from "react"

import { cn } from "@/lib/utils"

type Tone = "default" | "warn" | "bad"

export function StatCard({
  label,
  value,
  foot,
  meter,
  tone = "default",
  size = "default",
  className,
}: {
  label: string
  value: React.ReactNode
  foot?: React.ReactNode
  /** 0 to 1. Draws the 4px meter under the value. */
  meter?: number
  tone?: Tone
  /** `sm` (20px) when a lead sentence above already gives the answer, so it stays the headline. */
  size?: "default" | "sm"
  className?: string
}) {
  return (
    <div data-slot="stat-card" className={cn("surface-card min-w-0 px-4 py-3.5", className)}>
      <div className="text-xs font-medium text-fg-3">{label}</div>
      <div
        className={cn(
          size === "sm" ? "type-stat-sm mt-1" : "type-stat mt-1",
          // When a number is a problem, only the number changes colour.
          tone === "warn" && "text-orange",
          tone === "bad" && "text-red"
        )}
      >
        {value}
      </div>
      {meter !== undefined && <Meter value={meter} tone={tone} className="mt-2.5" />}
      {foot && <div className="mt-2 text-xs text-fg-3">{foot}</div>}
    </div>
  )
}

/** A 4px track. The fill is scaled with a transform, not resized, so it animates cheaply. */
export function Meter({ value, tone = "default", className }: { value: number; tone?: Tone; className?: string }) {
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className={cn("relative h-1 overflow-hidden rounded-xs bg-tint-2", className)}
    >
      <span
        className={cn(
          "absolute inset-0 origin-left rounded-xs bg-fg transition-transform duration-500 ease-out",
          tone === "warn" && "bg-orange",
          tone === "bad" && "bg-red"
        )}
        style={{ transform: `scaleX(${value})` }}
      />
    </div>
  )
}

export function MetricWell({
  items,
  className,
}: {
  items: { value: React.ReactNode; label: string; bad?: boolean }[]
  className?: string
}) {
  return (
    <div data-slot="metric-well" className={cn("surface-well flex min-h-10 divide-x divide-line", className)}>
      {items.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col justify-center px-3.5 py-1">
          <b className={cn("text-[15px] leading-tight font-semibold tabular-nums", item.bad && "text-red")}>
            {item.value}
          </b>
          <span className="text-[11px] text-fg-3">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

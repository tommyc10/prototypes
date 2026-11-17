/* Tabs, in two looks.
 *   bare       a plain row, for filtering a list. A count sits beside each label.
 *   segmented  the same tabs in a sunken track, for choosing a mode (a time range, a view).
 * Either way the chosen tab is a raised chip: one rung up, with a hairline.
 * Left and right arrows move between tabs, as a tab list should. */
import * as React from "react"

import { cn } from "@/lib/utils"

export type TabItem<T extends string> = { value: T; label: React.ReactNode; count?: number; disabled?: boolean }

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  variant = "bare",
  label,
  className,
}: {
  value: T
  onChange: (value: T) => void
  items: TabItem<T>[]
  variant?: "bare" | "segmented"
  /** What the tabs choose between, for screen readers. */
  label: string
  className?: string
}) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
    const enabled = items.filter((item) => !item.disabled)
    const at = enabled.findIndex((item) => item.value === value)
    const next = enabled[(at + (e.key === "ArrowRight" ? 1 : -1) + enabled.length) % enabled.length]
    onChange(next.value)
    e.preventDefault()
    ;(e.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null)?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex w-fit items-center gap-0.5",
        variant === "segmented" && "rounded-lg bg-well-2 p-0.5 inset-ring inset-ring-line",
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-value={item.value}
            data-active={active || undefined}
            disabled={item.disabled}
            // Only the chosen tab is in the tab order; arrows reach the others.
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md px-[9px] text-sm font-medium whitespace-nowrap text-fg-3 outline-none transition-colors duration-150",
              "hover:text-fg-2 disabled:pointer-events-none disabled:opacity-40",
              "data-active:bg-chip data-active:text-fg data-active:shadow-chip data-active:inset-ring data-active:inset-ring-line data-active:hover:text-fg"
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={cn("text-xs font-normal tabular-nums", active ? "text-fg-2" : "text-fg-3")}>{item.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

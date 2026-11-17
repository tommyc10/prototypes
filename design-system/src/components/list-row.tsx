/* One row of the list pane: a status dot, a name over an ID and meta line, and a number
 * at the right end. Hover is one rung up; selected is raised with a hairline. */
import * as React from "react"
import { TriangleAlertIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Kbd } from "./kbd"
import { StatusDot, type Status } from "./status-dot"

export function ListRow({
  status,
  name,
  id,
  meta,
  value,
  sub,
  warn,
  selected,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "name" | "value"> & {
  status: Status
  name: string
  id: string
  meta: string
  value: string
  sub: string
  /** The value is a problem: it turns orange and gains an icon. */
  warn?: boolean
  selected?: boolean
}) {
  return (
    <button
      data-slot="list-row"
      data-selected={selected || undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg py-2.5 pr-2.5 pl-3 text-left outline-none transition-colors duration-[120ms]",
        "hover:not-data-selected:bg-l3 data-selected:bg-chip data-selected:shadow-chip data-selected:inset-ring data-selected:inset-ring-line",
        "focus-visible:outline-offset-[-2px]!",
        className
      )}
      {...props}
    >
      <StatusDot status={status} />
      <span className="min-w-0 flex-1">
        {/* An unselected name is a shade under fg, so the selected row reads brightest without colour. */}
        <span className={cn("block truncate text-base font-medium", selected ? "text-fg" : "text-row-name")}>
          {name}
        </span>
        <span className="mt-px flex gap-2 overflow-hidden text-xs whitespace-nowrap text-fg-3">
          <span className="font-mono text-[11px]">{id}</span>
          {meta}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end text-xs tabular-nums">
        <span className={cn("flex items-center gap-1 text-sm font-medium", warn ? "text-orange" : "text-fg-2")}>
          {warn && <TriangleAlertIcon className="size-3" />}
          {value}
        </span>
        <span className="text-fg-3">{sub}</span>
      </span>
    </button>
  )
}

/** The footer of a list: the keys that work on this page. A shortcut that is not shown does not exist. */
export function KeyHints({ hints, className }: { hints: { keys: string[]; label: string }[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-x-4 gap-y-1.5 border-t px-4 pt-2.5 pb-3 text-xs text-fg-3", className)}>
      {hints.map((hint) => (
        <span key={hint.label} className="inline-flex items-center gap-[3px]">
          {hint.keys.map((key) => (
            <Kbd key={key}>{key}</Kbd>
          ))}
          <span className="ml-[3px]">{hint.label}</span>
        </span>
      ))}
    </div>
  )
}

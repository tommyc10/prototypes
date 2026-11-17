/* A table: quiet header, hairline rows, numbers right-aligned in tabular figures.
 * It wraps itself in a card so it has an edge, and scrolls sideways when it must. */
import * as React from "react"

import { cn } from "@/lib/utils"

export type Column<Row> = {
  head: string
  cell: (row: Row) => React.ReactNode
  /** Numbers and dates go right. */
  align?: "left" | "right"
  className?: string
}

export function Table<Row>({ columns, rows, rowKey, caption, className }: {
  columns: Column<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  caption: string
  className?: string
}) {
  return (
    <div className={cn("surface-card w-full overflow-x-auto px-1 pt-1 pb-0.5", className)}>
      <table className="w-full border-collapse text-sm tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.head} className={cn("px-3 py-2 text-xs font-normal whitespace-nowrap text-fg-3", col.align === "right" ? "text-right" : "text-left")}>
                {col.head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-t transition-colors duration-[120ms] hover:bg-tint">
              {columns.map((col) => (
                <td key={col.head} className={cn("px-3 py-2 whitespace-nowrap text-fg-2", col.align === "right" && "text-right", col.className)}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

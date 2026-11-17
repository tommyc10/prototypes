/* A key cap: 18px tall, in the interface font (not mono), so it reads as the label on a
 * key. Inside a primary or danger button it recolours itself to suit. */
import * as React from "react"

import { cn } from "@/lib/utils"

export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-[18px] min-w-[18px] items-center justify-center gap-px rounded-xs bg-tint px-1 font-sans text-[11px] font-medium text-fg-2 inset-ring inset-ring-line select-none",
        "group-data-[variant=primary]/button:bg-primary-kbd group-data-[variant=primary]/button:text-primary-kbd-fg group-data-[variant=primary]/button:inset-ring-primary-kbd-line",
        "group-data-[variant=danger]/button:bg-red/12 group-data-[variant=danger]/button:text-danger-fg group-data-[variant=danger]/button:inset-ring-transparent",
        className
      )}
      {...props}
    />
  )
}

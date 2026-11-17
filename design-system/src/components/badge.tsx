/* Badges, status pills and chips: three sizes of pill.
 *   neutral   24px  card-coloured, carries a small status dot and a word
 *   status    22px  the colour at ~10% as fill, ~22% as ring, 100% as text
 *   chip      20px  the quietest label
 * Always a word or icon with the colour, never colour alone. */
import * as React from "react"

import { cn } from "@/lib/utils"

const VARIANT = {
  neutral: "h-6 gap-[7px] bg-l3 pr-2.5 pl-[9px] text-xs text-fg inset-ring inset-ring-line",
  chip: "h-5 px-[7px] text-[11px] tracking-[0.01em] bg-tint text-fg-2 inset-ring inset-ring-line",
  success: "h-5.5 px-2 text-xs bg-green/10 text-green inset-ring inset-ring-green/22",
  pending: "h-5.5 px-2 text-xs bg-amber/10 text-amber inset-ring inset-ring-amber/24",
  warning: "h-5.5 px-2 text-xs bg-orange-wash text-orange inset-ring inset-ring-orange/20",
  danger: "h-5.5 px-2 text-xs bg-red-wash text-danger-fg inset-ring inset-ring-red/24",
} as const

export function Badge({
  variant = "neutral",
  className,
  ...props
}: React.ComponentProps<"span"> & { variant?: keyof typeof VARIANT }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 overflow-hidden rounded-4xl font-medium whitespace-nowrap [&>svg]:size-3",
        VARIANT[variant],
        className
      )}
      {...props}
    />
  )
}

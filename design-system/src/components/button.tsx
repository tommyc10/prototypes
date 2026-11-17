/* Buttons. One shape (34px tall, 9px corners, 13px medium text), one behaviour (shrink to
 * 97% when pressed), four levels of loudness.
 *
 * How it is put together: BASE is what every button gets. VARIANT and SIZE are plain
 * lookup tables, one string of classes per option. The component just joins three strings. */
import * as React from "react"

import { cn } from "@/lib/utils"

const BASE =
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-medium whitespace-nowrap outline-none select-none " +
  // the transition names only what changes; pressing scales, hovering recolours
  "transition-[scale,background-color,color,opacity] duration-150 ease-out active:scale-[0.97] " +
  "disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-3.5"

const VARIANT = {
  // The everyday button: raised grey with an inset ring, one rung up on hover.
  default: "bg-l4 text-fg inset-ring inset-ring-line-2 hover:bg-l5 aria-expanded:bg-l5",
  // The one white thing on screen. At most one per view.
  primary: "bg-primary text-primary-fg hover:bg-primary-hover",
  // Danger is a red wash with a red ring, never a solid red block.
  danger: "bg-red-wash text-danger-fg inset-ring inset-ring-red/35 hover:bg-red/14",
  // Nothing until hovered: cancel, toolbar icons.
  ghost: "text-fg-2 hover:bg-l3 hover:text-fg aria-expanded:bg-l4 aria-expanded:text-fg",
  // Quiet text that brightens: "View all 11".
  link: "h-auto! px-0! text-xs text-fg-2 hover:text-fg active:scale-100",
} as const

const SIZE = {
  default: "h-8.5 gap-2 px-3.5 has-[kbd]:pr-2.5", // 34px
  sm: "h-7 gap-1.5 rounded-md px-2.5", // 28px
  xs: "h-6 gap-1 rounded-md px-2 text-xs [&_svg]:size-3", // 24px
  lg: "h-9.5 gap-2 px-4", // 38px
  // The 28px square icon button. Give it an aria-label.
  icon: "size-7 rounded-md active:scale-95 [&_svg]:size-[15px]",
} as const

export type ButtonProps = React.ComponentProps<"button"> & {
  variant?: keyof typeof VARIANT
  size?: keyof typeof SIZE
}

export function Button({ variant = "default", size = "default", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      data-variant={variant}
      className={cn(BASE, VARIANT[variant], SIZE[size], className)}
      {...props}
    />
  )
}

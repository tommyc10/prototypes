/* Status in the smallest possible space: an 8px dot with a soft halo.
 * Inactive is a hollow ring, so the three states differ in shape as well as colour. */
import { cn } from "@/lib/utils"

export type Status = "active" | "proposed" | "warning" | "danger" | "inactive"

const TONE: Record<Status, string> = {
  active: "bg-green ring-[3px] ring-green/14",
  proposed: "bg-amber ring-[3px] ring-amber/14",
  warning: "bg-orange ring-[3px] ring-orange/14",
  danger: "bg-red ring-[3px] ring-red/14",
  inactive: "inset-ring-[1.5px] inset-ring-fg-3",
}

export function StatusDot({
  status,
  size = "default",
  className,
}: {
  status: Status
  /** `sm` is the 6px dot that goes inside a Badge: no halo. */
  size?: "default" | "sm"
  className?: string
}) {
  return (
    <span
      data-slot="status-dot"
      data-status={status}
      className={cn(
        "shrink-0 rounded-full",
        size === "sm" ? "size-1.5 ring-0!" : "size-2",
        TONE[status],
        className
      )}
    />
  )
}

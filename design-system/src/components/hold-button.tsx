/* Hold to confirm. For the rare action that overrides a safety check.
 *
 * The orange fill is a solid copy of the button, clipped away from the right. Holding
 * reveals it over 2 seconds, linearly (it is a timer, so it should not ease); letting go
 * snaps it back in 200ms. Space and Enter work the same way as the pointer. */
import * as React from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const HOLD_MS = 2000

export function HoldButton({
  children = "Hold to override",
  doneLabel = "Override confirmed",
  onConfirm,
  className,
}: {
  children?: React.ReactNode
  doneLabel?: React.ReactNode
  onConfirm?: () => void
  className?: string
}) {
  const [holding, setHolding] = React.useState(false)
  const [done, setDone] = React.useState(false)
  const timer = React.useRef<number | undefined>(undefined)

  const start = () => {
    if (done) return
    setHolding(true)
    timer.current = window.setTimeout(() => {
      setHolding(false)
      setDone(true)
      onConfirm?.()
    }, HOLD_MS)
  }
  const stop = () => {
    window.clearTimeout(timer.current)
    setHolding(false)
  }
  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const isHoldKey = (e: React.KeyboardEvent) => e.key === " " || e.key === "Enter"

  return (
    <button
      type="button"
      data-slot="hold-button"
      data-holding={holding || undefined}
      data-done={done || undefined}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onKeyDown={(e) => isHoldKey(e) && !e.repeat && start()}
      onKeyUp={(e) => isHoldKey(e) && stop()}
      onDoubleClick={() => setDone(false)}
      className={cn(
        "group/hold relative h-8 shrink-0 touch-none overflow-hidden rounded-lg bg-orange/10 px-3.5 text-sm font-medium text-orange outline-none inset-ring inset-ring-orange/45 transition-[scale] duration-150 ease-out select-none active:scale-[0.97]",
        "focus-visible:outline-orange!",
        "data-done:bg-green/10 data-done:text-green data-done:inset-ring-green/40",
        className
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        {done && <CheckIcon className="size-3.5" strokeWidth={2.5} />}
        {done ? doneLabel : children}
      </span>
      {!done && (
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center bg-orange text-hold-fg transition-[clip-path] duration-200 ease-out [clip-path:inset(0_100%_0_0)] group-data-holding/hold:duration-[2000ms] group-data-holding/hold:ease-linear group-data-holding/hold:[clip-path:inset(0_0_0_0)]"
        >
          {children}
        </span>
      )}
    </button>
  )
}

/* Waiting for something fetched. Show what is already known at once, and put a Skeleton
 * wherever fetched content will land, cut to that content's size so nothing jumps when it
 * arrives. One band of light crosses the window and passes over every shape at once.
 *
 *   const root = React.useRef<HTMLDivElement>(null)
 *   useSheen(root)                                   // once, on the page root
 *   <Skeleton className="h-3.5 w-[60%]" />           // a line of words
 *   <Skeleton shape="pill" className="h-6 w-20" />   // a badge
 *   <Skeleton shape="card" className="h-24" />       // a panel
 *   <ul data-sheen-stale={searching || undefined}>   // old rows about to be replaced
 *
 * A shape is never a real component's own parts: a waiting thing must never look like a
 * finished thing that broke. The styles are `.skel` in index.css. */
import * as React from "react"

import { cn } from "@/lib/utils"

/** One pass of the band, in ms. The same as the io-sheen animation in index.css. */
export const SHEEN_PASS = 2400

export function Skeleton({
  shape = "line",
  className,
  ...props
}: React.ComponentProps<"span"> & {
  /** `line` stands for words, `pill` for a badge or avatar, `card` for a whole panel. */
  shape?: "line" | "pill" | "card"
}) {
  return (
    <span
      data-slot="skeleton"
      data-shape={shape === "line" ? undefined : shape}
      aria-hidden
      className={cn("skel", className)}
      {...props}
    />
  )
}

/** Screen readers hear what's being fetched; the page shows it with shapes. */
export function Fetching({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>
}

/** One clock for every sheen under `root`. Each shape learns where it sits across the window
 * (--sheen-x), so its slice of the band lines up with every other shape's, and how far into
 * the current pass the page already is (--sheen-clock), so a shape that appears later joins
 * the band already crossing instead of starting its own. */
export function useSheen(root: React.RefObject<HTMLElement | null>) {
  React.useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const tag = () => {
      const now = performance.now()
      el.querySelectorAll<HTMLElement>(".skel, [data-sheen-stale]").forEach((shape) => {
        shape.style.setProperty("--sheen-x", `${Math.round(shape.getBoundingClientRect().left)}px`)
        if (!shape.dataset.sheenClock) {
          shape.dataset.sheenClock = ""
          shape.style.setProperty("--sheen-clock", `${-(now % SHEEN_PASS)}ms`)
        }
      })
    }
    tag()
    const watch = new MutationObserver((records) => {
      // Content newly marked stale starts its light now, so it takes the clock afresh.
      for (const r of records) {
        const target = r.target as HTMLElement
        if (r.type === "attributes" && target.hasAttribute("data-sheen-stale")) delete target.dataset.sheenClock
      }
      tag()
    })
    watch.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-sheen-stale"] })
    window.addEventListener("resize", tag)
    return () => {
      watch.disconnect()
      window.removeEventListener("resize", tag)
    }
  }, [root])
}

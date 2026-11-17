/* A token, shown: the colour itself, its name, what it is for, and four ways to write it.
 * The value is read live, so it changes when you switch theme or edit the token sheet. */
import * as React from "react"

import { cn } from "@/lib/utils"
import { CopyRows } from "./copy-rows"

/** Reads a CSS variable's current value from an element, and again whenever the theme or a live stylesheet changes. */
export function useToken(name: string, ref: React.RefObject<HTMLElement | null>) {
  const [value, setValue] = React.useState("")
  React.useEffect(() => {
    const read = () => ref.current && setValue(getComputedStyle(ref.current).getPropertyValue(`--${name}`).trim())
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, subtree: true, characterData: true, childList: true })
    return () => observer.disconnect()
  }, [name, ref])
  return value
}

export function Swatch({
  token,
  use,
  cls,
  kind = "fill",
  className,
}: {
  token: string
  use: string
  /** The class this guide's theme gives the token. */
  cls: string
  kind?: "fill" | "line" | "text" | "glass" | "status"
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const value = useToken(token, ref)
  // "bg-l3" is the prefix "bg" on the token "l3". A recipe such as glass-bar has no prefix: it is a background.
  const prefix = cls.endsWith(`-${token}`) ? cls.slice(0, -token.length - 1) : "bg"
  return (
    <div ref={ref} className={cn("surface-card flex min-w-0 flex-col overflow-hidden", className)}>
      <span
        className={cn(
          "grid h-14 w-full place-items-center border-b text-xl font-semibold",
          kind === "glass" && "bg-[linear-gradient(100deg,var(--green),var(--amber)_45%,var(--red))]"
        )}
        style={
          kind === "fill"
            ? { background: `var(--${token})` }
            : kind === "text"
              ? { color: `var(--${token})` }
              : undefined
        }
      >
        {kind === "text" && "Aa"}
        {/* Status colour is never a big block in the product, so it is not one here either. */}
        {kind === "status" && <span className="size-6 rounded-sm" style={{ background: `var(--${token})` }} />}
        {kind === "line" && (
          <span className="h-7 w-24 rounded-lg" style={{ boxShadow: `inset 0 0 0 1px var(--${token})` }} />
        )}
        {kind === "glass" && (
          <span
            className="h-8 w-28 rounded-lg backdrop-blur-[16px]"
            style={{ background: `var(--${token})`, boxShadow: "inset 0 1px 0 var(--glass-edge), 0 0 0 1px var(--line-2)" }}
          />
        )}
      </span>
      <span className="flex flex-1 flex-col gap-px px-3 pt-2.5 pb-2">
        <b className="font-mono text-xs font-medium">--{token}</b>
        <span className="text-xs leading-snug text-fg-2">{use}</span>
      </span>
      {/* Tailwind's brackets cannot hold spaces, so the value loses its own. */}
      <CopyRows
        rows={[
          ["Value", [value || "…"]],
          ["CSS", [`var(--${token})`]],
          ["Tailwind", [`${prefix}-[${value.replace(/\s+/g, "")}]`]],
          ["Theme", [cls]],
        ]}
      />
    </div>
  )
}

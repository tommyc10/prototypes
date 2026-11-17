/* Light or dark. The theme is a class on <html>, so menus, the palette and toasts
 * (which render at the end of <body>) follow it too. Switching dissolves the new theme
 * in over the old one with the View Transitions API (see the end of index.css). */
import { useLayoutEffect, useState } from "react"
import { flushSync } from "react-dom"

export type Theme = "dark" | "light"

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem("io-theme") === "light" ? "light" : "dark"
  )

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
    localStorage.setItem("io-theme", theme)
  }, [theme])

  const toggle = () => {
    // flushSync makes React repaint inside the transition's "after" snapshot.
    const apply = () =>
      flushSync(() => setTheme(theme === "dark" ? "light" : "dark"))
    if (!document.startViewTransition) return apply()
    document.startViewTransition(apply)
  }

  return [theme, toggle] as const
}

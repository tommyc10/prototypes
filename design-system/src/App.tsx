/* The design system page: a sticky contents list on the left, every section in one long
 * scroll on the right. The page is itself built from the system it documents. */
import * as React from "react"
import { MoonIcon, SunIcon } from "lucide-react"

import { Button } from "@/components/button"
import { CommandPalette, PaletteGroup, PaletteItem } from "@/components/command-palette"
import { JumpButton, NavItem } from "@/components/nav"
import { TooltipProvider } from "@/components/overlays"
import { Toaster } from "@/components/toast"
import { useTheme } from "@/showcase/lib/use-theme"
import { Anatomy, Start } from "@/showcase/sections/intro"
import { Colour, Type } from "@/showcase/sections/colour-type"
import { Materials, Motion, Shape, Space } from "@/showcase/sections/foundations"
import { Actions, DataDisplay, Feedback, Inputs, Navigation, Overlays } from "@/showcase/sections/components"
import { DoAndDont, Patterns } from "@/showcase/sections/patterns"
import { Recipes } from "@/showcase/sections/recipes"
import { ProductCss } from "@/showcase/sections/product-css"
import { BuildYourOwn, Handoff } from "@/showcase/sections/handoff"

const NAV = [
  { group: "Learn", items: [["start", "Start here"], ["anatomy", "How a system works"]] },
  {
    group: "Foundations",
    items: [["colour", "Colour"], ["type", "Type"], ["space", "Space and size"], ["shape", "Shape"], ["materials", "Materials"], ["motion", "Motion"]],
  },
  {
    group: "Components",
    items: [["actions", "Actions"], ["inputs", "Inputs"], ["navigation", "Navigation"], ["data", "Data display"], ["feedback", "Feedback"], ["overlays", "Overlays"]],
  },
  { group: "In use", items: [["patterns", "Patterns"], ["dodont", "Do and don't"], ["recipes", "Recipes and a screen"]] },
  {
    group: "In plain CSS",
    items: [["css-type", "Type"], ["css-surfaces", "Edges and surfaces"], ["css-layout", "Layout and position"], ["css-components", "Components"], ["css-status", "Status, motion, charts"], ["css-build", "Write your own"]],
  },
  { group: "Take it with you", items: [["handoff", "Hand off to an agent"], ["build", "Build your own"]] },
] as const

const FLAT = NAV.flatMap((group) => group.items.map(([id, label]) => ({ id, label, group: group.group })))
const numberOf = (id: string) => String(FLAT.findIndex((item) => item.id === id) + 1).padStart(2, "0")

export function App() {
  const [theme, toggleTheme] = useTheme()
  const [active, setActive] = React.useState("start")
  const [paletteOpen, setPaletteOpen] = React.useState(false)

  // Which section is showing: the nav follows the scroll.
  React.useEffect(() => {
    const spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id)
      },
      { rootMargin: "-10% 0px -80% 0px" }
    )
    document.querySelectorAll("[data-section]").forEach((section) => spy.observe(section))
    return () => spy.disconnect()
  }, [])

  // ⌘K opens the palette from anywhere, as it does in the product.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const go = (id: string) => {
    setPaletteOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <TooltipProvider delay={300}>
        <div className="grid min-h-svh md:grid-cols-[232px_minmax(0,1fr)]">
          <nav className="sticky top-0 hidden h-svh flex-col gap-px overflow-y-auto border-r bg-l0 px-2.5 pt-3.5 pb-3 md:flex">
            <a href="#start" className="flex items-center gap-2.5 px-2 pt-1 pb-3.5 font-semibold tracking-[-0.01em]">
              <span className="grid size-[22px] place-items-center rounded-sm bg-primary text-primary-fg">
                <svg viewBox="0 0 24 24" className="size-3.5">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
              </span>
              Design system
            </a>
            <JumpButton className="mb-2.5" onClick={() => setPaletteOpen(true)}>Jump to…</JumpButton>
            {NAV.map((group) => (
              <React.Fragment key={group.group}>
                <div className="px-2.5 pt-3 pb-1 text-xs font-medium text-fg-3">{group.group}</div>
                {group.items.map(([id, label]) => (
                  <NavItem key={id} href={`#${id}`} active={active === id} className="text-sm">
                    <b className="w-[18px] font-mono text-[11px] font-medium text-fg-3">{numberOf(id)}</b>
                    {label}
                  </NavItem>
                ))}
              </React.Fragment>
            ))}
            <div className="mt-auto flex items-center justify-between border-t px-2 pt-3 text-xs text-fg-3">
              <span>{theme === "dark" ? "Dark" : "Light"} theme</span>
              <Button variant="ghost" size="icon" aria-label="Switch theme" onClick={toggleTheme}>
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              </Button>
            </div>
          </nav>

          <main className="min-w-0 px-5 pb-40 md:px-12">
            <div className="mx-auto max-w-[1180px]">
              <Start n={numberOf} />
              <Anatomy n={numberOf("anatomy")} />
              <Colour n={numberOf("colour")} />
              <Type n={numberOf("type")} />
              <Space n={numberOf("space")} />
              <Shape n={numberOf("shape")} />
              <Materials n={numberOf("materials")} />
              <Motion n={numberOf("motion")} />
              <Actions n={numberOf("actions")} />
              <Inputs n={numberOf("inputs")} />
              <Navigation n={numberOf("navigation")} />
              <DataDisplay n={numberOf("data")} />
              <Feedback n={numberOf("feedback")} />
              <Overlays n={numberOf("overlays")} />
              <Patterns n={numberOf("patterns")} />
              <DoAndDont n={numberOf("dodont")} />
              <Recipes n={numberOf("recipes")} />
              <ProductCss n={numberOf} />
              <Handoff n={numberOf("handoff")} />
              <BuildYourOwn n={numberOf("build")} />
            </div>
          </main>
        </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} placeholder="Jump to a section…">
        {NAV.map((group) => (
          <PaletteGroup key={group.group} heading={group.group}>
            {group.items.map(([id, label]) => (
              <PaletteItem key={id} value={`${label} ${id}`} onSelect={() => go(id)}>
                <span className="w-5 font-mono text-[11px] text-fg-3">{numberOf(id)}</span>
                {label}
              </PaletteItem>
            ))}
          </PaletteGroup>
        ))}
      </CommandPalette>
      <Toaster />
    </TooltipProvider>
  )
}

/* In plain CSS: the product's own stylesheet, taught one editable box at a time. Imperial Ops
 * is not written in Tailwind, so this is where to look when you are changing the product
 * itself. The lessons are data (showcase/product-css/data.ts); this file only orders them. */
import * as React from "react"

import { C, Section } from "@/showcase/lib/doc"
import { Entries, Icons, Prose, useDemoBehaviour } from "@/showcase/product-css/blocks"
import { BUILD, CHARTS, COMPONENTS, LAYOUT, MOTION, STATUS, SURFACES, TYPE } from "@/showcase/product-css/data"

export function ProductCss({ n }: { n: (id: string) => string }) {
  const root = React.useRef<HTMLDivElement>(null)
  useDemoBehaviour(root)
  return (
    <div ref={root}>
      <Icons />

      <Section
        id="css-type"
        n={n("css-type")}
        title="Type, in plain CSS"
        lede={
          <>
            The product itself is plain CSS, not Tailwind. A piece gets its look from a{" "}
            <strong className="font-medium text-fg">class name</strong> (<C>mn-btn</C>), its variant or state
            from a <strong className="font-medium text-fg">data attribute</strong> (<C>data-variant="primary"</C>
            , <C>data-active</C>), and its colours from the same tokens as everything above. Shared pieces start
            with <C>mn-</C>, Hindcast pieces with <C>hc-</C>. From here to the end of this group,{" "}
            <strong className="font-medium text-fg">every grey CSS box is live</strong>: change a number and the
            demo beside it changes. Copy cards give each recipe as CSS, as a Tailwind class that works in any
            project, and as the shorter class this guide's theme gives you.
          </>
        }
      >
        <Entries lesson={TYPE} />
      </Section>

      <Section id="css-surfaces" n={n("css-surfaces")} title={SURFACES.title} lede={<Prose html={SURFACES.lede} />}>
        <Entries lesson={SURFACES} />
      </Section>

      <Section id="css-layout" n={n("css-layout")} title={LAYOUT.title} lede={<Prose html={LAYOUT.lede} />}>
        <Entries lesson={LAYOUT} />
      </Section>

      <Section id="css-components" n={n("css-components")} title="Components, in plain CSS" lede={<Prose html={COMPONENTS.lede} />}>
        <Entries lesson={COMPONENTS} />
      </Section>

      <Section
        id="css-status"
        n={n("css-status")}
        title="Status, motion and charts"
        lede="Three short lessons: the one formula for colour that means something, the few transitions the product allows itself, and charts drawn with nothing but divs."
      >
        <Entries lesson={STATUS} lead />
        <Entries lesson={MOTION} lead />
        <Entries lesson={CHARTS} lead />
      </Section>

      <Section id="css-build" n={n("css-build")} title="Write your own CSS" lede={<Prose html={BUILD.lede} />}>
        <Entries lesson={BUILD} />
      </Section>
    </div>
  )
}

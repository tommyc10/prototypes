/* Joins class names, skipping anything falsy:
 *   cn("a", selected && "b", undefined)  ->  "a b"
 * That is all it does. It does not resolve conflicts, so a component's `className` prop is
 * for placing it (width, margin, flex), not for restyling it. */
export function cn(...parts: (string | false | 0 | null | undefined)[]) {
  return parts.filter(Boolean).join(" ")
}

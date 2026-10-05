/* Prose that was written from the figures. **Double asterisks** mark the numbers, which are
 * shown in the primary text colour so the eye lands on them first. */

export function Prose({ text, className }: { text: string; className?: string }) {
  return (
    <p className={className}>
      {text.split('**').map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))}
    </p>
  );
}

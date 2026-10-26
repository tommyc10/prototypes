/* The brand mark: a ring round a dot. In Halloween mode it wears a sheet, like Tesla's car,
 * with its lights glowing through the eyes. */

import { useHalloween } from '../hooks/useHalloween';

export function BrandMark() {
  const halloween = useHalloween();
  return (
    <div className="mn-brand-mark" aria-hidden>
      {halloween ? (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M4.5 22V11a7.5 7.5 0 0 1 15 0v11l-2.5-1.6-2.5 1.6-2.5-1.6-2.5 1.6-2.5-1.6Z" fill="currentColor" />
          <ellipse className="mn-ghost-eye" cx="9.4" cy="11.2" rx="1.35" ry="1.8" />
          <ellipse className="mn-ghost-eye" cx="14.6" cy="11.2" rx="1.35" ry="1.8" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="14" height="14">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      )}
    </div>
  );
}

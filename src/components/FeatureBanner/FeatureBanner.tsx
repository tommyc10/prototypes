import { useState } from 'react';
import { X } from 'lucide-react';
import './FeatureBanner.css';

const DISMISSED_KEY = 'mn-service-pages-announcement-dismissed';

export function FeatureBanner() {
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISSED_KEY) === 'true');

  if (dismissed) return null;

  return (
    <aside className="mn-feature-banner" aria-label="New feature" data-own-keys>
      <span className="mn-feature-badge">New</span>
      <p className="mn-feature-copy">
        <strong>A home for every service</strong>
        <span>Owner, dependencies, open incidents, active rules and planned changes — on one page.</span>
      </p>
      <button
        className="mn-icon-btn mn-feature-dismiss"
        type="button"
        aria-label="Dismiss service pages announcement"
        title="Dismiss announcement"
        onClick={() => {
          sessionStorage.setItem(DISMISSED_KEY, 'true');
          setDismissed(true);
        }}
      >
        <X size={15} aria-hidden="true" />
      </button>
    </aside>
  );
}

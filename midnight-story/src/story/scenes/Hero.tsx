/* The opening frame, over the wall of noise. */

import { ArrowDown } from 'lucide-react';

export function Hero() {
  return (
    <div className="scene sc-hero">
      <div className="hero">
        <div className="hero-eyebrow">
          <span className="dot" data-s="open" />
          Midnight · rule governance for Imperial Ops
        </div>
        <h1 className="hero-title">
          Silence the noise.
          <br />
          <span className="hero-title-2">Never the signal.</span>
        </h1>
        <p className="hero-sub">
          Follow one alert from the second it fires to the rule that retires it, and meet the person who signs for it.
        </p>
      </div>
      <div className="hero-cue">
        <span>Scroll to follow the alert</span>
        <span className="hero-cue-line">
          <ArrowDown size={14} strokeWidth={1.75} />
        </span>
      </div>
    </div>
  );
}

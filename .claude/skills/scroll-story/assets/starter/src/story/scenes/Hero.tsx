/* The opening frame, over the wall of noise. */

import { PRODUCT } from '../data';

export function Hero() {
  return (
    <div className="scene sc-hero">
      <div className="hero">
        <div className="hero-eyebrow">
          <span className="dot" data-s="open" />
          {PRODUCT.name} · the story
        </div>
        <h1 className="hero-title">
          Every ticket asks for someone.
          <br />
          <span className="hero-title-2">Most shouldn’t have to.</span>
        </h1>
        <p className="hero-sub">Follow one ticket from the moment it lands to the moment it stops needing a person.</p>
      </div>
      <div className="hero-cue">
        <span>Scroll to follow the ticket</span>
        <span className="hero-cue-line">
          <span>↓</span>
        </span>
      </div>
    </div>
  );
}

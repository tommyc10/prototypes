/* The opening and closing frames, in Midnight's style, shared by every direction. Each
 * direction animates them its own way. */

import { HEADLINE, OUTRO, SUB } from './story';
import { DASHBOARD_URL } from './MidnightBar';

/** `o`: wrap the o in "noise" so a direction can dive through its counter. */
export function Hero({ cue, o = false }: { cue: string; o?: boolean }) {
  return (
    <div className="layer m-hero">
      <div className="hero">
        <div className="hero-eyebrow">
          <span className="dot" data-s="open" />
          Midnight · rule governance for Imperial Ops
        </div>
        <h1 className="hero-title">
          <span className="hero-line">
            {o ? (
              <>
                Silence the n
                <span className="m-o">
                  o<span className="m-o-window" />
                </span>
                ise.
              </>
            ) : (
              HEADLINE.a
            )}
          </span>
          <span className="hero-line hero-title-2">{HEADLINE.b}</span>
        </h1>
        <p className="hero-sub">{SUB}</p>
      </div>
      <div className="hero-cue">
        <span>{cue}</span>
        <span className="hero-cue-line">
          <span>↓</span>
        </span>
      </div>
    </div>
  );
}

export function Outro({ onReplay, replay }: { onReplay: () => void; replay: string }) {
  return (
    <div className="layer m-outro">
      <div className="outro">
        <h2 className="outro-title">{OUTRO.title}</h2>
        <p className="outro-sub">{OUTRO.sub}</p>
        <dl className="outro-stats">
          {OUTRO.stats.map((s) => (
            <div className="outro-stat" key={s.label}>
              <dt>
                <span className="num outro-num">{s.value}</span>
                {s.suffix}
              </dt>
              <dd>{s.label}</dd>
            </div>
          ))}
        </dl>
        <div className="outro-actions">
          <a className="btn" data-variant="primary" href={DASHBOARD_URL}>
            Open the dashboard ↗
          </a>
          <button className="btn" data-variant="ghost" type="button" onClick={onReplay}>
            ↺ {replay}
          </button>
        </div>
      </div>
    </div>
  );
}

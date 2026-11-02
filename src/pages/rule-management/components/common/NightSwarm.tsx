/* When a pattern's incidents came in last night, 22:00 to 06:00: one dot per incident at the
 * minute it arrived, stacked where they crowd. A thin night is a few dots rather than a bar
 * chart with holes in it. The ones a person had to work are red, because they are the pages
 * the rule would hide. Hover a dot for the incident. */

import { useLayoutEffect, useRef, useState } from 'react';
import { RESOLUTION_LABEL } from '../../model/labels';
import { isReal, nightClock, type NightIncident } from '../../model/suggestions';
import './NightSwarm.css';

const NIGHT = 480;
const HOURS = [0, 120, 240, 360, 480];
const DOT = 8;
const STEP = DOT + 2;

export function NightSwarm({ incidents }: { incidents: NightIncident[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<string | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Measured before the first paint, so the dots never show a frame in the wrong place.
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // One column per dot's width; a dot takes the next free place in its column. Noise goes in
  // first, so a dot that needed a person sits on top of its stack, where it is seen.
  const cols = Math.max(1, Math.floor(width / STEP));
  const colWidth = width / cols;
  const levels: number[] = Array(cols).fill(0);
  const dots = [...incidents]
    .sort((a, b) => Number(isReal(a.resolution)) - Number(isReal(b.resolution)) || a.minute - b.minute)
    .map((incident) => {
      const col = Math.min(cols - 1, Math.floor((incident.minute / NIGHT) * cols));
      return { incident, x: (col + 0.5) * colWidth, level: levels[col]++, real: isReal(incident.resolution) };
    });
  const height = Math.max(4, ...levels) * STEP + 4;
  const real = dots.filter((d) => d.real).length;
  const tip = dots.find((d) => d.incident.id === hover);

  return (
    <div className="mn-ns">
      <div
        className="mn-ns-plot"
        ref={ref}
        style={{ height }}
        role="img"
        aria-label={`${incidents.length} incidents through the night, one dot each${real ? `, ${real} that needed a person` : ''}`}
        onPointerLeave={() => setHover(null)}
      >
        {HOURS.slice(1, -1).map((m) => (
          <span key={m} className="mn-ns-hour" style={{ left: `${(m / NIGHT) * 100}%` }} />
        ))}
        {width > 0 &&
          dots.map((d) => (
            <span
              key={d.incident.id}
              className="mn-ns-dot"
              data-real={d.real || undefined}
              data-hover={hover === d.incident.id || undefined}
              style={{ transform: `translate(${d.x - DOT / 2}px, ${-(d.level * STEP) - DOT - 2}px)` }}
              onPointerEnter={() => setHover(d.incident.id)}
            />
          ))}
        {tip && <Tip incident={tip.incident} x={tip.x} y={height - tip.level * STEP - DOT / 2 - 2} flip={tip.x > width * 0.6} />}
      </div>
      <div className="mn-ns-axis" aria-hidden>
        {HOURS.map((m) => (
          <span key={m} style={{ left: `${(m / NIGHT) * 100}%` }}>
            {nightClock(m)}
          </span>
        ))}
      </div>
      <div className="mn-ns-legend">
        <span>
          <i />
          {incidents.length - real} needed no one
        </span>
        {real > 0 && (
          <span data-real>
            <i />
            <b>{real}</b> needed a person
          </span>
        )}
      </div>
    </div>
  );
}

function Tip({ incident, x, y, flip }: { incident: NightIncident; x: number; y: number; flip: boolean }) {
  return (
    <div className="mn-ns-tip" data-flip={flip || undefined} style={{ left: x, top: y }}>
      <div className="mn-ns-tip-title">
        <span className="mn-mono">{incident.id}</span> · {nightClock(incident.minute)}
      </div>
      <div>{incident.ci}</div>
      <div data-real={isReal(incident.resolution) || undefined}>
        {RESOLUTION_LABEL[incident.resolution]} · open {incident.minutesOpen} min
      </div>
    </div>
  );
}

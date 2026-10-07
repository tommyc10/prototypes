/* The journey: the line every incident travels, and how far this one got.
 *
 *   Raised → Change windows → Rules → Duplicates → Enrichment → Delivered
 *
 * Each checkpoint either lets the incident through or stops it. The line is lit as far as
 * the incident travelled, and the checkpoint where it ended is the one drawn large. What's
 * beyond it is faint: it never got there. Between two checkpoints is how long that step
 * took, which is the story in miniature: the checks are machines and take fractions of a
 * second, enrichment is people and takes minutes.
 *
 * It's a row of buttons, not a picture: pressing a checkpoint jumps to its section below.
 * On a narrow pane the row turns on its side and becomes a column.
 *
 * The journey can play. A bright dot rides the line from "Raised", the line fills in behind
 * it, and each checkpoint lights as it passes. What happens when it arrives depends on how
 * the journey ended, so the motion says what the words say:
 *
 *   gate     stopped on the way (held, suppressed, folded, noise): a gate snaps shut in
 *            front of it and the mark lands with a thud
 *   alarm    a real incident was suppressed: the same stop, but it shakes, in red
 *   burst    enriched and delivered: it reaches the end and the mark blooms, with rays
 *   orbit    with the team now: the mark stays open and a small dot circles it
 *
 * It's there to explain, and to be a little satisfying, so it plays when an incident is
 * opened with the pointer or from a link. It never plays for J and K: an incident picked from the keyboard is
 * there at once, because anything slower would lag behind the keys. The motion is all in
 * the CSS; this file only says whether to play it and gives each checkpoint its place in
 * the order (--i), which the CSS turns into a delay. */

import type { CSSProperties } from 'react';
import { RotateCcw } from 'lucide-react';
import { STATION_LABEL, clockFace, took } from '../../model/lifecycle';
import type { Lifecycle, StationId } from '../../model/types';
import './Journey.css';

export function Journey({
  life,
  play,
  onJump,
  onReplay,
}: {
  life: Lifecycle;
  /** Play the journey as it appears (opened with the pointer), or show it at once (the keyboard). */
  play: boolean;
  onJump: (station: StationId) => void;
  onReplay: () => void;
}) {
  const { stations } = life;
  // How the journey ended colours the checkpoint it ended at.
  const tone = life.end === 'suppressed' && life.real ? 'bad' : life.end === 'delivered' ? 'through' : life.end === 'enriching' ? 'wait' : 'quiet';
  // …and decides what happens when the dot gets there.
  const arrival = { bad: 'alarm', through: 'burst', wait: 'orbit', quiet: 'gate' }[tone];
  // How many stretches of line the dot has to cross.
  const stop = stations.findIndex((s) => s.state === 'stopped' || s.state === 'current');

  return (
    <div className="ic-journey-wrap" data-tone={tone} data-tour="ic-journey" style={{ '--stop': stop } as CSSProperties}>
      {/* The dot that rides the line. Only while playing: once it arrives it's gone. */}
      {play && stop > 0 && <span className="ic-traveller" aria-hidden />}
      <button className="mn-icon-btn ic-replay" onClick={onReplay} aria-label="Play the journey again" title="Play again">
        <RotateCcw size={14} />
      </button>
      <ol className="ic-journey" data-tone={tone} data-play={play || undefined} aria-label={`The journey: ${life.summary}`}>
        {stations.map((station, i) => {
          const before = stations[i - 1];
          const reached = station.state !== 'unreached';
          return (
            <li key={station.id} data-state={station.state} data-arrival={i === stop ? arrival : undefined} style={{ '--i': i } as CSSProperties}>
              {/* The stretch of line that leads here, with how long it took to cross. */}
              {i > 0 && (
                <span className="ic-leg" data-lit={reached || undefined} aria-hidden>
                  {reached && before?.at !== undefined && station.at !== undefined && <span>{took(station.at - before.at)}</span>}
                </span>
              )}
              <button className="ic-station" disabled={!reached} onClick={() => onJump(station.id)}>
                <i aria-hidden>
                  {/* What the arrival is made of: rays for a delivery, a circling dot while the team has it. */}
                  {i === stop && arrival === 'burst' && <span className="ic-rays" />}
                  {i === stop && arrival === 'orbit' && <span className="ic-orbit" />}
                </i>
                {/* The gate that stopped it, just past the mark. It stays shut once the journey has played. */}
                {i === stop && (arrival === 'gate' || arrival === 'alarm') && <span className="ic-gate" aria-hidden />}
                <span className="ic-station-name">{STATION_LABEL[station.id]}</span>
                {reached ? (
                  <>
                    <span className="ic-station-verdict">{station.verdict}</span>
                    <time className="mn-mono">{clockFace(station.at!)}</time>
                  </>
                ) : (
                  <span className="ic-station-verdict">Never reached</span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

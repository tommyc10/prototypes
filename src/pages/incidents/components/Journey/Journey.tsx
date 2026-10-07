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
 * On a narrow pane the row turns on its side and becomes a column. Nothing here animates:
 * it's changed with J and K, and anything slower than instant would lag behind the keys. */

import { STATION_LABEL, clockFace, took } from '../../model/lifecycle';
import type { Lifecycle, StationId } from '../../model/types';
import './Journey.css';

export function Journey({ life, onJump }: { life: Lifecycle; onJump: (station: StationId) => void }) {
  const { stations } = life;
  // How the journey ended colours the checkpoint it ended at.
  const tone = life.end === 'suppressed' && life.real ? 'bad' : life.end === 'delivered' ? 'through' : life.end === 'enriching' ? 'wait' : 'quiet';

  return (
    <ol className="ic-journey" data-tone={tone} data-tour="ic-journey" aria-label={`The journey: ${life.summary}`}>
      {stations.map((station, i) => {
        const before = stations[i - 1];
        const reached = station.state !== 'unreached';
        return (
          <li key={station.id} data-state={station.state}>
            {/* The stretch of line that leads here, with how long it took to cross. */}
            {i > 0 && (
              <span className="ic-leg" data-lit={reached || undefined} aria-hidden>
                {reached && before?.at !== undefined && station.at !== undefined && <span>{took(station.at - before.at)}</span>}
              </span>
            )}
            <button className="ic-station" disabled={!reached} onClick={() => onJump(station.id)}>
              <i aria-hidden />
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
  );
}

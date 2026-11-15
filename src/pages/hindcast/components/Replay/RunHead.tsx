/* The top of the report: what kind of report this is, the sentence that says what it found,
 * and the run's three steps. While the engine works, a light travels round the well (the
 * beam: the rule engine is working, and it ends), each step ticks as it finishes, and the
 * sentence fills in figure by figure as the step that knows it completes. Afterwards the steps
 * stay as a quiet receipt of what was read. */

import type { CSSProperties, ReactNode } from 'react';
import { Check } from 'lucide-react';
import { num } from '../../../../lib/format';
import { Counting } from '../Kpis/Kpis';

export interface RunStepWords {
  running: string;
  done: ReactNode;
}

/** A figure in the sentence: counts to its value once its step is done, stays dim with the
 *  last run's value while waiting, or stands as a soft shape before the first run. */
export function Fig({ value, ready, before, format = num }: { value: number; ready: boolean; before: number | null; format?: (n: number) => string }) {
  if (!ready && before === null) return <span className="mn-skel ol-fig-skel" aria-hidden />;
  return (
    <b className="ol-fig" data-sheen-stale={!ready || undefined}>
      <Counting numbers={{ v: ready ? value : (before ?? value) }} render={(v) => format(Math.round(v.v))} />
    </b>
  );
}

export function RunHead({ eyebrow, note, lead, steps, step, done, waiting }: { eyebrow: string; note: ReactNode; lead: ReactNode; steps: RunStepWords[]; step: number; done: boolean; waiting: string }) {
  return (
    <header className="ol-head" data-area="head">
      <div className="ol-head-top">
        <span className="ol-kind">{eyebrow}</span>
        <span className="ol-head-note">{note}</span>
      </div>
      <div className="ol-head-lead">{lead}</div>
      <ol className="ol-ledger" aria-label="The run" data-done={done || undefined}>
        <span className="mn-beam" data-active={!done || undefined} aria-hidden style={{ '--mn-beam-lap': '6s' } as CSSProperties} />
        {steps.map((s, i) => {
          const state = i < step ? 'done' : i === step && !done ? 'now' : 'later';
          return (
            <li key={i} data-state={state}>
              <span className="ol-ledger-mark" aria-hidden>
                {state === 'done' ? <Check size={11} strokeWidth={2.5} /> : <i />}
              </span>
              <span className="ol-ledger-text">{state === 'done' ? s.done : s.running}</span>
            </li>
          );
        })}
      </ol>
      <span className="mn-sr" role="status">
        {done ? '' : waiting}
      </span>
    </header>
  );
}

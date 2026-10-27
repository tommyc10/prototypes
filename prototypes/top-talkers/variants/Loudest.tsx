/* 4 Loudest: top talkers in the sidebar, so they're on every page. A section under the pinned
 * groups lists the five loudest services over the last four weeks, each with a strip of its
 * last eight weeks, so you can tell a service that's always loud from one having a bad week.
 * The label switches what they're ranked by. Picking a service opens a card beside the
 * sidebar with its numbers and its rules, and the way into the Hindcast and the Rules page.
 * Shown here on the Incidents page; it would be the same on every page. */

import { useMemo, useRef, useState } from 'react';
import { Popover } from '@base-ui/react/popover';
import { ChevronDown, Filter, History } from 'lucide-react';
import { num, pct } from '../../../src/lib/format';
import { IncidentsPage } from '../../../src/pages/incidents/IncidentsPage';
import { useFlip } from '../../../src/pages/hindcast/hooks/useFlip';
import { MEASURES, changeOf, hrefs, measureOf, ranked, valueOf, words, type Measure, type Talker } from '../model';
import { Change, MountInto, WeekBars, useTalkers } from '../shared';

const WEEKS = 4;
const STRIP = 8;
const SHOWN = 5;

export function Loudest() {
  return (
    <>
      <IncidentsPage />
      <MountInto selector=".mn-side-body">
        <LoudestSection />
      </MountInto>
    </>
  );
}

function LoudestSection() {
  const [measure, setMeasure] = useState<Measure>('tickets');
  const [all, setAll] = useState(false);
  const list = useTalkers(WEEKS);
  const strips = useTalkers(STRIP);
  const order = useMemo(() => ranked(list, measure), [list, measure]);
  const rows = all ? order : order.slice(0, SHOWN);
  const ref = useRef<HTMLElement>(null);
  useFlip(ref, rows.map((t) => t.id).join());
  const m = measureOf(measure);
  const next = MEASURES[(MEASURES.findIndex((x) => x.key === measure) + 1) % MEASURES.length]!;

  return (
    <section className="mn-nav-section tt-loud" aria-labelledby="tt-loud-label" ref={ref}>
      <div className="mn-nav-label tt-loud-label">
        <span id="tt-loud-label">Loudest</span>
        <button className="tt-loud-by" onClick={() => setMeasure(next.key)} title={`Rank by ${next.many} instead`} aria-label={`Ranked by ${m.many} over ${WEEKS} weeks. Rank by ${next.many} instead.`}>
          {m.many} · {WEEKS} weeks
        </button>
      </div>
      {rows.map((t, i) => (
        <Row key={t.id} t={t} rank={i + 1} of={order.length} measure={measure} strip={strips.find((s) => s.id === t.id)!.weekly} />
      ))}
      <button className="tt-loud-more" onClick={() => setAll((v) => !v)} aria-expanded={all}>
        <ChevronDown size={13} data-open={all || undefined} aria-hidden />
        {all ? 'Show the top five' : `Show all ${order.length}`}
      </button>
    </section>
  );
}

function Row({ t, rank, of, measure, strip }: { t: Talker; rank: number; of: number; measure: Measure; strip: number[] }) {
  const v = valueOf(t, measure);
  return (
    <Popover.Root>
      <Popover.Trigger className="mn-nav-item tt-loud-row" data-flip={t.id} aria-label={`${t.name}, ${num(v)} ${words(v, measure)}. Open its card.`}>
        <span className="tt-loud-rank">{rank}</span>
        <span className="mn-nav-text">{t.name}</span>
        <span className="tt-strip" aria-hidden title={`Tickets each week, last ${STRIP} weeks`}>
          {strip.map((n, i) => (
            <i key={i} style={{ transform: `scaleY(${Math.max(0.15, n / Math.max(1, ...strip))})` }} />
          ))}
        </span>
        <b className="tt-loud-n">{num(v)}</b>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="right" align="start" sideOffset={14} alignOffset={-8}>
          <Popover.Popup className="mn-menu tt-card-pop" aria-label={t.name}>
            <header className="tt-pop-head">
              <Popover.Title className="tt-pop-title">{t.name}</Popover.Title>
              <span>{t.unit}</span>
            </header>
            <Popover.Description className="tt-pop-say">
              {rank === 1 ? 'The loudest' : `${rank} of ${of}`} by {measureOf(measure).many} over the last {WEEKS} weeks: <b>{pct(t.share)}</b> of every ticket raised.
            </Popover.Description>
            <div className="mn-backtest tt-pop-well">
              <div>
                <b>{num(t.tickets)}</b>
                <span>Tickets</span>
              </div>
              <div>
                <b>{num(t.incidents)}</b>
                <span>Incidents</span>
              </div>
              <div>
                <b>{num(t.rules.total)}</b>
                <span>Rules, {t.rules.active} active</span>
              </div>
            </div>
            <div className="tt-pop-weeks">
              <WeekBars weekly={strip} height={32} />
              <span>
                Last {STRIP} weeks · <Change by={changeOf(t.tickets, t.before.tickets)} against={`on the ${WEEKS} before`} />
              </span>
            </div>
            {t.ruleList.length > 0 && (
              <ul className="tt-pop-rules" aria-label="Its rules">
                {t.ruleList.map((r) => (
                  <li key={r.id}>
                    <a href={hrefs.rule(r.id)}>
                      <span className="mn-dot" data-status={r.status} aria-hidden />
                      <span className="mn-truncate">{r.name}</span>
                      <span className="mn-mono">{r.id}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <footer className="tt-pop-actions">
              <a className="mn-btn" href={hrefs.hindcast(t.id)}>
                <History size={15} /> Hindcast
              </a>
              <a className="mn-btn" href={hrefs.rules(t.id)}>
                <Filter size={15} /> Its rules
              </a>
            </footer>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

/* The replay's report, the same for the current replay and for a historical extract's
 * aggregate: every ticket by what happened to it, the tickets closed by hand by what the
 * logic says, week by week, what explains them, the gaps, the hypotheses, the unknowns, and
 * the tickets themselves.
 *
 * Before the first run lands, each panel's title shows at once and soft shapes stand where its
 * content will land, as many as will land (the rules and windows in scope are known before the
 * run). During a later run the panels keep their figures, dimmed, and morph to the new ones
 * when it finishes. */

import type { CSSProperties, ReactNode, RefObject } from 'react';
import { num } from '../../../../lib/format';
import type { Focus, Narrowing } from '../../model/narrow';
import type { Replay, Replayed } from '../../model/replay';
import type { LifeKey } from '../../model/words';
import { Panel } from '../Panel/Panel';
import { Partition, Population, type PartPick } from './Bars';
import { Gaps, Hypothetical, Sources, Unknowns, type ListPick } from './Lists';
import { Tickets } from './Tickets';
import { WeekChart, WeekTable } from './WeekChart';

export interface Expect {
  sources: number;
  hypothetical: number;
}

function Stale({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <div className="ol-stale" data-sheen-stale={on || undefined}>
      {children}
    </div>
  );
}

function Rows({ n, tall }: { n: number; tall?: boolean }) {
  return (
    <div className="ol-skel-rows" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="ol-skel-row" data-tall={tall || undefined}>
          <span className="mn-skel" style={{ width: `${46 + ((i * 37) % 30)}%`, height: 10 } as CSSProperties} />
          <span className="mn-skel" style={{ width: 28, height: 10 }} />
        </div>
      ))}
    </div>
  );
}

const asPart = (f: Focus | null): PartPick | null => (f && (f.kind === 'group' || f.kind === 'verdict') ? f : null);
const asList = (f: Focus | null): ListPick | null => (f && (f.kind === 'source' || f.kind === 'gap' || f.kind === 'unknown') ? f : null);

export function Report({
  replay,
  stale,
  expect,
  narrowing,
  onFocus,
  onLife,
  onWeeks,
  onQuery,
  tickets,
  ticketCounts,
  focusChip,
  onClearFocus,
  searchRef,
  selected,
  onSelect,
  onOpen,
  limit,
  onMore,
  land,
}: {
  replay: Replay | null;
  stale: boolean;
  expect: Expect;
  narrowing: Narrowing;
  onFocus: (f: Focus | null) => void;
  onLife: (k: LifeKey | null) => void;
  onWeeks: (w: [number, number] | null) => void;
  onQuery: (q: string) => void;
  tickets: Replayed[];
  ticketCounts: Record<LifeKey, number>;
  focusChip: ReactNode;
  onClearFocus: () => void;
  searchRef: RefObject<HTMLInputElement | null>;
  selected: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string, how: 'pointer' | 'key') => void;
  limit: number;
  onMore: () => void;
  /** The first run just landed on a fresh load: its content draws itself in. */
  land: boolean;
}) {
  const r = replay;
  const all = r?.scope.serviceId === 'all';
  const hand = r?.population.closedByHand ?? 0;

  return (
    <div className="ol-rgrid" data-view="replay" data-land={land || undefined} aria-busy={!r || stale}>
      <Panel area="pop" index={0} title="Every ticket in the window" meta={r ? `${num(r.population.total)} · each in one place` : 'Reading the tickets'}>
        {r ? (
          <Stale on={stale}>
            <Population population={r.population} picked={narrowing.life} onPick={onLife} />
            <p className="ol-panel-note">
              Closed is an outcome, not a verdict: someone closed it, and that’s all it says. The replay looks hardest at the <b>{num(hand)}</b> closed by hand.
            </p>
          </Stale>
        ) : (
          <div aria-hidden>
            <span className="mn-skel" style={{ width: '100%', height: 14, borderRadius: 4 }} />
            <div className="ol-skel-key">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className="mn-skel" style={{ width: 110 + ((i * 23) % 40), height: 10 }} />
              ))}
            </div>
          </div>
        )}
      </Panel>

      <Panel area="part" index={1} title="Closed by hand, replayed" meta={r ? `${num(hand)} tickets, one verdict each` : 'Matching'}>
        {r ? (
          <Stale on={stale}>
            <Partition verdicts={r.verdicts} groups={r.groups} picked={asPart(narrowing.focus)} onPick={onFocus} />
          </Stale>
        ) : (
          <div aria-hidden>
            <span className="mn-skel" style={{ width: '100%', height: 22, borderRadius: 4 }} />
            <div className="ol-skel-cols">
              {[3, 2, 2].map((n, c) => (
                <div key={c}>
                  <span className="mn-skel" style={{ width: '70%', height: 12 }} />
                  {Array.from({ length: n }, (_, i) => (
                    <span key={i} className="mn-skel" style={{ width: `${80 - i * 12}%`, height: 10 }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <Panel area="sources" index={2} title="What explains them" meta="Active rules and approved windows">
        {r ? (
          <Stale on={stale}>
            <Sources rows={r.sources} explained={r.groups.explained} picked={asList(narrowing.focus)} onPick={onFocus} />
          </Stale>
        ) : (
          <Rows n={Math.max(1, expect.sources)} />
        )}
      </Panel>

      <Panel
        area="weeks"
        index={3}
        title="Week by week"
        meta={narrowing.weeks && r ? 'Drag again to change, Esc to let go' : 'Drag across weeks to narrow the tickets'}
        table={r ? <WeekTable weeks={r.weeks} /> : undefined}
      >
        {r ? (
          <Stale on={stale}>
            <WeekChart weeks={r.weeks} range={narrowing.weeks} onRange={onWeeks} />
          </Stale>
        ) : (
          <span className="mn-skel ol-skel-chart" data-shape="card" aria-hidden />
        )}
      </Panel>

      <Panel area="gaps" index={4} title="Gaps worth tuning" meta="Closed by hand, nothing explains them">
        {r ? (
          <Stale on={stale}>
            <Gaps gaps={r.gaps} picked={asList(narrowing.focus)} onPick={onFocus} showService={all} />
          </Stale>
        ) : (
          <Rows n={6} tall />
        )}
      </Panel>

      <Panel area="hypo" index={5} title="Hypothetical" meta="Proposed and inactive rules">
        {r ? (
          <Stale on={stale}>
            <Hypothetical rows={r.hypothetical} picked={asList(narrowing.focus)} onPick={onFocus} />
          </Stale>
        ) : (
          <Rows n={Math.max(1, expect.hypothetical)} tall />
        )}
      </Panel>

      <Panel area="unknowns" index={6} title="Unknowns" meta="Couldn’t evaluate, or unavailable">
        {r ? (
          <Stale on={stale}>
            <Unknowns reasons={r.unknowns} total={r.groups.unknown} picked={asList(narrowing.focus)} onPick={onFocus} />
          </Stale>
        ) : (
          <Rows n={3} tall />
        )}
      </Panel>

      <Panel area="tickets" index={7} title="Tickets" meta={r ? `${num(tickets.length)} of ${num(r.population.total)} · newest first` : 'Reading the tickets'}>
        {r ? (
          <Tickets
            rows={tickets}
            total={r.population.total}
            counts={ticketCounts}
            life={narrowing.life}
            onLife={onLife}
            focus={focusChip}
            onClearFocus={onClearFocus}
            query={narrowing.query}
            onQuery={onQuery}
            searchRef={searchRef}
            selected={selected}
            onSelect={onSelect}
            onOpen={onOpen}
            limit={limit}
            onMore={onMore}
            stale={stale}
            showService={all}
          />
        ) : (
          <Rows n={10} />
        )}
      </Panel>
    </div>
  );
}

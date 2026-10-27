/* 1 Board: top talkers get a page of their own. The sidebar's Services item (there today,
 * not built yet) opens it, and G S would go there. The list ranks every service by tickets,
 * incidents or rules over a lookback; the pane shows the picked one in full, with its rules
 * and the way into the Hindcast and the Rules page. */

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ExternalLink, Filter, History } from 'lucide-react';
import { PaneToggles } from '../../../src/components/PaneToggles';
import { Sidebar } from '../../../src/components/Sidebar/Sidebar';
import { useKeyboardShortcuts } from '../../../src/hooks/useKeyboardShortcuts';
import { useTheme } from '../../../src/hooks/useTheme';
import { num, pct } from '../../../src/lib/format';
import { HomePalette } from '../../../src/pages/home/components/Palette/HomePalette';
import { useFlip } from '../../../src/pages/hindcast/hooks/useFlip';
import { dayMonth, TODAY, WEEK } from '../../../src/pages/hindcast/model/labels';
import { MEASURES, changeOf, hrefs, measureOf, ranked, valueOf, words, type Measure } from '../model';
import { Change, MeasureSeg, Meter, Seg, useTalkers } from '../shared';

const LOOKBACKS = [4, 12, 26].map((w) => ({ key: w, label: `${w}w` }));

export function Board() {
  const [measure, setMeasure] = useState<Measure>('tickets');
  const [weeks, setWeeks] = useState(4);
  const list = useTalkers(weeks);
  const order = useMemo(() => ranked(list, measure), [list, measure]);
  const [picked, setPicked] = useState(order[0]!.id);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hideSide, setHideSide] = useState(false);
  const [hideList, setHideList] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const listRef = useRef<HTMLElement>(null);
  useFlip(listRef, order.map((t) => t.id).join());

  // Prototype only: the sidebar's Services item has no page yet, so mark it by hand.
  useEffect(() => {
    const item = [...document.querySelectorAll<HTMLElement>('.mn-side .mn-nav-item')].find((el) => el.textContent === 'Services');
    item?.setAttribute('data-active', '');
    item?.setAttribute('aria-current', 'page');
  }, []);

  const at = order.findIndex((t) => t.id === picked);
  const t = order[at]!;
  const max = Math.max(1, ...order.map((x) => valueOf(x, measure)));
  const step = (by: number) => setPicked(order[Math.max(0, Math.min(order.length - 1, at + by))]!.id);
  const cycle = () => setMeasure((m) => MEASURES[(MEASURES.findIndex((x) => x.key === m) + 1) % MEASURES.length]!.key);
  const go = (to: string) => (window.location.href = to);

  useKeyboardShortcuts({
    tourOpen: false,
    paletteOpen,
    onTogglePalette: () => setPaletteOpen((open) => !open),
    keys: {
      j: () => step(1),
      ArrowDown: () => step(1),
      k: () => step(-1),
      ArrowUp: () => step(-1),
      s: cycle,
      h: () => go(hrefs.hindcast(t.id)),
      r: () => go(hrefs.rules(t.id)),
      '[': () => setHideSide((v) => !v),
      ']': () => setHideList((v) => !v),
    },
  });

  // Keep the picked row in view as J and K walk the list.
  useEffect(() => {
    listRef.current?.querySelector(`[data-flip="${picked}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [picked]);

  const lookback = weeks === 1 ? 'week' : `${weeks} weeks`;
  const m = measureOf(measure);
  const value = valueOf(t, measure);

  return (
    <div className="mn tt-svc" data-hide-side={hideSide || undefined} data-hide-list={hideList || undefined}>
      <Sidebar hidden={hideSide} page={'services' as never} onOpenPalette={() => setPaletteOpen(true)} theme={theme} onToggleTheme={toggleTheme} />

      <aside className="mn-list" inert={hideList}>
        <header className="tt-list-head">
          <h1>Services</h1>
          <p>Who raised the most over the last {lookback}.</p>
          <div className="tt-list-controls">
            <MeasureSeg value={measure} onChange={setMeasure} />
            <Seg label="Lookback" options={LOOKBACKS} value={weeks} onChange={setWeeks} />
          </div>
        </header>

        <nav className="tt-rows" ref={listRef} aria-label={`Services, ranked by ${m.many}`}>
          {order.map((x, i) => (
            <button key={x.id} data-flip={x.id} className="tt-row" data-selected={x.id === picked || undefined} aria-current={x.id === picked || undefined} onClick={() => setPicked(x.id)}>
              <span className="tt-rank">{i + 1}</span>
              <span className="tt-row-main">
                <span className="tt-row-name mn-truncate">{x.name}</span>
                <span className="tt-row-meta mn-truncate">
                  {MEASURES.filter((o) => o.key !== measure)
                    .map((o) => `${num(valueOf(x, o.key))} ${words(valueOf(x, o.key), o.key)}`)
                    .join(' · ')}
                </span>
              </span>
              <span className="tt-row-fig">
                <b>{num(valueOf(x, measure))}</b>
                <Meter value={valueOf(x, measure)} max={max} />
              </span>
            </button>
          ))}
        </nav>

        <footer className="tt-list-foot">
          <span>
            <kbd>J</kbd> <kbd>K</kbd> Navigate
          </span>
          <span>
            <kbd>S</kbd> Rank by
          </span>
          <span>
            <kbd>⌘K</kbd> Commands
          </span>
        </footer>
      </aside>

      <section className="mn-detail">
        <div className="tt-top">
          <PaneToggles hideSide={hideSide} hideList={hideList} onToggleSide={() => setHideSide((v) => !v)} onToggleList={() => setHideList((v) => !v)} listLabel="Service list" />
        </div>
        <div className="tt-scroll">
          <article className="tt-page" key={t.id}>
            <header className="tt-head">
              <p className="tt-eyebrow">
                {at === 0 ? 'Loudest' : `${ordinal(at + 1)} loudest`} by {m.many}, of {order.length} · last {lookback}
              </p>
              <h2>{t.name}</h2>
              <p className="tt-unit">{t.unit}</p>
            </header>

            <p className="tt-lead">
              <b>{t.name}</b> raised <b>{num(t.tickets)}</b> {words(t.tickets, 'tickets')} in the last {lookback}, <b>{pct(t.share)}</b> of every service's, and{' '}
              <b>{num(t.incidents)}</b> became {words(t.incidents, 'incidents')}. It has <b>{num(t.rules.total)}</b> {words(t.rules.total, 'rules')}
              {t.rules.total > 0 && (
                <>
                  : {t.rules.active} active{t.rules.proposed > 0 && `, ${t.rules.proposed} waiting`}
                  {t.rules.inactive > 0 && `, ${t.rules.inactive} off`}
                </>
              )}
              .
            </p>

            <div className="tt-stats">
              <Stat label="Tickets" value={num(t.tickets)} active={measure === 'tickets'}>
                <Change by={changeOf(t.tickets, t.before.tickets)} against={`on the ${lookback} before`} />
              </Stat>
              <Stat label="Incidents" value={num(t.incidents)} active={measure === 'incidents'}>
                <Change by={changeOf(t.incidents, t.before.incidents)} against={`on the ${lookback} before`} />
              </Stat>
              <Stat label="Rules" value={num(t.rules.total)} active={measure === 'rules'}>
                <span className="tt-change">
                  {t.rules.active} active · {t.rules.proposed} waiting · {t.rules.inactive} off
                </span>
              </Stat>
            </div>

            <section className="tt-card">
              <header className="tt-card-head">
                <h3>Tickets, week by week</h3>
                <span>Incidents are part of each week's tickets</span>
              </header>
              <Weeks weekly={t.weekly} weeks={weeks} />
            </section>

            <section className="tt-card">
              <header className="tt-card-head">
                <h3>Its rules</h3>
                <span>{t.rules.total ? `${t.rules.total} written for ${t.name}` : 'None yet'}</span>
              </header>
              {t.ruleList.length ? (
                <ul className="tt-rules">
                  {t.ruleList.map((r) => (
                    <li key={r.id}>
                      <a href={hrefs.rule(r.id)}>
                        <span className="mn-dot" data-status={r.status} aria-hidden />
                        <span className="tt-rule-name mn-truncate">{r.name}</span>
                        <span className="mn-mono tt-rule-id">{r.id}</span>
                        <span className="tt-rule-fig">
                          <b>{num(r.incidentCount)}</b> fitted
                        </span>
                        <span className="tt-rule-status">{r.status === 'proposed' ? 'Waiting' : r.status === 'active' ? 'Active' : 'Off'}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mn-empty">No rules for {t.name} yet. Rules proposed overnight appear on the Rules page.</p>
              )}
            </section>

            <div className="tt-actions">
              <a className="mn-btn" href={hrefs.hindcast(t.id)}>
                <History size={15} /> Open in Hindcast <kbd>H</kbd>
              </a>
              <a className="mn-btn" href={hrefs.rules(t.id)}>
                <Filter size={15} /> Its rules <kbd>R</kbd>
              </a>
              <span className="tt-actions-note">
                <ExternalLink size={12} /> Both open the app on {t.name}
              </span>
            </div>
            <p className="mn-sr" aria-live="polite">
              {t.name}, {num(value)} {words(value, measure)}
            </p>
          </article>
        </div>
      </section>

      <HomePalette open={paletteOpen} onOpenChange={setPaletteOpen} onNavigate={(to) => go(`/${to}`)} theme={theme} onToggleTheme={toggleTheme} />
    </div>
  );
}

function Stat({ label, value, active, children }: { label: string; value: string; active: boolean; children: ReactNode }) {
  return (
    <div className="tt-stat" data-active={active || undefined}>
      <span className="tt-stat-label">{label}</span>
      <b>{value}</b>
      {children}
    </div>
  );
}

/** The lookback's weeks as bars, each labelled with its count; the latest week in fg. */
function Weeks({ weekly, weeks }: { weekly: number[]; weeks: number }) {
  const max = Math.max(1, ...weekly);
  const from = TODAY - weeks * WEEK;
  const every = weeks > 12 ? 4 : weeks > 4 ? 2 : 1;
  return (
    <div className="tt-wk" style={{ '--n': weekly.length } as CSSProperties}>
      {weekly.map((n, i) => (
        <div key={i} className="tt-wk-col" data-now={i === weekly.length - 1 || undefined} title={`Week of ${dayMonth(from + i * WEEK)}: ${n} tickets`}>
          <span className="tt-wk-n">{weeks <= 12 ? n : ''}</span>
          <span className="tt-wk-bar" style={{ transform: `scaleY(${Math.max(0.02, n / max)})` }} />
          <span className="tt-wk-date">{i % every === 0 ? dayMonth(from + i * WEEK) : ''}</span>
        </div>
      ))}
    </div>
  );
}

const ordinal = (n: number) => `${n}${n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : n === 1 ? 'st' : 'th'}`;

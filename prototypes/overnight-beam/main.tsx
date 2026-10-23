/* Throwaway prototype: three lights for the "Found overnight" card, behind a picker.
 * Open http://localhost:5188/prototypes/overnight-beam/ with the dev server running.
 * Nothing in src/ imports from here; delete the folder once a direction is chosen. */

import { StrictMode, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronDown, Sun } from 'lucide-react';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '../../src/styles/base.css';
import '../../src/styles/theme.css';
import '../../src/styles/ui.css';
import '../../src/styles/shell.css';
import '../../src/pages/rule-management/components/RuleList/RuleList.css';
import '../../src/pages/rule-management/components/RuleList/OvernightBlock.css';
import './proto.css';
import { NIGHT_TOTAL, SUGGESTIONS, type BeamProps, type Suggestion } from './shared';
import { TallyBeam } from './variants/Tally';
import { PingBeam } from './variants/Ping';
import { FollowBeam } from './variants/Follow';

const VARIANTS: { name: string; Beam: ComponentType<BeamProps> }[] = [
  { name: 'Tally', Beam: TallyBeam },
  { name: 'Ping', Beam: PingBeam },
  { name: 'Follow', Beam: FollowBeam },
];

const RULES = [
  { id: 'RUL-0435', name: 'Superlaser pre-charge sequence warnings', group: 'Reactor Core', status: 'proposed', conf: '47%', inc: 11 },
  { id: 'RUL-0428', name: 'Stormtrooper armour fitting ticket duplicates', group: 'Armory & Logistics', status: 'proposed', conf: '95%', inc: 121 },
  { id: 'RUL-0433', name: 'Hyperdrive fault codes on impounded YT-1300', group: 'Hyperdrive Maintenance', status: 'active', conf: '88%', inc: 15 },
  { id: 'RUL-0421', name: 'Cell 2187 door sensor false-open', group: 'Detention Block AA-23', status: 'active', conf: '91%', inc: 27 },
  { id: 'RUL-0424', name: 'Deck 12 CO2 warnings during shift change', group: 'Life Support', status: 'inactive', conf: '84%', inc: 97 },
];

function Page({ Beam }: { Beam: ComponentType<BeamProps> }) {
  const [open, setOpen] = useState<Suggestion[]>(SUGGESTIONS);
  const [selectedId, setSelectedId] = useState<string | null>(RULES[0].id);
  const [handled, setHandled] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const card = useRef<HTMLDivElement>(null);

  const rows = [...(collapsed || gone ? [] : open.map((s) => s.id)), ...RULES.map((r) => r.id)];
  const suggestion = open.find((s) => s.id === selectedId);
  const rule = RULES.find((r) => r.id === selectedId);

  const handle = (id: string) => {
    const at = open.findIndex((s) => s.id === id);
    const rest = open.filter((s) => s.id !== id);
    setOpen(rest);
    setHandled((n) => n + 1);
    setSelectedId(rest[Math.min(at, rest.length - 1)]?.id ?? RULES[0].id);
    if (rest.length === 0) {
      setLeaving(true);
      setTimeout(() => setGone(true), 150);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const at = rows.indexOf(selectedId ?? '');
      if (k === 'j' || e.key === 'ArrowDown') setSelectedId(rows[Math.min(at + 1, rows.length - 1)]);
      else if (k === 'k' || e.key === 'ArrowUp') setSelectedId(rows[Math.max(at - 1, 0)]);
      else if ((k === 'a' || k === 'x') && suggestion) handle(suggestion.id);
      else if (k === 'o' && !gone) setCollapsed((c) => !c);
      else if (k === 't') toggleTheme();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const inPatterns = open.reduce((n, s) => n + s.incidents, 0);

  return (
    <div className="mn proto-shell">
      <aside className="mn-side proto-side">
        <div className="proto-brand">Imperial Ops</div>
        {['Home', 'Incidents', 'Alerts', 'Rules', 'Hindcast', 'Change windows'].map((n) => (
          <div key={n} className="proto-nav" data-active={n === 'Rules' || undefined}>
            {n}
          </div>
        ))}
        <button className="proto-theme" onClick={toggleTheme} aria-label="Switch theme (T)">
          <Sun size={15} />
        </button>
      </aside>

      <section className="mn-list">
        <div className="mn-list-head">
          <div className="mn-list-title">
            <h1>Rules</h1>
          </div>
        </div>
        <div className="mn-rows" role="listbox">
          {!gone && (
            <div
              ref={card}
              className="mn-overnight"
              data-collapsed={collapsed || undefined}
              data-leaving={leaving || undefined}
              inert={leaving}
            >
              <Beam card={card} all={SUGGESTIONS} open={open} selectedId={selectedId} handled={handled} collapsed={collapsed} />
              <button className="mn-overnight-head" aria-expanded={!collapsed} onClick={() => setCollapsed((c) => !c)}>
                <ChevronDown size={13} />
                <span className="mn-overnight-title">
                  Found overnight <b data-count>{open.length}</b>
                </span>
                <span className="mn-overnight-sum">
                  {inPatterns} of {NIGHT_TOTAL} incidents
                </span>
                <kbd>O</kbd>
              </button>
              <div className="mn-overnight-share" aria-hidden>
                {open.map((s) => (
                  <span key={s.id} data-on={s.id === selectedId || undefined} style={{ flexGrow: s.incidents }} />
                ))}
                <span data-rest style={{ flexGrow: NIGHT_TOTAL - inPatterns }} />
              </div>
              {!collapsed &&
                open.map((s) => (
                  <div
                    key={s.id}
                    data-id={s.id}
                    role="option"
                    aria-selected={s.id === selectedId}
                    className="mn-row"
                    data-selected={s.id === selectedId || undefined}
                    onClick={() => setSelectedId(s.id)}
                  >
                    <span className="mn-dot" data-status="suggested" aria-label="Suggested" />
                    <div className="mn-row-main">
                      <div className="mn-row-name">{s.name}</div>
                      <div className="mn-row-meta">
                        {s.hides > 0 ? <span className="mn-bad">Hides {s.hides} that needed a person</span> : <span>{s.group}</span>}
                      </div>
                    </div>
                    <div className="mn-row-side">
                      <span className="mn-row-conf">{Math.round(s.confidence * 100)}%</span>
                      <span className="mn-subtle">{s.incidents} inc</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
          {RULES.map((r) => (
            <div
              key={r.id}
              role="option"
              aria-selected={r.id === selectedId}
              className="mn-row"
              data-selected={r.id === selectedId || undefined}
              onClick={() => setSelectedId(r.id)}
            >
              <span className="mn-dot" data-status={r.status} />
              <div className="mn-row-main">
                <div className="mn-row-name">{r.name}</div>
                <div className="mn-row-meta">
                  <span className="mn-mono">{r.id}</span>
                  <span>{r.group}</span>
                </div>
              </div>
              <div className="mn-row-side">
                <span>{r.conf}</span>
                <span className="mn-subtle">{r.inc} inc</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mn-hints">
          <span>
            <kbd>J</kbd>
            <kbd>K</kbd> Navigate
          </span>
          <span>
            <kbd>A</kbd>
            <kbd>X</kbd> Propose, dismiss
          </span>
          <span>
            <kbd>T</kbd> Theme
          </span>
        </div>
      </section>

      <main className="mn-detail proto-detail">
        {suggestion ? (
          <>
            <div className="proto-eyebrow">
              <span className="mn-dot" data-status="suggested" /> Found overnight
            </div>
            <h2>{suggestion.name}</h2>
            <p className="proto-sub">
              {suggestion.group} · {suggestion.incidents} incidents last night · {Math.round(suggestion.confidence * 100)}% confident
            </p>
            <div className="proto-actions">
              <button className="mn-btn" data-variant="primary" onClick={() => handle(suggestion.id)}>
                Propose <kbd>A</kbd>
              </button>
              <button className="mn-btn" onClick={() => handle(suggestion.id)}>
                Dismiss <kbd>X</kbd>
              </button>
            </div>
          </>
        ) : rule ? (
          <>
            <div className="proto-eyebrow">
              <span className="mn-mono">{rule.id}</span>
            </div>
            <h2>{rule.name}</h2>
            <p className="proto-sub">
              Scoped to {rule.group} · {rule.inc} incidents in 90 days
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
}

function toggleTheme() {
  const root = document.documentElement;
  root.dataset.mnTheme = root.dataset.mnTheme === 'light' ? 'dark' : 'light';
}

function Picker({ current, onPick, onReplay }: { current: number; onPick: (i: number) => void; onReplay: () => void }) {
  const nav = useRef<HTMLElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const move = () => {
      const el = items.current[current];
      if (!el || !highlight.current) return;
      highlight.current.style.width = el.offsetWidth + 'px';
      highlight.current.style.transform = `translateX(${el.offsetLeft}px)`;
    };
    move();
    window.addEventListener('resize', move);
    return () => window.removeEventListener('resize', move);
  }, [current]);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= VARIANTS.length) onPick(num - 1);
      else if (e.key === 'ArrowRight') onPick((current + 1) % VARIANTS.length);
      else if (e.key === 'ArrowLeft') onPick((current - 1 + VARIANTS.length) % VARIANTS.length);
      else if (e.key === 'r' || e.key === 'R') onReplay();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [current, onPick, onReplay]);

  return (
    <nav ref={nav} className="proto-picker" aria-label="Prototype variants" data-ready={ready || undefined}>
      <span ref={highlight} className="proto-picker-highlight" aria-hidden="true" />
      {VARIANTS.map((v, i) => (
        <button
          key={v.name}
          ref={(el) => {
            items.current[i] = el;
          }}
          className="proto-picker-item"
          data-active={i === current || undefined}
          aria-current={i === current ? 'true' : undefined}
          onClick={() => onPick(i)}
        >
          {v.name}
        </button>
      ))}
      <span className="proto-picker-divider" aria-hidden="true" />
      <button className="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" onClick={onReplay}>
        ↻
      </button>
    </nav>
  );
}

function App() {
  const [current, setCurrent] = useState(() => {
    const v = (parseInt(new URLSearchParams(location.search).get('v') ?? '', 10) || 1) - 1;
    return v >= 0 && v < VARIANTS.length ? v : 0;
  });
  const [mount, setMount] = useState(0);

  const pick = (i: number) => {
    setCurrent(i);
    setMount((m) => m + 1);
    const url = new URL(location.href);
    url.searchParams.set('v', String(i + 1));
    history.replaceState(null, '', url);
  };

  const { Beam } = VARIANTS[current];
  return (
    <>
      <Page key={`${current}-${mount}`} Beam={Beam} />
      <Picker current={current} onPick={pick} onReplay={() => setMount((m) => m + 1)} />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

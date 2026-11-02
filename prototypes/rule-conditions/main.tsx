/* Throwaway prototype: four ways to show a rule's conditions without a code block.
 * Open http://localhost:5188/prototypes/rule-conditions/ with the dev server running.
 * Nothing in src/ imports from here; delete the folder once a direction is chosen.
 *
 * Today the Evidence section shows a rule's conditions as a query (`where ci matches …`).
 * Each variant replaces only that block; everything around it is the Rules page's own
 * components and data, so the choice is made in place. Whichever wins also replaces the
 * Change windows "Covers" block and the two "why it matched" lists.
 *
 *   1 Spec      layout: a labelled table in plain words, set like the facts beneath it
 *   2 Sentence  language: one sentence you can read aloud; hover a value for the exact condition
 *   3 Sieve     evidence: each condition narrows the group's incidents, with the counts
 *   4 Chips     interaction: compact pills; press one for what it means and what it keeps out
 *
 * Keys: 1–4 or ← → variant, R replay, J K rule, T theme. Address: ?v=1..4. */

import { StrictMode, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '../../src/styles/base.css';
import '../../src/styles/theme.css';
import '../../src/styles/ui.css';
import '../../src/styles/shell.css';
import '../../src/pages/rule-management/components/RuleList/RuleList.css';
import '../../src/pages/rule-management/components/RuleDetail/RuleDetail.css';
import '../../src/pages/rule-management/components/RuleDetail/Evidence.css';
import '../../src/styles/accessibility.css';
import './proto.css';
import './variants/variants.css';
import { Sidebar } from '../../src/components/Sidebar/Sidebar';
import { useKeyboardShortcuts } from '../../src/hooks/useKeyboardShortcuts';
import { useTheme } from '../../src/hooks/useTheme';
import { pct, shortDate } from '../../src/lib/format';
import { ActionButtons } from '../../src/pages/rule-management/components/common/ActionButtons';
import { WeeklyBars } from '../../src/pages/rule-management/components/common/WeeklyBars';
import { IncidentList } from '../../src/pages/rule-management/components/Incidents/IncidentList';
import { AlsoInGroup } from '../../src/pages/rule-management/components/RuleDetail/AlsoInGroup';
import { DecisionCard } from '../../src/pages/rule-management/components/RuleDetail/DecisionCard';
import { History } from '../../src/pages/rule-management/components/RuleDetail/History';
import { ImpactCard } from '../../src/pages/rule-management/components/RuleDetail/ImpactCard';
import { Stats } from '../../src/pages/rule-management/components/RuleDetail/Stats';
import { RULES, groupById } from '../../src/pages/rule-management/data/mockData';
import { usePaneMode } from '../../src/pages/rule-management/hooks/usePaneMode';
import { SOURCE_LABEL, statusLabel } from '../../src/pages/rule-management/model/labels';
import type { Rule } from '../../src/pages/rule-management/model/types';
import { Spec } from './variants/Spec';
import { Sentence } from './variants/Sentence';
import { Sieve } from './variants/Sieve';
import { Chips } from './variants/Chips';

export interface VariantProps {
  rule: Rule;
}

const VARIANTS: { name: string; Block: ComponentType<VariantProps> }[] = [
  { name: 'Spec', Block: Spec },
  { name: 'Sentence', Block: Sentence },
  { name: 'Sieve', Block: Sieve },
  { name: 'Chips', Block: Chips },
];

const params = new URLSearchParams(location.search);
const noop = () => {};

/** The Evidence section as the Rules page has it, with the conditions block swapped for the variant. */
function Evidence({ rule, Block, mount }: { rule: Rule; Block: ComponentType<VariantProps>; mount: string }) {
  const escalated = rule.related.filter((i) => i.resolution === 'escalated');
  return (
    <section className="mn-sec">
      <h3>Evidence</h3>
      <p className="mn-p">{rule.evidence.summary}</p>
      {escalated.length > 0 && (
        <div className="mn-callout">
          <AlertTriangle size={14} />
          <span>
            Matched a real incident: <strong>{escalated[0].title}</strong> <span className="mn-mono">{escalated[0].id}</span>
          </span>
          <button className="mn-link">Open</button>
        </div>
      )}
      <Block key={mount} rule={rule} />
      <dl className="mn-kv">
        <div>
          <dt>Median clear</dt>
          <dd>{rule.evidence.medianClear}</dd>
        </div>
        <div>
          <dt>Recurrence</dt>
          <dd>{rule.evidence.recurrence}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{shortDate(rule.createdAt)}</dd>
        </div>
      </dl>
    </section>
  );
}

function Page({ current, replays }: { current: number; replays: number }) {
  const [id, setId] = useState(params.get('rule') ?? 'RUL-0435');
  const [theme, toggleTheme] = useTheme();
  const [detailRef, mode] = usePaneMode();
  const rule = RULES.find((r) => r.id === id) ?? RULES[0];
  const group = groupById(rule.groupId);
  const { Block, name } = VARIANTS[current];
  const mount = `${name}-${replays}`;

  const move = (by: number) => {
    const i = RULES.findIndex((r) => r.id === rule.id);
    const next = RULES[Math.min(RULES.length - 1, Math.max(0, i + by))];
    setId(next.id);
    document.querySelector(`[data-rule="${next.id}"]`)?.scrollIntoView({ block: 'nearest' });
  };

  useKeyboardShortcuts({
    tourOpen: false,
    paletteOpen: false,
    onTogglePalette: noop,
    keys: { j: () => move(1), ArrowDown: () => move(1), k: () => move(-1), ArrowUp: () => move(-1), t: toggleTheme },
  });

  const header = (
    <>
      <div className="mn-detail-top">
        <span className="mn-mono mn-subtle">{rule.id}</span>
        <span className="mn-badge" data-status={rule.status}>
          <span className="mn-dot" data-status={rule.status} />
          {statusLabel(rule)}
        </span>
      </div>
      <h2 className="mn-title">{rule.name}</h2>
      <div className="mn-scope">
        <ShieldCheck size={14} />
        Scoped to <strong>{group.name}</strong>
        <span className="mn-subtle">· {group.unit}</span>
        <span className="mn-sep" />
        {rule.source === 'operator' ? rule.sourceDetail : `${SOURCE_LABEL[rule.source]} · ${rule.sourceDetail.split(' ').pop()}`}
      </div>
    </>
  );
  const volume = (
    <section className="mn-sec">
      <h3>
        Matched incidents per week <span className="mn-subtle">{rule.incidentCount} total</span>
      </h3>
      <WeeklyBars data={rule.evidence.weekly} height={72} />
    </section>
  );
  const related = (
    <section className="mn-sec">
      <h3>
        Related incidents
        <button className="mn-link">View all {rule.incidentCount}</button>
      </h3>
      <IncidentList incidents={rule.related} wide={mode !== 'narrow'} onOpen={noop} />
    </section>
  );

  return (
    <div className="mn">
      <Sidebar hidden={false} page="rules" onOpenPalette={noop} theme={theme} onToggleTheme={toggleTheme} />

      <section className="mn-list">
        <header className="mn-list-head">
          <div className="mn-list-title">
            <h1>Rules</h1>
          </div>
        </header>
        <div className="mn-rows" role="listbox" aria-label="Rules">
          {RULES.map((r) => (
            <div
              key={r.id}
              data-rule={r.id}
              className="mn-row"
              role="option"
              aria-selected={r.id === rule.id}
              data-selected={r.id === rule.id || undefined}
              onClick={() => setId(r.id)}
            >
              <span className="mn-dot" data-status={r.status} aria-label={statusLabel(r)} />
              <div className="mn-row-main">
                <div className="mn-row-name">{r.name}</div>
                <div className="mn-row-meta">
                  <span className="mn-mono">{r.id}</span>
                  <span>{r.evidence.conditions.length} conditions</span>
                </div>
              </div>
              <div className="mn-row-side">
                <span className="mn-row-conf">{pct(r.confidence)}</span>
                <span className="mn-subtle">{r.incidentCount} inc</span>
              </div>
            </div>
          ))}
        </div>
        <footer className="mn-hints">
          <span>
            <kbd>J</kbd> <kbd>K</kbd> Navigate
          </span>
          <span>
            <kbd>T</kbd> Theme
          </span>
        </footer>
      </section>

      <section className="mn-detail" ref={detailRef}>
        {mode === 'narrow' ? (
          <div className="mn-detail-inner">
            <div className="mn-detail-scroll" data-floating>
              {header}
              <Stats rule={rule} />
              <Evidence rule={rule} Block={Block} mount={mount} />
              {volume}
              {related}
              <History rule={rule} />
            </div>
            <div className="mn-actionbar">
              <span className="mn-subtle mn-actionbar-note">Every change needs a written reason</span>
              <ActionButtons rule={rule} onAction={noop} />
            </div>
          </div>
        ) : (
          <div className="mn-detail-inner">
            <div className="mn-detail-scroll">
              <div className="mn-wide" data-mode="wide">
                <header className="mn-wide-head">{header}</header>
                <div className="mn-col">
                  <Stats rule={rule} />
                  <Evidence rule={rule} Block={Block} mount={mount} />
                  {volume}
                  {related}
                </div>
                <aside className="mn-rail" aria-label="Decision">
                  <div className="mn-rail-card">
                    <DecisionCard rule={rule} onAction={noop} />
                  </div>
                  <ImpactCard rule={rule} />
                  <History rule={rule} />
                  <AlsoInGroup rule={rule} rules={RULES} onSelect={setId} />
                </aside>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------- the picker: PICKER.md, verbatim in structure and behaviour ---------- */

function Picker({ current, onPick, onReplay }: { current: number; onPick: (i: number) => void; onReplay: () => void }) {
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

  return (
    <nav className="proto-picker" aria-label="Prototype variants" data-ready={ready || undefined}>
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
    const v = (parseInt(params.get('v') ?? '', 10) || 1) - 1;
    return v >= 0 && v < VARIANTS.length ? v : 0;
  });
  const [replays, setReplays] = useState(0);

  const pick = (i: number) => {
    if (i < 0 || i >= VARIANTS.length) return;
    setCurrent(i);
    setReplays((n) => n + 1);
    const url = new URL(location.href);
    url.searchParams.set('v', String(i + 1));
    history.replaceState(null, '', url);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= VARIANTS.length) pick(n - 1);
      else if (e.key === 'ArrowRight') pick((current + 1) % VARIANTS.length);
      else if (e.key === 'ArrowLeft') pick((current - 1 + VARIANTS.length) % VARIANTS.length);
      else if (e.key === 'r' || e.key === 'R') setReplays((n) => n + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="mn mn-app">
      <Page current={current} replays={replays} />
      <Picker current={current} onPick={pick} onReplay={() => setReplays((n) => n + 1)} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/* Throwaway prototype: three waiting states for an incident's story, behind a picker.
 * Open http://localhost:5188/prototypes/story-loading/ with the dev server running.
 * Nothing in src/ imports from here; delete the folder once a direction is chosen.
 *
 * Keys: J K step, click a row, R fetch again, H hold the wait open, N open one by its
 * number alone, T theme, 1 2 3 variant. ?hold=1 holds from the start.
 *
 * Chosen: Trace, built into src/pages/incidents. Every incident meets the same six
 * checkpoints, so Trace draws only what is certain, and the dot that runs the empty line is
 * the one that plays the real journey when it lands. Outline guesses the page's length (an
 * incident reaches anywhere from one to six sections) and reads like any app's skeleton.
 * Say is honest and calm, but leaves the pane empty, so the whole page lands at once, and
 * its shimmer barely starts in a 700ms wait. */

import { StrictMode, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { Server, Sun } from 'lucide-react';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '../../src/styles/base.css';
import '../../src/styles/theme.css';
import '../../src/styles/ui.css';
import '../../src/styles/shell.css';
import '../../src/pages/incidents/IncidentsPage.css';
import '../../src/styles/accessibility.css';
import './proto.css';
import { groupById } from '../../src/pages/rule-management/data/mockData';
import { useRulesStore } from '../../src/pages/rule-management/hooks/useRulesStore';
import { IncidentSearch } from '../../src/pages/incidents/components/IncidentSearch/IncidentSearch';
import { Journey } from '../../src/pages/incidents/components/Journey/Journey';
import { Stages } from '../../src/pages/incidents/components/Stages/Stages';
import { lifecycles } from '../../src/pages/incidents/data/mockData';
import { END_LABEL, dayAndTime } from '../../src/pages/incidents/model/lifecycle';
import type { WaitingProps } from './shared';
import { TraceWaiting } from './variants/Trace';
import { OutlineWaiting } from './variants/Outline';
import { SayWaiting } from './variants/Say';

const VARIANTS: { name: string; Waiting: ComponentType<WaitingProps> }[] = [
  { name: 'Trace', Waiting: TraceWaiting },
  { name: 'Outline', Waiting: OutlineWaiting },
  { name: 'Say', Waiting: SayWaiting },
];

const STORY_WAIT = 700;
const params = new URLSearchParams(location.search);

function Page({ Waiting }: { Waiting: ComponentType<WaitingProps> }) {
  const rules = useRulesStore((s) => s.rules);
  const lives = useMemo(() => lifecycles(rules), [rules]);
  const [query, setQuery] = useState('');
  const asked = query.trim();
  const found = useMemo(
    () => (asked ? lives.filter((l) => `${l.incident.id} ${l.incident.title} ${l.incident.ci}`.toLowerCase().includes(asked.toLowerCase())) : lives.slice(0, 12)),
    [lives, asked],
  );
  const [selectedId, setSelectedId] = useState<string | null>(params.get('id') ?? lives[1].incident.id);
  const [via, setVia] = useState<'pointer' | 'key'>('pointer');
  const [fetched, setFetched] = useState<ReadonlySet<string>>(new Set());
  const [hold, setHold] = useState(params.has('hold'));
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedId || fetched.has(selectedId) || hold) return;
    const timer = setTimeout(() => setFetched((ids) => new Set(ids).add(selectedId)), STORY_WAIT);
    return () => clearTimeout(timer);
  }, [selectedId, fetched, hold]);

  const pick = (id: string, how: 'pointer' | 'key') => {
    setVia(how);
    setSelectedId(id);
  };
  const move = (step: number) => {
    const i = found.findIndex((l) => l.incident.id === selectedId);
    const next = i < 0 ? found[0] : found[Math.min(found.length - 1, Math.max(0, i + step))];
    if (next) pick(next.incident.id, 'key');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (k === 'j' || e.key === 'ArrowDown') move(1);
      else if (k === 'k' || e.key === 'ArrowUp') move(-1);
      else if (k === 'h') setHold((h) => !h);
      else if (k === 'n') pick(lives[40].incident.id, 'pointer');
      else if (k === 't') toggleTheme();
      else if (e.key === 'Escape') setSelectedId(null);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const life = selectedId && fetched.has(selectedId) ? (lives.find((l) => l.incident.id === selectedId) ?? null) : null;
  const row = found.find((l) => l.incident.id === selectedId);
  const group = life && groupById(life.groupId);
  const tone = !life ? undefined : life.end === 'suppressed' && life.real ? 'bad' : life.end === 'enriching' ? 'wait' : life.end === 'delivered' ? 'through' : undefined;
  const known = life ?? row;
  const knownTone = known && known.end === 'suppressed' && known.real ? 'bad' : known?.end === 'enriching' ? 'wait' : known?.end === 'delivered' ? 'through' : undefined;

  return (
    <div className="mn ic proto-shell">
      <aside className="mn-side proto-side">
        <div className="proto-brand">Imperial Ops</div>
        {['Home', 'Incidents', 'Alerts', 'Rules', 'Hindcast', 'Change windows'].map((n) => (
          <div key={n} className="proto-nav" data-active={n === 'Incidents' || undefined}>
            {n}
          </div>
        ))}
        <button className="proto-theme" onClick={toggleTheme} aria-label="Switch theme (T)">
          <Sun size={15} />
        </button>
      </aside>

      <IncidentSearch
        hidden={false}
        lives={found}
        asked={asked}
        searching={false}
        query={query}
        onQuery={setQuery}
        selectedId={selectedId}
        onSelect={(id) => pick(id, 'pointer')}
        searchRef={searchRef}
      />

      <section className="mn-detail">
        <div className="ic-scroll">
          <div className="ic-top">
            {selectedId && (
              <>
                <span className="mn-mono mn-subtle">{selectedId}</span>
                {known && (
                  <span className="ic-badge" data-tone={knownTone}>
                    {END_LABEL[known.end]}
                  </span>
                )}
              </>
            )}
            {hold && <span className="proto-hold">Holding the wait open (H)</span>}
          </div>

          {life && group ? (
            <article className="ic-page" data-arrive={via === 'pointer' || undefined}>
              <header className="ic-head">
                <h2>{life.incident.title}</h2>
                <div className="ic-meta">
                  <Server size={14} />
                  <span className="mn-mono">{life.incident.ci}</span>
                  <span className="mn-subtle">
                    · {group.name} · {group.unit}
                  </span>
                  <span className="ic-sep" />
                  Raised {dayAndTime(new Date(life.incident.openedAt).getTime())}
                </div>
                <p className="ic-verdict" data-tone={tone}>
                  {life.summary}
                </p>
              </header>
              <Journey key={life.incident.id} life={life} play={via === 'pointer'} onJump={() => {}} onReplay={() => {}} />
              <Stages
                life={life}
                activeRules={rules.filter((r) => r.status === 'active').length}
                onOpenRule={() => {}}
                onOpenWindow={() => {}}
                onOpenIncident={(id) => pick(id, 'pointer')}
              />
            </article>
          ) : selectedId ? (
            <article className="ic-page" aria-busy>
              <Waiting id={selectedId} row={row} via={via} />
            </article>
          ) : (
            <div className="ic-blank">
              <h2>Find an incident</h2>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function toggleTheme() {
  const root = document.documentElement;
  root.dataset.mnTheme = root.dataset.mnTheme === 'light' ? 'dark' : 'light';
}

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
      <button className="proto-picker-item proto-picker-replay" aria-label="Fetch again (R)" onClick={onReplay}>
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
  const [mount, setMount] = useState(0);

  const pick = (i: number) => {
    setCurrent(i);
    setMount((m) => m + 1);
    const url = new URL(location.href);
    url.searchParams.set('v', String(i + 1));
    history.replaceState(null, '', url);
  };

  const { Waiting } = VARIANTS[current];
  return (
    <>
      <Page key={`${current}-${mount}`} Waiting={Waiting} />
      <Picker current={current} onPick={pick} onReplay={() => setMount((m) => m + 1)} />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/* Throwaway prototype: six ways the incidents page can wait, the list and the pane as one,
 * behind a picker. Open http://localhost:5188/prototypes/incidents-loading/ with the dev
 * server running. Nothing in src/ imports from here; delete the folder once a direction is
 * chosen.
 *
 * The problem it explored: the pane used to wait by drawing the journey's own line with its
 * own dot running it, so a slow fetch looked like a journey that broke. Sheen won, and is now
 * the product's (mn-skel in src/styles/ui.css); this stays to compare the others against it. And the list and the
 * pane waited in two different ways, at two different times. Every variant here waits in one
 * way across both columns, and none of them draws anything that a real journey draws.
 *
 * Scenarios (top right, or a key): S search, P pick, C cold open (both wait), E nothing found.
 * G Together: on a cold open, the list and the pane land at the same moment (on by default).
 * Keys: R run it again, H hold every wait open, 1–6 variant, J K step, / search, T theme,
 * [ ] tuck the columns away.
 * Address: ?v=1..6 variant, ?s=search|pick|cold|empty, ?hold=1, ?apart=1, ?theme=light,
 * ?bare=1 (no prototype chrome, for screenshots). #/incidents/INC-41201 opens cold on it. */

import { StrictMode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Server } from 'lucide-react';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '../../src/styles/base.css';
import '../../src/styles/theme.css';
import '../../src/styles/ui.css';
import '../../src/styles/shell.css';
import '../../src/pages/incidents/IncidentsPage.css';
import '../../src/pages/incidents/components/IncidentSearch/IncidentSearch.css';
import '../../src/styles/accessibility.css';
import './proto.css';
import { PaneToggles } from '../../src/components/PaneToggles';
import { Sidebar } from '../../src/components/Sidebar/Sidebar';
import { useTheme } from '../../src/hooks/useTheme';
import { num } from '../../src/lib/format';
import { groupById } from '../../src/pages/rule-management/data/mockData';
import { useRulesStore } from '../../src/pages/rule-management/hooks/useRulesStore';
import { Journey } from '../../src/pages/incidents/components/Journey/Journey';
import { Stages } from '../../src/pages/incidents/components/Stages/Stages';
import { lifecycles } from '../../src/pages/incidents/data/mockData';
import { END_LABEL, dayAndTime } from '../../src/pages/incidents/model/lifecycle';
import type { Lifecycle } from '../../src/pages/incidents/model/types';
import { IncidentRow, LATEST, PAGE, readySays, useBlockClock, type ListWait, type Row, type Variant } from './shared';
import { sheen } from './variants/Sheen';
import { wave } from './variants/Wave';
import { unison } from './variants/Unison';
import { thread } from './variants/Thread';
import { veil } from './variants/Veil';
import { mark } from './variants/Mark';

const VARIANTS: Variant[] = [sheen, wave, unison, thread, veil, mark];

type Scenario = 'search' | 'pick' | 'cold' | 'empty';
const SCENARIOS: { id: Scenario; key: string; label: string }[] = [
  { id: 'search', key: 's', label: 'Search' },
  { id: 'pick', key: 'p', label: 'Pick' },
  { id: 'cold', key: 'c', label: 'Cold open' },
  { id: 'empty', key: 'e', label: 'Nothing found' },
];

/** After the last keystroke, before the search is sent. The page's own value. */
const SEARCH_WAIT = 220;
/** A search's round trip. Fake, like the data, and a little slow so the wait can be seen. */
const FETCH_WAIT = 900;
/** An incident's journey's round trip. */
const STORY_WAIT = 1100;
/** The scripted scenarios start after a beat, so the state before is seen. */
const START = 600;
const KEY_GAP = 70;
const TYPED: Partial<Record<Scenario, string>> = { search: 'reactor', empty: 'kessel run' };

const params = new URLSearchParams(location.search);
const linked = location.hash.match(/^#\/incidents\/(INC-\d+)/)?.[1];
if (params.get('theme') === 'light' || params.get('theme') === 'dark') localStorage.setItem('mn-theme', params.get('theme')!);

/** The search, as the page runs it over the mock data. */
function search(lives: Lifecycle[], asked: string) {
  if (!asked) return lives.slice(0, LATEST);
  const words = asked.toLowerCase().split(/\s+/).filter(Boolean);
  return lives.filter((l) => {
    const haystack = `${l.incident.id} ${l.incident.title} ${l.incident.ci} ${l.rule?.id ?? ''} ${l.rule?.name ?? ''} ${groupById(l.groupId).name}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}

function Page({ variant, scenario, hold, together }: { variant: Variant; scenario: Scenario; hold: boolean; together: boolean }) {
  const rules = useRulesStore((s) => s.rules);
  const lives = useMemo(() => lifecycles(rules), [rules]);
  const cold = scenario === 'cold';
  // A link to an incident that isn't among the latest few, so nothing on screen knows it.
  const coldId = linked ?? lives[40].incident.id;

  const [query, setQuery] = useState('');
  // The search the rows on screen answer.
  const [asked, setAsked] = useState('');
  const [listReady, setListReady] = useState(!cold);
  // What the rows on screen landed from, so they arrive; nothing on the first paint.
  const [arrived, setArrived] = useState<'cold' | 'search' | null>(null);
  const [limit, setLimit] = useState(PAGE);

  const [selectedId, setSelectedId] = useState<string | null>(cold ? coldId : lives[1].incident.id);
  const [fetched, setFetched] = useState<ReadonlySet<string>>(() => new Set(cold ? [] : [lives[1].incident.id]));
  const [via, setVia] = useState<'pointer' | 'key'>('pointer');
  // Opened by its number with nothing on screen to borrow from: the header lands too.
  const [fromLink, setFromLink] = useState(cold);
  // The list and the journey started waiting together (Scan runs one light through both).
  const [coupled, setCoupled] = useState(cold);
  // The one live region's words. Set at moments, not derived, so nothing is said twice.
  const [announce, setAnnounce] = useState('');

  const [hideSide, setHideSide] = useState(false);
  const [hideList, setHideList] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const searchRef = useRef<HTMLInputElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  useBlockClock(rootRef, variant.period ?? 2400);

  const found = useMemo(() => (listReady ? search(lives, asked) : []), [lives, asked, listReady]);
  const shown = Math.min(limit, found.length);
  const q = query.trim();
  const listWait: ListWait | null = !listReady ? { kind: 'cold' } : q && q !== asked ? { kind: 'search', query: q, before: { asked, shown } } : null;

  const land = (answer: string) => {
    const rows = search(lives, answer);
    setAsked(answer);
    setListReady(true);
    setArrived(listReady ? 'search' : 'cold');
    setLimit(PAGE);
    rowsRef.current?.scrollTo({ top: 0 });
    setAnnounce(readySays(answer, rows.length, Math.min(PAGE, rows.length)));
  };

  // The list's request. Hold keeps it out; the debounce still runs, so "sent" is still said.
  useEffect(() => {
    if (!listReady) {
      if (hold) return;
      // Together: on a cold open the list holds its rows until the journey is in too, so the
      // two columns land as one page instead of one after the other.
      const timer = setTimeout(() => land(''), together && cold ? STORY_WAIT : FETCH_WAIT);
      return () => clearTimeout(timer);
    }
    if (q === asked) return;
    if (!q) return land('');
    const sent = setTimeout(() => setAnnounce(`Searching for “${q}”.`), SEARCH_WAIT);
    const answer = hold ? undefined : setTimeout(() => land(q), SEARCH_WAIT + FETCH_WAIT);
    return () => {
      clearTimeout(sent);
      clearTimeout(answer);
    };
  }, [q, asked, listReady, hold, together]);

  // The journey's request. A new pick clears the timer, so a late journey is never shown.
  const detailWaiting = selectedId !== null && !fetched.has(selectedId);
  useEffect(() => {
    if (!detailWaiting || hold) return;
    const timer = setTimeout(() => {
      setFetched((ids) => new Set(ids).add(selectedId));
      setCoupled(false);
    }, STORY_WAIT);
    return () => clearTimeout(timer);
  }, [selectedId, detailWaiting, hold]);

  const pick = (id: string, how: 'pointer' | 'key') => {
    setVia(how);
    setSelectedId(id);
    setFromLink(false);
    setCoupled(false);
    if (!fetched.has(id)) setAnnounce(`Fetching the journey of ${id}.`);
  };

  // The rows the person can see and step through.
  const onScreen = listWait && !variant.keepsRows ? [] : found;
  const move = (step: number) => {
    const i = onScreen.findIndex((l) => l.incident.id === selectedId);
    const next = i < 0 ? onScreen[0] : onScreen[Math.min(onScreen.length - 1, Math.max(0, i + step))];
    if (next) pick(next.incident.id, 'key');
  };

  // The scenario's script: what a person would do, a beat after the page appears.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const typed = TYPED[scenario];
    if (typed) [...typed].forEach((_, i) => timers.push(setTimeout(() => setQuery(typed.slice(0, i + 1)), START + i * KEY_GAP)));
    if (scenario === 'pick') timers.push(setTimeout(() => pick(lives[3].incident.id, 'pointer'), START));
    // A live region doesn't speak what it held at first paint, so the cold open says it a moment in.
    if (cold) timers.push(setTimeout(() => setAnnounce(`Fetching the ${LATEST} latest incidents, and ${coldId}.`), 50));
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [selectedId]);

  useEffect(() => {
    rowsRef.current?.querySelector('[data-selected]')?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).tagName === 'INPUT') {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }
      const k = e.key.toLowerCase();
      if (k === 'j' || e.key === 'ArrowDown') move(1);
      else if (k === 'k' || e.key === 'ArrowUp') move(-1);
      else if (e.key === '/') searchRef.current?.focus();
      else if (k === 't') toggleTheme();
      else if (e.key === '[') setHideSide((h) => !h);
      else if (e.key === ']') setHideList((h) => !h);
      else if (e.key === 'Escape') setSelectedId(null);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const life = selectedId && !detailWaiting ? (lives.find((l) => l.incident.id === selectedId) ?? null) : null;
  const known: Row | undefined = life ?? found.find((l) => l.incident.id === selectedId);
  // A linked incident that's among the latest few is known once the list lands, before its
  // journey does. Its header is already real then, so it mustn't arrive a second time.
  useEffect(() => {
    if (fromLink && detailWaiting && known) setFromLink(false);
  }, [fromLink, detailWaiting, known]);
  const group = life && groupById(life.groupId);
  const tone = !known ? undefined : known.end === 'suppressed' && known.real ? 'bad' : known.end === 'enriching' ? 'wait' : known.end === 'delivered' ? 'through' : undefined;
  const { ListWaiting, DetailWaiting, Overlay } = variant;
  // Where each column starts, for the page-level pieces (the shell's widths: 240 and 380).
  const listLeft = hideSide ? 0 : 240;
  const detailLeft = listLeft + (hideList ? 0 : 380);
  const listBusy = listWait !== null && !hideList;
  const overlaySays =
    listBusy && detailWaiting
      ? `Fetching the ${LATEST} latest, and ${selectedId}…`
      : listBusy
        ? variant.says(listWait!)
        : detailWaiting
          ? `Fetching the journey of ${selectedId}…`
          : '';

  return (
    <div
      ref={rootRef}
      className={`mn ic pl ld ${variant.className}`}
      data-list-waiting={listBusy || undefined}
      data-detail-waiting={detailWaiting || undefined}
      data-hide-side={hideSide || undefined}
      data-hide-list={hideList || undefined}
      data-coupled={coupled || undefined}
    >
      <Sidebar hidden={hideSide} page="incidents" onOpenPalette={() => {}} theme={theme} onToggleTheme={toggleTheme} />

      <aside className="mn-list" inert={hideList}>
        <header className="ic-list-head">
          <div className="ic-list-title">
            <h1>Incidents</h1>
            <span className="mn-subtle">find one</span>
          </div>
          <label className="mn-search">
            <Search size={14} />
            <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find an incident, CI or rule" />
            <kbd>/</kbd>
          </label>
          <p className="ic-list-says mn-truncate" data-waiting={listWait ? true : undefined}>
            {listWait ? variant.says(listWait) : readySays(asked, found.length, shown)}
          </p>
        </header>

        <div
          className="ic-rows"
          ref={rowsRef}
          role="listbox"
          aria-label="Incidents"
          aria-busy={listWait !== null}
          data-arrive={(!listWait && arrived) || undefined}
        >
          {listWait ? (
            <ListWaiting wait={listWait} rows={found.slice(0, limit)} selectedId={selectedId} onSelect={(id) => pick(id, 'pointer')} />
          ) : (
            <>
              {found.slice(0, limit).map((l, i) => (
                <IncidentRow key={l.incident.id} life={l} index={i} selected={l.incident.id === selectedId} onSelect={(id) => pick(id, 'pointer')} />
              ))}
              {found.length > limit && (
                <button className="ic-more" onClick={() => setLimit(limit + PAGE)}>
                  Show more <span className="mn-subtle">{num(found.length - limit)} left</span>
                </button>
              )}
              {!found.length && <div className="mn-empty">Nothing fits “{asked}”. Try its number, its CI or fewer words.</div>}
            </>
          )}
        </div>

        <footer className="ic-list-foot">
          <span>
            <kbd>J</kbd> <kbd>K</kbd> Navigate
          </span>
          <span>
            <kbd>/</kbd> Search
          </span>
          <span>
            <kbd>⌘K</kbd> Commands
          </span>
        </footer>
      </aside>

      <section className="mn-detail">
        <div className="ic-scroll" ref={scrollRef}>
          <div className="ic-top">
            <PaneToggles
              hideSide={hideSide}
              hideList={hideList}
              onToggleSide={() => setHideSide((h) => !h)}
              onToggleList={() => setHideList((h) => !h)}
              listLabel="Incident list"
            />
            {selectedId && <span className="mn-mono mn-subtle">{selectedId}</span>}
            {known ? (
              <span className="ic-badge" data-tone={tone}>
                {END_LABEL[known.end]}
              </span>
            ) : (
              selectedId && variant.badge
            )}
          </div>

          {selectedId ? (
            <article
              className="ic-page"
              aria-label={`The journey of ${selectedId}`}
              aria-busy={detailWaiting}
              data-arrive={via === 'pointer' || undefined}
              data-from-link={fromLink || undefined}
            >
              {detailWaiting ? (
                <DetailWaiting id={selectedId} row={known} />
              ) : (
                life &&
                group && (
                  <>
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
                  </>
                )
              )}
            </article>
          ) : (
            <div className="ic-blank">
              <h2>Find an incident</h2>
            </div>
          )}
        </div>
      </section>

      {Overlay && <Overlay list={listBusy} detail={detailWaiting} says={overlaySays} listLeft={listLeft} detailLeft={detailLeft} />}

      <p className="pl-announce" role="status">
        {announce}
      </p>
    </div>
  );
}

function ScenarioBar({
  current,
  hold,
  together,
  onPick,
  onHold,
  onTogether,
}: {
  current: Scenario;
  hold: boolean;
  together: boolean;
  onPick: (s: Scenario) => void;
  onHold: () => void;
  onTogether: () => void;
}) {
  return (
    <nav className="proto-picker pl-scenarios" aria-label="Prototype scenarios">
      {SCENARIOS.map((s) => (
        <button key={s.id} className="proto-picker-item" data-active={s.id === current || undefined} aria-current={s.id === current ? 'true' : undefined} onClick={() => onPick(s.id)}>
          {s.label} <span className="pl-key">{s.key.toUpperCase()}</span>
        </button>
      ))}
      <span className="proto-picker-divider" aria-hidden="true" />
      <button className="proto-picker-item" data-active={hold || undefined} aria-pressed={hold} onClick={onHold}>
        Hold <span className="pl-key">H</span>
      </button>
      <button
        className="proto-picker-item"
        data-active={together || undefined}
        aria-pressed={together}
        onClick={onTogether}
        title="On a cold open, the list and the pane land at the same moment"
      >
        Together <span className="pl-key">G</span>
      </button>
    </nav>
  );
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
          title={v.idea}
        >
          {v.name}
        </button>
      ))}
      <span className="proto-picker-divider" aria-hidden="true" />
      <button className="proto-picker-item proto-picker-replay" aria-label="Run it again (R)" onClick={onReplay}>
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
  const [scenario, setScenario] = useState<Scenario>(() => (linked ? 'cold' : (SCENARIOS.find((s) => s.id === params.get('s'))?.id ?? 'search')));
  const [hold, setHold] = useState(params.has('hold'));
  const [together, setTogether] = useState(!params.has('apart'));
  const [mount, setMount] = useState(0);

  const remember = (key: string, value: string) => {
    const url = new URL(location.href);
    url.searchParams.set(key, value);
    history.replaceState(null, '', url);
  };
  const pickVariant = (i: number) => {
    setCurrent(i);
    setMount((m) => m + 1);
    remember('v', String(i + 1));
  };
  const pickScenario = (s: Scenario) => {
    setScenario(s);
    setMount((m) => m + 1);
    remember('s', s);
  };
  const replay = () => setMount((m) => m + 1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const num = parseInt(e.key, 10);
      const s = SCENARIOS.find((x) => x.key === k);
      if (num >= 1 && num <= VARIANTS.length) pickVariant(num - 1);
      else if (e.key === 'ArrowRight') pickVariant((current + 1) % VARIANTS.length);
      else if (e.key === 'ArrowLeft') pickVariant((current - 1 + VARIANTS.length) % VARIANTS.length);
      else if (k === 'r') replay();
      else if (k === 'h') setHold((h) => !h);
      else if (k === 'g') {
        setTogether((t) => !t);
        replay();
      }
      else if (s) pickScenario(s.id);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <>
      <Page key={`${current}-${scenario}-${mount}`} variant={VARIANTS[current]} scenario={scenario} hold={hold} together={together} />
      {!params.has('bare') && (
        <>
          <ScenarioBar
            current={scenario}
            hold={hold}
            together={together}
            onPick={pickScenario}
            onHold={() => setHold((h) => !h)}
            onTogether={() => {
              setTogether((t) => !t);
              replay();
            }}
          />
          <Picker current={current} onPick={pickVariant} onReplay={replay} />
        </>
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/* Throwaway prototype: three workspaces for Live analysis, behind a picker.
 * Open http://localhost:5188/prototypes/live-analysis/ with the dev server running.
 * Nothing in src/ imports from here; delete the folder once a direction is chosen.
 *
 * Live analysis is where you bring a file of alerts or incidents, find what keeps repeating,
 * and decide what each pattern deserves: an investigation, or a proposal to suppress it.
 * The file is really read: drop any CSV with a time, a service and an alert name, or use the
 * sample. Every figure is computed from its rows (model.ts).
 *
 *   1 Desk   a list of patterns, one pattern beside it, five lenses as tabs. The app's own
 *            list-and-detail. The upload happens in the pane the pattern will fill.
 *   2 Flow   the review is the layout: four lanes, and a decision is a card dragged to the
 *            next one. The upload is a sheet; the cards are dealt when it's done.
 *   3 Field  the chart is the page: each pattern a bubble, placed by how regular it is and
 *            how often it was real. The file's rows scatter, then gather into patterns.
 *
 * The file, the filters and every decision carry over when you switch, so the same analysis
 * can be compared in all three. R starts over with no file.
 * Keys: 1–3 or ← → variant, R start over, U upload, J K pattern, I P A X decide, / search,
 * [ sidebar, T theme, ⌘K palette. Address: ?v=1..3, ?bare (no picker), ?sample (opens loaded). */

import { StrictMode, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown, Download, FileSpreadsheet, Lock, PanelLeftClose, PanelLeftOpen, ScanSearch, Upload } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '../../src/styles/base.css';
import '../../src/styles/theme.css';
import '../../src/styles/ui.css';
import '../../src/styles/shell.css';
import '../../src/styles/palette.css';
import '../../src/pages/rule-management/components/RuleList/SortMenu.css';
import '../../src/pages/rule-management/components/common/DecisionToast.css';
import './shared.css';
import './variants/variants.css';
import '../../src/styles/accessibility.css';
import './proto.css';
import { Sidebar } from '../../src/components/Sidebar/Sidebar';
import { useSheen } from '../../src/hooks/useSheen';
import { useTheme } from '../../src/hooks/useTheme';
import type { PageId } from '../../src/lib/route';
import { HomePalette } from '../../src/pages/home/components/Palette/HomePalette';
import { ACT_PAST, NEEDS_REASON, NO_REVIEW, PEOPLE, analyse, can, count, download, evidenceCsv, patternsCsv, ACT_STATUS, type Act, type Pattern, type Review, type Role } from './model';
import { useIngest, type Deciding, type Filters, type LensKey, type VariantProps } from './shared';
import { Desk } from './variants/Desk';
import { Field } from './variants/Field';
import { Flow } from './variants/Flow';

const VARIANTS: { name: string; idea: string; Screen: ComponentType<VariantProps> }[] = [
  { name: 'Desk', idea: 'A list of patterns, one beside it, five lenses as tabs', Screen: Desk },
  { name: 'Flow', idea: 'The review as a board: a decision is a card moved to the next lane', Screen: Flow },
  { name: 'Field', idea: 'The chart is the page: where a bubble sits says what to do with it', Screen: Field },
];

const params = new URLSearchParams(location.search);
const bare = params.has('bare');
const ROLES: Role[] = ['governor', 'analyst', 'viewer'];
const EVERY = [1, 2, 3, 4];

function Page({ Screen, nonce }: { Screen: ComponentType<VariantProps>; nonce: string }) {
  const [role, setRole] = useState<Role>('governor');
  const person = PEOPLE[role];
  const ingest = useIngest(person.name);
  const [filters, setFilters] = useState<Filters>({ weeks: 12, service: 'all', sevs: EVERY, query: '' });
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [pick, setPick] = useState<{ key: string | null; arrive: boolean }>({ key: null, arrive: false });
  const [deciding, setDeciding] = useState<Deciding | null>(null);
  const [lens, setLens] = useState<LensKey>('evidence');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hideSide, setHideSide] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const [liveNav, setLiveNav] = useState<Element | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useSheen(root);

  // Prototype only: the page isn't in the sidebar yet, so its row is added to Live from here.
  useLayoutEffect(() => setLiveNav(root.current?.querySelector('[aria-labelledby="mn-nav-live"]') ?? null), []);

  // ?sample opens with the sample already read.
  useEffect(() => {
    if (params.has('sample')) ingest.useSample();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A new file is a new analysis: nothing decided, nothing narrowed.
  const data = ingest.data;
  useEffect(() => {
    setReviews({});
    setPick({ key: null, arrive: false });
    setDeciding(null);
    setLens('evidence');
    setFilters({ weeks: data?.span ?? 12, service: 'all', sevs: EVERY, query: '' });
  }, [data]);

  const analysis = useMemo(() => (data ? analyse(data.rows, { weeks: Math.min(filters.weeks, data.span), service: filters.service, sevs: filters.sevs }, data.ids) : null), [data, filters.weeks, filters.service, filters.sevs]);
  const shown = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return (analysis?.patterns ?? []).filter((p) => !q || `${p.signature} ${p.service} ${p.id}`.toLowerCase().includes(q));
  }, [analysis, filters.query]);
  const picked = analysis?.patterns.find((p) => p.key === pick.key) ?? null;
  const statusOf = (key: string) => (reviews[key] ?? NO_REVIEW).status;

  const commit = (p: Pattern, act: Act, note?: string) => {
    setReviews((all) => {
      const was = all[p.key] ?? NO_REVIEW;
      return { ...all, [p.key]: { status: ACT_STATUS[act], owner: act === 'investigate' ? person.name : was.owner, events: [...was.events, { at: Date.now(), who: person.name, act, note }] } };
    });
    toast.custom(() => (
      <div className="mn-toast">
        <span className="mn-toast-icon">
          <Check size={13} strokeWidth={2.5} />
        </span>
        <div>
          <div className="mn-toast-title">
            {p.id} {ACT_PAST[act]}
          </div>
          <div className="mn-toast-sub">{note ? 'Reason recorded in the review log' : act === 'investigate' ? `It’s yours, ${person.name.split(' ').pop()}` : 'Back in the list to decide'}</div>
        </div>
      </div>
    ));
  };

  const onAct: VariantProps['onAct'] = (p, act, by = 'pointer') => {
    const allowed = can(role, act, statusOf(p.key));
    if (!allowed.ok) {
      toast.custom(() => (
        <div className="mn-toast">
          <span className="la-toast-lock">
            <Lock size={12} />
          </span>
          <div>
            <div className="mn-toast-title">Not {ACT_PAST[act].replace('under investigation', 'taken')}</div>
            <div className="mn-toast-sub">{allowed.why}</div>
          </div>
        </div>
      ));
      return;
    }
    if (NEEDS_REASON.includes(act)) {
      setPick({ key: p.key, arrive: by === 'pointer' && pick.key !== p.key });
      setDeciding({ key: p.key, act, animate: by === 'pointer' });
    } else commit(p, act);
  };

  const props: VariantProps = {
    ingest,
    analysis,
    shown,
    picked,
    arrive: pick.arrive,
    onPick: (key, by = 'pointer') => {
      setDeciding(null);
      setPick({ key, arrive: by === 'pointer' });
    },
    reviews,
    statusOf,
    role,
    onAct,
    deciding,
    onDecide: (note) => {
      const p = analysis?.patterns.find((x) => x.key === deciding?.key);
      if (p && deciding) commit(p, deciding.act, note);
      setDeciding(null);
    },
    onCancelDecision: () => setDeciding(null),
    filters,
    onFilters: (patch) => setFilters((f) => ({ ...f, ...patch })),
    lens,
    onLens: setLens,
    searchRef,
    shortcuts: {
      paletteOpen,
      onTogglePalette: () => setPaletteOpen((open) => !open),
      keys: {
        '[': () => setHideSide((hidden) => !hidden),
        t: toggleTheme,
      },
    },
  };

  const ready = ingest.phase === 'ready' && !!analysis;
  const stamp = ingest.source?.name.replace(/\.[^.]+$/, '') ?? 'analysis';
  const exportAll = () =>
    download(
      `${stamp}-analysis.json`,
      JSON.stringify(
        {
          source: ingest.source,
          rows: { read: ingest.table?.rows.length, kept: data?.rows.length, dropped: data?.dropped },
          columns: ingest.mapping,
          scope: analysis?.scope,
          patterns: analysis?.patterns.map(({ rows, heat, proposal, existing, ...p }) => ({ ...p, lines: rows.map((r) => r.line), heat, coveredBy: existing && { ...existing, lines: [...existing.lines] }, proposal: { ...proposal, lines: [...proposal.lines] }, review: reviews[p.key] ?? NO_REVIEW })),
        },
        null,
        2,
      ),
      'application/json',
    );

  return (
    <div ref={root} className="mn la" data-hide-side={hideSide || undefined} data-drag={ingest.dragging || undefined}>
      <Sidebar hidden={hideSide} page={'analysis' as PageId} onOpenPalette={() => setPaletteOpen(true)} theme={theme} onToggleTheme={toggleTheme} />
      {liveNav &&
        createPortal(
          <a className="mn-nav-item" href="#" data-active aria-current="page" onClick={(e) => e.preventDefault()}>
            <ScanSearch size={16} />
            <span className="mn-nav-text">Live analysis</span>
          </a>,
          liveNav,
        )}

      <section className="mn-detail la-page">
        <header className="la-top">
          <button className="mn-icon-btn" onClick={() => setHideSide((hidden) => !hidden)} aria-pressed={!hideSide} aria-label="Sidebar" title={`${hideSide ? 'Show' : 'Hide'} sidebar  [`}>
            {hideSide ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
          <h1>Live analysis</h1>
          {ingest.source && ingest.phase !== 'empty' && (
            <span className="la-chip" title={data ? `${count(data.rows.length)} rows, ${data.span} weeks. SHA-256 ${ingest.source.hash}` : undefined}>
              <FileSpreadsheet size={13} />
              <span className="mn-truncate">{ingest.source.name}</span>
            </span>
          )}
          <span className="la-top-gap" />

          {/* Prototype only: who you are, to see what each role may do. */}
          <Menu.Root>
            <Menu.Trigger className="la-pick la-role">
              <span className="la-role-avatar">{person.name.split(' ').map((w) => w[0]).join('')}</span>
              <span className="mn-truncate">{person.title}</span>
              <ChevronDown size={13} />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner sideOffset={6} align="end">
                <Menu.Popup className="mn-menu la-menu" data-own-keys="">
                  <div className="mn-menu-label">See this page as</div>
                  <Menu.RadioGroup value={role} onValueChange={(v) => { setRole(v as Role); setDeciding(null); }}>
                    {ROLES.map((r) => (
                      <Menu.RadioItem key={r} value={r} className="mn-menu-item la-menu-two" closeOnClick>
                        <Menu.RadioItemIndicator className="mn-menu-ind">
                          <Check size={13} />
                        </Menu.RadioItemIndicator>
                        <span>
                          {PEOPLE[r].title}
                          <em className="la-menu-note">{r === 'governor' ? 'decides proposals' : r === 'analyst' ? 'investigates and proposes' : 'reads only'}</em>
                        </span>
                      </Menu.RadioItem>
                    ))}
                  </Menu.RadioGroup>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>

          <Menu.Root>
            <Menu.Trigger className="mn-btn la-top-btn" disabled={!ready}>
              <Download size={14} /> Export
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner sideOffset={6} align="end">
                <Menu.Popup className="mn-menu la-menu" data-own-keys="">
                  <Menu.Item className="mn-menu-item la-menu-plain" onClick={() => analysis && download(`${stamp}-patterns.csv`, patternsCsv(analysis, statusOf))}>
                    <span>
                      Patterns and decisions<em className="la-menu-note">CSV</em>
                    </span>
                  </Menu.Item>
                  <Menu.Item className="mn-menu-item la-menu-plain" disabled={!picked || role === 'viewer'} onClick={() => picked && download(`${stamp}-${picked.id}-rows.csv`, evidenceCsv(picked))}>
                    <span>
                      {picked ? `${picked.id}’s evidence rows` : 'A pattern’s evidence rows'}
                      <em className="la-menu-note">{role === 'viewer' ? 'not for viewers' : picked ? 'CSV' : 'pick one first'}</em>
                    </span>
                  </Menu.Item>
                  <Menu.Separator className="mn-menu-sep" />
                  <Menu.Item className="mn-menu-item la-menu-plain" disabled={role === 'viewer'} onClick={exportAll}>
                    <span>
                      Everything, with provenance<em className="la-menu-note">{role === 'viewer' ? 'not for viewers' : 'JSON'}</em>
                    </span>
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>

          {ingest.phase !== 'empty' && (
            <button className="mn-btn la-top-btn" onClick={ingest.browse}>
              <Upload size={14} /> {ready ? 'Another file' : 'Choose a file'} <kbd>U</kbd>
            </button>
          )}
        </header>

        <Screen key={nonce} {...props} />
      </section>

      <HomePalette open={paletteOpen} onOpenChange={setPaletteOpen} onNavigate={(to) => (location.href = `/${to}`)} theme={theme} onToggleTheme={toggleTheme} />
      <StartOver nonce={nonce} onReset={ingest.reset} />
    </div>
  );
}

/** R in the picker starts the current variant over with no file. */
function StartOver({ nonce, onReset }: { nonce: string; onReset: () => void }) {
  const first = useRef(nonce.split(':')[1]);
  useEffect(() => {
    const replay = nonce.split(':')[1];
    if (replay !== first.current) {
      first.current = replay;
      onReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);
  return null;
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
    <nav className="proto-picker" aria-label="Prototype variants" data-position="top" data-ready={ready || undefined}>
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
      <button className="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" title="Start over with no file  R" onClick={onReplay}>
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
    setCurrent(i);
    const url = new URL(location.href);
    url.searchParams.set('v', String(i + 1));
    history.replaceState(null, '', url);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector('[cmdk-dialog], .la-decide') || t.closest('[data-own-keys]')) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= VARIANTS.length) pick(n - 1);
      else if (e.key === 'ArrowRight') pick((current + 1) % VARIANTS.length);
      else if (e.key === 'ArrowLeft') pick((current - 1 + VARIANTS.length) % VARIANTS.length);
      else if (e.key === 'r' || e.key === 'R') setReplays((n) => n + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // One Page for the life of the prototype: switching swaps only the workspace (re-mounted, so
  // its entrance plays), and the file, the filters and the decisions carry over.
  const { Screen } = VARIANTS[current];
  return (
    <div className="mn mn-app">
      <Page Screen={Screen} nonce={`${current}:${replays}`} />
      <Toaster position="bottom-right" theme="dark" />
      {!bare && <Picker current={current} onPick={pick} onReplay={() => setReplays((n) => n + 1)} />}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

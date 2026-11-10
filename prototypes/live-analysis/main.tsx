/* Throwaway prototype: Live analysis, in the Desk layout (a list of patterns, one pattern beside
 * it, five lenses as tabs: the app's own list-and-detail).
 * Open http://localhost:5188/prototypes/live-analysis/ with the dev server running.
 * Nothing in src/ imports from here.
 *
 * Live analysis is where you find what keeps repeating in your alerts and decide what each
 * pattern deserves: a proposal to suppress it, or nothing. Two sources, switched in the header (L):
 *   Live         the alert feed as it arrives. It opens on the last twelve weeks, then each new
 *                alert lands in its pattern and every figure follows. Pause holds it still.
 *   Historical   a file someone exported: drop a CSV, or try the sample. The file is really
 *                read, and every figure is computed from its rows (model.ts).
 *
 * Decisions survive the live feed's updates.
 * Keys: L live or historical, U upload, J K pattern, P A X decide, / search, [ sidebar,
 * T theme, ⌘K palette. Address: ?mode=historical (opens on the file drop), ?sample (opens on
 * the sample file). Opens live otherwise. */

import { StrictMode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown, Download, FileSpreadsheet, History, Lock, PanelLeftClose, PanelLeftOpen, Pause, Play, Radio, ScanSearch, Upload } from 'lucide-react';
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
import { Sidebar } from '../../src/components/Sidebar/Sidebar';
import { useSheen } from '../../src/hooks/useSheen';
import { useTheme } from '../../src/hooks/useTheme';
import type { PageId } from '../../src/lib/route';
import { HomePalette } from '../../src/pages/home/components/Palette/HomePalette';
import { ACT_PAST, NEEDS_REASON, NO_REVIEW, PEOPLE, analyse, can, count, download, evidenceCsv, patternsCsv, ACT_STATUS, type Act, type Pattern, type Review, type Role } from './model';
import { useIngest, type Deciding, type Ingest, type Filters, type LensKey, type VariantProps } from './shared';
import { Desk } from './variants/Desk';

const params = new URLSearchParams(location.search);
const ROLES: Role[] = ['governor', 'analyst', 'viewer'];
const EVERY = [1, 2, 3, 4];

function Page() {
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

  // Live unless the address asks for a file; ?sample opens with the sample already read.
  useEffect(() => {
    if (params.has('sample')) ingest.useSample();
    else if (params.get('mode') !== 'historical') ingest.goLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A new file, or connecting to the feed, is a new analysis: nothing decided, nothing narrowed.
  // A live alert arriving is not: it changes the data, never what's been decided.
  const data = ingest.data;
  const opened = ingest.source?.readAt;
  useEffect(() => {
    setReviews({});
    setPick({ key: null, arrive: false });
    setDeciding(null);
    setLens('evidence');
    setFilters({ weeks: data?.span ?? 12, service: 'all', sevs: EVERY, query: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, !!data]);

  const switchMode = (mode: 'live' | 'historical') => {
    if (mode === ingest.mode) return;
    if (mode === 'live') ingest.goLive();
    else ingest.reset();
  };

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
      return { ...all, [p.key]: { status: ACT_STATUS[act], owner: was.owner, events: [...was.events, { at: Date.now(), who: person.name, act, note }] } };
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
          <div className="mn-toast-sub">{note ? 'Reason recorded in the review log' : 'Back in the list to decide'}</div>
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
            <div className="mn-toast-title">Not {ACT_PAST[act]}</div>
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
        l: () => switchMode(ingest.mode === 'live' ? 'historical' : 'live'),
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
          <div className="la-seg la-mode" role="radiogroup" aria-label="Data source">
            <button role="radio" className="mn-tab" data-active={ingest.mode === 'live' || undefined} aria-checked={ingest.mode === 'live'} onClick={() => switchMode('live')} title="The alert feed as it arrives  L">
              <Radio size={13} /> Live
            </button>
            <button role="radio" className="mn-tab" data-active={ingest.mode === 'historical' || undefined} aria-checked={ingest.mode === 'historical'} onClick={() => switchMode('historical')} title="A file of past alerts  L">
              <History size={13} /> Historical
            </button>
          </div>
          {ingest.mode === 'live' && ingest.live ? (
            <LiveStatus ingest={ingest} />
          ) : ingest.source && ingest.phase !== 'empty' && (
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
                          <em className="la-menu-note">{r === 'governor' ? 'decides proposals' : r === 'analyst' ? 'proposes' : 'reads only'}</em>
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

          {ingest.mode === 'historical' && ingest.phase !== 'empty' && (
            <button className="mn-btn la-top-btn" onClick={ingest.browse}>
              <Upload size={14} /> {ready ? 'Another file' : 'Choose a file'} <kbd>U</kbd>
            </button>
          )}
        </header>

        <Desk {...props} />
      </section>

      <HomePalette open={paletteOpen} onOpenChange={setPaletteOpen} onNavigate={(to) => (location.href = `/${to}`)} theme={theme} onToggleTheme={toggleTheme} />
    </div>
  );
}

/** The feed's state in the bar: a green mark while it runs, what arrived in the last minute,
 *  and pause. Ticks once a second so "the last minute" stays true between alerts. */
function LiveStatus({ ingest }: { ingest: Ingest }) {
  const live = ingest.live!;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const lastMinute = live.arrivals.filter((at) => now - at < 60_000).length;
  const last = live.arrivals[live.arrivals.length - 1];
  const ago = last ? Math.max(0, Math.round((now - last) / 1000)) : null;
  return (
    <>
      <span className="la-live" data-paused={live.paused || undefined} title={`Connected at ${new Date(live.since).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}. ${count(live.arrivals.length)} alerts since.`}>
        <i aria-hidden />
        <span className="la-live-word">{live.paused ? 'Paused' : 'Live'}</span>
        <span className="mn-subtle la-live-meta">
          <b>{lastMinute}</b> in the last minute{ago != null && !live.paused ? ` · last ${ago < 2 ? 'just now' : `${ago}s ago`}` : ''}
        </span>
      </span>
      <button className="mn-icon-btn" onClick={ingest.togglePause} aria-pressed={live.paused} aria-label={live.paused ? 'Resume the feed' : 'Pause the feed'} title={live.paused ? 'Resume the feed' : 'Pause the feed'}>
        {live.paused ? <Play size={14} /> : <Pause size={14} />}
      </button>
      <span className="mn-sr" role="status">
        {live.paused ? 'Live feed paused' : ''}
      </span>
    </>
  );
}

function App() {
  return (
    <div className="mn mn-app">
      <Page />
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

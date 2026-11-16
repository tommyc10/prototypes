/* The hindcast: today's logic, replayed over tickets that already happened. It shows which
 * past tickets the service's active rules and approved change windows would explain, and where
 * the gaps worth tuning are. It is retrospective, never a forecast.
 *
 *   Sidebar          navigation (shared with the other pages)
 *   ReplayBar        the page's name, its two views, and the view's scope
 *   Current replay   today's rules (live from the Rules page's store) and windows, over a
 *                    service and a lookback
 *   Historical extract  a past run, kept as it was: its aggregate, and its diagnostics
 *   Trace            one ticket's replay, in a drawer
 *
 * The address says which view and scope: #/hindcast/holonet/26 for a replay (the same shape
 * the Services page links to), #/hindcast/extract/EXT-0031/diagnostics for an extract. Every
 * figure comes from model/replay.ts. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, FileArchive, Hand, History, Stethoscope } from 'lucide-react';
import { Command } from 'cmdk';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useSheen } from '../../hooks/useSheen';
import { useTheme } from '../../hooks/useTheme';
import { num } from '../../lib/format';
import { navigate } from '../../lib/route';
import { useRulesStore } from '../rule-management/hooks/useRulesStore';
import { AnalysisPalette } from './components/Palette/AnalysisPalette';
import { Diagnostics } from './components/Replay/Diagnostics';
import { ReplayBar, snapNextThumb, type ExtractView, type Mode } from './components/Replay/ReplayBar';
import { Report } from './components/Replay/Report';
import { Fig, RunHead } from './components/Replay/RunHead';
import { PAGE, Tickets, type Chip } from './components/Replay/Tickets';
import { Trace } from './components/Replay/Trace';
import { serviceName } from './data/mockData';
import { EXTRACTS, WINDOWS, extractById, rulesFrom, source } from './data/replayData';
import { useEntrance } from './hooks/useEntrance';
import { useRun } from './hooks/useRun';
import { useScope } from './hooks/useScope';
import { snapNextChange } from './hooks/useTween';
import { runExtract } from './model/extract';
import { DEFAULT_LOOKBACK, TODAY, WEEK, dayMonth, plural } from './model/labels';
import { CHAPTERS, GROUP_BYS, groupTickets, visibleRows, type ChapterId, type GroupBy } from './model/chapters';
import { focusWords, narrow, type Focus, type Narrowing } from './model/narrow';
import { isLive, replay, type Replay } from './model/replay';
import { LIFECYCLE } from './model/words';
import './components/charts/charts.css';
import './layout.css';
import './components/Replay/replay.css';

/* The dock opens on the tickets closed by hand: the only ones that get a verdict, so its
 * groups agree with every figure in the chapters. */
const EMPTY: Narrowing = { focus: null, life: 'closedByHand', weeks: null, query: '' };

const longDay = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function HindcastPage({ serviceId: a0, weeks: a1, focus: a2 }: { serviceId?: string; weeks?: string; focus?: string }) {
  const isExtractAddress = a0 === 'extract';
  const [{ serviceId, weeks }, setScope] = useScope(isExtractAddress ? {} : { serviceId: a0, weeks: a1 });
  const [mode, setMode] = useState<Mode>(isExtractAddress ? 'extract' : 'replay');
  const [extractId, setExtractId] = useState(extractById(isExtractAddress ? a1 : undefined)?.id ?? EXTRACTS[0].id);
  const [view, setView] = useState<ExtractView>(isExtractAddress && a2 === 'diagnostics' ? 'diagnostics' : 'aggregate');
  const [narrowing, setNarrowing] = useState<Narrowing>(EMPTY);
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState<{ id: string; animate: boolean } | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hideSide, setHideSide] = useState(false);
  const [chapter, setChapter] = useState<ChapterId>('verdict');
  const [groupBy, setGroupBy] = useState<GroupBy>('verdict');
  const [chosen, setChosen] = useState<Record<string, boolean>>({});
  const [wide, setWide] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const searchRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  useSheen(rootRef);

  // Current rules: whatever the Rules page's store says now, so approving one there changes the replay here.
  const store = useRulesStore((s) => s.rules);
  const rulesKey = store.map((r) => `${r.id}${r.status[0]}`).join();
  const rules = useMemo(() => rulesFrom(store), [rulesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = useRun(`${serviceId}:${weeks}:${rulesKey}`, () => replay(source(rules), { serviceId, from: TODAY - weeks * WEEK, to: TODAY }));
  const extract = extractById(extractId)!;
  // The extract opens (and reads) when its view is shown, not before.
  const past = useRun(`${mode === 'extract' ? 'open' : 'shut'}:${extractId}:${rulesKey}`, () => runExtract(extract, store));

  const run = mode === 'replay' ? current : { ...past, next: past.next.replay, shown: past.shown?.replay ?? null };
  const shown: Replay | null = run.shown;

  // Keep the address in step, without adding a Back step for every change.
  useEffect(() => {
    const to =
      mode === 'extract'
        ? `#/hindcast/extract/${extractId}${view === 'diagnostics' ? '/diagnostics' : ''}`
        : `#/hindcast${serviceId !== 'all' || weeks !== DEFAULT_LOOKBACK ? `/${serviceId}/${weeks}` : ''}`;
    navigate(to, true);
  }, [mode, extractId, view, serviceId, weeks]);

  // A new scope, view or extract starts the list afresh: picks made on the old figures don't carry.
  const reset = () => {
    setNarrowing(EMPTY);
    setLimit(PAGE);
    setChosen({});
    setOpen(null);
  };

  // The story, once per load of the app: the panels rise as the page opens, and their content
  // draws itself in when the first run lands. After that, figures morph in place.
  const entrance = useEntrance();
  const told = useRef(entrance === 'story');
  const landed = shown !== null;
  const [land, setLand] = useState(false);
  useEffect(() => {
    if (!landed || !told.current) return;
    setLand(true);
    const t = setTimeout(() => setLand(false), 1400);
    return () => clearTimeout(t);
  }, [landed]);

  const rows = useMemo(() => (shown ? narrow(shown, narrowing) : []), [shown, narrowing]);
  const groups = useMemo(() => groupTickets(rows, groupBy, shown?.scope.from ?? 0), [rows, groupBy, shown]);
  const visible = useMemo(() => visibleRows(groups, rows.length, chosen), [groups, rows.length, chosen]);
  const openRow = open && shown ? shown.tickets.find((r) => r.ticket.id === open.id) : undefined;

  const patch = (p: Partial<Narrowing>) => {
    setNarrowing((n) => ({ ...n, ...p }));
    setLimit(PAGE);
    setChosen({});
  };

  // What's narrowing the dock, each with its own way out. "By hand" has its own toggle.
  const chips: Chip[] = [];
  if (shown && narrowing.focus) chips.push({ key: 'focus', label: focusWords(shown, narrowing.focus), onClear: () => patch({ focus: null }) });
  if (shown && narrowing.weeks)
    chips.push({ key: 'weeks', label: `Weeks of ${dayMonth(shown.weeks[narrowing.weeks[0]].start)} to ${dayMonth(shown.weeks[narrowing.weeks[1]].start)}`, onClear: () => patch({ weeks: null }) });
  if (narrowing.life && narrowing.life !== 'closedByHand') chips.push({ key: 'life', label: LIFECYCLE[narrowing.life], onClear: () => patch({ life: null }) });

  const regroup = (g: GroupBy) => {
    setGroupBy(g);
    setChosen({});
    setLimit(PAGE);
  };
  const nextGroup = () => regroup(GROUP_BYS[(GROUP_BYS.findIndex((b) => b.id === groupBy) + 1) % GROUP_BYS.length].id);

  // A view picked with the pointer rises in; one picked with a key shows at once.
  const [arrive, setArrive] = useState(false);
  const changeMode = (m: Mode, key = false) => {
    if (m === mode) return;
    if (key) snapNextThumb();
    setArrive(!key);
    setMode(m);
    reset();
  };
  const changeView = (v: ExtractView, key = false) => {
    if (v === view) return;
    if (key) snapNextThumb();
    setArrive(!key);
    setView(v);
  };

  // J and K walk the tickets that are showing. With every group folded, the first one opens.
  const step = (by: number) => {
    if (rows.length === 0) return;
    if (visible.length === 0) {
      setChosen((c) => ({ ...c, [groups[0].key]: true }));
      return;
    }
    const at = selected ? visible.findIndex((r) => r.ticket.id === selected) : -1;
    const next = Math.max(0, Math.min(visible.length - 1, at < 0 ? (by > 0 ? 0 : visible.length - 1) : at + by));
    if (next >= limit) setLimit((l) => l + PAGE);
    const id = visible[next].ticket.id;
    setSelected(id);
    // With the drawer open, J and K walk it through the tickets without closing it.
    if (open) setOpen({ id, animate: false });
  };

  useKeyboardShortcuts({
    tourOpen: false,
    paletteOpen,
    onTogglePalette: () => setPaletteOpen((o) => !o),
    keys: {
      j: () => step(1),
      ArrowDown: () => step(1),
      k: () => step(-1),
      ArrowUp: () => step(-1),
      Enter: () => selected && setOpen({ id: selected, animate: false }),
      '/': () => searchRef.current?.focus(),
      r: () => changeMode('replay', true),
      e: () => changeMode('extract', true),
      a: () => mode === 'extract' && changeView('aggregate', true),
      d: () => mode === 'extract' && changeView('diagnostics', true),
      // Esc steps back one layer: the drawer, the widened dock, what's picked, the weeks, the outcome, the search.
      Escape: () => {
        if (open) setOpen(null);
        else if (wide) setWide(false);
        else if (narrowing.focus) patch({ focus: null });
        else if (narrowing.weeks) patch({ weeks: null });
        else if (narrowing.life && narrowing.life !== 'closedByHand') patch({ life: 'closedByHand' });
        else if (narrowing.query) patch({ query: '' });
        else setSelected(null);
      },
      '[': () => setHideSide((h) => !h),
      t: () => setWide((w) => !w),
      b: nextGroup,
      ...Object.fromEntries(
        CHAPTERS.map((c) => [
          c.key,
          () => {
            setWide(false);
            if (mode === 'extract' && view === 'diagnostics') changeView('aggregate', true);
            setChapter(c.id);
          },
        ]),
      ),
    },
  });

  // Close the drawer if what it showed has left the list (a new scope or extract).
  useEffect(() => {
    if (open && shown && !openRow) setOpen(null);
  }, [open, shown, openRow]);

  /* ---------- the opening sentence ---------- */

  const before = (pick: (r: Replay) => number) => (run.shown ? pick(run.shown) : null);
  const next = run.next;
  const scopeRules = rules.filter((r) => serviceId === 'all' || r.serviceId === serviceId);
  const expect =
    mode === 'replay'
      ? { sources: scopeRules.filter(isLive).length + WINDOWS.filter((w) => serviceId === 'all' || w.serviceId === serviceId).length, hypothetical: scopeRules.filter((r) => !isLive(r)).length }
      : { sources: next.sources.length, hypothetical: next.hypothetical.length };
  const scopeWords = (id: string) => (id === 'all' ? 'across every service' : `for ${serviceName(id)}`);

  const head =
    mode === 'replay' ? (
      <RunHead
        eyebrow="Retrospective replay"
        note="Not a forecast. Today’s rules and approved windows, run over tickets that already happened."
        waiting={`Replaying ${serviceId === 'all' ? 'every service' : serviceName(serviceId)} over ${weeks} weeks`}
        step={run.step}
        done={run.done}
        lead={
          <>
            <p className="ol-lead-1">
              Today’s <Fig value={next.activeRules} ready={run.step >= 2} before={before((r) => r.activeRules)} /> {plural(next.activeRules, 'active rule', 'active rules')} and{' '}
              <Fig value={next.windows} ready={run.step >= 2} before={before((r) => r.windows)} /> approved change {plural(next.windows, 'window', 'windows')}, replayed over{' '}
              <Fig value={next.population.total} ready={run.step >= 1} before={before((r) => r.population.total)} /> {plural(next.population.total, 'ticket')} {scopeWords(serviceId)} in the last {weeks} weeks.
            </p>
          </>
        }
        steps={[
          { running: `Reading tickets, ${dayMonth(TODAY - weeks * WEEK)} to ${dayMonth(TODAY - 1)}`, done: <>Read {num(next.population.total)} tickets</> },
          { running: 'Loading today’s rules and windows', done: <>{num(next.activeRules)} active {plural(next.activeRules, 'rule')}, {num(next.windows)} {plural(next.windows, 'window')}, {num(next.hypothetical.length)} hypothetical</> },
          { running: `Matching ${num(next.population.closedByHand)} closed by hand`, done: <>Matched {num(next.population.closedByHand)}, one verdict each</> },
        ]}
      />
    ) : (
      <RunHead
        eyebrow="Historical extract"
        note={`Kept as it ran on ${longDay(extract.ranAt)}, by ${extract.by}. A past replay, not a record of what was suppressed.`}
        waiting={`Opening ${extract.id}`}
        step={run.step}
        done={run.done}
        lead={
          <>
            <p className="ol-lead-1">
              <code>{extract.id}</code> replayed <Fig value={next.population.total} ready={run.step >= 1} before={before((r) => r.population.total)} /> tickets {scopeWords(extract.serviceId)},{' '}
              {dayMonth(extract.from)} to {dayMonth(extract.to - 1)}, with the <Fig value={next.activeRules} ready={run.step >= 2} before={before((r) => r.activeRules)} /> {plural(next.activeRules, 'rule')} active on {dayMonth(extract.ranAt)}.
            </p>
          </>
        }
        steps={[
          { running: `Opening ${extract.id}`, done: <>Opened {extract.id}, {num(next.population.total)} tickets</> },
          { running: `Loading the rules as of ${dayMonth(extract.ranAt)}`, done: <>{num(next.activeRules)} {plural(next.activeRules, 'rule')} active then, {num(next.windows)} {plural(next.windows, 'window')}</> },
          { running: 'Reading its results', done: <>{num(next.population.closedByHand)} closed by hand, one verdict each</> },
        ]}
      />
    );

  const report = (
    <Report
      replay={shown}
      stale={!run.done}
      expect={expect}
      narrowing={narrowing}
      onFocus={(focus) => patch({ focus })}
      onLife={(life) => patch({ life })}
      onWeeks={(w) => patch({ weeks: w })}
      chapter={chapter}
      onChapter={setChapter}
      basis={mode === 'replay' ? 'Today’s rules and windows' : `Rules as of ${dayMonth(extract.ranAt)}`}
      land={land}
    />
  );

  const dock = (
    <Tickets
      rows={rows}
      groups={groups}
      total={shown?.population.total ?? 0}
      groupBy={groupBy}
      onGroupBy={regroup}
      chosen={chosen}
      onToggleGroup={(key, on) => setChosen((c) => ({ ...c, [key]: on }))}
      chips={chips}
      handOnly={narrowing.life === 'closedByHand'}
      onHandOnly={() => patch({ life: narrowing.life === 'closedByHand' ? null : 'closedByHand' })}
      query={narrowing.query}
      onQuery={(query) => patch({ query })}
      searchRef={searchRef}
      selected={selected}
      onSelect={setSelected}
      onOpen={(id, how) => setOpen({ id, animate: how === 'pointer' })}
      limit={limit}
      onMore={() => setLimit((l) => (l < visible.length ? l + PAGE : l))}
      stale={!run.done}
      wide={wide}
      onWide={() => setWide((w) => !w)}
      showService={shown?.scope.serviceId === 'all'}
      ready={shown !== null}
    />
  );

  return (
    <div className="mn ol" ref={rootRef} data-hide-side={hideSide || undefined}>
      <Sidebar hidden={hideSide} page="hindcast" onOpenPalette={() => setPaletteOpen(true)} theme={theme} onToggleTheme={toggleTheme} />

      <section className="mn-detail ol-pane ol-rpane">
        <ReplayBar
          mode={mode}
          onMode={(m) => changeMode(m)}
          serviceId={serviceId}
          onService={(id) => {
            setScope({ serviceId: id });
            reset();
          }}
          weeks={weeks}
          onWeeks={(w) => {
            setScope({ weeks: w });
            reset();
          }}
          extractId={extractId}
          onExtract={(id) => {
            setExtractId(id);
            reset();
          }}
          view={view}
          onView={(v) => changeView(v)}
          hideSide={hideSide}
          onToggleSide={() => setHideSide((h) => !h)}
          asOf={TODAY}
        />

        <div className="ol-desk" data-wide={wide || undefined}>
        <div className="ol-scroll ol-desk-main">
          <div className="ol-rpage" data-enter={entrance === 'story' || undefined} data-arrive={arrive || undefined} data-mode={mode} key={`${mode}:${view}`}>
            {head}
            {mode === 'extract' && view === 'diagnostics' ? (
              past.shown ? (
                <div data-sheen-stale={!past.done || undefined} className="ol-stale">
                  <Diagnostics
                    d={past.shown.diagnostics}
                    from={past.shown.extract.from}
                    to={past.shown.extract.to}
                    unknowns={past.shown.replay.unknowns}
                    unknownTotal={past.shown.replay.groups.unknown}
                    onPick={(focus) => {
                      setView('aggregate');
                      patch({ focus });
                    }}
                  />
                </div>
              ) : (
                <div className="ol-rgrid" data-view="diagnostics" aria-busy>
                  {['rows', 'calendar', 'fields', 'since', 'unknowns'].map((a) => (
                    <span key={a} className="mn-skel ol-skel-panel" data-shape="card" data-area={a} aria-hidden />
                  ))}
                </div>
              )
            ) : (
              report
            )}
          </div>
        </div>
        {dock}
        </div>

        {openRow && <Trace key={openRow.ticket.id} replayed={openRow} animate={open!.animate} onClose={() => setOpen(null)} basis={mode === 'replay' ? 'today' : extract.ranAt} />}

        <footer className="ol-keys" aria-label="Keyboard shortcuts">
          <span>
            <kbd>R</kbd>
            <kbd>E</kbd> Replay, extract
          </span>
          {mode === 'extract' && (
            <span>
              <kbd>A</kbd>
              <kbd>D</kbd> Aggregate, diagnostics
            </span>
          )}
          <span>
            <kbd>1</kbd>
            <kbd>5</kbd> Chapter
          </span>
          <span>
            <kbd>J</kbd>
            <kbd>K</kbd> Ticket
          </span>
          <span>
            <kbd>B</kbd> Group
          </span>
          <span>
            <kbd>T</kbd> Widen
          </span>
          <span>
            <kbd>↵</kbd> Its replay
          </span>
          <span>
            <kbd>/</kbd> Search
          </span>
          <span>
            <kbd>Esc</kbd> Step back
          </span>
          <span>
            <kbd>[</kbd> Sidebar
          </span>
          <span>
            <kbd>⌘K</kbd> Commands
          </span>
        </footer>
      </section>

      <AnalysisPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        page="hindcast"
        onService={(id) => {
          snapNextChange();
          setMode('replay');
          setScope({ serviceId: id });
          reset();
        }}
        onWeeks={(w) => {
          snapNextChange();
          setMode('replay');
          setScope({ weeks: w });
          reset();
        }}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={toggleTheme}
      >
        {(close) => (
          <Command.Group heading="Hindcast">
            <Command.Item value="current replay today rules" onSelect={close(() => changeMode('replay', true))}>
              <History size={15} />
              Current replay
            </Command.Item>
            {EXTRACTS.map((e) => (
              <Command.Item
                key={e.id}
                value={`historical extract ${e.id} ${e.title}`}
                onSelect={close(() => {
                  snapNextThumb();
                  setMode('extract');
                  setExtractId(e.id);
                  reset();
                })}
              >
                <FileArchive size={15} />
                <span className="mn-truncate">
                  {e.id} · {e.title}
                </span>
              </Command.Item>
            ))}
            <Command.Item value="extract diagnostics data quality" onSelect={close(() => { setMode('extract'); changeView('diagnostics', true); })}>
              <Stethoscope size={15} />
              Extract diagnostics
            </Command.Item>
            <Command.Item value="show tickets closed by hand nothing explains gaps" onSelect={close(() => patch({ focus: { kind: 'verdict', verdict: 'none' } as Focus }))}>
              <Eye size={15} />
              Show what nothing explains
            </Command.Item>
            <Command.Item value="show tickets closed by hand" onSelect={close(() => patch({ life: 'closedByHand' }))}>
              <Hand size={15} />
              Show {LIFECYCLE.closedByHand.toLowerCase()}
            </Command.Item>
          </Command.Group>
        )}
      </AnalysisPalette>
    </div>
  );
}

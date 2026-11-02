/* Throwaway prototype: four ways to make a maintenance plan, behind a picker.
 * Open http://localhost:5188/prototypes/maintenance-plans/ with the dev server running.
 * Nothing in src/ imports from here; delete the folder once a direction is chosen.
 *
 * A maintenance plan sits on a change window. While it's in place, tickets filed against
 * what it covers are softened, never hidden: every one is still filed and can be found,
 * nobody is paged for it, and a P1 always pages (model.ts says exactly how). All four run on
 * the Change windows page's own windows, and the clock runs, so tickets keep being filed
 * while you watch and the plans deal with them.
 *
 *   1 Rail      the plan is a section of the window. "Plan maintenance" opens the decision
 *               form over it; once it's in place, the section lists what it's holding.
 *   2 Sentence  the plan is one sentence you can read aloud. Each part of it is a choice.
 *               Below it, the tickets it softened, sorted by what became of them.
 *   3 Paint     the plan is drawn on the timeline: drag across a window's lane to cover it.
 *               Tickets land on the lanes as marks, so you see what each plan caught.
 *   4 Dimmer    the plan fades rather than switching off: hold while the work runs, lower
 *               near the end, mark for a while after. Drag the steps to shape it.
 *
 * Plans made in one variant show in the others. Three are in place when it opens.
 * Keys: 1–4 or ← → variant, J K window, M plan maintenance, Space pause the clock,
 * [ ] panes, T theme, ⌘K palette. Address: ?v=1..4, ?still (clock paused), ?bare (no picker). */

import { StrictMode, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { Pause, Play } from 'lucide-react';
import { Toaster } from 'sonner';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '../../src/styles/base.css';
import '../../src/styles/theme.css';
import '../../src/styles/ui.css';
import '../../src/styles/shell.css';
import '../../src/styles/palette.css';
import '../../src/pages/change-windows/ChangeWindowsPage.css';
import '../../src/pages/change-windows/components/GroupList/GroupList.css';
import '../../src/pages/change-windows/components/WindowDetail/WindowDetail.css';
import '../../src/pages/change-windows/components/WindowsBar/WindowsBar.css';
import '../../src/pages/rule-management/components/Composer/Composer.css';
import '../../src/pages/rule-management/components/RuleList/SortMenu.css';
import '../../src/pages/rule-management/components/common/DecisionToast.css';
import '../../src/styles/accessibility.css';
import './proto.css';
import './variants/variants.css';
import { PaneToggles } from '../../src/components/PaneToggles';
import { Sidebar } from '../../src/components/Sidebar/Sidebar';
import { useTheme } from '../../src/hooks/useTheme';
import { NOW } from '../../src/lib/clock';
import { navigate } from '../../src/lib/route';
import { WindowsPalette } from '../../src/pages/change-windows/components/Palette/WindowsPalette';
import { dayLabel, hourLabel, statusOf, timing } from '../../src/pages/change-windows/model/windows';
import { CURRENT_USER } from '../../src/pages/rule-management/data/mockData';
import { SEEDED, WINDOWS, endedNow, filedFor, planEnd, planLive, tallyOf, type Plan } from './model';
import type { VariantProps } from './shared';
import { Rail } from './variants/Rail';
import { Sentence } from './variants/Sentence';
import { Paint } from './variants/Paint';
import { Dimmer } from './variants/Dimmer';

const VARIANTS: { name: string; idea: string; Screen: ComponentType<VariantProps> }[] = [
  { name: 'Rail', idea: 'The plan is a section of the window, made with the decision form', Screen: Rail },
  { name: 'Sentence', idea: 'The plan is one sentence you can read aloud; each part is a choice', Screen: Sentence },
  { name: 'Paint', idea: 'Drag across a window on the timeline to cover it with a plan', Screen: Paint },
  { name: 'Dimmer', idea: 'The plan fades instead of switching off: drag its steps to shape it', Screen: Dimmer },
];

const params = new URLSearchParams(location.search);
const bare = params.has('bare');

/** How much prototype time passes each real second while the clock runs. */
const PACE = 120_000;

const SECTIONS = [
  { label: 'In place', has: (s: string) => s === 'active' || s === 'overrunning' },
  { label: 'Upcoming', has: (s: string) => s === 'upcoming' },
  { label: 'Ended', has: (s: string) => s === 'ended' },
];

function Page({ Screen }: { Screen: ComponentType<VariantProps> }) {
  const [now, setNow] = useState(NOW.getTime());
  const [running, setRunning] = useState(!params.has('still'));
  const [plans, setPlans] = useState<Record<string, Plan>>(() => Object.fromEntries(SEEDED.map((p) => [p.windowKey, p])));
  const [picked, setPicked] = useState(() => WINDOWS.find((w) => w.id === 'CHG-2398')!.key);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hideSide, setHideSide] = useState(false);
  const [hideList, setHideList] = useState(false);
  const [theme, toggleTheme] = useTheme();

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow((t) => t + PACE), 1000);
    return () => clearInterval(id);
  }, [running]);

  const win = WINDOWS.find((w) => w.key === picked)!;
  const order = useMemo(() => SECTIONS.flatMap((s) => WINDOWS.filter((w) => s.has(statusOf(w, NOW.getTime())))), []);

  const move = (by: number) => {
    const i = order.findIndex((w) => w.key === picked);
    const next = order[Math.min(order.length - 1, Math.max(0, i + by))];
    if (next) setPicked(next.key);
  };

  const props: VariantProps = {
    window: win,
    windows: WINDOWS,
    now,
    plans,
    plan: plans[win.key],
    user: CURRENT_USER,
    onSelect: setPicked,
    onSave: (plan) => setPlans((all) => ({ ...all, [plan.windowKey]: plan })),
    onEnd: (key) => setPlans((all) => ({ ...all, [key]: endedNow(all[key], now) })),
    onSend: (key, ticketId) => setPlans((all) => ({ ...all, [key]: { ...all[key], sent: { ...all[key].sent, [ticketId]: now } } })),
    shortcuts: {
      tourOpen: false,
      paletteOpen,
      onTogglePalette: () => setPaletteOpen((open) => !open),
      keys: {
        j: () => move(1),
        ArrowDown: () => move(1),
        k: () => move(-1),
        ArrowUp: () => move(-1),
        ' ': () => setRunning((on) => !on),
        '[': () => setHideSide((hidden) => !hidden),
        ']': () => setHideList((hidden) => !hidden),
        t: toggleTheme,
      },
    },
  };

  return (
    <div className="mn cw mp" data-hide-side={hideSide || undefined} data-hide-list={hideList || undefined}>
      <Sidebar hidden={hideSide} page="changes" onOpenPalette={() => setPaletteOpen(true)} theme={theme} onToggleTheme={toggleTheme} />

      <aside className="mn-list" inert={hideList}>
        <header className="cw-list-head">
          <div className="cw-list-title">
            <h1>Change windows</h1>
          </div>
        </header>
        <nav className="cw-rows mp-wins" aria-label="Change windows">
          {SECTIONS.map((s) => {
            const own = order.filter((w) => s.has(statusOf(w, NOW.getTime())));
            return (
              <section key={s.label}>
                <h2 className="mp-wins-head">{s.label}</h2>
                {own.map((w) => {
                  const plan = plans[w.key];
                  const held = plan ? tallyOf(filedFor(w, now), plan, now).held : 0;
                  const live = plan && (planLive(plan, now) || held > 0);
                  return (
                    <button key={w.key} className="mp-win" aria-current={w.key === picked || undefined} onClick={() => setPicked(w.key)}>
                      <i data-status={statusOf(w, now)} aria-hidden />
                      <span className="mp-win-main">
                        <span className="mp-win-name mn-truncate">{w.name}</span>
                        <span className="mp-win-meta mn-truncate">
                          <span className="mn-mono">{w.id}</span> · {timing(w, now)}
                        </span>
                      </span>
                      {plan && (
                        <span className="mp-win-plan" data-live={live || undefined} title={live ? `${plan.id} is in place` : `${plan.id} ended ${hourLabel(planEnd(plan))}`}>
                          {held > 0 && <b>{held}</b>}
                          Plan
                        </span>
                      )}
                    </button>
                  );
                })}
              </section>
            );
          })}
        </nav>
        <footer className="cw-list-foot">
          <span>
            <kbd>J</kbd> <kbd>K</kbd> Navigate
          </span>
          <span>
            <kbd>M</kbd> Plan
          </span>
          <span>
            <kbd>⌘K</kbd> Commands
          </span>
        </footer>
      </aside>

      <section className="mn-detail cw-pane mp-pane">
        <div className="cw-top">
          <PaneToggles
            hideSide={hideSide}
            hideList={hideList}
            onToggleSide={() => setHideSide((hidden) => !hidden)}
            onToggleList={() => setHideList((hidden) => !hidden)}
            listLabel="Window list"
          />
          <div className="cw-clock">
            {dayLabel(now)} <span className="mn-mono">{hourLabel(now)}</span>
          </div>
          {/* Prototype only: the clock runs so tickets keep arriving. */}
          <button className="mn-btn mn-btn-ghost mp-clock" onClick={() => setRunning((on) => !on)} aria-pressed={running}>
            {running ? <Pause size={14} /> : <Play size={14} />}
            {running ? `Clock running at ${PACE / 1000}×` : 'Clock paused'}
            <kbd>Space</kbd>
          </button>
        </div>
        <Screen {...props} />
      </section>

      <WindowsPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        windows={WINDOWS}
        now={now}
        onSelect={setPicked}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={toggleTheme}
        onStartTour={() => {}}
      />
      <Toaster position="bottom-right" theme={theme} />
    </div>
  );
}

function Picker({ current, onPick }: { current: number; onPick: (i: number) => void }) {
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
          {v.name} <span className="proto-picker-key">{i + 1}</span>
        </button>
      ))}
    </nav>
  );
}

function App() {
  const [current, setCurrent] = useState(() => {
    const v = (parseInt(params.get('v') ?? '', 10) || 1) - 1;
    return v >= 0 && v < VARIANTS.length ? v : 0;
  });

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
      if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector('[cmdk-dialog], .mp-pop, .mn-composer')) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= VARIANTS.length) pick(n - 1);
      else if (e.key === 'ArrowRight' && !t.closest('[data-own-keys]')) pick((current + 1) % VARIANTS.length);
      else if (e.key === 'ArrowLeft' && !t.closest('[data-own-keys]')) pick((current - 1 + VARIANTS.length) % VARIANTS.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // One Page for the life of the prototype: switching variant swaps only the pane, so the
  // plans and the clock carry over.
  const { Screen } = VARIANTS[current];
  return (
    <div className="mn mn-app">
      <Page Screen={Screen} />
      {!bare && <Picker current={current} onPick={pick} />}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

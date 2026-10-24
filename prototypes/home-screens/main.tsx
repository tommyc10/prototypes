/* Throwaway prototype: four home screens to replace the station globe, behind a picker.
 * Open http://localhost:5188/prototypes/home-screens/ with the dev server running.
 * Nothing in src/ imports from here; delete the folder once a direction is chosen.
 *
 * Each one runs on the home page's own data (useStation: the live alert stream, the rules,
 * the change windows), keeps the page's words (the figure, the sentence, the one thing
 * waiting), and swaps the globe for a different picture of the same hour:
 *
 *   1 Sieve   every alert of the hour falls through the rules. Each active rule is a shelf
 *             that holds what it hid; what nobody hid lands on the floor, by you.
 *   2 Dial    the hour as one instrument. The ring is the waterline: what reached a person
 *             rises outside it, what the rules hid sinks inside. It turns as time passes.
 *   3 Stack   what's waiting on you as a pile of cards. Throw the top one away (J, or drag)
 *             to reach the next; each card carries its own evidence.
 *   4 Ridge   each group's hour as a ridgeline, nine of them stacked, drifting left as the
 *             hour moves. Pages sit on the line as bright points.
 *
 * Keys: 1–4 or ← → variant, J K next thing, ↵ open it, [ sidebar, T theme, ⌘K palette.
 * Address: ?v=1..4, ?bare=1 (no picker, for screenshots). */

import { StrictMode, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '../../src/styles/base.css';
import '../../src/styles/theme.css';
import '../../src/styles/ui.css';
import '../../src/styles/shell.css';
import '../../src/styles/palette.css';
import '../../src/pages/home/HomePage.css';
import '../../src/styles/accessibility.css';
import './proto.css';
import './variants/variants.css';
import { Sidebar } from '../../src/components/Sidebar/Sidebar';
import { useKeyboardShortcuts } from '../../src/hooks/useKeyboardShortcuts';
import { useTheme } from '../../src/hooks/useTheme';
import { navigate } from '../../src/lib/route';
import { HomePalette } from '../../src/pages/home/components/Palette/HomePalette';
import { useStation } from '../../src/pages/home/hooks/useStation';
import type { HomeProps } from './shared';
import { Sieve } from './variants/Sieve';
import { Dial } from './variants/Dial';
import { Stack } from './variants/Stack';
import { Ridge } from './variants/Ridge';

const VARIANTS: { name: string; idea: string; Screen: ComponentType<HomeProps> }[] = [
  { name: 'Sieve', idea: 'Every alert falls through the rules; what nobody hid lands on the floor', Screen: Sieve },
  { name: 'Dial', idea: 'The hour as one instrument: pages rise outside the ring, hidden alerts sink inside', Screen: Dial },
  { name: 'Stack', idea: 'What is waiting on you, as a pile of cards you throw away one by one', Screen: Stack },
  { name: 'Ridge', idea: "Each group's hour as a ridgeline, nine stacked, drifting as time moves", Screen: Ridge },
];

const params = new URLSearchParams(location.search);
const bare = params.has('bare');

function Page({ Screen }: { Screen: ComponentType<HomeProps> }) {
  const data = useStation();
  const { queue } = data;
  const [picked, setPicked] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hideSide, setHideSide] = useState(false);
  const [theme, toggleTheme] = useTheme();

  const at = Math.min(picked, Math.max(0, queue.length - 1));
  const need = queue[at];
  // Steps wrap round the queue here (the page clamps), so the pile in Stack can keep turning.
  const step = (by: number) => queue.length && setPicked((at + by + queue.length) % queue.length);
  const pickGroup = (id: string) => {
    const first = queue.findIndex((n) => n.groupId === id);
    if (first >= 0) setPicked(first);
  };

  useKeyboardShortcuts({
    tourOpen: false,
    paletteOpen,
    onTogglePalette: () => setPaletteOpen((open) => !open),
    keys: {
      j: () => step(1),
      ArrowDown: () => step(1),
      k: () => step(-1),
      ArrowUp: () => step(-1),
      Enter: () => need && navigate(need.href),
      '[': () => setHideSide((hidden) => !hidden),
      t: toggleTheme,
    },
  });

  return (
    <div className="mn hm hs" data-hide-side={hideSide || undefined}>
      <Sidebar hidden={hideSide} page="home" onOpenPalette={() => setPaletteOpen(true)} theme={theme} onToggleTheme={toggleTheme} />
      <section className="mn-detail hm-pane hs-pane">
        <button
          className="mn-icon-btn hm-side-toggle"
          onClick={() => setHideSide((hidden) => !hidden)}
          aria-pressed={!hideSide}
          aria-label="Sidebar"
          title={`${hideSide ? 'Show' : 'Hide'} sidebar  [`}
        >
          {hideSide ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
        <Screen data={data} at={at} need={need} step={step} pickGroup={pickGroup} theme={theme} />
      </section>
      <HomePalette open={paletteOpen} onOpenChange={setPaletteOpen} onNavigate={navigate} theme={theme} onToggleTheme={toggleTheme} />
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
      if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector('[cmdk-dialog]')) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= VARIANTS.length) pick(n - 1);
      else if (e.key === 'ArrowRight') pick((current + 1) % VARIANTS.length);
      else if (e.key === 'ArrowLeft') pick((current - 1 + VARIANTS.length) % VARIANTS.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const { Screen, name } = VARIANTS[current];
  return (
    <div className="mn mn-app">
      <Page key={name} Screen={Screen} />
      {!bare && <Picker current={current} onPick={pick} />}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

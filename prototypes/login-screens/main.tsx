/* Throwaway prototype: four sign-in screens for Imperial Ops, behind a picker.
 * Open http://localhost:5199/prototypes/login-screens/ with the dev server running.
 * Nothing in src/ imports from here; delete the folder once a direction is chosen.
 *
 * All four use the real page's mock sign-in (src/pages/login/data/mockAuth.ts), so every
 * failure works: a wrong password, three of them (a lock), and the service being down.
 *
 *   1 Approach      one spatial object: the station turns beside the form; signing in flies you into it
 *   2 One step      the interaction: one question at a time, in large type, no card
 *   3 Behind glass  the context: the app waits, frosted, behind a glass card; signing in lifts the glass
 *   4 Badge         a physical metaphor: an access card that fills itself in and is read by a reader
 *
 * Keys: 1–4 or ← → variant, R replay, T theme. Address: ?v=1..4. */

import { StrictMode, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { Moon, Sun } from 'lucide-react';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '../../src/styles/base.css';
import '../../src/styles/theme.css';
import '../../src/styles/ui.css';
import '../../src/styles/shell.css';
import '../../src/components/Sidebar/Sidebar.css';
import '../../src/pages/login/login.css';
import '../../src/styles/accessibility.css';
import './proto.css';
import './variants/variants.css';
import { useTheme, type Theme } from '../../src/hooks/useTheme';
import { DEMO } from '../../src/pages/login/data/mockAuth';
import { Approach } from './variants/Approach';
import { OneStep } from './variants/OneStep';
import { Glass } from './variants/Glass';
import { Badge } from './variants/Badge';

const VARIANTS: { name: string; idea: string; Screen: ComponentType<{ theme: Theme }> }[] = [
  { name: 'Approach', idea: 'The station turns beside the form; signing in flies you into it', Screen: Approach },
  { name: 'One step', idea: 'One question at a time, in large type, no card', Screen: OneStep },
  { name: 'Behind glass', idea: 'The app waits, frosted, behind a glass card; signing in lifts the glass', Screen: Glass },
  { name: 'Badge', idea: 'An access card that fills itself in as you type, read by a reader', Screen: Badge },
];

const typing = (t: EventTarget | null) => t instanceof HTMLElement && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);

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
  const [run, setRun] = useState(0);
  const [theme, toggleTheme] = useTheme();

  const pick = (i: number) => {
    setCurrent(i);
    setRun((n) => n + 1);
    const url = new URL(location.href);
    url.searchParams.set('v', String(i + 1));
    history.replaceState(null, '', url);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= VARIANTS.length) pick(n - 1);
      else if (e.key === 'ArrowRight') pick((current + 1) % VARIANTS.length);
      else if (e.key === 'ArrowLeft') pick((current - 1 + VARIANTS.length) % VARIANTS.length);
      else if (e.key === 'r' || e.key === 'R') setRun((n) => n + 1);
      else if (e.key === 't' || e.key === 'T') toggleTheme();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const { Screen } = VARIANTS[current];
  return (
    <div className="mn mn-app">
      <Screen key={`${current}-${run}`} theme={theme} />
      <div className="lgp-corner">
        <button className="mn-icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} title="Theme  T">
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <span>
          Demo <code>{DEMO.email}</code> · <code>{DEMO.password}</code>. <code>{DEMO.offline}</code> shows the service down; three wrong passwords lock it.
        </span>
      </div>
      <Picker current={current} onPick={pick} onReplay={() => setRun((n) => n + 1)} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

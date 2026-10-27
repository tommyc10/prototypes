/* Throwaway prototype: four ways to see the top talkers, the services with the most tickets,
 * incidents and rules, each where it would live in the app. Behind a picker.
 * Open http://localhost:5188/prototypes/top-talkers/ with the dev server running.
 * Nothing in src/ imports from here; delete the folder once a direction is chosen.
 *
 *   1 Board     its own page: the sidebar's Services item. Every service ranked in the list,
 *               the picked one in full in the pane, with its rules.
 *   2 Treemap   a card on Home. Each service's area is its share, so the loudest is the
 *               biggest thing on the card.
 *   3 Quadrant  a panel on the Hindcast. Rules across, tickets up: the loud ones with few
 *               rules sit top left, where tuning pays. Picking one scopes the page.
 *   4 Loudest   a section in the sidebar, on every page. The top five, each with eight
 *               weeks of history; picking one opens its card.
 *
 * All four read the same figures (model.ts): the hindcast's tickets and the Rules page's rules.
 * Keys: 1–4 or ← → variant, then each variant's own (shown on screen). Address: ?v=1..4, ?bare. */

import { StrictMode, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '../../src/styles/base.css';
import '../../src/styles/theme.css';
import '../../src/styles/ui.css';
import '../../src/styles/shell.css';
import '../../src/styles/palette.css';
import '../../src/styles/halloween.css';
import '../../src/pages/rule-management/components/RuleList/SortMenu.css';
import '../../src/pages/hindcast/components/charts/charts.css';
import '../../src/styles/accessibility.css';
import './proto.css';
import './variants/variants.css';
import { Board } from './variants/Board';
import { Treemap } from './variants/Treemap';
import { Quadrant } from './variants/Quadrant';
import { Loudest } from './variants/Loudest';

const VARIANTS: { name: string; idea: string; Screen: ComponentType }[] = [
  { name: 'Board', idea: 'Its own page, the Services item in the sidebar: every service ranked, one in full', Screen: Board },
  { name: 'Treemap', idea: 'A card on Home: each service sized by its share', Screen: Treemap },
  { name: 'Quadrant', idea: 'A panel on the Hindcast: rules against tickets, loud and under-ruled at the top left', Screen: Quadrant },
  { name: 'Loudest', idea: 'A section in the sidebar, on every page: the top five, each opening its card', Screen: Loudest },
];

const params = new URLSearchParams(location.search);
const bare = params.has('bare');

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
          {v.name}
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
    // Drop whatever the last variant's page put after the #, so the next starts clean.
    const url = new URL(location.href);
    url.searchParams.set('v', String(i + 1));
    url.hash = '';
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

  const { Screen } = VARIANTS[current]!;
  return (
    <div className="mn mn-app">
      <Screen key={current} />
      {!bare && <Picker current={current} onPick={pick} />}
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

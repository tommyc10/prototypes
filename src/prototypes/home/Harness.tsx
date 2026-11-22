/* Throwaway: the real sidebar and palette, one home variant at a time in the pane, and the
 * picker to flip between them. Any link the variants or sidebar follow (#/rules/…) opens in
 * the real app, so nothing here is a dead end. */

import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../hooks/useTheme';
import { HomePalette } from '../../pages/home/components/Palette/HomePalette';
import { useStation } from '../../pages/home/hooks/useStation';
import type { VariantProps } from './shared';
import { Board } from './variants/Board';
import { Briefing } from './variants/Briefing';
import { Pulse } from './variants/Pulse';
import { Triage } from './variants/Triage';
import './picker.css';
import './variants.css';

const VARIANTS: { name: string; View: ComponentType<VariantProps> }[] = [
  { name: 'Briefing', View: Briefing },
  { name: 'Board', View: Board },
  { name: 'Triage', View: Triage },
  { name: 'Pulse', View: Pulse },
];

const toApp = () => {
  if (location.hash && location.hash !== '#/' && location.hash !== '#') location.href = `/${location.hash}`;
};

export function Harness() {
  const data = useStation();
  const [theme, toggleTheme] = useTheme();
  const [hideSide, setHideSide] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [current, setCurrent] = useState(() => {
    const v = Number(new URLSearchParams(location.search).get('v'));
    return v >= 1 && v <= VARIANTS.length ? v - 1 : 0;
  });
  const [mount, setMount] = useState(0);

  useEffect(() => {
    toApp();
    window.addEventListener('hashchange', toApp);
    return () => window.removeEventListener('hashchange', toApp);
  }, []);

  useKeyboardShortcuts({
    tourOpen: false,
    paletteOpen,
    onTogglePalette: () => setPaletteOpen((open) => !open),
    keys: { '[': () => setHideSide((hidden) => !hidden) },
  });

  const pick = (i: number) => {
    if (i < 0 || i >= VARIANTS.length) return;
    setCurrent(i);
    setMount((m) => m + 1);
    const url = new URL(location.href);
    url.searchParams.set('v', String(i + 1));
    history.replaceState(null, '', url);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (paletteOpen || e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= VARIANTS.length) pick(n - 1);
      else if (e.key === 'ArrowRight') pick((current + 1) % VARIANTS.length);
      else if (e.key === 'ArrowLeft') pick((current - 1 + VARIANTS.length) % VARIANTS.length);
      else if (e.key === 'r' || e.key === 'R') setMount((m) => m + 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const { View } = VARIANTS[current];
  return (
    <div className="mn mn-app">
      <div className="mn-stage">
        <div className="mn-stage-layer">
          <div className="mn pv" data-hide-side={hideSide || undefined}>
            <Sidebar hidden={hideSide} page="home" onOpenPalette={() => setPaletteOpen(true)} theme={theme} onToggleTheme={toggleTheme} />
            <section className="mn-detail pv-pane">
              <button
                className="mn-icon-btn pv-side-toggle"
                onClick={() => setHideSide((hidden) => !hidden)}
                aria-pressed={!hideSide}
                aria-label="Sidebar"
                title={`${hideSide ? 'Show' : 'Hide'} sidebar  [`}
              >
                {hideSide ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
              </button>
              <View key={mount} data={data} />
            </section>
            <HomePalette open={paletteOpen} onOpenChange={setPaletteOpen} onNavigate={(to) => (location.href = `/${to}`)} theme={theme} onToggleTheme={toggleTheme} />
          </div>
        </div>
      </div>
      <Picker names={VARIANTS.map((v) => v.name)} current={current} onPick={pick} onReplay={() => setMount((m) => m + 1)} />
    </div>
  );
}

/** The picker from the prototype skill's PICKER.md: harness chrome, not part of any variant. */
function Picker({ names, current, onPick, onReplay }: { names: string[]; current: number; onPick: (i: number) => void; onReplay: () => void }) {
  const nav = useRef<HTMLElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const highlight = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const move = () => {
      const el = items.current[current];
      if (!el || !highlight.current) return;
      highlight.current.style.width = `${el.offsetWidth}px`;
      highlight.current.style.transform = `translateX(${el.offsetLeft}px)`;
    };
    move();
    window.addEventListener('resize', move);
    return () => window.removeEventListener('resize', move);
  }, [current]);

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => nav.current?.setAttribute('data-ready', '')));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <nav className="proto-picker" aria-label="Prototype variants" ref={nav}>
      <span className="proto-picker-highlight" aria-hidden="true" ref={highlight} />
      {names.map((name, i) => (
        <button
          key={name}
          ref={(el) => {
            items.current[i] = el;
          }}
          className="proto-picker-item"
          data-active={i === current || undefined}
          aria-current={i === current || undefined}
          onClick={() => onPick(i)}
        >
          {name}
        </button>
      ))}
      <span className="proto-picker-divider" aria-hidden="true" />
      <button className="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" onClick={onReplay}>
        ↻
      </button>
    </nav>
  );
}

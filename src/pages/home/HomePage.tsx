/* The home page: how the station is, and the one thing to look at first. It owns almost no
 * state of its own. Everything on it is read from the other pages' data (the alert stream,
 * the rules, the change windows), so it can't say something they don't.
 *
 *   the column   the figure that matters this hour, a sentence that says what it means,
 *                and the most pressing thing waiting on you
 *   the station  every assignment group as a point on a sphere (components/Station)
 *
 * The two are tied: J and K turn to the next thing, and the station turns to the group it
 * belongs to. Clicking a group on the station jumps to what's waiting for it. */

import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { NightScene } from '../../components/Halloween/NightScene';
import { useHalloween } from '../../hooks/useHalloween';
import { useTheme } from '../../hooks/useTheme';
import { num } from '../../lib/format';
import { navigate } from '../../lib/route';
import { CURRENT_USER } from '../rule-management/data/mockData';
import { HomePalette } from './components/Palette/HomePalette';
import { Station } from './components/Station/Station';
import { useStation } from './hooks/useStation';
import { clockFace, dayFace, plural, TONE_COLOR } from './model/station';
import './HomePage.css';

/** What the station is doing: facing the thing you're on, facing a group you clicked, or turning freely. */
type Facing = { kind: 'need' } | { kind: 'group'; id: string } | { kind: 'free' };

export function HomePage() {
  const data = useStation();
  const { counts, queue, groups, now } = data;
  const [picked, setPicked] = useState(0);
  const [facing, setFacing] = useState<Facing>({ kind: 'need' });
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hideSide, setHideSide] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const halloween = useHalloween();

  const at = Math.min(picked, Math.max(0, queue.length - 1));
  const need = queue[at];
  const step = (by: number) => {
    setPicked(Math.max(0, Math.min(queue.length - 1, at + by)));
    setFacing({ kind: 'need' });
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
    },
  });

  const facedId = facing.kind === 'group' ? facing.id : facing.kind === 'need' ? (need?.groupId ?? null) : null;
  const shown = groups.find((g) => g.group.id === (hoverId ?? facedId));

  /** A group was clicked on the station: go to the first thing of its that's waiting, if there is one. */
  const pick = (id: string | null) => {
    if (!id) return setFacing({ kind: 'free' });
    const first = queue.findIndex((n) => n.groupId === id);
    if (first < 0) return setFacing({ kind: 'group', id });
    setPicked(first);
    setFacing({ kind: 'need' });
  };

  // "Good afternoon, Admiral." The rank is the first word of the name.
  const hour = new Date(now).getHours();
  const hello = `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${CURRENT_USER.split(' ')[0]}.`;

  return (
    <div className="mn hm" data-hide-side={hideSide || undefined}>
      <Sidebar hidden={hideSide} page="home" onOpenPalette={() => setPaletteOpen(true)} theme={theme} onToggleTheme={toggleTheme} />

      <section className="mn-detail hm-pane">
        {halloween && <NightScene variant="ground" />}
        <button
          className="mn-icon-btn hm-side-toggle"
          onClick={() => setHideSide((hidden) => !hidden)}
          aria-pressed={!hideSide}
          aria-label="Sidebar"
          title={`${hideSide ? 'Show' : 'Hide'} sidebar  [`}
        >
          {hideSide ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>

        <div className="hm-page">
          <div className="hm-col">
            <header className="hm-head">
              <p className="hm-date">
                {dayFace(now)} <span className="mn-mono">{clockFace(now)}</span>
              </p>
              <h1>{hello}</h1>
            </header>

            <section className="hm-figure">
              <a className="hm-num" href="#/alerts" aria-label={`${counts.paged} alerts reached a person. Open the alert stream.`}>
                {num(counts.paged)}
              </a>
              <p className="hm-lead">
                {counts.paged === 1 ? 'alert' : 'alerts'} reached a person in the last hour, out of <b>{num(counts.total)}</b>. Rules hid{' '}
                <b>{num(counts.hidden)}</b>, and <b>{num(counts.folded)}</b> joined incidents that were already open.
              </p>
            </section>

            <section className="hm-need" aria-live="polite">
              {need ? (
                <>
                  <p className="hm-need-count">{queue.length === 1 ? 'One thing is waiting on you' : `${at + 1} of ${queue.length} waiting on you`}</p>
                  <a className="hm-need-row" href={need.href}>
                    <i style={{ background: TONE_COLOR[need.tone] }} aria-hidden />
                    <span className="hm-need-main">
                      <span className="hm-need-title">
                        {need.title} <span className="hm-need-kind">{need.kind}</span>
                      </span>
                      <span className="hm-need-why">{need.why}</span>
                    </span>
                    <kbd>↵</kbd>
                  </a>
                </>
              ) : (
                <p className="hm-need-count">Nothing is waiting on you.</p>
              )}
            </section>

            {queue.length > 1 && (
              <footer className="hm-keys">
                <span>
                  <kbd>J</kbd> <kbd>K</kbd> Next thing
                </span>
                <span>
                  <kbd>↵</kbd> Open it
                </span>
              </footer>
            )}
          </div>

          <div className="hm-station">
            <Station data={data} theme={theme} pickedId={facedId} hoverId={hoverId} onPick={pick} onHover={setHoverId} />
            <p className="hm-caption" aria-live="polite">
              {shown ? (
                <>
                  <b>{shown.group.name}</b> {shown.group.unit}
                  <span>
                    {plural(shown.paged, 'page')} this hour, from {plural(shown.total, 'alert')}
                  </span>
                </>
              ) : (
                <span>Drag to turn the station. Pick a group to see what's waiting for it.</span>
              )}
            </p>
          </div>
        </div>
      </section>

      <HomePalette open={paletteOpen} onOpenChange={setPaletteOpen} onNavigate={navigate} theme={theme} onToggleTheme={toggleTheme} />
    </div>
  );
}

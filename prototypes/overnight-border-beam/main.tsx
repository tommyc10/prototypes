/* Throwaway prototype: the "Found overnight" card with the Border beam package (border-beam,
 * libraries.dev/beam) instead of the hand-made mn-beam, in two variants behind a picker.
 * Open http://localhost:5188/prototypes/overnight-border-beam/ with the dev server running.
 * Nothing in src/ imports from here; delete the folder once a direction is chosen.
 *
 *   1 Pulse inner           size="pulse-inner", colorVariant="mono": what ships in src/ now.
 *                           Grey, because colour on this page means status.
 *   2 Pulse inner · colour  the same, with the package's free palettes to compare:
 *                           Colorful, Ocean, Sunset and Mono (C cycles them).
 *
 * Both breathe in place rather than travel: the card waits on a decision, and the package's
 * guidance for that is pulse-inner. The glow fades out with the card when its last suggestion
 * is proposed or dismissed (A or X).
 *
 * Keys: 1 2 variant, C colour, J K step, A X propose / dismiss, O collapse, T theme, R replay.
 * Address: ?v=1|2, ?c=colorful|ocean|sunset|mono, ?theme=light. */

import { StrictMode, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BorderBeam, type BorderBeamColorVariant } from 'border-beam';
import { ChevronDown, Sun } from 'lucide-react';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '../../src/styles/base.css';
import '../../src/styles/theme.css';
import '../../src/styles/ui.css';
import '../../src/styles/shell.css';
import '../../src/pages/rule-management/components/RuleList/RuleList.css';
import '../../src/pages/rule-management/components/RuleList/OvernightBlock.css';
import './proto.css';
import { NIGHT_TOTAL, SUGGESTIONS, type Suggestion } from './shared';

type Theme = 'dark' | 'light';

/** The free palettes libraries.dev documents. (The package's types list four more, which are Pro.) */
const COLOURS: { id: BorderBeamColorVariant; label: string }[] = [
  { id: 'colorful', label: 'Colorful' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'mono', label: 'Mono' },
];

const VARIANTS = [
  { name: 'Pulse inner', colours: false },
  { name: 'Pulse inner · colour', colours: true },
];

const RULES = [
  { id: 'RUL-0435', name: 'Superlaser pre-charge sequence warnings', group: 'Reactor Core', status: 'proposed', conf: '47%', inc: 11 },
  { id: 'RUL-0428', name: 'Stormtrooper armour fitting ticket duplicates', group: 'Armory & Logistics', status: 'proposed', conf: '95%', inc: 121 },
  { id: 'RUL-0433', name: 'Hyperdrive fault codes on impounded YT-1300', group: 'Hyperdrive Maintenance', status: 'active', conf: '88%', inc: 15 },
  { id: 'RUL-0421', name: 'Cell 2187 door sensor false-open', group: 'Detention Block AA-23', status: 'active', conf: '91%', inc: 27 },
  { id: 'RUL-0424', name: 'Deck 12 CO2 warnings during shift change', group: 'Life Support', status: 'inactive', conf: '84%', inc: 97 },
];

const params = new URLSearchParams(location.search);

/** Mono on a light card, as src/ tunes it (OvernightBlock.tsx): darker and a little wider, so it shows. */
const LIGHT_MONO = { brightness: 0.45, glowSize: 1.4 };

function Page({ colour, theme, onTheme }: { colour: BorderBeamColorVariant; theme: Theme; onTheme: () => void }) {
  const [open, setOpen] = useState<Suggestion[]>(SUGGESTIONS);
  const [selectedId, setSelectedId] = useState<string | null>(SUGGESTIONS[0].id);
  const [collapsed, setCollapsed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  const rows = [...(collapsed || gone ? [] : open.map((s) => s.id)), ...RULES.map((r) => r.id)];
  const suggestion = open.find((s) => s.id === selectedId);
  const rule = RULES.find((r) => r.id === selectedId);

  const handle = (id: string) => {
    const at = open.findIndex((s) => s.id === id);
    const rest = open.filter((s) => s.id !== id);
    setOpen(rest);
    setSelectedId(rest[Math.min(at, rest.length - 1)]?.id ?? RULES[0].id);
    if (rest.length === 0) {
      // As in src: the card and its glow fade out together, then it's gone.
      setLeaving(true);
      setTimeout(() => setGone(true), 500);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const at = rows.indexOf(selectedId ?? '');
      if (k === 'j' || e.key === 'ArrowDown') setSelectedId(rows[Math.min(at + 1, rows.length - 1)]);
      else if (k === 'k' || e.key === 'ArrowUp') setSelectedId(rows[Math.max(at - 1, 0)]);
      else if ((k === 'a' || k === 'x') && suggestion) handle(suggestion.id);
      else if (k === 'o' && !gone) setCollapsed((c) => !c);
      else if (k === 't') onTheme();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const inPatterns = open.reduce((n, s) => n + s.incidents, 0);

  return (
    <div className="mn proto-shell">
      <aside className="mn-side proto-side">
        <div className="proto-brand">Imperial Ops</div>
        {['Home', 'Incidents', 'Alerts', 'Rules', 'Hindcast', 'Forecast', 'Change windows'].map((n) => (
          <div key={n} className="proto-nav" data-active={n === 'Rules' || undefined}>
            {n}
          </div>
        ))}
        <button className="proto-theme" onClick={onTheme} aria-label="Switch theme (T)">
          <Sun size={15} />
        </button>
      </aside>

      <section className="mn-list">
        <div className="mn-list-head">
          <div className="mn-list-title">
            <h1>Rules</h1>
          </div>
        </div>
        <div className="mn-rows" role="listbox">
          {!gone && (
            // Exactly how src/ wraps it (OvernightBlock.tsx): the beam's wrapper is the card's
            // outer box and takes its exit; the radius is read from the card inside.
            <BorderBeam
              size="pulse-inner"
              colorVariant={colour}
              theme={theme}
              {...(theme === 'light' && colour === 'mono' ? LIGHT_MONO : {})}
              active={!leaving}
              className="mn-overnight-beam"
              data-leaving={leaving || undefined}
            >
              <div className="mn-overnight" data-collapsed={collapsed || undefined} inert={leaving}>
                <button className="mn-overnight-head" aria-expanded={!collapsed} onClick={() => setCollapsed((c) => !c)}>
                  <ChevronDown size={13} />
                  <span className="mn-overnight-title">
                    Found overnight <b>{open.length}</b>
                  </span>
                  <span className="mn-overnight-sum">
                    {inPatterns} of {NIGHT_TOTAL} incidents
                  </span>
                  <kbd>O</kbd>
                </button>
                <div className="mn-overnight-share" aria-hidden>
                  {open.map((s) => (
                    <span key={s.id} data-on={s.id === selectedId || undefined} style={{ flexGrow: s.incidents }} />
                  ))}
                  <span data-rest style={{ flexGrow: NIGHT_TOTAL - inPatterns }} />
                </div>
                {!collapsed &&
                  open.map((s) => (
                    <div
                      key={s.id}
                      role="option"
                      aria-selected={s.id === selectedId}
                      className="mn-row"
                      data-selected={s.id === selectedId || undefined}
                      onClick={() => setSelectedId(s.id)}
                    >
                      <span className="mn-dot" data-status="suggested" aria-label="Suggested" />
                      <div className="mn-row-main">
                        <div className="mn-row-name">{s.name}</div>
                        <div className="mn-row-meta">
                          {s.hides > 0 ? <span className="mn-bad">Hides {s.hides} that needed a person</span> : <span>{s.group}</span>}
                        </div>
                      </div>
                      <div className="mn-row-side">
                        <span className="mn-row-conf">{Math.round(s.confidence * 100)}%</span>
                        <span className="mn-subtle">{s.incidents} inc</span>
                      </div>
                    </div>
                  ))}
              </div>
            </BorderBeam>
          )}
          {RULES.map((r) => (
            <div
              key={r.id}
              role="option"
              aria-selected={r.id === selectedId}
              className="mn-row"
              data-selected={r.id === selectedId || undefined}
              onClick={() => setSelectedId(r.id)}
            >
              <span className="mn-dot" data-status={r.status} />
              <div className="mn-row-main">
                <div className="mn-row-name">{r.name}</div>
                <div className="mn-row-meta">
                  <span className="mn-mono">{r.id}</span>
                  <span>{r.group}</span>
                </div>
              </div>
              <div className="mn-row-side">
                <span>{r.conf}</span>
                <span className="mn-subtle">{r.inc} inc</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mn-hints">
          <span>
            <kbd>J</kbd>
            <kbd>K</kbd> Navigate
          </span>
          <span>
            <kbd>A</kbd>
            <kbd>X</kbd> Propose, dismiss
          </span>
          <span>
            <kbd>T</kbd> Theme
          </span>
        </div>
      </section>

      <main className="mn-detail proto-detail">
        {suggestion ? (
          <>
            <div className="proto-eyebrow">
              <span className="mn-dot" data-status="suggested" /> Found overnight
            </div>
            <h2>{suggestion.name}</h2>
            <p className="proto-sub">
              {suggestion.group} · {suggestion.incidents} incidents last night · {Math.round(suggestion.confidence * 100)}% confident
            </p>
            <div className="proto-actions">
              <button className="mn-btn" data-variant="primary" onClick={() => handle(suggestion.id)}>
                Propose <kbd>A</kbd>
              </button>
              <button className="mn-btn" onClick={() => handle(suggestion.id)}>
                Dismiss <kbd>X</kbd>
              </button>
            </div>
          </>
        ) : rule ? (
          <>
            <div className="proto-eyebrow">
              <span className="mn-mono">{rule.id}</span>
            </div>
            <h2>{rule.name}</h2>
            <p className="proto-sub">
              Scoped to {rule.group} · {rule.inc} incidents in 90 days
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
}

/** A sliding-highlight picker (the prototype picker spec). */
function Picker<T extends string | number>({ items, current, onPick, label, extra }: { items: { id: T; label: string }[]; current: T; onPick: (id: T) => void; label: string; extra?: ReactNode }) {
  const highlight = useRef<HTMLSpanElement>(null);
  const refs = useRef(new Map<T, HTMLButtonElement | null>());
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const move = () => {
      const el = refs.current.get(current);
      if (!el || !highlight.current) return;
      highlight.current.style.width = el.offsetWidth + 'px';
      highlight.current.style.transform = `translateX(${el.offsetLeft}px)`;
    };
    move();
    window.addEventListener('resize', move);
    return () => window.removeEventListener('resize', move);
  }, [current, items]);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
  }, []);

  return (
    <nav className="proto-picker" aria-label={label} data-ready={ready || undefined}>
      <span ref={highlight} className="proto-picker-highlight" aria-hidden="true" />
      {items.map((item) => (
        <button
          key={item.id}
          ref={(el) => {
            refs.current.set(item.id, el);
          }}
          className="proto-picker-item"
          data-active={item.id === current || undefined}
          aria-current={item.id === current ? 'true' : undefined}
          onClick={() => onPick(item.id)}
        >
          {item.label}
        </button>
      ))}
      {extra}
    </nav>
  );
}

function App() {
  const [variant, setVariant] = useState(() => {
    const v = (parseInt(params.get('v') ?? '', 10) || 1) - 1;
    return v >= 0 && v < VARIANTS.length ? v : 0;
  });
  const [colour, setColour] = useState<BorderBeamColorVariant>(() => COLOURS.find((c) => c.id === params.get('c'))?.id ?? 'colorful');
  const [theme, setTheme] = useState<Theme>(() => (params.get('theme') === 'light' || localStorage.getItem('mn-theme') === 'light' ? 'light' : 'dark'));
  const [mount, setMount] = useState(0);

  useLayoutEffect(() => {
    document.documentElement.dataset.mnTheme = theme;
  }, [theme]);

  const remember = (key: string, value: string) => {
    const url = new URL(location.href);
    url.searchParams.set(key, value);
    history.replaceState(null, '', url);
  };
  const pickVariant = (i: number) => {
    setVariant(i);
    remember('v', String(i + 1));
  };
  const pickColour = (c: BorderBeamColorVariant) => {
    setColour(c);
    remember('c', c);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= VARIANTS.length) pickVariant(num - 1);
      else if (e.key === 'r' || e.key === 'R') setMount((m) => m + 1);
      else if ((e.key === 'c' || e.key === 'C') && VARIANTS[variant].colours) {
        const at = COLOURS.findIndex((c) => c.id === colour);
        pickColour(COLOURS[(at + 1) % COLOURS.length].id);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const shown = VARIANTS[variant].colours ? colour : 'mono';
  return (
    <>
      <Page key={mount} colour={shown} theme={theme} onTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />
      <div className="obb-pickers">
        {VARIANTS[variant].colours && <Picker label="Beam colour" items={COLOURS} current={colour} onPick={pickColour} />}
        <Picker
          label="Prototype variants"
          items={VARIANTS.map((v, i) => ({ id: i, label: v.name }))}
          current={variant}
          onPick={pickVariant}
          extra={
            <>
              <span className="proto-picker-divider" aria-hidden="true" />
              <button className="proto-picker-item proto-picker-replay" aria-label="Replay (R)" onClick={() => setMount((m) => m + 1)}>
                ↻
              </button>
            </>
          }
        />
      </div>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

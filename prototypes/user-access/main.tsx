import { StrictMode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Bell, CalendarClock, Check, ChevronRight, Filter, History, House, LockKeyhole, Moon, PanelLeftClose, PanelLeftOpen, ShieldCheck, Siren, Sun, Telescope, Users, X } from 'lucide-react';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '../../src/styles/base.css';
import '../../src/styles/theme.css';
import '../../src/styles/ui.css';
import '../../src/components/Sidebar/Sidebar.css';
import '../../src/styles/accessibility.css';
import './styles.css';
import './picker.css';
import { useAccess } from './model';
import Roster from './variants/Roster';
import Directory from './variants/Directory';
import ScopeMap from './variants/ScopeMap';

const variants = [{ name: 'Roster', Screen: Roster }, { name: 'Directory', Screen: Directory }, { name: 'Scope map', Screen: ScopeMap }];
function App() {
  const [current, setCurrent] = useState(() => {
    const value = Number(new URLSearchParams(location.search).get('v'));
    return Number.isInteger(value) && value >= 1 && value <= variants.length ? value - 1 : 0;
  });
  const [replay, setReplay] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('mn-ua-prototype-theme') === 'light' ? 'light' : 'dark');
  const [hideSide, setHideSide] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  const access = useAccess();
  const Screen = variants[current].Screen;
  function pick(i: number) {
    setCurrent(i); setReplay(r => r + 1);
    const url = new URL(location.href); url.searchParams.set('v', String(i + 1)); history.replaceState(null, '', url);
  }
  useEffect(() => {
    document.documentElement.dataset.mnTheme = theme;
    localStorage.setItem('mn-ua-prototype-theme', theme);
  }, [theme]);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const update = () => setHideSide(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= variants.length) { e.preventDefault(); pick(num - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); pick((current + 1) % variants.length); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); pick((current + variants.length - 1) % variants.length); }
      else if (e.key.toLowerCase() === 'r') setReplay(r => r + 1);
      else if (e.key === '[') setHideSide(s => !s);
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [current]);
  return <div className="mn mn-ua-shell" data-hide-sidebar={hideSide || undefined}>
    <aside className="mn-side" inert={hideSide}>
      <button className="mn-icon-btn mn-ua-mobile-close" aria-label="Close sidebar" onClick={() => setHideSide(true)}><X size={15} /></button>
      <a className="mn-brand" href="/#/"><div className="mn-brand-mark"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg></div>Imperial Ops</a>
      <div className="mn-ua-workspace"><span className="mn-ua-station-mark"><LayersMark /></span><div><strong>Imperial Navy</strong><span>Operations workspace</span></div><LockKeyhole size={12} /></div>
      <span className="mn-ua-nav-label">Operation</span><nav className="mn-nav" aria-label="Operation">{[
        ['Home', '', House], ['Incidents', 'incidents', Siren], ['Alerts', 'alerts', Bell], ['Rules', 'rules', Filter], ['Hindcast', 'hindcast', History], ['Forecast', 'forecast', Telescope], ['Change windows', 'changes', CalendarClock],
      ].map(([name, path, Icon]) => { const I = Icon as typeof House; return <a className="mn-nav-item" href={'/#/' + path} key={name as string}><I size={16} />{name as string}</a>; })}</nav>
      <span className="mn-ua-nav-label">Workspace</span><nav className="mn-nav" aria-label="Workspace"><a className="mn-nav-item" data-active aria-current="page" href={location.pathname + location.search}><Users size={16} />People & access<span className="mn-ua-nav-count">{access.members.length}</span></a></nav>
      <div className="mn-side-body"><div className="mn-ua-side-note"><ShieldCheck size={16} /><strong>Small scope. Clear ownership.</strong><p>Everyone sees the operation they’re here to look after.</p></div></div>
      <div className="mn-user"><div className="mn-avatar">AP</div><div className="mn-user-text"><div>Admiral Piett</div><div className="mn-subtle">Workspace admin</div></div><button className="mn-icon-btn" aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button></div>
    </aside>
    <div className="mn-ua-work-area"><div className="mn-ua-topbar"><div><button className="mn-icon-btn" aria-label={hideSide ? 'Show sidebar' : 'Hide sidebar'} onClick={() => setHideSide(s => !s)}>{hideSide ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}</button><span>Workspace</span><ChevronRight size={12} /><strong>People & access</strong></div><span><LockKeyhole size={12} />Administrator access</span></div>
      <div className="mn-ua-demo-note"><span className="mn-ua-prototype-badge">Prototype</span><span>Try it freely. Changes stay in this browser; no emails are sent.</span></div>
      <Screen key={current + '-' + replay} access={access} />
    </div>
    <div className="mn-ua-toast-region" aria-live="polite" aria-atomic="true">{access.notice && <div className="mn-ua-toast"><span><Check size={15} /></span><p>{access.notice}</p><button className="mn-icon-btn" aria-label="Dismiss notification" onClick={() => access.setNotice('')}><X size={14} /></button></div>}</div>
    <Picker current={current} onPick={pick} onReplay={() => setReplay(r => r + 1)} />
  </div>;
}
function LayersMark() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 5 8 2l6 3-6 3-6-3Zm0 3 6 3 6-3M2 11l6 3 6-3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>; }
function Picker({ current, onPick, onReplay }: { current: number; onPick: (i: number) => void; onReplay: () => void }) {
  const picker = useRef<HTMLElement>(null), highlight = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const move = () => {
      const el = picker.current?.querySelector<HTMLButtonElement>('.proto-picker-item[data-active]');
      if (el && highlight.current) { highlight.current.style.width = el.offsetWidth + 'px'; highlight.current.style.transform = `translateX(${el.offsetLeft}px)`; }
    };
    move(); window.addEventListener('resize', move);
    return () => window.removeEventListener('resize', move);
  }, [current]);
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setReady(true)); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, []);
  return <nav className="proto-picker" ref={picker} aria-label="Prototype variants" data-ready={ready ? '' : undefined}><span className="proto-picker-highlight" ref={highlight} aria-hidden="true" />{variants.map((v, i) => <button key={v.name} className="proto-picker-item" data-active={current === i ? '' : undefined} aria-current={current === i ? 'true' : undefined} onClick={() => onPick(i)}>{v.name}</button>)}<span className="proto-picker-divider" aria-hidden="true" /><button className="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" onClick={onReplay}>↻</button></nav>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

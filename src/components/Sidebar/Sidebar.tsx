/* The sidebar every page shares: brand, ⌘K button, navigation, the signed-in user, the tour
 * and the theme switch. Whatever a page wants under the navigation (the rules page puts its
 * pinned groups there) comes in as children. */

import type { ReactNode } from 'react';
import { Bell, BookText, CalendarClock, CircleHelp, Filter, History, LayoutGrid, Moon, Search, Siren, Sun } from 'lucide-react';
import type { PageId } from '../../lib/route';
import type { Theme } from '../../hooks/useTheme';
import './Sidebar.css';

export function Sidebar({
  hidden,
  page,
  onOpenPalette,
  onStartTour,
  theme,
  onToggleTheme,
  children,
}: {
  hidden: boolean;
  /** The page that's showing, to mark it in the navigation. */
  page: PageId;
  onOpenPalette: () => void;
  onStartTour: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  children?: ReactNode;
}) {
  return (
    <aside className="mn-side" inert={hidden}>
      <div className="mn-brand">
        <div className="mn-brand-mark" aria-hidden>
          <svg viewBox="0 0 24 24" width="14" height="14">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
        </div>
        Imperial Ops
      </div>

      <button className="mn-jump" onClick={onOpenPalette} data-tour="jump">
        <Search size={14} />
        <span>Search or jump to…</span>
        <kbd>⌘K</kbd>
      </button>

      <nav className="mn-nav">
        <a className="mn-nav-item"><Siren size={16} /> Incidents</a>
        <a className="mn-nav-item" href="#/alerts" data-active={page === 'alerts' || undefined}>
          <Bell size={16} /> Alerts
        </a>
        <a className="mn-nav-item" href="#/rules" data-active={page === 'rules' || undefined}>
          <Filter size={16} /> Rules
        </a>
        <a className="mn-nav-item" href="#/hindcast" data-active={page === 'hindcast' || undefined}>
          <History size={16} /> Hindcast
        </a>
        <a className="mn-nav-item" href="#/changes" data-active={page === 'changes' || undefined}>
          <CalendarClock size={16} /> Change windows
        </a>
        <a className="mn-nav-item"><LayoutGrid size={16} /> Services</a>
        <a className="mn-nav-item"><BookText size={16} /> Audit log</a>
      </nav>

      <div className="mn-side-body">{children}</div>

      <div className="mn-user">
        <div className="mn-avatar">AP</div>
        <div className="mn-user-text">
          <div>Admiral Piett</div>
          <div className="mn-subtle">Rule governor</div>
        </div>
        <button className="mn-icon-btn" onClick={onStartTour} aria-label="Take the tour" title="Take the tour  ?">
          <CircleHelp size={15} />
        </button>
        <button
          className="mn-icon-btn mn-theme-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </aside>
  );
}

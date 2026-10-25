/* The sidebar every page shares: brand, ⌘K button, the pages, your pinned groups, the admin
 * pages, then the signed-in user, the tour and the theme switch.
 *
 * The pages are grouped by the question you come with:
 *
 *   (none)   Home, Services     where to start: this hour, or one service
 *   Live     Incidents, Alerts, Change windows     what's happening now
 *   Tuning   Rules, Hindcast, Forecast            cutting the noise, and the evidence for it
 *   Pinned   your groups, on every page
 *   Admin    Access, Audit log    rare, so pushed to the bottom
 *
 * A count shows only when it asks something of a person ("4 waiting"), and only its number
 * takes a status colour. Each page's G-chord (G I: Incidents) is in its tooltip.
 * Whatever a page wants under the pins comes in as children. */

import type { ComponentType, ReactNode } from 'react';
import { Bell, BookText, CalendarClock, CircleHelp, Filter, History, House, LayoutGrid, Moon, Search, Siren, Sun, Telescope, Users } from 'lucide-react';
import { goKey, type PageId } from '../../lib/route';
import type { Theme } from '../../hooks/useTheme';
import type { Pin } from '../../pages/rule-management/hooks/usePinnedGroups';
import { useNavCounts } from './navCounts';
import { PinnedGroups } from './PinnedGroups';
import './Sidebar.css';

type Tone = 'red' | 'orange' | 'amber';

interface Item {
  /** The page it opens. Services and the Audit log aren't built yet. */
  page?: PageId;
  label: string;
  Icon: ComponentType<{ size?: number }>;
  count?: { n: number; word?: string; tone?: Tone; title: string };
}

export function Sidebar({
  hidden,
  page,
  onOpenPalette,
  onStartTour,
  theme,
  onToggleTheme,
  activePin,
  onPin,
  children,
}: {
  hidden: boolean;
  /** The page that's showing, to mark it in the navigation. */
  page: PageId;
  onOpenPalette: () => void;
  /** A page with no tour leaves this out, and the button with it. */
  onStartTour?: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  /** The Rules page: the group it's filtered to, and filtering in place when a pin is picked. */
  activePin?: Pin | null;
  onPin?: (pin: Pin) => void;
  children?: ReactNode;
}) {
  const counts = useNavCounts();

  const START: Item[] = [
    { page: 'home', label: 'Home', Icon: House },
    { label: 'Services', Icon: LayoutGrid },
  ];
  const LIVE: Item[] = [
    { page: 'incidents', label: 'Incidents', Icon: Siren, count: counts.open ? { n: counts.open, word: 'open', tone: 'red', title: `${counts.open} real incidents with the team now` } : undefined },
    { page: 'alerts', label: 'Alerts', Icon: Bell },
    { page: 'changes', label: 'Change windows', Icon: CalendarClock, count: counts.late ? { n: counts.late, word: 'late', tone: 'orange', title: `${counts.late} past their planned end` } : undefined },
  ];
  const TUNING: Item[] = [
    { page: 'rules', label: 'Rules', Icon: Filter, count: counts.waiting ? { n: counts.waiting, word: 'waiting', tone: 'amber', title: `${counts.waiting} proposed rules waiting for a decision` } : undefined },
    { page: 'hindcast', label: 'Hindcast', Icon: History },
    { page: 'forecast', label: 'Forecast', Icon: Telescope },
  ];
  const ADMIN: Item[] = [
    { page: 'access', label: 'Access', Icon: Users, count: counts.invited ? { n: counts.invited, word: 'invited', title: `${counts.invited} invitations not accepted yet` } : undefined },
    { label: 'Audit log', Icon: BookText },
  ];

  const row = ({ page: to, label, Icon, count }: Item) => {
    const key = to && goKey(to);
    return (
      <a
        key={label}
        className="mn-nav-item"
        href={to ? (to === 'home' ? '#/' : `#/${to}`) : undefined}
        data-active={(to && to === page) || undefined}
        aria-current={to === page ? 'page' : undefined}
        title={key ? `${label}  G ${key}` : undefined}
      >
        <Icon size={16} />
        <span className="mn-nav-text">{label}</span>
        {count && (
          <span className="mn-nav-count" data-tone={count.tone} title={count.title}>
            <b>{count.n}</b>
            {count.word && ` ${count.word}`}
          </span>
        )}
      </a>
    );
  };

  const section = (id: string, label: string, items: Item[]) => (
    <section className="mn-nav-section" aria-labelledby={`mn-nav-${id}`}>
      <div className="mn-nav-label" id={`mn-nav-${id}`}>
        {label}
      </div>
      {items.map(row)}
    </section>
  );

  return (
    <aside className="mn-side" inert={hidden}>
      <a className="mn-brand" href="#/" aria-label="Imperial Ops, home">
        <div className="mn-brand-mark" aria-hidden>
          <svg viewBox="0 0 24 24" width="14" height="14">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
        </div>
        Imperial Ops
      </a>

      <button className="mn-jump" onClick={onOpenPalette} data-tour="jump">
        <Search size={14} />
        <span>Search or jump to…</span>
        <kbd>⌘K</kbd>
      </button>

      {/* Scrolls on a short window; the admin pages and you stay put. */}
      <div className="mn-side-body">
        <nav className="mn-nav" aria-label="Pages">
          {START.map(row)}
          {section('live', 'Live', LIVE)}
          {section('tuning', 'Tuning', TUNING)}
        </nav>
        <PinnedGroups activePin={activePin} onPin={onPin} hint={page === 'rules'} />
        {children}
      </div>

      <nav className="mn-nav mn-nav-admin" aria-label="Admin">
        {section('admin', 'Admin', ADMIN)}
      </nav>

      <div className="mn-user">
        <div className="mn-avatar">AP</div>
        <div className="mn-user-text">
          <div>Admiral Piett</div>
          <div className="mn-subtle">Rule governor</div>
        </div>
        {onStartTour && (
          <button className="mn-icon-btn" onClick={onStartTour} aria-label="Take the tour" title="Take the tour  ?">
            <CircleHelp size={15} />
          </button>
        )}
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

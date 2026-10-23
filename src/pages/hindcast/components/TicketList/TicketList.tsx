/* The tickets behind the figures, newest first, each with what caused it and what fixed it.
 * The search narrows by any word: an id, a CI, a cause, a fix. Rows are added as the list
 * scrolls, so a year of tickets doesn't all render at once. */

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Search } from 'lucide-react';
import { num } from '../../../../lib/format';
import { serviceName } from '../../data/mockData';
import { CAUSE_LABEL, dayMonth, span } from '../../model/labels';
import type { Ticket } from '../../model/types';
import './TicketList.css';

const PAGE = 60;
const OUTCOME_WORD = { incident: 'Incident', worked: 'Worked', cancelled: 'Cancelled' } as const;

export function TicketList({
  tickets,
  query,
  onQuery,
  searchRef,
}: {
  tickets: Ticket[];
  query: string;
  onQuery: (q: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
}) {
  const [shown, setShown] = useState(PAGE);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const found = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return tickets;
    return tickets.filter((t) => {
      const hay = `${t.id} ${t.title} ${t.ci} ${serviceName(t.serviceId)} ${CAUSE_LABEL[t.cause]} ${t.fix} ${OUTCOME_WORD[t.outcome]}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [tickets, query]);

  // A new search or scope starts again from the top.
  useEffect(() => {
    setShown(PAGE);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [found]);

  useEffect(() => {
    const end = endRef.current;
    if (!end) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setShown((n) => n + PAGE), {
      root: scrollRef.current,
      rootMargin: '200px',
    });
    observer.observe(end);
    return () => observer.disconnect();
  }, [found]);

  return (
    <div className="ol-tkts">
      <label className="mn-search ol-tkts-search">
        <Search size={14} />
        <input ref={searchRef} value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search tickets, CIs, causes, fixes…" aria-label="Search tickets" />
        <kbd>/</kbd>
      </label>
      <div className="ol-tkts-scroll" ref={scrollRef}>
        {found.length === 0 ? (
          <p className="ol-empty">No tickets match “{query}”. Try a CI, a cause or a ticket id.</p>
        ) : (
          found.slice(0, shown).map((t) => (
            <div className="ol-tkt" key={t.id}>
              <i className="ol-tkt-dot" data-outcome={t.outcome} aria-hidden />
              <div className="ol-tkt-main">
                <div className="ol-tkt-title">
                  <span className="mn-truncate">{t.title}</span>
                  {t.repeat && <span className="ol-chip">Repeat</span>}
                </div>
                <div className="ol-tkt-meta mn-truncate">
                  <span className="mn-mono">{t.id}</span> · {serviceName(t.serviceId)} · {dayMonth(t.openedAt)} · <b>{CAUSE_LABEL[t.cause]}</b> → {t.fix}
                </div>
              </div>
              <div className="ol-tkt-side">
                <b>{span(t.resolveMins)}</b>
                <span data-outcome={t.outcome}>{OUTCOME_WORD[t.outcome]}</span>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} className="ol-tkts-end">
          {found.length > 0 && shown >= found.length && `All ${num(found.length)} shown`}
        </div>
      </div>
    </div>
  );
}

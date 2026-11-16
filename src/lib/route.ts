/* Which page is showing. The address after the # says so:
 *
 *   #/                       home (also what any address it doesn't know opens)
 *   #/login                  the sign-in page (a mock; nothing is gated behind it)
 *   #/rules                  the rule list
 *   #/rules/RUL-0428         …opened on one rule
 *   #/rules?group=assignment.reactor   …filtered to one group (a pinned group in the sidebar)
 *   #/hindcast               the look back: tickets, root causes, the patterns that repeat
 *   #/hindcast/holonet/26    …one service, 26 completed weeks
 *   #/hindcast/all/26/PAT-04 …ringing one pattern (a prediction on the forecast links here)
 *   #/forecast               the look ahead, built from the hindcast's patterns
 *   #/forecast/holonet/26/8  …one service, 26 weeks back, 8 ahead
 *   #/forecast/all/26/4/PAT-04  …ringing one pattern's prediction
 *   #/outlook/…              an older address, when the two were one page: opens the same view
 *   #/alerts                 the alert stream
 *   #/changes                the change windows
 *   #/changes/CHG-2398       …opened on one window
 *   #/incidents              every incident's journey
 *   #/incidents/INC-41201    …opened on one incident
 *   #/access                 who's been let in, and what each of them can see
 *   #/access/ozzel           …opened on one person
 *   #/access/invite          …on a new invitation
 *
 * These pages don't need a router library. In the real app, swap this for the router's
 * own hooks; the pages only ever see `parts`. */

import { useEffect, useState } from 'react';

export type PageId = 'home' | 'login' | 'rules' | 'hindcast' | 'forecast' | 'alerts' | 'changes' | 'incidents' | 'access';

const PAGES: PageId[] = ['login', 'rules', 'hindcast', 'forecast', 'alerts', 'changes', 'incidents', 'access'];

export interface Route {
  page: PageId;
  /** Whatever follows the page in the address, e.g. ['holonet', '12']. */
  parts: string[];
  /** Whatever follows a ?, e.g. group=assignment.reactor. */
  query: URLSearchParams;
}

function parse(hash: string): Route {
  const [path = '', search = ''] = hash.replace(/^#\/?/, '').split('?');
  const query = new URLSearchParams(search);
  const [page, ...parts] = path.split('/').filter(Boolean);
  // The hindcast and forecast were briefly one page at #/outlook/<view>/…; those links still land.
  if (page === 'outlook') return parts[0] === 'forecast' ? { page: 'forecast', parts: parts.slice(1), query } : { page: 'hindcast', parts: parts[0] === 'hindcast' ? parts.slice(1) : parts, query };
  return { page: PAGES.find((known) => known === page) ?? 'home', parts, query };
}

/** G, then a letter, goes to a page from anywhere (see useKeyboardShortcuts). The sidebar
 *  shows each pair in its item's tooltip. */
export const GO: Record<string, { page: PageId; to: string }> = {
  h: { page: 'home', to: '#/' },
  i: { page: 'incidents', to: '#/incidents' },
  a: { page: 'alerts', to: '#/alerts' },
  c: { page: 'changes', to: '#/changes' },
  r: { page: 'rules', to: '#/rules' },
  p: { page: 'hindcast', to: '#/hindcast' },
  f: { page: 'forecast', to: '#/forecast' },
  u: { page: 'access', to: '#/access' },
};

/** The key that goes to a page after G, e.g. "I" for Incidents. */
export const goKey = (page: PageId) => Object.keys(GO).find((k) => GO[k]!.page === page)?.toUpperCase();

/** Go to another page. `replace` rewrites the address without adding a step to Back
 *  (and without re-rendering), for a page keeping its own filters in the address. */
export function navigate(to: string, replace = false) {
  if (replace) history.replaceState(null, '', to);
  else window.location.hash = to;
}

export function useRoute() {
  const [route, setRoute] = useState(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

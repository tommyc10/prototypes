/* Which page is showing. The address after the # says so:
 *
 *   #/rules                  the rule list
 *   #/rules/RUL-0428         …opened on one rule
 *   #/hindcast               the hindcast, all services, default lookback
 *   #/hindcast/holonet/12    …one service, 12 completed weeks
 *   #/alerts                 the alert stream
 *   #/changes                the change windows
 *   #/changes/CHG-2398       …opened on one window
 *   #/incidents              every incident's journey
 *   #/incidents/INC-41201    …opened on one incident
 *
 * Five pages don't need a router library. In the real app, swap this for the router's
 * own hooks; the pages only ever see `parts`. */

import { useEffect, useState } from 'react';

export type PageId = 'rules' | 'hindcast' | 'alerts' | 'changes' | 'incidents';

export interface Route {
  page: PageId;
  /** Whatever follows the page in the address, e.g. ['holonet', '12']. */
  parts: string[];
}

function parse(hash: string): Route {
  const [page, ...parts] = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { page: page === 'hindcast' || page === 'alerts' || page === 'changes' || page === 'incidents' ? page : 'rules', parts };
}

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

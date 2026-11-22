/* The app: whichever page the address asks for (see lib/route.ts), plus the toast
 * container (sonner) that decision toasts appear in.
 *
 * Pages sit in one grid cell (mn-stage), with the sign-in page in a layer of its own above
 * them, so a sign-in can hand off to the app with a wave (components/Wave). Opened with no
 * session, the app shows the loading screen (SsoLoading) in that layer instead, and the
 * page asked for (Home by default) mounts under it once the company's sign-in has answered. */

import { useEffect, useRef } from 'react';
import { Toaster } from 'sonner';
import { navigate, parse, useRoute, type PageId } from './lib/route';
import { AccessPage } from './pages/access/AccessPage';
import { AlertsPage } from './pages/alerts/AlertsPage';
import { ChangeWindowsPage } from './pages/change-windows/ChangeWindowsPage';
import { ForecastPage } from './pages/forecast/ForecastPage';
import { HindcastPage } from './pages/hindcast/HindcastPage';
import { HomePage } from './pages/home/HomePage';
import { SignInPage } from './pages/login/SignInPage';
import { SsoLoading } from './pages/login/SsoLoading';
import { USER } from './pages/login/data/mockSso';
import { startSession, useSession } from './lib/session';
import { IncidentsPage } from './pages/incidents/IncidentsPage';
import { RuleManagementPage } from './pages/rule-management/RuleManagementPage';
import { Aide } from './components/Aide/Aide';
import { useHandoff } from './components/Wave/useHandoff';
import { HalloweenCard, useHalloweenCard } from './components/Halloween/HalloweenCard';
import { Haunting } from './components/Halloween/Haunting';
import { useHalloween } from './hooks/useHalloween';
import { pinFromParam } from './pages/rule-management/hooks/usePinnedGroups';

const TITLE: Record<PageId, string> = { home: 'Home', login: 'Sign in', rules: 'Rules', hindcast: 'Hindcast', forecast: 'Forecast', alerts: 'Alerts', changes: 'Change windows', incidents: 'Incidents', access: 'Access' };

export function App() {
  const route = useRoute();
  const halloweenCard = useHalloweenCard();
  const halloween = useHalloween();
  useEffect(() => {
    document.title = `${TITLE[route.page]} · Imperial Ops`;
  }, [route.page]);
  const session = useSession();
  const signIn = route.page === 'login';
  // Opened with no session: the loading screen, over a page that isn't mounted yet.
  const booting = !signIn && !session;
  // What the sign-in layer shows: a sign-in page's own address (which variant, and where it
  // goes after: ?to=#/rules, or Home), or null for the loading screen. Kept while the wave
  // runs, because the wave pictures the layer after the address and session have moved on,
  // and it must picture what was showing.
  const signInRoute = useRef<typeof route | null>(route);
  if (signIn) signInRoute.current = route;
  else if (booting) signInRoute.current = null;
  const signInTo = signInRoute.current?.query.get('to') || '#/';
  const inApp = !signIn && session;
  const handoff = useHandoff(inApp);
  /** Signed in. `from` is where the wave leaves from; none when a cached token answered at once. */
  const signedIn = (from: HTMLElement | null, to?: string) => {
    startSession(USER.email);
    if (from) handoff.start(from);
    if (to) navigate(to);
  };
  // Over the app, not the sign-in page, and not while the wave is still carrying one into the other.
  const overApp = inApp && !handoff.active;
  return (
    <div className="mn mn-app">
      {overApp && halloweenCard.shown && <HalloweenCard onDismiss={halloweenCard.dismiss} />}
      <div className="mn-stage" ref={handoff.stage} data-handoff={handoff.active || undefined}>
        {inApp && (
          <div className="mn-stage-layer" ref={handoff.to}>
            {route.page === 'home' ? (
              <HomePage />
            ) : route.page === 'incidents' ? (
              // The key gives a link to another incident a fresh page, opened on that incident.
              <IncidentsPage key={route.parts[0] ?? ''} initialId={route.parts[0]} />
            ) : route.page === 'alerts' ? (
              <AlertsPage />
            ) : route.page === 'access' ? (
              <AccessPage initialId={route.parts[0]} />
            ) : route.page === 'changes' ? (
              <ChangeWindowsPage initialId={route.parts[0]} />
            ) : route.page === 'hindcast' ? (
              // The key gives a link from the forecast a fresh page, ringing the pattern it names.
              <HindcastPage key={route.parts.join('/')} serviceId={route.parts[0]} weeks={route.parts[1]} focus={route.parts[2]} />
            ) : route.page === 'forecast' ? (
              <ForecastPage key={route.parts.join('/')} serviceId={route.parts[0]} weeks={route.parts[1]} horizon={route.parts[2]} focus={route.parts[3]} />
            ) : (
              // The key gives a link to another rule a fresh page, opened on that rule.
              <RuleManagementPage key={`${route.parts[0] ?? ''}?${route.query}`} initialRuleId={route.parts[0]} initialGroup={pinFromParam(route.query.get('group'))} />
            )}
          </div>
        )}
        {(signIn || booting || handoff.active) && (
          <div className="mn-stage-layer" ref={handoff.from}>
            {signInRoute.current ? (
              <SignInPage
                variant={signInRoute.current.parts[0]}
                query={signInRoute.current.query}
                toTitle={TITLE[parse(signInTo).page]}
                onSignedIn={(from) => signedIn(from, signInTo)}
              />
            ) : (
              // Already at the page asked for: it mounts under the screen once signed in.
              <SsoLoading ssoCase="first" toTitle={TITLE[route.page]} onSignedIn={(from) => signedIn(from)} />
            )}
          </div>
        )}
      </div>
      {halloween && <Haunting />}
      {overApp && <Aide />}
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

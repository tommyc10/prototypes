/* The app: whichever page the address asks for (see lib/route.ts), plus the toast
 * container (sonner) that decision toasts appear in.
 *
 * Pages sit in one grid cell (mn-stage), with the sign-in page in a layer of its own above
 * them, so a sign-in can hand off to the app with a wave (components/Wave). */

import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { navigate, useRoute, type PageId } from './lib/route';
import { AccessPage } from './pages/access/AccessPage';
import { AlertsPage } from './pages/alerts/AlertsPage';
import { ChangeWindowsPage } from './pages/change-windows/ChangeWindowsPage';
import { ForecastPage } from './pages/forecast/ForecastPage';
import { HindcastPage } from './pages/hindcast/HindcastPage';
import { HomePage } from './pages/home/HomePage';
import { LoginPage } from './pages/login/LoginPage';
import { IncidentsPage } from './pages/incidents/IncidentsPage';
import { RuleManagementPage } from './pages/rule-management/RuleManagementPage';
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
  const signIn = route.page === 'login';
  const handoff = useHandoff(!signIn);
  // Over the app, not the sign-in page, and not while the wave is still carrying one into the other.
  const overApp = !signIn && !handoff.active;
  return (
    <div className="mn mn-app">
      {overApp && halloweenCard.shown && <HalloweenCard onDismiss={halloweenCard.dismiss} />}
      <div className="mn-stage" ref={handoff.stage} data-handoff={handoff.active || undefined}>
        {!signIn && (
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
        {(signIn || handoff.active) && (
          <div className="mn-stage-layer" ref={handoff.from}>
            <LoginPage
              onSignedIn={(button) => {
                handoff.start(button);
                navigate('#/');
              }}
            />
          </div>
        )}
      </div>
      {halloween && <Haunting />}
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

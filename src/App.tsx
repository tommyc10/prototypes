/* The app: whichever page the address asks for (see lib/route.ts), plus the toast
 * container (sonner) that decision toasts appear in. */

import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useRoute, type PageId } from './lib/route';
import { AccessPage } from './pages/access/AccessPage';
import { AlertsPage } from './pages/alerts/AlertsPage';
import { ChangeWindowsPage } from './pages/change-windows/ChangeWindowsPage';
import { ForecastPage } from './pages/forecast/ForecastPage';
import { HindcastPage } from './pages/hindcast/HindcastPage';
import { HomePage } from './pages/home/HomePage';
import { LoginPage } from './pages/login/LoginPage';
import { IncidentsPage } from './pages/incidents/IncidentsPage';
import { RuleManagementPage } from './pages/rule-management/RuleManagementPage';
import { FeatureBanner } from './components/FeatureBanner/FeatureBanner';
import { pinFromParam } from './pages/rule-management/hooks/usePinnedGroups';

const TITLE: Record<PageId, string> = { home: 'Home', login: 'Sign in', rules: 'Rules', hindcast: 'Hindcast', forecast: 'Forecast', alerts: 'Alerts', changes: 'Change windows', incidents: 'Incidents', access: 'Access' };

export function App() {
  const route = useRoute();
  useEffect(() => {
    document.title = `${TITLE[route.page]} · Imperial Ops`;
  }, [route.page]);
  return (
    <div className="mn mn-app">
      {route.page !== 'login' && <FeatureBanner />}
      {route.page === 'login' ? (
        <LoginPage />
      ) : route.page === 'home' ? (
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
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

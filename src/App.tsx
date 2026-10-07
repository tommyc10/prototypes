/* The app: whichever page the address asks for (see lib/route.ts), plus the toast
 * container (sonner) that decision toasts appear in. */

import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useRoute, type PageId } from './lib/route';
import { AlertsPage } from './pages/alerts/AlertsPage';
import { ChangeWindowsPage } from './pages/change-windows/ChangeWindowsPage';
import { HindcastPage } from './pages/hindcast/HindcastPage';
import { RuleManagementPage } from './pages/rule-management/RuleManagementPage';

const TITLE: Record<PageId, string> = { rules: 'Rules', hindcast: 'Hindcast', alerts: 'Alerts', changes: 'Change windows' };

export function App() {
  const route = useRoute();
  useEffect(() => {
    document.title = `${TITLE[route.page]} · Imperial Ops`;
  }, [route.page]);
  return (
    <>
      {route.page === 'alerts' ? (
        <AlertsPage />
      ) : route.page === 'changes' ? (
        <ChangeWindowsPage initialId={route.parts[0]} />
      ) : route.page === 'hindcast' ? (
        <HindcastPage serviceId={route.parts[0]} weeks={route.parts[1]} />
      ) : (
        // The key gives a link to another rule a fresh page, opened on that rule.
        <RuleManagementPage key={route.parts[0] ?? ''} initialRuleId={route.parts[0]} />
      )}
      <Toaster position="bottom-right" theme="dark" />
    </>
  );
}

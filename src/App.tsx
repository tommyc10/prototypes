/* The app: whichever page the address asks for (see lib/route.ts), plus the toast
 * container (sonner) that decision toasts appear in. */

import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useRoute } from './lib/route';
import { HindcastPage } from './pages/hindcast/HindcastPage';
import { RuleManagementPage } from './pages/rule-management/RuleManagementPage';

export function App() {
  const route = useRoute();
  useEffect(() => {
    document.title = `${route.page === 'hindcast' ? 'Hindcast' : 'Rules'} · Imperial Ops`;
  }, [route.page]);
  return (
    <>
      {route.page === 'hindcast' ? (
        <HindcastPage serviceId={route.parts[0]} weeks={route.parts[1]} />
      ) : (
        // The key gives a link to another rule a fresh page, opened on that rule.
        <RuleManagementPage key={route.parts[0] ?? ''} initialRuleId={route.parts[0]} />
      )}
      <Toaster position="bottom-right" theme="dark" />
    </>
  );
}

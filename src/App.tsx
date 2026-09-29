/* The app: one page, plus the toast container (sonner) that decision toasts appear in. */

import { Toaster } from 'sonner';
import { RuleManagementPage } from './pages/rule-management/RuleManagementPage';

export function App() {
  return (
    <>
      <RuleManagementPage />
      <Toaster position="bottom-right" theme="dark" />
    </>
  );
}

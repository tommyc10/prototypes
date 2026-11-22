/* Throwaway entry for the home page prototypes: prototypes/home.html. Nothing in the app
 * imports from here. Delete this folder and prototypes/home.html once a direction is picked. */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '../../styles/base.css';
import '../../styles/theme.css';
import '../../styles/ui.css';
import '../../styles/shell.css';
import '../../styles/palette.css';
import '../../styles/accessibility.css';
import { Harness } from './Harness';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);

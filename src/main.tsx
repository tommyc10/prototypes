/* The entry point: load the fonts and global styles, then render the app into #root. */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './styles/base.css';
import './styles/theme.css';
import './styles/ui.css';
import './styles/shell.css';
import './styles/palette.css';
import { App } from './App';
// Loaded after the app's own styles, so these accessibility overrides win.
import './styles/accessibility.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { applyTheme, loadStoredTheme } from './ui/tokens/theme';
import './ui/global.css';

// Apply the stored/default theme before first paint to avoid a flash.
applyTheme(loadStoredTheme());

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

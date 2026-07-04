import { useTheme } from './useTheme';
import './App.css';

/**
 * Application shell.
 *
 * Milestone 1 (scaffold): proves the design-token system and light/dark theming
 * render correctly. The media panel, rating slider, sampling engine, autosave,
 * and CSV export arrive in later milestones and mount inside `.app-body`.
 */
export function App(): JSX.Element {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <div className="app-logo" aria-hidden="true" />
          <span className="app-brand-name">Continuum</span>
          <span className="app-sep">/</span>
          <span className="app-subtitle">Continuous rating instrument</span>
        </div>
        <div className="app-spacer" />
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          <span className="theme-toggle-dot" aria-hidden="true" />
          {theme === 'dark' ? 'Dark' : 'Light'}
        </button>
        <span className="app-badge">1D</span>
      </header>

      <main className="app-body">
        <div className="app-placeholder">
          <span className="app-milestone">Phase 1 · Milestone 1 — scaffold</span>
          <h1>Continuum</h1>
          <p>
            Design tokens, theming, and tooling are in place. Browse-to-file media, the vertical
            rating slider, per-frame sampling, autosave/resume, and self-describing CSV export land
            in the milestones that follow. Toggle the theme to confirm light and dark both read from{' '}
            <code>tokens.css</code>.
          </p>
        </div>
      </main>
    </div>
  );
}

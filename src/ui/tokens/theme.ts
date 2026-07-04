/**
 * Theme model. Dark is the default (the design specifies dark as primary —
 * better for watching video); light is required and derived.
 *
 * The active theme is applied by setting `data-theme` on <html>, which flips the
 * CSS custom properties defined in tokens.css. Keeping this in one place means the
 * whole app reskins from tokens without touching component code.
 */

export type Theme = 'dark' | 'light';

export const DEFAULT_THEME: Theme = 'dark';

const STORAGE_KEY = 'continuum.theme';

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export function loadStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // localStorage may be unavailable (private mode / SSR); fall back to default.
  }
  return DEFAULT_THEME;
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Non-fatal: theme simply won't persist.
  }
}

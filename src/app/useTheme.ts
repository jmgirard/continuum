import { useCallback, useEffect, useState } from 'react';
import { applyTheme, loadStoredTheme, storeTheme, type Theme } from '../ui/tokens/theme';

/** Hook that owns the active theme and keeps <html data-theme> + storage in sync. */
export function useTheme(): {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
} {
  const [theme, setThemeState] = useState<Theme>(loadStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    storeTheme(theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    [],
  );

  return { theme, toggleTheme, setTheme };
}

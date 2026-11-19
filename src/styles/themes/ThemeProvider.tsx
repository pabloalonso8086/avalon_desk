import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getSettings, setTheme as saveTheme } from "~/lib/api/settings";
import { DEFAULT_THEME, isTheme } from "./index";
import type { Theme } from "./index";

type ThemeContextValue = {
  theme: Theme;
  /** Applies the theme at once and saves it in `settings.json`. */
  setTheme: (theme: Theme) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Active theme, applied as `data-theme` on `<html>`. Loaded from `settings.json`;
 * an unknown theme falls back to the default one.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((settings) => {
        if (!cancelled) setThemeState(isTheme(settings.theme) ? settings.theme : DEFAULT_THEME);
      })
      .catch((error: unknown) => console.error("Could not load the theme", error));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = useCallback(async (next: Theme) => {
    setThemeState(next);
    await saveTheme(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
  return context;
}

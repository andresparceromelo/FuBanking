'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggle: () => {},
});

const STORAGE_KEY = 'fubank-theme';

function resolveInitialTheme(): Theme {
  if (globalThis.window === undefined) return 'dark';
  const stored = globalThis.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  if (globalThis.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
  // Arranca igual que el SSR ('dark'): leer localStorage/matchMedia aquí hacía
  // que el primer render del cliente no coincidiera con el HTML del servidor
  // (hydration mismatch en ThemeToggle). El efecto de abajo aplica el tema real.
  const [theme, setTheme] = useState<Theme>('dark');
  // Hasta resolver el tema real no se toca el DOM ni localStorage: el script
  // fubank-theme-init del layout ya aplicó el tema correcto antes de hidratar.
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-sync after mount: localStorage/matchMedia only exist client-side, SSR always renders 'dark'
    setTheme(resolveInitialTheme());
    setResolved(true);
  }, []);

  useEffect(() => {
    if (!resolved) return;
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    globalThis.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, resolved]);

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={useMemo(() => ({ theme, toggle }), [theme, toggle])}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

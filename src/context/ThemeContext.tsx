import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('zadel_theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch {
      // LocalStorage access fail safe
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-transitioning');
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    try {
      localStorage.setItem('zadel_theme', theme);
    } catch {
      // Ignore
    }
    const t = window.setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 320);
    return () => window.clearTimeout(t);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

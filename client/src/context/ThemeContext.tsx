import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'dark' | 'light';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('learnspace_theme') as Theme) || 'light';
  });

  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>('light');

  const applyTheme = useCallback((currentTheme: Theme) => {
    const root = document.documentElement;
    let resolved: 'dark' | 'light' = 'light';

    if (currentTheme === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolved = prefersDark ? 'dark' : 'light';
    } else {
      resolved = currentTheme;
    }

    setActualTheme(resolved);

    if (resolved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('learnspace_theme', newTheme);
    applyTheme(newTheme);
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  }, [theme, setTheme]);

  useEffect(() => {
    applyTheme(theme);

    // Add listener for real-time OS theme changes when in 'system' mode
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleMediaChange = () => {
        const savedTheme = (localStorage.getItem('learnspace_theme') as Theme) || 'light';
        if (savedTheme === 'system') {
          applyTheme('system');
        }
      };

      try {
        mediaQuery.addEventListener('change', handleMediaChange);
        return () => mediaQuery.removeEventListener('change', handleMediaChange);
      } catch (e) {
        // Fallback for older browsers
        mediaQuery.addListener(handleMediaChange);
        return () => mediaQuery.removeListener(handleMediaChange);
      }
    }
  }, [theme, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};


import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { ColorScheme, Theme, createTheme } from '../constants/theme';

const SCHEME_KEY = 'mh_color_scheme';

type ThemeContextValue = Theme & {
  /** false enquanto a preferência salva ainda está sendo lida. */
  isReady: boolean;
  setScheme: (scheme: ColorScheme) => void;
  toggleScheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [stored, setStored] = useState<ColorScheme | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Lê a preferência salva (se não houver, segue o tema do sistema)
  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(SCHEME_KEY)
      .then((value) => {
        if (active && (value === 'light' || value === 'dark')) setStored(value);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const scheme: ColorScheme = stored ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const setScheme = useCallback((next: ColorScheme) => {
    setStored(next);
    SecureStore.setItemAsync(SCHEME_KEY, next).catch(() => {});
  }, []);

  const toggleScheme = useCallback(() => {
    setScheme(scheme === 'dark' ? 'light' : 'dark');
  }, [scheme, setScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ ...createTheme(scheme), isReady, setScheme, toggleScheme }),
    [scheme, isReady, setScheme, toggleScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de <AppThemeProvider>');
  return ctx;
}

/**
 * Cria estilos que acompanham o tema.
 * `factory` deve ser definida fora do componente (função estável):
 *   const createStyles = (t: Theme) => StyleSheet.create({ ... });
 *   const styles = useThemedStyles(createStyles);
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
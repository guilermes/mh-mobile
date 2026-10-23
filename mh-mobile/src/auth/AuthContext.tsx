import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const TOKEN_KEY = 'mh_auth_token';

type AuthContextValue = {
  isLoggedIn: boolean;
  /** true enquanto a sessão salva está sendo restaurada na abertura do app. */
  isLoading: boolean;
  /** Lança um Error com mensagem amigável se o login falhar. */
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * TODO: troque pela chamada real à sua API de login.
 * Deve retornar o token da sessão ou lançar um Error com a mensagem a exibir.
 */
async function loginRequest(email: string, password: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 600)); // simula a rede
  if (!email || !password) throw new Error('E-mail ou senha incorretos.');
  return 'demo-token';
}

/** O SecureStore não existe na web: nesse caso a sessão só vive em memória. */
const storage = {
  get: async () => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: async (token: string) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch {}
  },
  clear: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {}
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaura a sessão salva ao abrir o app
  useEffect(() => {
    let active = true;
    storage.get().then((saved) => {
      if (!active) return;
      setToken(saved);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const newToken = await loginRequest(email, password);
    await storage.set(newToken);
    setToken(newToken);
  }, []);

  const signOut = useCallback(async () => {
    await storage.clear();
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({ isLoggedIn: token !== null, isLoading, signIn, signOut }),
    [token, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
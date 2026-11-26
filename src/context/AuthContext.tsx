import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError, setUnauthorizedHandler, tokenStore, type User } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

type AuthContextValue = {
  /** true quando há sessão válida. Usado pelo Stack.Protected do _layout. */
  isLoggedIn: boolean;
  /** true enquanto o token salvo está sendo validado na abertura do app. */
  isLoading: boolean;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { name?: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const clearSession = useCallback(() => {
    queryClient.clear(); // evita mostrar dados da conta anterior no próximo login
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  const signOut = useCallback(async () => {
    await tokenStore.clear();
    clearSession();
  }, [clearSession]);

  // 401 vindo de qualquer chamada da API derruba a sessão.
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Ao abrir o app: se há token salvo, valida com GET /api/me.
  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStore.get();
        if (!token) return;
        const me = await api.me();
        setUser((me.user as User) ?? null);
        setIsLoggedIn(true);
      } catch (e) {
        // Sem rede não significa token inválido: só desloga se a API recusou o token.
        if (e instanceof ApiError && e.status === 401) await tokenStore.clear();
        else if (await tokenStore.get()) setIsLoggedIn(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const finishAuth = async ({ token, user }: { token: string; user: User }) => {
    await tokenStore.set(token);
    setUser(user);
    setIsLoggedIn(true);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoggedIn,
      isLoading,
      user,
      signIn: async (email, password) => finishAuth(await api.login(email, password)),
      signUp: async (data) => finishAuth(await api.register(data)),
      signOut,
    }),
    [isLoggedIn, isLoading, user, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import { ApiError } from '@/lib/api';

// No React Native não existe "foco da janela": usamos o estado do app. Assim, ao voltar do
// navegador (ex.: depois de autorizar o Mercado Livre), os dados desatualizados são recarregados.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (status) => {
    focusManager.setFocused(status === 'active');
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // 401 = sessão inválida (o AuthContext já cuida disso); não adianta tentar de novo.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status === 401) && failureCount < 2,
    },
  },
});
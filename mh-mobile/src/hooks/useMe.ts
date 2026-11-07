import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const ME_QUERY_KEY = ['me'] as const;

/** Usuário autenticado e status da conexão com o Mercado Livre (GET /api/me). */
export function useMe() {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => api.me(),
    staleTime: 10_000,
  });
}
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { api, type AnunciosParams } from '@/lib/api';

/** Lista paginada de anúncios (GET /api/anuncios) com busca, ordenação e filtro. */
export function useAnuncios(params: Omit<AnunciosParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['anuncios', params],
    queryFn: ({ pageParam }) => api.anuncios({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    placeholderData: keepPreviousData, // evita a lista "piscar" a cada letra digitada
  });
}
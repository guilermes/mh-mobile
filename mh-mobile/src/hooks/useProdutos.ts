import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Produtos por SKU, paginados (GET /api/produtos). */
export function useProdutos() {
  return useInfiniteQuery({
    queryKey: ['produtos'],
    queryFn: ({ pageParam }) => api.produtos(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
}

/** Define o custo de um SKU (vale para todos os anúncios dele). */
export function useSetCusto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sku, custo }: { sku: string; custo: number }) => api.setCusto(sku, custo),
    onSuccess: () => {
      // O custo muda lucro e margem dos anúncios e os números do painel.
      qc.invalidateQueries({ queryKey: ['produtos'] });
      qc.invalidateQueries({ queryKey: ['anuncios'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
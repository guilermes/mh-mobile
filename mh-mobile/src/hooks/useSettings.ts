import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Regras } from '@/lib/api';

/** Tudo que depende de CEP, alíquotas ou dados sincronizados precisa ser recarregado. */
const DEPENDENTES = [['dashboard'], ['anuncios'], ['produtos']] as const;

export const useConfig = () => useQuery({ queryKey: ['config'], queryFn: () => api.config() });

export function useSaveCep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (zipCode: string) => api.saveCep(zipCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['config'] });
      DEPENDENTES.forEach((key) => qc.invalidateQueries({ queryKey: key }));
    },
  });
}

export const useRegras = () => useQuery({ queryKey: ['regras'], queryFn: () => api.regras() });

export function useSaveRegras() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (r: Regras) => api.saveRegras(r),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regras'] });
      DEPENDENTES.forEach((key) => qc.invalidateQueries({ queryKey: key }));
    },
  });
}

/** Progresso da sincronização. Consulta a cada 1,5 s enquanto roda (ou logo após iniciar). */
export function useSyncStatus(forcePoll: boolean) {
  return useQuery({
    queryKey: ['sync-status'],
    queryFn: () => api.syncStatus(),
    refetchInterval: (query) => (query.state.data?.running || forcePoll ? 1500 : false),
  });
}

export function useStartSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.sync(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sync-status'] }),
  });
}
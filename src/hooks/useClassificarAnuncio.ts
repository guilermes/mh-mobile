import { useCallback, useState } from 'react';
import {
  api,
  ApiError,
  ClassificacaoFeatures,
  ClassificacaoResponse,
} from '../lib/api';

export function useClassificarAnuncio() {
  const [data, setData] = useState<ClassificacaoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classificar = useCallback(async (features: ClassificacaoFeatures) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.classificarAnuncio(features);
      setData(res);
      return res;
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setError('Modelo de IA ainda não disponível no servidor.');
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao classificar anúncio.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, classificar, reset };
}
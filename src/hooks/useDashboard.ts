import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

/** KPIs, insights e frete divergente (GET /api/dashboard). */
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard(),
  });
}
import * as SecureStore from 'expo-secure-store';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const TOKEN_KEY = 'mh_token';

export const tokenStore = {
  get: () => SecureStore.getItemAsync(TOKEN_KEY),
  set: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  clear: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// O AuthContext registra aqui o que fazer quando a API responder 401 (token expirado/inválido).
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await tokenStore.get();

  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const body = await res.json();
      message = body.error ?? body.message ?? message;
    } catch {
      /* resposta sem JSON */
    }
    // 401 em rota protegida = sessão inválida. No /login, 401 é só senha errada.
    if (res.status === 401 && token) {
      await tokenStore.clear();
      onUnauthorized?.();
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

// ⚠️ Ajuste os tipos/nomes de campos conforme /api/docs (Swagger) ou /api/openapi.json.
export type User = { id?: number | string; name?: string; email: string; [k: string]: unknown };
export type AuthResponse = { token: string; user: User };

export type Medidas = {
  largura: number;
  altura: number;
  comprimento: number; // no app aparece como "profundidade"
  peso: number;
};

export type FreteEstimado = { frete?: number; valor?: number; [k: string]: unknown };

const qs = (params: Record<string, string | number>) =>
  new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (body: { name?: string; email: string; password: string }) =>
    request<AuthResponse>('/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request<{ user?: User; [k: string]: unknown }>('/me'),

  dashboard: () => request<any>('/dashboard'),
  anuncios: (p: Record<string, string | number>) => request<any>(`/anuncios?${qs(p)}`),
  produtos: () => request<any>('/produtos'),
  setCusto: (sku: string, custo: number) =>
    request(`/produtos/${encodeURIComponent(sku)}/custo`, { method: 'POST', body: JSON.stringify({ custo }) }),
  setMedidas: (sku: string, m: Medidas) =>
    request(`/produtos/${encodeURIComponent(sku)}/medidas`, { method: 'POST', body: JSON.stringify(m) }),

  estimarFrete: (m: Medidas) => request<FreteEstimado>(`/frete/estimar?${qs(m)}`),

  regras: () => request<any>('/regras'),
  saveRegras: (r: unknown) => request('/regras', { method: 'PUT', body: JSON.stringify(r) }),
  config: () => request<any>('/config'),
  saveCep: (cep: string) => request('/config/cep', { method: 'PUT', body: JSON.stringify({ cep }) }),
  sync: () => request('/sync', { method: 'POST' }),
  syncStatus: () => request<any>('/sync/status'),
};
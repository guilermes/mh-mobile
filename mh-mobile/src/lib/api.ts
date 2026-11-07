import * as SecureStore from 'expo-secure-store';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
/** Mesma origem da API; usada para abrir páginas web (ex.: autorização do Mercado Livre). */
export const WEB_BASE_URL = 'https://192.168.1.53:3333';
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
export type User = {
  id: number;
  email: string;
  storeName?: string | null;
  whatsapp?: string | null;
};
export type AuthResponse = { token: string; user: User };

export type MeResponse = {
  user: User;
  mercadoLivre: { authenticated: boolean };
};

export type Medidas = {
  largura: number;
  altura: number;
  comprimento: number; // no app aparece como "profundidade"
  peso: number;
};

export type FreteEstimado = { frete?: number; valor?: number; [k: string]: unknown };

export type DivergenteTop = {
  mlb: string;
  titulo: string;
  freteCobrado: number;
  freteReal: number;
  /** freteReal − freteCobrado */
  delta: number;
};

export type DashboardResponse = {
  prejuizo: number;
  altoDesempenho: number;
  freteDivergente: number;
  ticketMedio: number;
  divergentesTop: DivergenteTop[];
};

export type AnuncioItem = {
  mlb: string;
  titulo: string;
  precoDe: number;
  precoPor: number;
  /** R$ */
  frete: number;
  /** R$ (custoML = frete + comissao) */
  comissao: number;
  _calc: { base: number; lucro: number; margem: number; custoML: number };
};

export type AnunciosResponse = {
  total: number;
  page: number;
  totalPages: number;
  filterLabel: string;
  items: AnuncioItem[];
};

export type AnunciosParams = {
  search?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  filter?: string;
  page?: number;
};

export type Produto = {
  sku: string;
  nome: string;
  qtd: number;
  custo: number;
  largura: number | null;
  altura: number | null;
  comprimento: number | null;
  pesoReal: number | null;
  freteCobrado: number;
  freteReal: number;
  /** freteReal − freteCobrado */
  delta: number;
  divergente: boolean;
};

export type ProdutosResponse = {
  total: number;
  page: number;
  totalPages: number;
  products: Produto[];
};

export type ConfigResponse = { zipCode: string; lastSyncAt: string | null };

export type SyncStatus = {
  running: boolean;
  phase: string;
  processed: number;
  totalIds: number;
  novos: number;
  atualizados: number;
};

export type Regras = { icms: number; ipi: number; difal: number; custoOperacional: number };

const qs = (params: Record<string, string | number>) =>
  new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (body: { name?: string; email: string; password: string }) =>
    request<AuthResponse>('/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request<MeResponse>('/me'),

  dashboard: () => request<DashboardResponse>('/dashboard'),
  anuncios: (p: AnunciosParams) => {
    const clean = Object.fromEntries(
      Object.entries(p).filter(([, v]) => v !== undefined && v !== ''),
    ) as Record<string, string | number>;
    return request<AnunciosResponse>(`/anuncios?${qs(clean)}`);
  },
  produtos: (page = 1) => request<ProdutosResponse>(`/produtos?${qs({ page })}`),
  setCusto: (sku: string, custo: number) =>
    request(`/produtos/${encodeURIComponent(sku)}/custo`, { method: 'POST', body: JSON.stringify({ custo }) }),
  setMedidas: (sku: string, m: Medidas) =>
    request(`/produtos/${encodeURIComponent(sku)}/medidas`, { method: 'POST', body: JSON.stringify(m) }),

  estimarFrete: (m: Medidas) => request<FreteEstimado>(`/frete/estimar?${qs(m)}`),

  regras: () => request<Regras>('/regras'),
  saveRegras: (r: Regras) => request('/regras', { method: 'PUT', body: JSON.stringify(r) }),
  config: () => request<ConfigResponse>('/config'),
  // ⚠️ confirme no Swagger o nome do campo do corpo (aqui: zipCode, igual ao GET /config)
  saveCep: (zipCode: string) =>
    request('/config/cep', { method: 'PUT', body: JSON.stringify({ zipCode }) }),
  sync: () => request('/sync', { method: 'POST' }),
  syncStatus: () => request<SyncStatus>('/sync/status'),
};
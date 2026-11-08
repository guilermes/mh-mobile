import { api, type Produto } from '../lib/api';

/** Lançado quando o usuário cancela a espera pela balança. */
export class ScaleCancelledError extends Error {
  constructor() {
    super('Espera cancelada');
  }
}

type Options = {
  signal?: AbortSignal;
  /** Tempo máximo de espera pela pesagem. */
  timeoutMs?: number;
  /** Intervalo entre consultas à API. */
  intervalMs?: number;
};

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new ScaleCancelledError());
    const onAbort = () => {
      clearTimeout(timer);
      reject(new ScaleCancelledError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });

/**
 * Procura o SKU nas páginas de /api/produtos (a API não tem rota de produto único).
 * Com `search`, o backend já filtra a lista e a busca costuma caber em uma única chamada.
 */
async function findProduto(sku: string, search?: string): Promise<Produto | null> {
  const wanted = sku.trim().toLowerCase();
  let page = 1;
  for (;;) {
    const res = await api.produtos(page, search);
    const hit = res.products.find((p) => p.sku.toLowerCase() === wanted);
    if (hit) return hit;
    if (page >= res.totalPages) return null;
    page += 1;
  }
}

/**
 * Espera a balança enviar uma pesagem para o SKU e devolve o peso em kg.
 *
 * Como funciona: a balança (ESP32) grava o peso no SKU via POST /api/iot/medidas. Aqui lemos o
 * `pesoReal` do SKU ao iniciar e consultamos a API até esse valor mudar. Por isso o usuário deve
 * tocar em "Conectar à balança" ANTES de pesar.
 *
 * Limitação: uma pesagem com o mesmo valor da anterior não é percebida (a API não devolve a
 * data da leitura). O ideal é a API expor `capturadoEm` junto do produto.
 */
export async function readWeightFromScale(sku: string, options: Options = {}): Promise<number> {
  const { signal, timeoutMs = 60_000, intervalMs = 2_000 } = options;

  // Tenta primeiro com ?search=<sku>. Se a busca não encontrar (ela pode não olhar o campo SKU),
  // volta a varrer a lista inteira e continua assim nas consultas seguintes.
  let search: string | undefined = sku.trim();
  let baseline = await findProduto(sku, search);
  if (!baseline) {
    search = undefined;
    baseline = await findProduto(sku);
  }
  if (!baseline) {
    throw new Error(`SKU "${sku}" não encontrado. Confira o código na lista de produtos.`);
  }
  const before = baseline.pesoReal;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await sleep(intervalMs, signal);
    try {
      const current = await findProduto(sku, search);
      if (current && current.pesoReal !== null && current.pesoReal !== before) {
        return current.pesoReal;
      }
    } catch {
      // Falha momentânea de rede: tenta de novo na próxima rodada.
    }
  }

  throw new Error(
    'Nenhuma pesagem nova chegou. Confira se o SKU digitado na balança é o mesmo e se o peso é ' +
      'diferente do anterior.',
  );
}
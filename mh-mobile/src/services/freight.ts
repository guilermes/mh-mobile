import { api, type FreteEstimado, type Medidas } from '../lib/api';
import { BoxDimensions } from './measurements';

/**
 * O preço agora vem da API (GET /api/frete/estimar). Só o divisor da cubagem
 * continua aqui, para exibir volume e peso cúbico na tela.
 * `base` e `perKg` não são mais usados no cálculo; mantidos por compatibilidade
 * caso algum componente ainda leia este objeto.
 */
export const FREIGHT_TARIFF = {
  /** Divisor da cubagem (cm³ por kg). 6000 é o usual no Brasil; algumas transportadoras usam 5000. */
  cubicDivisor: 6000,
  base: 8,
  perKg: 4.5,
  /** false: o preço exibido vem da API (tabela real), não de uma tarifa de exemplo. */
  isSample: false,
};

export type FreightEstimate = {
  /** Volume da caixa em cm³. */
  volumeCm3: number;
  /** Peso cúbico em kg (volume ÷ divisor). */
  cubicWeightKg: number;
  /** Maior valor entre o peso real e o peso cúbico, em kg. */
  billableWeightKg: number;
  /** Frete estimado em R$. */
  price: number;
};

/** App (altura/largura/profundidade em cm, peso em kg) → API (profundidade vira "comprimento"). */
export const toMedidas = (d: BoxDimensions, weightKg: number): Medidas => ({
  altura: d.height,
  largura: d.width,
  comprimento: d.depth,
  peso: weightKg,
});

/** Primeiro campo numérico encontrado entre os nomes candidatos. */
function pickNumber(res: FreteEstimado, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = res[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

/**
 * Converte a resposta da API no formato que a tela e o FreightEstimateCard usam.
 * ⚠️ CONFIRA os nomes dos campos em /api/docs (Swagger) e ajuste as listas abaixo.
 */
function fromApi(res: FreteEstimado, dimensions: BoxDimensions, weightKg: number): FreightEstimate {
  const price = pickNumber(res, ['frete', 'valor', 'price', 'preco']);
  if (price === undefined) {
    throw new Error('A API não retornou o valor do frete. Verifique o formato da resposta.');
  }

  // Volume e peso cúbico são geometria pura: calculados aqui, a menos que a API os envie.
  const volumeCm3 =
    pickNumber(res, ['volumeCm3', 'volume']) ?? dimensions.height * dimensions.width * dimensions.depth;
  const cubicWeightKg =
    pickNumber(res, ['pesoCubico', 'peso_cubico', 'cubicWeightKg']) ??
    volumeCm3 / FREIGHT_TARIFF.cubicDivisor;
  const billableWeightKg =
    pickNumber(res, ['pesoTarifado', 'peso_tarifado', 'billableWeightKg']) ??
    Math.max(weightKg, cubicWeightKg);

  return { volumeCm3, cubicWeightKg, billableWeightKg, price };
}

/** Estima o frete pela API (cubagem + tabela do Mercado Livre). Lança Error se a chamada falhar. */
export async function estimateFreight(
  dimensions: BoxDimensions,
  weightKg: number,
): Promise<FreightEstimate> {
  const res = await api.estimarFrete(toMedidas(dimensions, weightKg));
  return fromApi(res, dimensions, weightKg);
}
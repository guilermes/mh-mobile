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
  /** true quando a tarifa usou o peso cúbico (e não o peso real). */
  usesCubicWeight?: boolean;
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

/** Converte a resposta de GET /api/frete/estimar no formato que a tela e o FreightEstimateCard usam. */
function fromApi(res: FreteEstimado, dimensions: BoxDimensions): FreightEstimate {
  if (typeof res.frete !== 'number' || !Number.isFinite(res.frete)) {
    throw new Error('A API não retornou o valor do frete. Verifique o formato da resposta.');
  }

  return {
    // A API não devolve o volume; é só altura × largura × profundidade.
    volumeCm3: dimensions.height * dimensions.width * dimensions.depth,
    cubicWeightKg: res.cubagem,
    billableWeightKg: res.considerado,
    usesCubicWeight: res.usaCubagem,
    price: res.frete,
  };
}

/** Estima o frete pela API (cubagem + tabela do Mercado Livre). Lança Error se a chamada falhar. */
export async function estimateFreight(
  dimensions: BoxDimensions,
  weightKg: number,
  salePrice: number,
): Promise<FreightEstimate> {
  const res = await api.estimarFrete(toMedidas(dimensions, weightKg), salePrice);
  return fromApi(res, dimensions);
}
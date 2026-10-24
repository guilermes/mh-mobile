import { BoxDimensions } from './measurements';

/**
 * TODO: troque pelas tarifas reais (transportadora / marketplace).
 * ATENÇÃO: estes valores são só de EXEMPLO.
 */
export const FREIGHT_TARIFF = {
  /** Divisor da cubagem (cm³ por kg). 6000 é o usual no Brasil; algumas transportadoras usam 5000. */
  cubicDivisor: 6000,
  /** Valor fixo da tarifa, em R$. */
  base: 8,
  /** Valor por kg tarifado, em R$. */
  perKg: 4.5,
  /** Enquanto for true, a tela avisa que a tarifa é de exemplo. */
  isSample: true,
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

/** Estima o frete pela cubagem: cobra o maior entre o peso real e o peso cúbico. */
export function estimateFreight(dimensions: BoxDimensions, weightKg: number): FreightEstimate {
  const { height, width, depth } = dimensions;
  const { cubicDivisor, base, perKg } = FREIGHT_TARIFF;

  const volumeCm3 = height * width * depth;
  const cubicWeightKg = volumeCm3 / cubicDivisor;
  const billableWeightKg = Math.max(weightKg, cubicWeightKg);
  const price = Math.round((base + billableWeightKg * perKg) * 100) / 100;

  return { volumeCm3, cubicWeightKg, billableWeightKg, price };
}
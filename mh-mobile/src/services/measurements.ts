/** Medidas da caixa em centímetros. */
export type BoxDimensions = {
  height: number;
  width: number;
  depth: number;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * TODO: calcular as medidas da caixa a partir da foto
 * (visão computacional, objeto de referência na imagem, etc.).
 *
 * ATENÇÃO: por enquanto devolve valores FIXOS de exemplo, só para a interface
 * poder ser testada. Substitua pela medição real antes de usar.
 */
export async function measureBoxFromPhoto(_photoUri: string): Promise<BoxDimensions> {
  if (__DEV__) console.warn('[measurements] measureBoxFromPhoto está usando valores de exemplo');
  await delay(800);
  return { height: 30, width: 20, depth: 10 };
}
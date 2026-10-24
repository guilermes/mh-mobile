const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * TODO: conectar à balança e ler o peso (em kg).
 * Deve lançar um Error com mensagem amigável se não conseguir conectar.
 *
 * ATENÇÃO: por enquanto devolve um valor FIXO de exemplo, só para a interface
 * poder ser testada. Substitua pela comunicação real com a balança
 * (Bluetooth, Wi-Fi, etc.).
 */
export async function readWeightFromScale(): Promise<number> {
  if (__DEV__) console.warn('[scale] readWeightFromScale está usando um valor de exemplo');
  await delay(1200);
  return 1.25;
}
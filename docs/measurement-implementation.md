# Implementação da medição de embalagens

## Fluxo integrado

A medição agora começa pelo botão **Medir caixa (2 fotos)**, dentro de `SimularFreteScreen`:

1. Captura ou seleciona uma imagem da vista superior.
2. `vision.service.ts` detecta o marcador ArUco ID 0.
3. A pessoa marca os quatro cantos da face; cada ponto pode ser reposicionado individualmente.
4. Repete o processo na vista lateral.
5. `measurements.ts` calcula as duas homografias, converte as coordenadas para milímetros e valida a diferença entre os dois comprimentos.
6. As dimensões finais são convertidas para centímetros e entregues ao estado já usado por `MeasureGauge` e `estimateFreight`.

Não foi criado endpoint novo nem fluxo independente de medição. O serviço de frete e a gravação de medidas no SKU continuam usando os contratos já existentes.

## Separação da visão computacional

- `vision.service.ts`: adaptador de detecção ArUco. Pode ser substituído por uma implementação HTTP ou nativa sem alterar a tela.
- `measurements.ts`: decodificação JPEG, homografia e cálculo geométrico.
- `BoxMeasurementFlow.tsx`: seleção de fotos, orientação ao usuário e seleção/ajuste dos cantos.

A detecção e a matemática são executadas em JavaScript. Não há módulo Kotlin/C++, NDK, CMake ou dependência de ARCore.

## Parâmetros do MVP

- Dicionário: `ARUCO`.
- ID esperado: `0`.
- Lado físico do quadrado preto externo: `50 mm`.
- Limite de divergência do comprimento entre as vistas: `12%`.
- Resolução máxima de decodificação: `4 megapixels`.
- Unidade de saída do app: centímetros.

## Limitações e calibração

A homografia só corrige perspectiva para pontos que pertencem ao mesmo plano. Por isso, o marcador precisa estar encostado na face medida. A correção não elimina distorção da lente, erro de impressão, deformação da caixa ou erro humano ao selecionar os cantos.

Antes de usar as medidas para decisões comerciais, compare vários testes com régua ou paquímetro. Use a câmera principal em 1×, mantenha a face inteira visível e evite fotografar em ângulos extremos.

A detecção é feita na thread JavaScript. O limite de 4 MP reduz o custo de memória e processamento, mas o tempo de análise pode variar conforme o aparelho e a qualidade da foto.

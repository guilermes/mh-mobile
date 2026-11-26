# Marcador para medir embalagens

O fluxo de medição usa o marcador **ArUco, dicionário `ARUCO`, ID 0**. O tamanho físico configurado no app é **50 × 50 mm**, considerando o quadrado preto externo completo.

## Gerar o arquivo para impressão

Depois de instalar as dependências do projeto, execute na raiz do app:

```bash
node scripts/generate-aruco-marker.cjs
```

O script cria `assets/aruco-marker-id0-50mm.svg`.

Imprima o SVG em **escala 100% / tamanho real**, sem a opção “ajustar à página”. Meça o quadrado preto externo com uma régua: ele precisa ter exatamente 50 × 50 mm. Se a impressora alterar a escala, ajuste a impressão antes de usar o app.

## Como posicionar

- Vista superior: fixe o marcador na face superior da caixa.
- Vista lateral: mova o marcador para a face lateral fotografada.
- Em ambas as fotos, mantenha o lado superior do marcador paralelo ao comprimento da caixa.
- O marcador precisa estar no mesmo plano da face medida. Não o deixe sobre a mesa nem em outra face.
- Fotografe a face inteira, com os quatro cantos da caixa e o marcador visíveis.
- Prefira a câmera principal em 1×, sem zoom digital, com boa iluminação e sem reflexos.

O app seleciona automaticamente o marcador e pede que a pessoa marque os quatro cantos da face da caixa. A homografia corrige a perspectiva entre pontos coplanares; ela não corrige distorção da lente nem erros de impressão/posicionamento.

## Limitação atual

A decodificação local espera dados JPEG. O `expo-image-picker` fornece a representação Base64 em JPEG; se uma imagem específica não puder ser decodificada, salve uma cópia em JPG e tente novamente.

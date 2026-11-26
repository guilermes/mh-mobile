import { decode, type DecodedImage } from 'jpeg-js';
import type { MeasurementCapture, MeasurementPhotoInput, NormalizedPoint } from '../types/measurement';
import { detectArucoMarker } from './vision.service';

/** Medidas da caixa em centímetros, no formato já consumido pelo cálculo de frete. */
export type BoxDimensions = {
  height: number;
  width: number;
  depth: number;
};

/** Tamanho físico do quadrado preto externo do marcador impresso. */
export const ARUCO_MARKER_SIZE_MM = 50;
/** Diferença máxima tolerada entre o comprimento calculado nas duas vistas. */
export const LENGTH_TOLERANCE_RATIO = 0.12;

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64ToBytes(value: string): Uint8Array {
  const clean = value.replace(/[^A-Za-z0-9+/=]/g, '').replace(/=+$/, '');
  const output = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let offset = 0;

  for (const char of clean) {
    const digit = BASE64_ALPHABET.indexOf(char);
    if (digit < 0) continue;
    buffer = (buffer << 6) | digit;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output[offset++] = (buffer >> bits) & 0xff;
    }
  }

  return output.subarray(0, offset);
}

/** Decodifica uma foto JPEG para RGBA e encontra o marcador ArUco ID 0. */
export async function analyzeMeasurementPhoto(
  input: MeasurementPhotoInput
): Promise<MeasurementCapture> {

  let decoded: DecodedImage;
  try {
    decoded = decode(base64ToBytes(input.base64), {
      useTArray: true,
      maxResolutionInMP: 4,
      maxMemoryUsageInMB: 128,
    });
  } catch {
    throw new Error('Formato de imagem não suportado. No momento, use uma foto JPEG (JPG).');
  }

  if (!decoded.width || !decoded.height || decoded.data.length !== decoded.width * decoded.height * 4) {
    throw new Error('A foto não pôde ser decodificada. Tente outra imagem JPEG.');
  }

  const marker = await detectArucoMarker(decoded.width, decoded.height, decoded.data);
  return {
    uri: input.uri,
    width: decoded.width,
    height: decoded.height,
    markerId: marker.id,
    markerCorners: marker.corners,
    boxCorners: [],
  };
}

function solveLinearSystem(matrix: number[][], values: number[]): number[] {
  const size = values.length;
  const augmented = matrix.map((row, index) => [...row, values[index]]);

  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }
    if (Math.abs(augmented[pivot][column]) < 1e-10) {
      throw new Error('Não foi possível corrigir a perspectiva. Reposicione o marcador e tire outra foto.');
    }
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];

    const divisor = augmented[column][column];
    for (let cell = column; cell <= size; cell += 1) augmented[column][cell] /= divisor;

    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let cell = column; cell <= size; cell += 1) {
        augmented[row][cell] -= factor * augmented[column][cell];
      }
    }
  }

  return augmented.map((row) => row[size]);
}

/** Calcula a homografia que leva os quatro cantos do marcador ao quadrado métrico conhecido. */
function createHomography(capture: MeasurementCapture): number[] {
  if (capture.markerCorners.length !== 4) throw new Error('O marcador precisa ter quatro cantos detectados.');
  const source = capture.markerCorners.map((point) => ({
    x: point.x * capture.width,
    y: point.y * capture.height,
  }));
  const size = ARUCO_MARKER_SIZE_MM;
  const target = [
    { x: 0, y: 0 },
    { x: size, y: 0 },
    { x: size, y: size },
    { x: 0, y: size },
  ];

  const matrix: number[][] = [];
  const values: number[] = [];
  for (let index = 0; index < 4; index += 1) {
    const { x, y } = source[index];
    const { x: u, y: v } = target[index];
    matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    values.push(u);
    matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    values.push(v);
  }
  return solveLinearSystem(matrix, values);
}

function transformPoint(point: NormalizedPoint, capture: MeasurementCapture, h: number[]) {
  const x = point.x * capture.width;
  const y = point.y * capture.height;
  const denominator = h[6] * x + h[7] * y + 1;
  if (Math.abs(denominator) < 1e-10) throw new Error('Pontos inválidos para corrigir a perspectiva.');
  return {
    x: (h[0] * x + h[1] * y + h[2]) / denominator,
    y: (h[3] * x + h[4] * y + h[5]) / denominator,
  };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function measureFace(capture: MeasurementCapture) {
  if (capture.boxCorners.length !== 4) {
    throw new Error('Marque os quatro cantos da face da caixa antes de continuar.');
  }
  const homography = createHomography(capture);
  const points = capture.boxCorners.map((point) => transformPoint(point, capture, homography));
  // Rejeita seleções cruzadas/concavas: os pontos precisam contornar a face.
  const turns = points.map((point, index) => {
    const next = points[(index + 1) % 4];
    const after = points[(index + 2) % 4];
    return (next.x - point.x) * (after.y - next.y) - (next.y - point.y) * (after.x - next.x);
  });
  if (
    turns.some((turn) => Math.abs(turn) < 1e-6) ||
    !turns.every((turn) => Math.sign(turn) === Math.sign(turns[0]))
  ) {
    throw new Error('Os pontos não formam uma face retangular válida. Marque os quatro cantos em sentido horário.');
  }
  const edgeA = [points[0], points[1], points[3], points[2]];
  const edgeB = [points[0], points[3], points[1], points[2]];
  const edgeALengths = [distance(edgeA[0], edgeA[1]), distance(edgeA[2], edgeA[3])];
  const edgeBLengths = [distance(edgeB[0], edgeB[1]), distance(edgeB[2], edgeB[3])];
  const edgeAAlignment =
    (Math.abs(edgeA[1].x - edgeA[0].x) + Math.abs(edgeA[3].x - edgeA[2].x)) /
    (edgeALengths[0] + edgeALengths[1]);
  const edgeBAlignment =
    (Math.abs(edgeB[1].x - edgeB[0].x) + Math.abs(edgeB[3].x - edgeB[2].x)) /
    (edgeBLengths[0] + edgeBLengths[1]);

  // O par mais alinhado ao eixo X do marcador representa o comprimento.
  const lengthEdges = edgeAAlignment >= edgeBAlignment ? edgeALengths : edgeBLengths;
  const otherEdges = edgeAAlignment >= edgeBAlignment ? edgeBLengths : edgeALengths;
  const length = (lengthEdges[0] + lengthEdges[1]) / 2;
  const other = (otherEdges[0] + otherEdges[1]) / 2;
  if (![length, other].every((value) => Number.isFinite(value) && value > 0)) {
    throw new Error('Não consegui calcular as dimensões. Confira os cantos selecionados.');
  }
  return { length, other };
}

/** Combina vista superior e lateral em dimensões compatíveis com o serviço de frete. */
export function measureBoxFromPhotos(
  topCapture: MeasurementCapture,
  sideCapture: MeasurementCapture,
): BoxDimensions {
  const top = measureFace(topCapture);
  const side = measureFace(sideCapture);
  const referenceLength = (top.length + side.length) / 2;
  const differenceRatio = Math.abs(top.length - side.length) / referenceLength;

  if (differenceRatio > LENGTH_TOLERANCE_RATIO) {
    const difference = Math.abs(top.length - side.length) / 10;
    throw new Error(
      `O comprimento divergiu ${difference.toFixed(1)} cm entre as fotos. Refaça a vista lateral ou superior, mantendo o marcador alinhado ao comprimento da caixa.`,
    );
  }

  return {
    depth: referenceLength / 10,
    width: top.other / 10,
    height: side.other / 10,
  };
}

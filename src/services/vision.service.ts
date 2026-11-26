import type { NormalizedPoint } from '../types/measurement';

export const ARUCO_MARKER_ID = 0;
export const ARUCO_DICTIONARY = 'ARUCO';
const MAX_DETECTION_DIMENSION = 720;

export type ArucoDetection = {
  id: number;
  corners: NormalizedPoint[];
};

type ArucoMarker = {
  id: number;
  corners: Array<{ x: number; y: number }>;
};

type ArucoImageData = {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
};

type ArucoDetector = {
  dictionary?: unknown;
  detect: (image: ArucoImageData) => ArucoMarker[];
};

type ArucoNamespace = {
  DICTIONARIES?: Record<string, unknown>;
  Detector: new (options?: {
    dictionaryName?: string;
    maxHammingDistance?: number;
  }) => ArucoDetector;
};

const { AR } = require('js-aruco2') as { AR: ArucoNamespace };

function downscaleRgba(
  width: number,
  height: number,
  rgba: Uint8Array,
  maxSide: number,
): ArucoImageData {
  const largestSide = Math.max(width, height);
  if (largestSide <= maxSide) {
    return { width, height, data: rgba };
  }

  const scale = maxSide / largestSide;
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const resized = new Uint8Array(targetWidth * targetHeight * 4);

  for (let y = 0; y < targetHeight; y += 1) {
    const srcY = Math.min(height - 1, Math.floor(y / scale));
    const srcRowOffset = srcY * width * 4;
    const dstRowOffset = y * targetWidth * 4;

    for (let x = 0; x < targetWidth; x += 1) {
      const srcX = Math.min(width - 1, Math.floor(x / scale));
      const srcIdx = srcRowOffset + srcX * 4;
      const dstIdx = dstRowOffset + x * 4;

      resized[dstIdx] = rgba[srcIdx];
      resized[dstIdx + 1] = rgba[srcIdx + 1];
      resized[dstIdx + 2] = rgba[srcIdx + 2];
      resized[dstIdx + 3] = rgba[srcIdx + 3];
    }
  }

  return {
    width: targetWidth,
    height: targetHeight,
    data: resized,
  };
}

export async function detectArucoMarker(
  width: number,
  height: number,
  rgba: Uint8Array,
): Promise<ArucoDetection> {
  if (typeof AR?.Detector !== 'function') {
    throw new Error(
      'Não foi possível inicializar o detector ArUco. Verifique a instalação do js-aruco2.',
    );
  }

  if (AR.DICTIONARIES && !(ARUCO_DICTIONARY in AR.DICTIONARIES)) {
    throw new Error(
      `Dicionário "${ARUCO_DICTIONARY}" não existe no js-aruco2. Disponíveis: ${Object.keys(
        AR.DICTIONARIES,
      ).join(', ')}`,
    );
  }

  const detector = new AR.Detector({
    dictionaryName: ARUCO_DICTIONARY,
    maxHammingDistance: 2,
  });

  const sample = downscaleRgba(width, height, rgba, MAX_DETECTION_DIMENSION);
  const markers = detector.detect(sample);
  const marker = markers.find((item) => item.id === ARUCO_MARKER_ID);

  if (!marker) {
    if (markers.length > 0) {
      throw new Error(
        `Encontrei um marcador ArUco, mas o ID detectado foi ${markers
          .map((item) => item.id)
          .join(', ')}. Use o marcador ID ${ARUCO_MARKER_ID}.`,
      );
    }

    throw new Error(
      'Não encontrei o marcador ArUco. Deixe o quadrado inteiro visível, bem iluminado e sem reflexos; depois tente novamente.',
    );
  }

  return {
    id: marker.id,
    corners: marker.corners.map((point) => ({
      x: point.x / sample.width,
      y: point.y / sample.height,
    })),
  };
}
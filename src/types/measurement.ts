/** Ponto em coordenadas normalizadas da imagem (0..1). */
export type NormalizedPoint = { x: number; y: number };

export type MeasurementView = 'top' | 'side';

/** Captura já decodificada e com marcador ArUco detectado. */
export type MeasurementCapture = {
  uri: string;
  width: number;
  height: number;
  markerId: number;
  markerCorners: NormalizedPoint[];
  boxCorners: NormalizedPoint[];
};

export type MeasurementPhotoInput = {
  uri: string;
  base64: string;
  width: number;
  height: number;
};

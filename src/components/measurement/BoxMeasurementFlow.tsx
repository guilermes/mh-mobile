import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import type {
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { Theme } from '../../constants/theme';
import { spacing } from '../../constants/theme';

import { useTheme, useThemedStyles } from '../../context/ThemeContext';

import type { BoxDimensions } from '../../services/measurements';

import {
  analyzeMeasurementPhoto,
  measureBoxFromPhotos,
} from '../../services/measurements';

import type {
  MeasurementCapture,
  MeasurementView,
  NormalizedPoint,
} from '../../types/measurement';

const VIEW_COPY: Record<MeasurementView, { title: string; description: string }> = {
  top: {
    title: '1 de 2 · Vista superior',
    description: 'Fotografe a face de cima. O lado superior do marcador deve ficar paralelo ao comprimento da caixa.',
  },
  side: {
    title: '2 de 2 · Vista lateral',
    description: 'Fotografe uma face lateral. O marcador precisa estar nessa face, com o lado superior paralelo ao comprimento.',
  },
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onComplete: (dimensions: BoxDimensions, photos: { top: string; side: string }) => void;
};

export function BoxMeasurementFlow({ visible, onClose, onComplete }: Props) {
  const { colors, components, typography } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [view, setView] = useState<MeasurementView>('top');
  const [capture, setCapture] = useState<MeasurementCapture | null>(null);
  const [topCapture, setTopCapture] = useState<MeasurementCapture | null>(null);
  const [boxCorners, setBoxCorners] = useState<NormalizedPoint[]>([]);
  const [editingCorner, setEditingCorner] = useState<number | null>(null);
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

 const resetFlow = () => {
  setView('top');
  setCapture(null);
  setTopCapture(null);
  setBoxCorners([]);
  setEditingCorner(null);
  setFrame({ width: 0, height: 0 });
  setError(null);
  setProcessing(false);
};

  const close = () => {
    resetFlow();
    onClose();
  };

  const handleFrameLayout = (event: LayoutChangeEvent) => {
    setFrame({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height });
  };


  const choosePhoto = async (source: 'camera' | 'library') => {
  if (processing) return;

  setError(null);

  try {
    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso à câmera para fotografar a caixa.'
        );
        return;
      }

      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 1,
        cameraType: ImagePicker.CameraType.back,
        allowsEditing: false,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        allowsEditing: false,
      });
    }

    if (result.canceled) return;

    const asset = result.assets?.[0];

    if (!asset) {
      throw new Error('Nenhuma imagem foi selecionada.');
    }

    setProcessing(true);

    // Redimensiona imagens muito grandes.
    const actions =
      Math.max(asset.width, asset.height) > 2000
        ? [
            {
              resize:
                asset.width >= asset.height
                  ? { width: 2000 }
                  : { height: 2000 },
            },
          ]
        : [];

    // Converte a imagem para JPEG.
    const jpegImage = await ImageManipulator.manipulateAsync(
      asset.uri,
      actions,
      {
        format: SaveFormat.JPEG,
        compress: 1,
        base64: true,
      }
    );

    if (!jpegImage.base64) {
      throw new Error(
        'Não foi possível converter a fotografia para JPEG.'
      );
    }

    // Analisa a imagem convertida.
    const detected = await analyzeMeasurementPhoto({
      uri: jpegImage.uri,
      base64: jpegImage.base64,
      width: jpegImage.width,
      height: jpegImage.height,
    });

    if (!detected) {
      throw new Error('Não foi possível analisar a fotografia.');
    }

    if (detected.markerId !== 0) {
      throw new Error(
        'O marcador encontrado não corresponde ao ID 0.'
      );
    }

    setCapture(detected);
    setBoxCorners([]);
    setEditingCorner(null);

  } catch (cause) {
    console.error(
  'Erro ao processar fotografia:',
  cause instanceof Error
    ? {
        name: cause.name,
        message: cause.message,
        stack: cause.stack,
      }
    : cause
);

    setError(
      cause instanceof Error
        ? cause.message
        : 'Não foi possível processar a fotografia.'
    );

  } finally {
    setProcessing(false);
  }
};


  const handleImagePress = (event: GestureResponderEvent) => {
    if (
  !capture ||
  (boxCorners.length >= 4 && editingCorner === null) ||
  frame.width <= 0 ||
  frame.height <= 0
) return;
    const scale = Math.min(frame.width / capture.width, frame.height / capture.height);
    const imageWidth = capture.width * scale;
    const imageHeight = capture.height * scale;
    const offsetX = (frame.width - imageWidth) / 2;
    const offsetY = (frame.height - imageHeight) / 2;
    const x = event.nativeEvent.locationX - offsetX;
    const y = event.nativeEvent.locationY - offsetY;
    if (x < 0 || y < 0 || x > imageWidth || y > imageHeight) return;

    const selectedPoint = {
      x: Math.max(0, Math.min(1, x / imageWidth)),
      y: Math.max(0, Math.min(1, y / imageHeight)),
    };
    if (editingCorner !== null) {
      setBoxCorners((current) => current.map((point, index) => index === editingCorner ? selectedPoint : point));
      setEditingCorner(null);
    } else {
      setBoxCorners((current) => [...current, selectedPoint]);
    }
  };

  const handleContinue = () => {
    if (!capture || boxCorners.length !== 4) return;
    const completedCapture = { ...capture, boxCorners };
    setError(null);

    if (view === 'top') {
      setTopCapture(completedCapture);
      setView('side');
      setCapture(null);
      setBoxCorners([]);
      setEditingCorner(null);
      return;
    }

    if (!topCapture) {
      setError('A vista superior não foi registrada. Recomece a medição.');
      return;
    }

    try {
      const dimensions = measureBoxFromPhotos(topCapture, completedCapture);
      onComplete(dimensions, { top: topCapture.uri, side: completedCapture.uri });
      resetFlow();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível calcular as medidas.');
    }
  };

  const markerPoints = capture?.markerCorners ?? [];
  const scale = capture && frame.width && frame.height
    ? Math.min(frame.width / capture.width, frame.height / capture.height)
    : 1;
  const renderedWidth = capture ? capture.width * scale : 0;
  const renderedHeight = capture ? capture.height * scale : 0;
  const offsetX = (frame.width - renderedWidth) / 2;
  const offsetY = (frame.height - renderedHeight) / 2;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={components.screen} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={typography.h3}>Medir embalagem</Text>
              <Text style={typography.small}>{VIEW_COPY[view].title}</Text>
            </View>
            <Pressable onPress={close} hitSlop={12} accessibilityRole="button">
              <Text style={[typography.body, { color: colors.primary }]}>Fechar</Text>
            </Pressable>
          </View>

          <View style={styles.instruction}>
            <Text style={typography.body}>{VIEW_COPY[view].description}</Text>
            <Text style={[typography.small, styles.warning]}>
              Importante: cole ou encoste o marcador na própria face que está medindo. Não o deixe solto na mesa ou em outra superfície.
            </Text>
            <Text style={typography.small}>
              Use o marcador ID 0, com o quadrado preto externo medindo exatamente 5 × 5 cm. Evite reflexos, sombras fortes e zoom digital.
            </Text>
          </View>

          {!capture ? (
            <View style={styles.pickActions}>
              {processing ? (
                <View style={styles.processing}>
                  <ActivityIndicator color={colors.primary} size="large" />
                  <Text style={typography.small}>Analisando a imagem e procurando o marcador…</Text>
                </View>
              ) : (
                <>
                  <Pressable
                    onPress={() => choosePhoto('camera')}
                    style={({ pressed }) => [components.buttonPrimary, styles.actionButton, pressed && components.buttonPrimaryPressed]}
                  >
                    <Text style={components.buttonPrimaryText}>Tirar foto</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => choosePhoto('library')}
                    style={({ pressed }) => [components.buttonOutline, styles.actionButton, pressed && components.buttonOutlinePressed]}
                  >
                    <Text style={components.buttonOutlineText}>Escolher da galeria</Text>
                  </Pressable>
                </>
              )}
            </View>
          ) : (
            <>
              <Text style={typography.body}>Marcador detectado (ID {capture.markerId}). Agora toque nos quatro cantos da face da caixa nesta ordem:</Text>
              <Text style={[typography.small, styles.orderText]}>Comece por qualquer canto e selecione os quatro em sentido horário.</Text>

              <Pressable style={styles.imageFrame} onLayout={handleFrameLayout} onPress={handleImagePress}>
                <Image
                  source={{ uri: capture.uri }}
                  style={{ position: 'absolute', width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
                {markerPoints.map((point, index) => (
                  <View
                    key={`marker-${index}`}
                    pointerEvents="none"
                    style={[styles.markerDot, { left: offsetX + point.x * renderedWidth - 5, top: offsetY + point.y * renderedHeight - 5 }]}
                  />
                ))}
                {boxCorners.map((point, index) => (
                  <View
                    key={`box-${index}`}
                    pointerEvents="none"
                    style={[styles.cornerDot, { left: offsetX + point.x * renderedWidth - 11, top: offsetY + point.y * renderedHeight - 11 }]}
                  >
                    <Text style={styles.cornerNumber}>{index + 1}</Text>
                  </View>
                ))}
              </Pressable>

              <Text style={[typography.small, styles.counter]}>
                {editingCorner !== null ? `Toque na nova posição do ponto ${editingCorner + 1}.` : `${boxCorners.length} de 4 cantos selecionados`}
              </Text>
              {boxCorners.length === 4 ? (
                <View style={styles.inlineActions}>
                  {boxCorners.map((_point, index) => (
                    <Pressable
                      key={`edit-${index}`}
                      onPress={() => setEditingCorner(index)}
                      style={({ pressed }) => [styles.editPoint, editingCorner === index && styles.editPointActive, pressed && styles.editPointPressed]}
                    >
                      <Text style={[typography.small, editingCorner === index && styles.editPointTextActive]}>
                        Ajustar {index + 1}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <View style={styles.inlineActions}>
                <Pressable
                  onPress={() => { setBoxCorners([]); setEditingCorner(null); }}
                  disabled={boxCorners.length === 0}
                  style={({ pressed }) => [components.buttonOutline, styles.flexButton, pressed && components.buttonOutlinePressed, boxCorners.length === 0 && styles.disabled]}
                >
                  <Text style={components.buttonOutlineText}>Limpar pontos</Text>
                </Pressable>
                <Pressable
                  onPress={() => { setCapture(null); setBoxCorners([]); setEditingCorner(null); setError(null); }}
                  style={({ pressed }) => [components.buttonOutline, styles.flexButton, pressed && components.buttonOutlinePressed]}
                >
                  <Text style={components.buttonOutlineText}>Trocar foto</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={handleContinue}
                disabled={boxCorners.length !== 4}
                style={({ pressed }) => [components.buttonPrimary, styles.actionButton, pressed && components.buttonPrimaryPressed, boxCorners.length !== 4 && styles.disabled]}
              >
                <Text style={components.buttonPrimaryText}>{view === 'top' ? 'Confirmar vista superior' : 'Calcular dimensões'}</Text>
              </Pressable>
            </>
          )}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={[typography.small, { color: colors.danger }]}>{error}</Text>
              {view === 'side' && topCapture ? (
                <Pressable onPress={() => { setCapture(null); setBoxCorners([]); setEditingCorner(null); setError(null); }}>
                  <Text style={[typography.small, { color: colors.primary }]}>Refazer vista lateral</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = ({ colors }: Theme) => StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerText: { gap: 2 },
  instruction: { padding: spacing.md, borderRadius: 12, backgroundColor: colors.primarySoft, gap: spacing.sm },
  warning: { color: colors.danger },
  pickActions: { gap: spacing.md, minHeight: 160, justifyContent: 'center' },
  actionButton: { minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  processing: { alignItems: 'center', gap: spacing.md },
  orderText: { marginTop: -spacing.sm },
  imageFrame: { height: 340, width: '100%', overflow: 'hidden', borderRadius: 12, backgroundColor: '#111827', alignSelf: 'center' },
  markerDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#facc15', borderWidth: 1, borderColor: '#111827' },
  cornerDot: { position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: '#16a34a', borderWidth: 2, borderColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  cornerNumber: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  counter: { textAlign: 'center' },
  inlineActions: { flexDirection: 'row', gap: spacing.md },
  flexButton: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  editPoint: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  editPointActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  editPointPressed: { opacity: 0.7 },
  editPointTextActive: { color: colors.white },
  disabled: { opacity: 0.45 },
  errorBox: { padding: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: colors.danger, gap: spacing.sm },
});

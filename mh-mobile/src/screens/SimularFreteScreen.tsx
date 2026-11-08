import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FieldInput } from '@/components/settings/FieldInput';
import { parseDecimal } from '@/utils/format';
import { FreightEstimateCard } from '../components/FreightEstimatedCard';
import { MeasureGauge } from '../components/MeasureGauge';
import { ScreenHeader } from '../components/Screenheader';
import { radius, spacing, Theme } from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { api, ApiError } from '../lib/api';
import { estimateFreight, FreightEstimate, toMedidas } from '../services/freight';
import { BoxDimensions, measureBoxFromPhoto } from '../services/measurements';
import { readWeightFromScale, ScaleCancelledError } from '../services/scale';

type Busy = 'measuring' | 'scale' | 'saving' | null;

const errorMessage = (e: unknown, fallback: string) =>
  e instanceof ApiError || e instanceof Error ? e.message : fallback;

export function SimularFreteScreen() {
  const router = useRouter();
  const { colors, components, typography } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<BoxDimensions | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [busy, setBusy] = useState<Busy>(null);

  const [estimate, setEstimate] = useState<FreightEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const [sku, setSku] = useState('');
  const [priceText, setPriceText] = useState('');
  const queryClient = useQueryClient();

  // Preço de venda válido (ou null): o frete do Mercado Livre depende dele.
  const parsedPrice = parseDecimal(priceText);
  const price = Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : null;
  const scaleAbort = useRef<AbortController | null>(null);

  // Se a tela for fechada durante a espera, para de consultar a API.
  useEffect(() => () => scaleAbort.current?.abort(), []);

  // O frete só é pedido à API quando medidas, peso e preço de venda já foram informados.
  // Se qualquer um mudar no meio do caminho, a resposta antiga é descartada (e a digitação do
  // preço espera 500 ms antes de consultar).
  useEffect(() => {
    if (dimensions === null || weight === null || price === null) {
      setEstimate(null);
      setEstimateError(null);
      setEstimating(false);
      return;
    }

    let cancelled = false;
    setEstimate(null);
    setEstimating(true);
    setEstimateError(null);

    const timer = setTimeout(() => {
      estimateFreight(dimensions, weight, price)
        .then((res) => {
          if (!cancelled) setEstimate(res);
        })
        .catch((e) => {
          if (cancelled) return;
          setEstimate(null);
          setEstimateError(errorMessage(e, 'Não foi possível calcular o frete.'));
        })
        .finally(() => {
          if (!cancelled) setEstimating(false);
        });
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [dimensions, weight, price, retryKey]);

  /** Abre a câmera, registra a foto e obtém as medidas da caixa. */
  const handleTakePhoto = async () => {
    if (busy) return;

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permissão necessária',
        'Permita o acesso à câmera nas configurações do aparelho para tirar as fotos.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setPhotoUri(uri);
    setBusy('measuring');
    try {
      setDimensions(await measureBoxFromPhoto(uri));
    } catch (e) {
      Alert.alert('Não foi possível medir', errorMessage(e, 'Tente tirar outra foto da caixa.'));
    } finally {
      setBusy(null);
    }
  };

  /** Espera a balança enviar o peso do SKU informado (ela grava o peso direto na API). */
  const handleConnectScale = async () => {
    if (busy) return;

    const code = sku.trim();
    if (!code) {
      Alert.alert('Informe o SKU', 'Digite o SKU do produto antes de pesar: a balança grava o peso nesse SKU.');
      return;
    }

    const controller = new AbortController();
    scaleAbort.current = controller;
    setBusy('scale');
    try {
      setWeight(await readWeightFromScale(code, { signal: controller.signal }));
      queryClient.invalidateQueries({ queryKey: ['produtos'] }); // o peso do SKU mudou
    } catch (e) {
      if (!(e instanceof ScaleCancelledError)) {
        Alert.alert(
          'Balança indisponível',
          errorMessage(e, 'Não foi possível obter o peso. Tente novamente.'),
        );
      }
    } finally {
      scaleAbort.current = null;
      setBusy(null);
    }
  };

  const handleCancelScale = () => scaleAbort.current?.abort();

  /** Opcional: grava as medidas no SKU informado (POST /api/produtos/:sku/medidas). */
  const handleSaveToSku = async () => {
    if (busy || dimensions === null || weight === null) return;
    const code = sku.trim();
    if (!code) {
      Alert.alert('Informe o SKU', 'Digite o SKU do produto para salvar as medidas.');
      return;
    }

    setBusy('saving');
    try {
      await api.setMedidas(code, toMedidas(dimensions, weight));
      Alert.alert('Pronto', 'Medidas salvas no produto.');
      setSku('');
    } catch (e) {
      Alert.alert('Não foi possível salvar', errorMessage(e, 'Tente novamente.'));
    } finally {
      setBusy(null);
    }
  };

  /** Conclui a simulação: limpa os dados (para a próxima) e volta para a Home. */
  const handleOk = () => {
    setPhotoUri(null);
    setDimensions(null);
    setWeight(null);
    setSku('');
    setPriceText('');
    router.navigate('/');
  };

  // Com o frete na tela, o "Ok!" vira a ação principal (única sólida).
  const cameraIsPrimary = estimate === null;
  const hasMeasures = dimensions !== null && weight !== null;
  const disabled = busy !== null;

  return (
    <SafeAreaView style={components.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          title="Simule o frete!"
          subtitle="Use a câmera para tirar as medidas da caixa do produto. Depois de registrar as medidas, clique no botão para se conectar a balança e obter o peso do produto."
        />

        <View style={styles.skuBox}>
          <FieldInput
            label="SKU do produto"
            value={sku}
            onChangeText={setSku}
            autoCapitalize="characters"
            placeholder="Ex.: SKA"
            editable={busy !== 'scale'}
          />
          <Text style={typography.small}>
            Digite o mesmo SKU na balança. Toque em "Conectar à balança" e só então pese o produto.
          </Text>
          <FieldInput
            label="Preço de venda (R$)"
            value={priceText}
            onChangeText={setPriceText}
            keyboardType="decimal-pad"
            placeholder="Ex.: 129,90"
          />
          <Text style={typography.small}>
            O frete do Mercado Livre depende do preço do anúncio.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleTakePhoto}
            disabled={disabled}
            accessibilityRole="button"
            style={({ pressed }) => [
              cameraIsPrimary ? components.buttonPrimary : components.buttonOutline,
              styles.button,
              pressed &&
                (cameraIsPrimary
                  ? components.buttonPrimaryPressed
                  : components.buttonOutlinePressed),
              disabled && styles.disabled,
            ]}
          >
            {busy === 'measuring' ? (
              <ActivityIndicator color={cameraIsPrimary ? colors.white : colors.primary} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="camera-outline"
                  size={20}
                  color={cameraIsPrimary ? colors.white : colors.text}
                />
                <Text
                  style={
                    cameraIsPrimary ? components.buttonPrimaryText : components.buttonOutlineText
                  }
                >
                  Tirar foto da caixa
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={handleConnectScale}
            disabled={disabled}
            accessibilityRole="button"
            style={({ pressed }) => [
              components.buttonOutline,
              styles.button,
              pressed && components.buttonOutlinePressed,
              disabled && styles.disabled,
            ]}
          >
            {busy === 'scale' ? (
              <>
                <ActivityIndicator color={colors.primary} />
                <Text style={components.buttonOutlineText}>Aguardando a balança…</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="scale-balance" size={20} color={colors.text} />
                <Text style={components.buttonOutlineText}>Conectar à balança</Text>
              </>
            )}
          </Pressable>

          {busy === 'scale' ? (
            <Pressable onPress={handleCancelScale} accessibilityRole="button" hitSlop={8}>
              <Text style={[typography.small, styles.cancel, { color: colors.danger }]}>Cancelar espera</Text>
            </Pressable>
          ) : null}
        </View>

        {photoUri ? (
          <View style={[components.card, styles.photoCard]}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            <View style={styles.photoTexts}>
              <Text style={typography.label}>Última foto</Text>
              <Text style={typography.small}>
                {busy === 'measuring' ? 'Calculando as medidas…' : 'Foto registrada'}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Mostradores */}
        <Text style={[typography.h4, styles.sectionTitle]}>Medidas do produto</Text>
        <View style={styles.grid}>
          <MeasureGauge
            icon="arrow-expand-vertical"
            label="Altura"
            value={dimensions?.height ?? null}
            unit="cm"
            style={styles.gridItem}
          />
          <MeasureGauge
            icon="arrow-expand-horizontal"
            label="Largura"
            value={dimensions?.width ?? null}
            unit="cm"
            style={styles.gridItem}
          />
          <MeasureGauge
            icon="cube-outline"
            label="Profundidade"
            value={dimensions?.depth ?? null}
            unit="cm"
            style={styles.gridItem}
          />
          <MeasureGauge
            icon="weight-kilogram"
            label="Peso"
            value={weight}
            unit="kg"
            style={styles.gridItem}
          />
        </View>

        {/* Frete: só depois que as medidas e o peso foram obtidos */}
        {hasMeasures ? (
          <View style={styles.result}>
            {price === null ? (
              <Text style={typography.small}>Informe o preço de venda para calcular o frete.</Text>
            ) : null}

            {estimating ? (
              <View style={styles.estimating}>
                <ActivityIndicator color={colors.primary} />
                <Text style={typography.small}>Calculando o frete…</Text>
              </View>
            ) : null}

            {estimateError ? (
              <View style={styles.estimating}>
                <Text style={[typography.small, { color: colors.danger }]}>{estimateError}</Text>
                <Pressable
                  onPress={() => setRetryKey((k) => k + 1)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    components.buttonOutline,
                    styles.button,
                    pressed && components.buttonOutlinePressed,
                  ]}
                >
                  <Text style={components.buttonOutlineText}>Tentar novamente</Text>
                </Pressable>
              </View>
            ) : null}

            {estimate ? <FreightEstimateCard estimate={estimate} /> : null}

            {estimate ? (
              <View style={styles.saveBox}>
                <Text style={typography.label}>Salvar as medidas no SKU {sku.trim() || '—'} (opcional)</Text>
                <Pressable
                  onPress={handleSaveToSku}
                  disabled={disabled}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    components.buttonOutline,
                    styles.button,
                    pressed && components.buttonOutlinePressed,
                    disabled && styles.disabled,
                  ]}
                >
                  {busy === 'saving' ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text style={components.buttonOutlineText}>Salvar medidas no SKU</Text>
                  )}
                </Pressable>
              </View>
            ) : null}

            {estimate ? (
              <Pressable
                onPress={handleOk}
                disabled={disabled}
                accessibilityRole="button"
                style={({ pressed }) => [
                  components.buttonPrimary,
                  styles.button,
                  pressed && components.buttonPrimaryPressed,
                  disabled && styles.disabled,
                ]}
              >
                <Text style={components.buttonPrimaryText}>Ok!</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (_t: Theme) =>
  StyleSheet.create({
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    actions: {
      gap: spacing.md,
    },
    button: {
      minHeight: 48,
    },
    disabled: {
      opacity: 0.7,
    },
    photoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      marginTop: spacing.lg,
    },
    photo: {
      width: 56,
      height: 56,
      borderRadius: radius.sm,
    },
    photoTexts: {
      flex: 1,
      gap: 2,
    },
    sectionTitle: {
      marginTop: spacing.xxl,
      marginBottom: spacing.md,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    gridItem: {
      flexGrow: 1,
      flexBasis: '45%',
    },
    result: {
      marginTop: spacing.xl,
      gap: spacing.lg,
    },
    estimating: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    saveBox: {
      gap: spacing.sm,
    },
    skuBox: {
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    cancel: {
      textAlign: 'center',
    },
  });
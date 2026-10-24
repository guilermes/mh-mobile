import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FreightEstimateCard } from '../components/FreightEstimatedCard';
import { MeasureGauge } from '../components/MeasureGauge';
import { ScreenHeader } from '../components/Screenheader';
import { radius, spacing, Theme } from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { estimateFreight } from '../services/freight';
import { BoxDimensions, measureBoxFromPhoto } from '../services/measurements';
import { readWeightFromScale } from '../services/scale';

type Busy = 'measuring' | 'scale' | null;

export function SimularFreteScreen() {
  const router = useRouter();
  const { colors, components, typography } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<BoxDimensions | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [busy, setBusy] = useState<Busy>(null);

  // O frete só aparece quando as medidas e o peso já foram obtidos.
  const estimate = useMemo(
    () => (dimensions !== null && weight !== null ? estimateFreight(dimensions, weight) : null),
    [dimensions, weight],
  );

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
      Alert.alert(
        'Não foi possível medir',
        e instanceof Error ? e.message : 'Tente tirar outra foto da caixa.',
      );
    } finally {
      setBusy(null);
    }
  };

  /** Conecta à balança e registra o peso. */
  const handleConnectScale = async () => {
    if (busy) return;

    setBusy('scale');
    try {
      setWeight(await readWeightFromScale());
    } catch (e) {
      Alert.alert(
        'Balança indisponível',
        e instanceof Error ? e.message : 'Não foi possível conectar à balança. Tente novamente.',
      );
    } finally {
      setBusy(null);
    }
  };

  /** Conclui a simulação: limpa os dados (para a próxima) e volta para a Home. */
  const handleOk = () => {
    setPhotoUri(null);
    setDimensions(null);
    setWeight(null);
    router.navigate('/');
  };

  // Com o frete na tela, o "Ok!" vira a ação principal (única sólida).
  const cameraIsPrimary = estimate === null;

  return (
    <SafeAreaView style={components.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Simule o frete!"
          subtitle="Use a câmera para tirar as medidas da caixa do produto. Depois de registrar as medidas, clique no botão para se conectar a balança e obter o peso do produto."
        />

        <View style={styles.actions}>
          <Pressable
            onPress={handleTakePhoto}
            disabled={busy !== null}
            accessibilityRole="button"
            style={({ pressed }) => [
              cameraIsPrimary ? components.buttonPrimary : components.buttonOutline,
              styles.button,
              pressed &&
                (cameraIsPrimary
                  ? components.buttonPrimaryPressed
                  : components.buttonOutlinePressed),
              busy !== null && styles.disabled,
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
            disabled={busy !== null}
            accessibilityRole="button"
            style={({ pressed }) => [
              components.buttonOutline,
              styles.button,
              pressed && components.buttonOutlinePressed,
              busy !== null && styles.disabled,
            ]}
          >
            {busy === 'scale' ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <MaterialCommunityIcons name="scale-balance" size={20} color={colors.text} />
                <Text style={components.buttonOutlineText}>Conectar à balança</Text>
              </>
            )}
          </Pressable>
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
        {estimate ? (
          <View style={styles.result}>
            <FreightEstimateCard estimate={estimate} />

            <Pressable
              onPress={handleOk}
              disabled={busy !== null}
              accessibilityRole="button"
              style={({ pressed }) => [
                components.buttonPrimary,
                styles.button,
                pressed && components.buttonPrimaryPressed,
                busy !== null && styles.disabled,
              ]}
            >
              <Text style={components.buttonPrimaryText}>Ok!</Text>
            </Pressable>
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
  });
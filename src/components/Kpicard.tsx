import type { ClasseAnuncio } from '@/lib/api';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

type Props = {
  label: string;
  value: string;
  /** Sobrescreve a cor do valor (ex.: colors.danger para "Custo ML"). */
  valueColor?: string;
  /** Texto auxiliar abaixo do valor (ex.: confiança da classificação "84% confiança"). */
  subtitle?: string;
  loading?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function useClasseColor(classe?: ClasseAnuncio | null): string | undefined {
  const { colors } = useTheme();
  if (!classe) return undefined;
  if (classe === 'Bom') return colors.success;
  if (classe === 'Mediano') return colors.warning;
  return colors.danger;
}

export function KpiCard({ label, value, valueColor, subtitle, loading, onPress, style }: Props) {
  const { colors, components, typography } = useTheme();

  const content = (
    <View style={[components.card, styles.card, style]}>
      <Text style={typography.label}>{label}</Text>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      ) : (
        <Text style={[typography.kpiValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
      )}
      {subtitle && !loading ? <Text style={typography.small}>{subtitle}</Text> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={loading}
        accessibilityRole="button"
        style={({ pressed }) => [pressed && { opacity: 0.75 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  loader: {
    alignSelf: 'flex-start',
    marginVertical: spacing.xs,
  },
});
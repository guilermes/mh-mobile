import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { components, spacing, typography } from '../constants/theme';

type Props = {
  label: string;
  value: string;
  /** Sobrescreve a cor do valor (ex.: colors.danger para "Custo ML"). */
  valueColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function KpiCard({ label, value, valueColor, style }: Props) {
  return (
    <View style={[components.card, styles.card, style]}>
      <Text style={typography.label}>{label}</Text>
      <Text style={[typography.kpiValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
});
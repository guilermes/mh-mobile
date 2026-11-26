import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { fontFamily, fontSize, spacing, Theme } from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type Props = {
  icon: IconName;
  label: string;
  /** null = ainda não medido (mostra "—"). */
  value: number | null;
  unit: string;
  style?: StyleProp<ViewStyle>;
};

const formatValue = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

/** Mostrador de uma medida (altura, largura, profundidade ou peso). */
export function MeasureGauge({ icon, label, value, unit, style }: Props) {
  const { colors, components, typography } = useTheme();
  const styles = useThemedStyles(createStyles);
  const hasValue = value !== null;

  return (
    <View
      style={[components.card, styles.card, style]}
      accessibilityLabel={hasValue ? `${label}: ${formatValue(value)} ${unit}` : `${label}: não medido`}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons name={icon} size={16} color={colors.muted} />
        <Text style={typography.label}>{label}</Text>
      </View>

      <View style={styles.valueRow}>
        <Text style={[typography.kpiValue, !hasValue && styles.empty]}>
          {hasValue ? formatValue(value) : '—'}
        </Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    card: {
      padding: spacing.lg,
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.xs,
    },
    empty: {
      color: colors.muted,
    },
    unit: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.body,
      color: colors.muted,
    },
  });
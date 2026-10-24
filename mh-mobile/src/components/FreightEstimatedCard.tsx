import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, fontSize, spacing, Theme } from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { FREIGHT_TARIFF, FreightEstimate } from '../services/freight';

type Props = {
  estimate: FreightEstimate;
};

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const kg = (n: number) =>
  `${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
const cm3 = (n: number) => `${Math.round(n).toLocaleString('pt-BR')} cm³`;

/** Mostrador do frete estimado, com o detalhe da cubagem. */
export function FreightEstimateCard({ estimate }: Props) {
  const { colors, components, typography } = useTheme();
  const styles = useThemedStyles(createStyles);

  const rows = [
    { label: 'Volume', value: cm3(estimate.volumeCm3) },
    { label: 'Peso cúbico', value: kg(estimate.cubicWeightKg) },
    { label: 'Peso tarifado', value: kg(estimate.billableWeightKg) },
  ];

  return (
    <View
      style={[components.card, styles.card]}
      accessibilityLabel={`Frete estimado: ${brl(estimate.price)}`}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons name="truck-outline" size={16} color={colors.muted} />
        <Text style={typography.label}>Frete estimado</Text>
      </View>

      <Text style={[typography.kpiValue, styles.price]}>{brl(estimate.price)}</Text>

      <View style={styles.details}>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={typography.small}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      {FREIGHT_TARIFF.isSample ? (
        <Text style={[typography.small, styles.caption]}>
          Estimativa com tarifa de exemplo, baseada na cubagem.
        </Text>
      ) : null}
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
    price: {
      fontSize: 36,
      lineHeight: 42,
    },
    details: {
      gap: spacing.xs,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowValue: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.small,
      color: colors.text,
    },
    caption: {
      marginTop: spacing.xs,
    },
  });
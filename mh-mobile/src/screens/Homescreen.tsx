import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KpiCard } from '../components/Kpicard';
import { ScreenHeader } from '../components/Screenheader';
import {
    colors,
    components,
    fontFamily,
    getFreightDeltaColor,
    spacing,
    typography,
} from '../constants/theme';

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/* Dados de exemplo: o conteúdo real entra depois. */
const KPIS = [
  { label: 'Anúncios ativos', value: '128' },
  { label: 'Pausados', value: '14' },
  { label: 'Frete médio', value: brl(18.4) },
  { label: 'Custo ML', value: brl(7.9), danger: true },
];

const FREIGHT_CHANGES = [
  { id: '1', title: 'Cadeirinha para carro 9–36 kg', from: 21.9, to: 24.5 },
  { id: '2', title: 'Berço portátil dobrável', from: 39.0, to: 35.2 },
  { id: '3', title: 'Kit mamadeiras anticólica', from: 14.8, to: 14.8 },
];

export function HomeScreen() {
  return (
    <SafeAreaView style={components.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Olá!" subtitle="Resumo dos seus anúncios" connected />

        <View style={styles.grid}>
          {KPIS.map((kpi) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              valueColor={kpi.danger ? colors.danger : undefined}
              style={styles.gridItem}
            />
          ))}
        </View>

        <Text style={[typography.h4, styles.sectionTitle]}>Variações de frete</Text>

        <View style={components.table}>
          {FREIGHT_CHANGES.map((item, index) => {
            const delta = item.to - item.from;
            const color = getFreightDeltaColor(delta);
            const isLast = index === FREIGHT_CHANGES.length - 1;

            return (
              <View
                key={item.id}
                style={[components.tableRow, isLast && { borderBottomWidth: 0 }]}
              >
                <View style={styles.rowTexts}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={typography.small}>
                    {brl(item.from)} → {brl(item.to)}
                  </Text>
                </View>

                <View style={styles.delta}>
                  {delta !== 0 && (
                    <MaterialCommunityIcons
                      name={delta > 0 ? 'arrow-up' : 'arrow-down'}
                      size={16}
                      color={color}
                    />
                  )}
                  <Text style={[typography.number, { color }]}>
                    {delta === 0 ? '—' : brl(Math.abs(delta))}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
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
  sectionTitle: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  rowTexts: {
    flex: 1,
    gap: 2,
    paddingRight: spacing.md,
  },
  rowTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    color: colors.text,
  },
  delta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
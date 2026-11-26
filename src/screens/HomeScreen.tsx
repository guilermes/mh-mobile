import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KpiCard } from '@/components/Kpicard';
import { ScreenHeader } from '@/components/Screenheader';
import { fontFamily, spacing, Theme } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { useDashboard } from '@/hooks/useDashboard';

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function HomeScreen() {
  const { colors, components, typography, getFreightDeltaColor } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { data, isPending, isError, error, refetch, isRefetching } = useDashboard();

  const kpis = data
    ? [
        { label: 'Ticket médio', value: brl(data.ticketMedio) },
        { label: 'Alto desempenho', value: String(data.altoDesempenho) },
        { label: 'Em prejuízo', value: String(data.prejuizo), danger: data.prejuizo > 0 },
        { label: 'Frete divergente', value: String(data.freteDivergente) },
      ]
    : [];

  return (
    <SafeAreaView style={components.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <ScreenHeader title="Olá!" subtitle="Resumo dos seus anúncios" connected />

        {isPending ? (
          <View style={styles.state}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : isError ? (
          <View style={styles.state}>
            <Text style={[typography.small, { color: colors.danger }]}>
              {error instanceof Error ? error.message : 'Não foi possível carregar o resumo.'}
            </Text>
            <Pressable
              onPress={() => refetch()}
              accessibilityRole="button"
              style={({ pressed }) => [
                components.buttonOutline,
                styles.retry,
                pressed && components.buttonOutlinePressed,
              ]}
            >
              <Text style={components.buttonOutlineText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.grid}>
              {kpis.map((kpi) => (
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

            {data.divergentesTop.length === 0 ? (
              <Text style={typography.small}>Nenhuma divergência de frete no momento.</Text>
            ) : (
              <View style={components.table}>
                {data.divergentesTop.map((item, index) => {
                  const delta = item.delta;
                  const color = getFreightDeltaColor(delta);
                  const isLast = index === data.divergentesTop.length - 1;

                  return (
                    <View
                      key={item.mlb}
                      style={[components.tableRow, isLast && { borderBottomWidth: 0 }]}
                    >
                      <View style={styles.rowTexts}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {item.titulo}
                        </Text>
                        <Text style={typography.small}>
                          {brl(item.freteCobrado)} → {brl(item.freteReal)}
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
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    state: {
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.xxl,
    },
    retry: {
      minHeight: 48,
      alignSelf: 'stretch',
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
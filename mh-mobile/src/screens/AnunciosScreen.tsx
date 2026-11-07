import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '@/components/Chip';
import { ScreenHeader } from '@/components/Screenheader';
import { fontFamily, radius, spacing, Theme } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { useAnuncios } from '@/hooks/useAnuncios';
import type { AnuncioItem } from '@/lib/api';
import { brl, pct } from '@/utils/format';

// ⚠️ CONFIRA no Swagger (/api/docs) os valores aceitos por `filter` e `sort` e ajuste aqui.
// A API devolve `filterLabel`, que aparece abaixo da busca e ajuda a validar se o filtro pegou.
const FILTERS = [
  { label: 'Todos', value: '' },
  { label: 'Prejuízo', value: 'prejuizo' },
  { label: 'Alto desempenho', value: 'alto-desempenho' },
  { label: 'Frete divergente', value: 'frete-divergente' },
];

const SORTS = [
  { label: 'Título', value: 'titulo', defaultDir: 'asc' as const },
  { label: 'Preço', value: 'precoPor', defaultDir: 'desc' as const },
  { label: 'Margem', value: 'margem', defaultDir: 'desc' as const },
];

type Dir = 'asc' | 'desc';

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  const { typography } = useTheme();
  return (
    <View style={metricStyles.metric}>
      <Text style={typography.small}>{label}</Text>
      <Text style={[typography.label, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const metricStyles = StyleSheet.create({ metric: { flexBasis: '46%', flexGrow: 1, gap: 2 } });

function AnuncioCard({ item }: { item: AnuncioItem }) {
  const { colors, components, typography } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { lucro, margem, custoML } = item._calc;
  const negative = lucro < 0;

  return (
    <View style={[components.card, styles.card]}>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.titulo}
      </Text>
      <Text style={typography.small}>{item.mlb}</Text>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={typography.small}>Preço</Text>
          <View style={styles.priceRow}>
            <Text style={typography.label}>{brl(item.precoPor)}</Text>
            {item.precoDe > item.precoPor ? (
              <Text style={[typography.small, styles.strike]}>{brl(item.precoDe)}</Text>
            ) : null}
          </View>
        </View>
        <Metric label="Frete" value={brl(item.frete)} />
        <Metric label="Comissão" value={brl(item.comissao)} />
        <Metric label="Custo ML" value={brl(custoML)} color={colors.danger} />
      </View>

      <View style={[styles.profit, { borderTopColor: colors.border }]}>
        <Metric label="Lucro" value={brl(lucro)} color={negative ? colors.danger : undefined} />
        <Metric label="Margem" value={pct(margem)} color={negative ? colors.danger : undefined} />
      </View>
    </View>
  );
}

export function AnunciosScreen() {
  const { colors, components, typography } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('');
  const [dir, setDir] = useState<Dir>('asc');

  // Só consulta a API 400 ms depois da última letra digitada.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchText.trim()), 400);
    return () => clearTimeout(t);
  }, [searchText]);

  const { data, isPending, isError, error, refetch, isRefetching, isPlaceholderData, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAnuncios({ search, filter, sort, dir: sort ? dir : undefined });

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const first = data?.pages[0];

  const onSortPress = (value: string, defaultDir: Dir) => {
    if (sort === value) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(value);
      setDir(defaultDir);
    }
  };

  const header = (
    <View>
      <ScreenHeader title="Anúncios" subtitle="Preço, frete e lucro de cada anúncio" />

      <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.text} />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar por título ou MLB"
          placeholderTextColor={colors.border}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={[styles.searchInput, { color: colors.text }]}
        />
        {searchText ? (
          <Pressable onPress={() => setSearchText('')} accessibilityLabel="Limpar busca" hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.text} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {FILTERS.map((f) => (
          <Chip key={f.label} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {SORTS.map((s) => (
          <Chip
            key={s.value}
            label={s.label}
            selected={sort === s.value}
            trailingIcon={sort === s.value ? (dir === 'asc' ? 'arrow-up' : 'arrow-down') : undefined}
            onPress={() => onSortPress(s.value, s.defaultDir)}
          />
        ))}
      </ScrollView>

      {first ? (
        <Text style={[typography.small, styles.summary]}>
          {first.total} {first.total === 1 ? 'anúncio' : 'anúncios'}
          {first.filterLabel ? ` · ${first.filterLabel}` : ''}
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={components.screen} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.mlb}
        renderItem={({ item }) => <AnuncioCard item={item} />}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.content, isPlaceholderData && styles.dimmed]}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => refetch()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        ListEmptyComponent={
          isPending ? (
            <View style={styles.state}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : isError ? (
            <View style={styles.state}>
              <Text style={[typography.small, { color: colors.danger }]}>
                {error instanceof Error ? error.message : 'Não foi possível carregar os anúncios.'}
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
            <Text style={[typography.small, styles.state]}>Nenhum anúncio encontrado.</Text>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: spacing.lg }} color={colors.primary} /> : null
        }
      />
    </SafeAreaView>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    dimmed: { opacity: 0.5 },
    state: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
    retry: { minHeight: 48, alignSelf: 'stretch' },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      minHeight: 48,
      marginTop: spacing.lg,
    },
    searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
    chips: { gap: spacing.sm, paddingTop: spacing.md },
    summary: { marginTop: spacing.md, marginBottom: spacing.md },
    card: { padding: spacing.md, gap: spacing.sm },
    cardTitle: { fontFamily: fontFamily.semibold, fontSize: 15, color: colors.text },
    metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
    metric: { flexBasis: '46%', flexGrow: 1, gap: 2 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
    strike: { textDecorationLine: 'line-through' },
    profit: {
      flexDirection: 'row',
      gap: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingTop: spacing.md,
      marginTop: spacing.sm,
    },
  });
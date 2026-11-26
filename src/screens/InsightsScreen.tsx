import { Chip } from '@/components/Chip';
import { useClasseColor } from '@/components/Kpicard';
import { ScreenHeader } from '@/components/Screenheader';
import { FieldInput } from '@/components/settings/FieldInput';
import { fontFamily, spacing, Theme } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { useClassificarAnuncio } from '@/hooks/useClassificarAnuncio';
import { useProdutos, useSetCusto } from '@/hooks/useProdutos';
import { featuresFromProduto, type Produto } from '@/lib/api';
import { brl, parseDecimal } from '@/utils/format';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Mode = 'todos' | 'divergentes';

function ProdutoCard({
  item,
  onSaveCusto,
}: {
  item: Produto;
  onSaveCusto: (sku: string, custo: number) => Promise<void>;
}) {
  const { colors, components, typography, getFreightDeltaColor } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [editing, setEditing] = useState(false);
  const [custoText, setCustoText] = useState('');
  const [saving, setSaving] = useState(false);

  const classificar = useClassificarAnuncio();
  const mlResult = classificar.data;
  const mlColor = useClasseColor(mlResult?.classe);

  const deltaColor = getFreightDeltaColor(item.delta);
  const hasMeasures =
    item.largura !== null && item.altura !== null && item.comprimento !== null && item.pesoReal !== null;

  const handleClassificar = () => {
    classificar.mutate(featuresFromProduto(item), {
      onError: (e) => {
        Alert.alert('Classificador', e instanceof Error ? e.message : 'Modelo indisponível.');
      },
    });
  };

  const startEdit = () => {
    setCustoText(item.custo !== null ? String(item.custo).replace('.', ',') : '');
    setEditing(true);
  };

  const save = async () => {
    const value = parseDecimal(custoText);
    if (!Number.isFinite(value) || value < 0) {
      Alert.alert('Custo inválido', 'Informe um valor maior ou igual a zero.');
      return;
    }
    setSaving(true);
    try {
      await onSaveCusto(item.sku, value);
      if (mlResult) {
        classificar.mutate(featuresFromProduto({ ...item, custo: value }));
      }
      setEditing(false);
    } catch (e) {
      Alert.alert('Não foi possível salvar', e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[components.card, styles.card]}>
      <View style={styles.titleRow}>
        <View style={styles.titleTexts}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.nome}
          </Text>
          <Text style={typography.small}>
            {item.sku} · {item.qtd} {item.qtd === 1 ? 'anúncio' : 'anúncios'}
          </Text>
        </View>
        <View style={styles.badgesRow}>
          {mlResult ? (
            <View style={[styles.mlBadge, { borderColor: mlColor }]}>
              <Text style={[styles.mlBadgeText, { color: mlColor }]}>
                {mlResult.classe} · {Math.round((mlResult.probabilidades[mlResult.classe] ?? 0) * 100)}%
              </Text>
            </View>
          ) : null}
          {item.divergente ? (
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.danger} />
          ) : null}
        </View>
      </View>

      <View style={styles.freight}>
        <Text style={typography.small}>Frete cobrado → real</Text>
        <View style={styles.freightRow}>
          <Text style={typography.label}>
            {brl(item.freteCobrado)} → {brl(item.freteReal)}
          </Text>
          <View style={styles.delta}>
            {item.delta !== null && item.delta !== 0 && (
              <MaterialCommunityIcons name={item.delta > 0 ? 'arrow-up' : 'arrow-down'} size={16} color={deltaColor} />
            )}
            <Text style={[typography.number, { color: deltaColor }]}>
              {item.delta === null || item.delta === 0 ? '—' : brl(Math.abs(item.delta))}
            </Text>
          </View>
        </View>
      </View>

      <Text style={typography.small}>
        {hasMeasures
          ? `${item.largura} × ${item.altura} × ${item.comprimento} cm · ${item.pesoReal} kg`
          : 'Sem medidas cadastradas'}
      </Text>

      {editing ? (
        <View style={styles.editBox}>
          <FieldInput
            label="Custo (R$)"
            value={custoText}
            onChangeText={setCustoText}
            keyboardType="decimal-pad"
            autoFocus
          />
          <View style={styles.editActions}>
            <Pressable
              onPress={() => setEditing(false)}
              disabled={saving}
              accessibilityRole="button"
              style={({ pressed }) => [
                components.buttonOutline,
                styles.button,
                pressed && components.buttonOutlinePressed,
              ]}
            >
              <Text style={components.buttonOutlineText}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={saving}
              accessibilityRole="button"
              style={({ pressed }) => [
                components.buttonPrimary,
                styles.button,
                pressed && components.buttonPrimaryPressed,
                saving && { opacity: 0.7 },
              ]}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={components.buttonPrimaryText}>Salvar</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.costRow}>
          <View>
            <Text style={typography.small}>Custo</Text>
            <Text style={typography.label}>{brl(item.custo)}</Text>
          </View>
          <View style={styles.cardActions}>
            <Pressable
              onPress={handleClassificar}
              disabled={classificar.isPending}
              accessibilityRole="button"
              style={({ pressed }) => [
                components.buttonOutline,
                styles.button,
                styles.editButton,
                pressed && components.buttonOutlinePressed,
              ]}
            >
              {classificar.isPending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={components.buttonOutlineText}>
                  {mlResult ? 'Reavaliar IA' : 'Classificar'}
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={startEdit}
              accessibilityRole="button"
              style={({ pressed }) => [
                components.buttonOutline,
                styles.button,
                styles.editButton,
                pressed && components.buttonOutlinePressed,
              ]}
            >
              <Text style={components.buttonOutlineText}>Editar custo</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

export function InsightsScreen() {
  const { colors, components, typography } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [mode, setMode] = useState<Mode>('divergentes');

  const { data, isPending, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useProdutos();
  const setCusto = useSetCusto();

  const all = useMemo(() => data?.pages.flatMap((p) => p.products) ?? [], [data]);
  // A API não filtra por divergência: o filtro é feito nas páginas já carregadas.
  const products = useMemo(
    () => (mode === 'divergentes' ? all.filter((p) => p.divergente) : all),
    [all, mode],
  );
  const total = data?.pages[0]?.total;

  // Com o filtro ligado a lista pode ficar curta demais para rolar: carrega mais páginas.
  useEffect(() => {
    if (mode === 'divergentes' && products.length < 6 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [mode, products.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const header = (
    <View>
      <ScreenHeader title="Insights" subtitle="Frete cobrado × real e custo de cada produto" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Divergentes" selected={mode === 'divergentes'} onPress={() => setMode('divergentes')} />
        <Chip label="Todos" selected={mode === 'todos'} onPress={() => setMode('todos')} />
      </ScrollView>
      {total !== undefined ? (
        <Text style={[typography.small, styles.summary]}>
          {mode === 'divergentes' ? `${products.length} divergentes de ${total} produtos` : `${total} produtos`}
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={components.screen} edges={['top']}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.sku}
        renderItem={({ item }) => (
          <ProdutoCard item={item} onSaveCusto={(sku, custo) => setCusto.mutateAsync({ sku, custo })} />
        )}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        keyboardShouldPersistTaps="handled"
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
                {error instanceof Error ? error.message : 'Não foi possível carregar os produtos.'}
              </Text>
              <Pressable
                onPress={() => refetch()}
                accessibilityRole="button"
                style={({ pressed }) => [
                  components.buttonOutline,
                  styles.button,
                  { alignSelf: 'stretch' },
                  pressed && components.buttonOutlinePressed,
                ]}
              >
                <Text style={components.buttonOutlineText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={[typography.small, styles.state]}>
              {mode === 'divergentes' ? 'Nenhum produto com frete divergente.' : 'Nenhum produto encontrado.'}
            </Text>
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
    state: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
    chips: { gap: spacing.sm, paddingTop: spacing.lg },
    summary: { marginTop: spacing.md, marginBottom: spacing.md },
    card: { padding: spacing.md, gap: spacing.sm },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    titleTexts: { flex: 1, gap: 2 },
    cardTitle: { fontFamily: fontFamily.semibold, fontSize: 15, color: colors.text },
    badgesRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    mlBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 999,
      borderWidth: 1,
    },
    mlBadgeText: {
      fontFamily: fontFamily.semibold,
      fontSize: 12,
    },
    freight: { gap: 2, marginTop: spacing.sm },
    freightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    delta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    costRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    editButton: { paddingHorizontal: spacing.md, flexGrow: 0 },
    editBox: { gap: spacing.md, marginTop: spacing.sm },
    editActions: { flexDirection: 'row', gap: spacing.md },
    button: { minHeight: 44, flexGrow: 1 },
  });
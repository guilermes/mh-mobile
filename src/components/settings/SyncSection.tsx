import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useConfig, useStartSync, useSyncStatus } from '@/hooks/useSettings';
import { formatDateTime } from '@/utils/format';

/** Sincronização com o Mercado Livre (POST /api/sync + GET /api/sync/status com progresso). */
export function SyncSection() {
  const { colors, components, typography } = useTheme();
  const qc = useQueryClient();
  const { data: config } = useConfig();
  const [waiting, setWaiting] = useState(false); // entre o clique e o servidor marcar "running"
  const { data: status } = useSyncStatus(waiting);
  const start = useStartSync();
  const wasRunning = useRef(false);

  const running = status?.running ?? false;

  // O servidor pode demorar um instante para marcar "running"; não esperamos mais que 8 s.
  useEffect(() => {
    if (running) setWaiting(false);
  }, [running]);
  useEffect(() => {
    if (!waiting) return;
    const t = setTimeout(() => setWaiting(false), 8000);
    return () => clearTimeout(t);
  }, [waiting]);

  // Ao terminar, tudo que veio da sincronização precisa ser recarregado.
  useEffect(() => {
    if (wasRunning.current && !running) {
      ['config', 'dashboard', 'anuncios', 'produtos'].forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
    }
    wasRunning.current = running;
  }, [running, qc]);

  const begin = async () => {
    try {
      await start.mutateAsync();
      setWaiting(true);
    } catch (e) {
      Alert.alert('Não foi possível sincronizar', e instanceof Error ? e.message : 'Tente novamente.');
    }
  };

  const busy = running || waiting || start.isPending;
  const pct = status && status.totalIds > 0 ? Math.min(100, (status.processed / status.totalIds) * 100) : 0;

  return (
    <>
      <Text style={[typography.h4, styles.title]}>Sincronização</Text>
      <View style={[components.card, styles.card]}>
        <Text style={typography.small}>Última sincronização: {formatDateTime(config?.lastSyncAt)}</Text>

        {running && status ? (
          <View style={styles.progress}>
            <View style={[styles.track, { backgroundColor: colors.border }]}>
              <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={typography.small}>
              {status.processed} de {status.totalIds} · {status.phase}
            </Text>
          </View>
        ) : status && status.totalIds > 0 && !waiting ? (
          <Text style={typography.small}>
            Último resultado: {status.novos} {status.novos === 1 ? 'novo' : 'novos'} e {status.atualizados}{' '}
            {status.atualizados === 1 ? 'atualizado' : 'atualizados'} de {status.totalIds}.
          </Text>
        ) : null}

        <Pressable
          onPress={begin}
          disabled={busy}
          accessibilityRole="button"
          style={({ pressed }) => [
            components.buttonPrimary,
            styles.button,
            pressed && components.buttonPrimaryPressed,
            busy && { opacity: 0.6 },
          ]}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={components.buttonPrimaryText}>Sincronizar agora</Text>
          )}
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.xl, marginBottom: spacing.md },
  card: { padding: spacing.md, gap: spacing.md },
  progress: { gap: spacing.sm },
  track: { height: 8, borderRadius: radius.sm, overflow: 'hidden' },
  fill: { height: 8, borderRadius: radius.sm },
  button: { minHeight: 48 },
});
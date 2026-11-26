import { StyleSheet, Text, View } from 'react-native';
import { spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

type Props = {
  title: string;
  subtitle?: string;
  /** Mostra o badge de status (Conectado / Não autorizado). */
  connected?: boolean;
};

export function ScreenHeader({ title, subtitle, connected }: Props) {
  const { typography, getBadgeStyle } = useTheme();
  const badge = getBadgeStyle(connected ? 'success' : 'neutral');

  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <Text style={typography.h2}>{title}</Text>
        {subtitle ? <Text style={[typography.muted, styles.subtitle]}>{subtitle}</Text> : null}
      </View>
      {connected !== undefined && (
        <View style={badge.container}>
          <Text style={badge.text}>{connected ? 'Conectado' : 'Não autorizado'}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  texts: { flex: 1 },
  subtitle: { marginTop: spacing.xs },
});
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

type Props = TextInputProps & { label: string; suffix?: string };

/** Campo de texto com rótulo, já no tema do app. */
export function FieldInput({ label, suffix, style, ...props }: Props) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={typography.small}>{label}</Text>
      <View style={[styles.box, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <TextInput
          placeholderTextColor={colors.border}
          autoCorrect={false}
          {...props}
          style={[styles.input, { color: colors.text }, style]}
        />
        {suffix ? <Text style={typography.small}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 0 },
});
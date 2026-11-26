import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  trailingIcon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
};

export function Chip({ label, selected, onPress, trailingIcon }: Props) {
  const { colors } = useTheme();
  const fg = selected ? colors.white : colors.text;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary : colors.surface,
        },
      ]}
    >
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
      {trailingIcon ? <MaterialCommunityIcons name={trailingIcon} size={14} color={fg} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  label: { fontSize: 13 },
});
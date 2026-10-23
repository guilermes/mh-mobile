import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { borderWidth, colors, fontFamily, fontSize, shadows, spacing } from '../constants/theme';

/** Tipo das props vem do próprio <Tabs> do Expo Router, para sempre bater com a versão instalada. */
type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type TabConfig = {
  label: string;
  icon: IconName;
  iconActive: IconName;
  highlight?: boolean;
};

const TAB_CONFIG: Record<string, TabConfig> = {
  index: { label: 'Home', icon: 'home-outline', iconActive: 'home' },
  anuncios: { label: 'Anúncios', icon: 'volume-high', iconActive: 'volume-high' },
  'simular-frete': {
    label: 'Simular frete',
    icon: 'truck-outline',
    iconActive: 'truck',
    highlight: true,
  },
  insights: { label: 'Insights', icon: 'lightbulb-on-outline', iconActive: 'lightbulb-on' },
  configuracoes: { label: 'Configurações', icon: 'cog-outline', iconActive: 'cog' },
};

export function BottomTabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG[route.name];
        if (!config) return null;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigateToTab(route.key);
          }
        };

        const onLongPress = () => {
          emitter.emit({ type: 'tabLongPress', target: route.key });
        };

        const common = {
          accessibilityRole: 'button' as const,
          accessibilityState: isFocused ? { selected: true } : {},
          accessibilityLabel: config.label,
          onPress,
          onLongPress,
        };

        /* Botão central em destaque (única ação "sólida" da barra) */
        if (config.highlight) {
          return (
            <View key={route.key} style={styles.item}>
              <Pressable
                {...common}
                style={({ pressed }) => [
                  styles.fab,
                  { backgroundColor: pressed ? colors.primaryHover : colors.primary },
                ]}
              >
                <MaterialCommunityIcons name={config.iconActive} size={28} color={colors.white} />
              </Pressable>
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  styles.fabLabel,
                  isFocused && { color: colors.primary, fontFamily: fontFamily.semibold },
                ]}
              >
                {config.label}
              </Text>
            </View>
          );
        }

        const color = isFocused ? colors.primary : colors.muted;

        return (
          <Pressable key={route.key} {...common} style={styles.item}>
            <MaterialCommunityIcons
              name={isFocused ? config.iconActive : config.icon}
              size={24}
              color={color}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                { color },
                isFocused && { fontFamily: fontFamily.semibold },
              ]}
            >
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const FAB_SIZE = 58;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderTopWidth: borderWidth.hairline,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    paddingTop: spacing.xs,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.label,
    lineHeight: 14,
    color: colors.muted,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -(FAB_SIZE / 2 + spacing.sm), // sobe acima da barra
    borderWidth: 4,
    borderColor: colors.surface, // anel branco separa da barra
    ...shadows.card,
  },
  fabLabel: {
    marginTop: 2,
  },
});
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, components, spacing, typography } from '../constants/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function Placeholder({ title, icon }: { title: string; icon: IconName }) {
  return (
    <SafeAreaView style={components.screen} edges={['top']}>
      <View style={styles.center}>
        <MaterialCommunityIcons name={icon} size={40} color={colors.muted} />
        <Text style={typography.h3}>{title}</Text>
        <Text style={typography.muted}>Em construção</Text>
      </View>
    </SafeAreaView>
  );
}

export const AnunciosScreen = () => <Placeholder title="Anúncios" icon="volume-high" />;
export const SimularFreteScreen = () => <Placeholder title="Simular frete" icon="truck-outline" />;
export const InsightsScreen = () => <Placeholder title="Insights" icon="lightbulb-on-outline" />;
export const ConfiguracoesScreen = () => <Placeholder title="Configurações" icon="cog-outline" />;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
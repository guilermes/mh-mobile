import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CepSection } from '@/components/settings/CepSection';
import { RegrasSection } from '@/components/settings/RegrasSection';
import { SyncSection } from '@/components/settings/SyncSection';
import { ScreenHeader } from '@/components/Screenheader';
import { spacing, Theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { useMe } from '@/hooks/useMe';
import { WEB_BASE_URL } from '@/lib/api';

export function SettingScreen() {
  const { colors, components, typography } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { signOut } = useAuth();
  const { data: me, isPending, isError, error, refetch } = useMe();

  const connected = me?.mercadoLivre.authenticated ?? false;

  /** A autorização do Mercado Livre acontece na versão web (rota /auth). */
  const handleConnectML = async () => {
    try {
      await Linking.openURL(`${WEB_BASE_URL}/auth`);
    } catch {
      Alert.alert('Não foi possível abrir o navegador', 'Acesse a versão web para conectar sua conta.');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sair da conta', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={components.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Configurações" subtitle="Conta e conexões" />

        {isPending ? (
          <View style={styles.state}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : isError ? (
          <View style={styles.state}>
            <Text style={[typography.small, { color: colors.danger }]}>
              {error instanceof Error ? error.message : 'Não foi possível carregar a conta.'}
            </Text>
            <Pressable
              onPress={() => refetch()}
              accessibilityRole="button"
              style={({ pressed }) => [
                components.buttonOutline,
                styles.button,
                pressed && components.buttonOutlinePressed,
              ]}
            >
              <Text style={components.buttonOutlineText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={[typography.h4, styles.sectionTitle]}>Conta</Text>
            <View style={[components.card, styles.card]}>
              <Text style={typography.label}>{me.user.storeName ?? 'Minha loja'}</Text>
              <Text style={typography.small}>{me.user.email}</Text>
              {me.user.whatsapp ? <Text style={typography.small}>{me.user.whatsapp}</Text> : null}
            </View>

            <Text style={[typography.h4, styles.sectionTitle]}>Mercado Livre</Text>
            <View style={[components.card, styles.card]}>
              <View style={styles.status}>
                <MaterialCommunityIcons
                  name={connected ? 'check-circle-outline' : 'alert-circle-outline'}
                  size={20}
                  color={connected ? colors.primary : colors.danger}
                />
                <Text style={typography.label}>{connected ? 'Conta conectada' : 'Conta não conectada'}</Text>
              </View>

              {!connected ? (
                <>
                  <Text style={typography.small}>
                    A autorização é feita no navegador. Ao concluir, volte para o app e o status
                    será atualizado.
                  </Text>
                  <Pressable
                    onPress={handleConnectML}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      components.buttonPrimary,
                      styles.button,
                      pressed && components.buttonPrimaryPressed,
                    ]}
                  >
                    <Text style={components.buttonPrimaryText}>Conectar Mercado Livre</Text>
                  </Pressable>
                </>
              ) : null}
            </View>

            <SyncSection />
            <CepSection />
            <RegrasSection />
          </>
        )}

        <Pressable
          onPress={handleSignOut}
          accessibilityRole="button"
          style={({ pressed }) => [
            components.buttonOutline,
            styles.button,
            styles.signOut,
            pressed && components.buttonOutlinePressed,
          ]}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.text} />
          <Text style={components.buttonOutlineText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (_t: Theme) =>
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
    sectionTitle: {
      marginTop: spacing.xl,
      marginBottom: spacing.md,
    },
    card: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    status: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    button: {
      minHeight: 48,
    },
    signOut: {
      marginTop: spacing.xxl,
    },
  });
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import { ScreenHeader } from '../components/Screenheader';
import { fontFamily, spacing, Theme } from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';

export function SettingsScreen() {
  const { colors, components, typography, isDark, toggleScheme } = useTheme();
  const { signOut } = useAuth();
  const styles = useThemedStyles(createStyles);

  const confirmSignOut = () => {
    Alert.alert('Sair da conta', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        // Ao limpar a sessão, o controle de login do _layout leva de volta ao login.
        onPress: () => {
          signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={components.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Configurações" subtitle="Preferências do aplicativo" />

        {/* Aparência */}
        <Text style={[typography.label, styles.sectionLabel]}>Aparência</Text>
        <View style={[components.card, styles.card]}>
          <View style={styles.row}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons
                name={isDark ? 'weather-night' : 'white-balance-sunny'}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle}>Tema escuro</Text>
              <Text style={typography.small}>
                {isDark ? 'Ativado' : 'Desativado'} · toque para alternar
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleScheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.border}
              accessibilityLabel="Alternar tema escuro"
            />
          </View>
        </View>

        {/* Conta */}
        <Text style={[typography.label, styles.sectionLabel]}>Conta</Text>
        <Pressable
          onPress={confirmSignOut}
          accessibilityRole="button"
          style={({ pressed }) => [
            components.buttonOutline,
            styles.signOut,
            pressed && components.buttonOutlinePressed,
          ]}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.danger} />
          <Text style={[components.buttonOutlineText, { color: colors.danger }]}>
            Sair da conta
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = ({ colors, radius }: Theme) =>
  StyleSheet.create({
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    sectionLabel: {
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    card: {
      padding: spacing.lg,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    rowTexts: {
      flex: 1,
      gap: 2,
    },
    rowTitle: {
      fontFamily: fontFamily.semibold,
      fontSize: 15,
      color: colors.text,
    },
    signOut: {
      minHeight: 48,
    },
  });
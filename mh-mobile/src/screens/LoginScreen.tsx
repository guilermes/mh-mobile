import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fontFamily, fontSize, spacing, Theme } from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';

type Props = {
  /** Deve lançar um Error com mensagem amigável se o login falhar. */
  onSubmit: (email: string, password: string) => Promise<void>;
};

type Field = 'email' | 'password';

export function LoginScreen({ onSubmit }: Props) {
  const { colors, components, typography } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<Field | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const handleSubmit = async () => {
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes('@')) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (!password) {
      setError('Informe sua senha.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onSubmit(trimmedEmail, password);
      // Em caso de sucesso a tela é desmontada pelo controle de login.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível entrar. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={components.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <MaterialCommunityIcons name="truck-outline" size={28} color={colors.primary} />
            <Text style={typography.h3}>Marketplace Helper</Text>
          </View>

          <Text style={typography.h1}>Entrar</Text>
          <Text style={[typography.muted, styles.subtitle]}>
            Acesse sua conta para continuar.
          </Text>

          <View style={styles.field}>
            <Text style={typography.label}>E-mail</Text>
            <TextInput
              style={[components.input, focused === 'email' && components.inputFocused]}
              placeholder="voce@email.com"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Text style={typography.label}>Senha</Text>
            <View>
              <TextInput
                ref={passwordRef}
                style={[
                  components.input,
                  styles.passwordInput,
                  focused === 'password' && components.inputFocused,
                ]}
                placeholder="Sua senha"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                secureTextEntry={!showPassword}
                textContentType="password"
                returnKeyType="done"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                onSubmitEditing={handleSubmit}
                editable={!loading}
              />
              <Pressable
                style={styles.eye}
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
            style={({ pressed }) => [
              components.buttonPrimary,
              styles.button,
              pressed && components.buttonPrimaryPressed,
              loading && styles.buttonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={components.buttonPrimaryText}>Entrar</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.xl,
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xxxl,
    },
    subtitle: {
      marginTop: spacing.xs,
      marginBottom: spacing.xl,
    },
    field: {
      gap: spacing.xs,
      marginBottom: spacing.lg,
    },
    passwordInput: {
      paddingRight: 44,
    },
    eye: {
      position: 'absolute',
      right: 12,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
    },
    error: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.small,
      color: colors.danger,
      marginBottom: spacing.md,
    },
    button: {
      minHeight: 44,
      marginTop: spacing.xs,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
  });
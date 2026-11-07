import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { FieldInput } from '@/components/settings/FieldInput';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useConfig, useSaveCep } from '@/hooks/useSettings';
import { formatCep, onlyDigits } from '@/utils/format';

/** CEP usado no cálculo de frete (GET/PUT /api/config e /api/config/cep). */
export function CepSection() {
  const { colors, components, typography } = useTheme();
  const { data, isPending, isError } = useConfig();
  const saveCep = useSaveCep();
  const [cep, setCep] = useState('');

  useEffect(() => {
    if (data) setCep(formatCep(data.zipCode));
  }, [data?.zipCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    const digits = onlyDigits(cep);
    if (digits.length !== 8) {
      Alert.alert('CEP inválido', 'Informe os 8 dígitos do CEP.');
      return;
    }
    try {
      await saveCep.mutateAsync(digits);
      Alert.alert('Pronto', 'CEP atualizado. Os valores de frete serão recalculados.');
    } catch (e) {
      Alert.alert('Não foi possível salvar', e instanceof Error ? e.message : 'Tente novamente.');
    }
  };

  const unchanged = data ? onlyDigits(cep) === onlyDigits(data.zipCode) : true;

  return (
    <>
      <Text style={[typography.h4, styles.title]}>CEP de cálculo do frete</Text>
      <View style={[components.card, styles.card]}>
        {isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : isError ? (
          <Text style={[typography.small, { color: colors.danger }]}>Não foi possível carregar o CEP.</Text>
        ) : (
          <>
            <FieldInput
              label="CEP"
              value={cep}
              onChangeText={(t) => setCep(formatCep(t))}
              keyboardType="number-pad"
              maxLength={9}
              placeholder="00000-000"
            />
            <Pressable
              onPress={save}
              disabled={saveCep.isPending || unchanged}
              accessibilityRole="button"
              style={({ pressed }) => [
                components.buttonPrimary,
                styles.button,
                pressed && components.buttonPrimaryPressed,
                (saveCep.isPending || unchanged) && { opacity: 0.6 },
              ]}
            >
              {saveCep.isPending ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={components.buttonPrimaryText}>Salvar CEP</Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.xl, marginBottom: spacing.md },
  card: { padding: spacing.md, gap: spacing.md },
  button: { minHeight: 48 },
});
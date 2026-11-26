import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { FieldInput } from '@/components/settings/FieldInput';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useRegras, useSaveRegras } from '@/hooks/useSettings';
import type { Regras } from '@/lib/api';
import { parseDecimal } from '@/utils/format';

const FIELDS: { key: keyof Regras; label: string }[] = [
  { key: 'icms', label: 'ICMS' },
  { key: 'ipi', label: 'IPI' },
  { key: 'difal', label: 'DIFAL' },
  { key: 'custoOperacional', label: 'Custo operacional' },
];

const toText = (n: number) => String(n).replace('.', ',');

/** Alíquotas e custos usados no cálculo de lucro (GET/PUT /api/regras). */
export function RegrasSection() {
  const { colors, components, typography } = useTheme();
  const { data, isPending, isError } = useRegras();
  const saveRegras = useSaveRegras();
  const [values, setValues] = useState<Record<keyof Regras, string>>({
    icms: '',
    ipi: '',
    difal: '',
    custoOperacional: '',
  });

  useEffect(() => {
    if (data) {
      setValues({
        icms: toText(data.icms),
        ipi: toText(data.ipi),
        difal: toText(data.difal),
        custoOperacional: toText(data.custoOperacional),
      });
    }
  }, [data]);

  const save = async () => {
    const parsed = Object.fromEntries(FIELDS.map(({ key }) => [key, parseDecimal(values[key])])) as Regras;
    if (Object.values(parsed).some((n) => !Number.isFinite(n) || n < 0)) {
      Alert.alert('Valores inválidos', 'Use números maiores ou iguais a zero.');
      return;
    }
    try {
      await saveRegras.mutateAsync(parsed);
      Alert.alert('Pronto', 'Regras salvas. Lucro e margem serão recalculados.');
    } catch (e) {
      Alert.alert('Não foi possível salvar', e instanceof Error ? e.message : 'Tente novamente.');
    }
  };

  return (
    <>
      <Text style={[typography.h4, styles.title]}>Regras de negócio</Text>
      <View style={[components.card, styles.card]}>
        {isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : isError ? (
          <Text style={[typography.small, { color: colors.danger }]}>Não foi possível carregar as regras.</Text>
        ) : (
          <>
            {FIELDS.map(({ key, label }) => (
              <FieldInput
                key={key}
                label={label}
                suffix="%" // ⚠️ confirme no Swagger se "custoOperacional" também é percentual
                value={values[key]}
                onChangeText={(t) => setValues((v) => ({ ...v, [key]: t }))}
                keyboardType="decimal-pad"
              />
            ))}
            <Pressable
              onPress={save}
              disabled={saveRegras.isPending}
              accessibilityRole="button"
              style={({ pressed }) => [
                components.buttonPrimary,
                styles.button,
                pressed && components.buttonPrimaryPressed,
                saveRegras.isPending && { opacity: 0.6 },
              ]}
            >
              {saveRegras.isPending ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={components.buttonPrimaryText}>Salvar regras</Text>
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
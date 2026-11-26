/**
 * theme.ts — Marketplace Helper
 * Tokens do design.md (claro) + paleta escura derivada.
 *
 * Tokens que não dependem de cor (spacing, radius, fontes) continuam exports
 * estáticos. Tudo que depende de cor sai de createTheme(scheme) e deve ser
 * lido com useTheme() (src/context/ThemeContext.tsx).
 */
import { Platform, TextStyle, ViewStyle } from 'react-native';

export type ColorScheme = 'light' | 'dark';

/* ------------------------------------------------------------------ */
/* Paletas                                                             */
/* ------------------------------------------------------------------ */
export const lightColors = {
  bg: '#f8fafc',
  surface: '#ffffff',
  text: '#0f1729',
  muted: '#65758b',
  border: '#e1e7ef',
  primary: '#1f2f56',
  primaryHover: '#182540',
  primarySoft: '#eef1f6',
  success: '#15803d',
  danger: '#dc2626',
  white: '#ffffff',
  transparent: 'transparent',
};

export type Colors = Record<keyof typeof lightColors, string>;

/** Paleta escura: o design.md não define uma, então estes valores são uma proposta. */
export const darkColors: Colors = {
  bg: '#0b1220',
  surface: '#111a2e',
  text: '#f1f5f9',
  muted: '#94a3b8',
  border: '#1f2a44',
  primary: '#5b78c4',
  primaryHover: '#4a65ab',
  primarySoft: '#1a2540',
  success: '#4ade80',
  danger: '#f87171',
  white: '#ffffff',
  transparent: 'transparent',
};

/* ------------------------------------------------------------------ */
/* Tokens estáticos (iguais nos dois temas)                            */
/* ------------------------------------------------------------------ */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  fallback: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
} as const;

export const fontSize = {
  label: 11,
  labelLg: 12,
  small: 13,
  body: 15,
  bodyLg: 16,
  h5: 16,
  h4: 18,
  h3: 20,
  h2: 24,
  h1: 30,
  kpi: 28,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  md: 12,
  sm: 10,
  pill: 999,
} as const;

export const borderWidth = {
  hairline: 1,
} as const;

/** Converte em (em) para px, já que o RN usa letterSpacing em pixels. */
const em = (value: number, size: number) => value * size;

/* ------------------------------------------------------------------ */
/* Tema dependente de cor                                              */
/* ------------------------------------------------------------------ */
export function createTheme(scheme: ColorScheme) {
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const softColors = {
    success: { text: colors.success, bg: isDark ? 'rgba(74,222,128,0.14)' : 'rgba(21,128,61,0.10)' },
    danger: { text: colors.danger, bg: isDark ? 'rgba(248,113,113,0.14)' : 'rgba(220,38,38,0.10)' },
    neutral: { text: colors.muted, bg: colors.primarySoft },
    primary: { text: colors.primary, bg: colors.primarySoft },
  } as const;

  const shadows = {
    none: { shadowOpacity: 0, elevation: 0 } as ViewStyle,
    card: {
      shadowColor: isDark ? '#000000' : '#0f1729',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.25 : 0.06,
      shadowRadius: 3,
      elevation: 1,
    } as ViewStyle,
  };

  const heading = (size: number): TextStyle => ({
    fontFamily: fontFamily.bold,
    fontSize: size,
    lineHeight: Math.round(size * 1.25),
    color: colors.text,
    letterSpacing: em(-0.01, size),
  });

  const typography = {
    h1: heading(fontSize.h1),
    h2: heading(fontSize.h2),
    h3: heading(fontSize.h3),
    h4: heading(fontSize.h4),
    h5: heading(fontSize.h5),
    body: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.body,
      lineHeight: 22,
      color: colors.text,
    } as TextStyle,
    bodyLg: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.bodyLg,
      lineHeight: 24,
      color: colors.text,
    } as TextStyle,
    muted: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.body,
      lineHeight: 22,
      color: colors.muted,
    } as TextStyle,
    small: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.small,
      lineHeight: 18,
      color: colors.muted,
    } as TextStyle,
    label: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.label,
      lineHeight: 16,
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: em(0.04, fontSize.label),
    } as TextStyle,
    kpiValue: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.kpi,
      lineHeight: 34,
      color: colors.primary,
      letterSpacing: em(-0.01, fontSize.kpi),
    } as TextStyle,
    button: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.body,
      lineHeight: 20,
    } as TextStyle,
    number: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.body,
      color: colors.text,
      textAlign: 'right',
      fontVariant: ['tabular-nums'],
    } as TextStyle,
  };

  const components = {
    screen: { flex: 1, backgroundColor: colors.bg } as ViewStyle,

    navbar: {
      backgroundColor: colors.surface,
      borderBottomWidth: borderWidth.hairline,
      borderBottomColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    } as ViewStyle,
    navLink: { ...typography.body, color: colors.muted } as TextStyle,
    navLinkActive: {
      ...typography.body,
      fontFamily: fontFamily.semibold,
      color: colors.primary,
    } as TextStyle,

    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: borderWidth.hairline,
      borderColor: colors.border,
      padding: spacing.xl,
      ...shadows.card,
    } as ViewStyle,

    buttonPrimary: {
      backgroundColor: colors.primary,
      borderRadius: radius.sm,
      paddingVertical: 8,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    } as ViewStyle,
    buttonPrimaryPressed: { backgroundColor: colors.primaryHover } as ViewStyle,
    buttonPrimaryText: { ...typography.button, color: colors.white } as TextStyle,

    buttonOutline: {
      backgroundColor: colors.transparent,
      borderRadius: radius.sm,
      borderWidth: borderWidth.hairline,
      borderColor: colors.border,
      paddingVertical: 8,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    } as ViewStyle,
    buttonOutlinePressed: { backgroundColor: colors.primarySoft } as ViewStyle,
    buttonOutlineText: { ...typography.button, color: colors.text } as TextStyle,

    input: {
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      borderWidth: borderWidth.hairline,
      borderColor: colors.border,
      paddingVertical: 10,
      paddingHorizontal: 12,
      fontFamily: fontFamily.regular,
      fontSize: fontSize.body,
      color: colors.text,
    } as TextStyle,
    inputFocused: {
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
    } as ViewStyle,

    badge: {
      alignSelf: 'flex-start',
      borderRadius: radius.pill,
      paddingVertical: 2,
      paddingHorizontal: 10,
    } as ViewStyle,
    badgeText: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.labelLg,
      lineHeight: 16,
    } as TextStyle,

    table: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: borderWidth.hairline,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.card,
    } as ViewStyle,
    tableHeader: {
      backgroundColor: colors.primarySoft,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: borderWidth.hairline,
      borderBottomColor: colors.border,
    } as ViewStyle,
    tableHeaderText: { ...typography.label } as TextStyle,
    tableHeaderSortActive: { color: colors.primary } as TextStyle,
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: borderWidth.hairline,
      borderBottomColor: colors.border,
    } as ViewStyle,
    tableRowPressed: { backgroundColor: colors.primarySoft } as ViewStyle,
  };

  type BadgeTone = keyof typeof softColors;

  /** Estilos de badge/pílula por tom: t.getBadgeStyle('success'). */
  const getBadgeStyle = (tone: BadgeTone = 'neutral') => ({
    container: [components.badge, { backgroundColor: softColors[tone].bg }] as ViewStyle[],
    text: [components.badgeText, { color: softColors[tone].text }] as TextStyle[],
  });

  /** Cor da variação de frete: sobe = danger, desce = success. */
  const getFreightDeltaColor = (delta: number) =>
    delta > 0 ? colors.danger : delta < 0 ? colors.success : colors.muted;

  return {
    scheme,
    isDark,
    colors,
    softColors,
    fontFamily,
    fontSize,
    typography,
    spacing,
    radius,
    borderWidth,
    shadows,
    components,
    getBadgeStyle,
    getFreightDeltaColor,
  };
}

export type Theme = ReturnType<typeof createTheme>;
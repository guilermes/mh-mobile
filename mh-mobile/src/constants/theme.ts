/**
 * theme.ts — Marketplace Helper
 * Tokens derivados do design.md (minimalista, navy, Inter).
 *
 * Fontes: instale `@expo-google-fonts/inter` (Expo) e carregue
 * Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold
 * com `useFonts`. Em RN, o peso é escolhido pelo nome da família.
 */
import { Platform, TextStyle, ViewStyle } from 'react-native';

/* ------------------------------------------------------------------ */
/* Cores                                                               */
/* ------------------------------------------------------------------ */
export const colors = {
  bg: '#f8fafc', // --mh-bg: fundo da página
  surface: '#ffffff', // --mh-surface: cards, navbar, tabela, modais
  text: '#0f1729', // --mh-text: texto principal e títulos
  muted: '#65758b', // --mh-muted: texto secundário, labels, ícones
  border: '#e1e7ef', // --mh-border: bordas e divisórias
  primary: '#1f2f56', // --mh-primary: ação principal, logo, destaques
  primaryHover: '#182540', // --mh-primary-hover (use como cor de "pressed")
  primarySoft: '#eef1f6', // --mh-primary-soft: pílulas neutras, hover de linha
  success: '#15803d', // --mh-success: frete caiu, sucesso
  danger: '#dc2626', // --mh-danger: frete subiu, erro, "Custo ML"
  white: '#ffffff',
  transparent: 'transparent',
} as const;

/** Fundos suaves para badges (cor do texto + fundo claro). */
export const softColors = {
  success: { text: colors.success, bg: 'rgba(21,128,61,0.10)' },
  danger: { text: colors.danger, bg: 'rgba(220,38,38,0.10)' },
  neutral: { text: colors.muted, bg: colors.primarySoft },
  primary: { text: colors.primary, bg: colors.primarySoft },
} as const;

/* ------------------------------------------------------------------ */
/* Tipografia                                                          */
/* ------------------------------------------------------------------ */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  /** Fallback caso a fonte ainda não tenha carregado. */
  fallback: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
} as const;

/** Converte em (em) para px, já que o RN usa letterSpacing em pixels. */
const em = (value: number, fontSize: number) => value * fontSize;

export const fontSize = {
  label: 11, // labels de KPI / cabeçalho de tabela (11–12)
  labelLg: 12,
  small: 13,
  body: 15, // corpo (15–16)
  bodyLg: 16,
  h5: 16,
  h4: 18,
  h3: 20,
  h2: 24,
  h1: 30,
  kpi: 28, // valor grande do KPI
} as const;

const heading = (size: number): TextStyle => ({
  fontFamily: fontFamily.bold, // peso 700
  fontSize: size,
  lineHeight: Math.round(size * 1.25),
  color: colors.text,
  letterSpacing: em(-0.01, size),
});

export const typography = {
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

  /** Labels de KPI e cabeçalho de tabela: pequeno, maiúsculo, espaçado. */
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.label,
    lineHeight: 16,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: em(0.04, fontSize.label),
  } as TextStyle,

  /** Valor grande de KPI. */
  kpiValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.kpi,
    lineHeight: 34,
    color: colors.primary,
    letterSpacing: em(-0.01, fontSize.kpi),
  } as TextStyle,

  button: {
    fontFamily: fontFamily.semibold, // peso 600
    fontSize: fontSize.body,
    lineHeight: 20,
  } as TextStyle,

  /** Números de tabela: alinhados à direita, algarismos tabulares. */
  number: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    color: colors.text,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  } as TextStyle,
} as const;

/* ------------------------------------------------------------------ */
/* Espaçamento e forma                                                 */
/* ------------------------------------------------------------------ */
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
  md: 12, // --mh-radius: cards, tabela, modais
  sm: 10, // --mh-radius-sm: botões, inputs, badges
  pill: 999,
} as const;

export const borderWidth = {
  hairline: 1, // 1px --mh-border
} as const;

/* ------------------------------------------------------------------ */
/* Sombras: 0 1px 3px rgba(15,23,41,.06), 0 1px 2px rgba(15,23,41,.04) */
/* RN aceita uma única sombra; combinamos as duas de forma sutil.      */
/* ------------------------------------------------------------------ */
export const shadows = {
  none: {
    shadowOpacity: 0,
    elevation: 0,
  } as ViewStyle,
  card: {
    shadowColor: '#0f1729',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1, // Android: manter sempre baixo
  } as ViewStyle,
} as const;

/* ------------------------------------------------------------------ */
/* Presets de componentes                                              */
/* ------------------------------------------------------------------ */
export const components = {
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  } as ViewStyle,

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
  navLink: {
    ...typography.body,
    color: colors.muted,
  } as TextStyle,
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

  /** Botão primário: sólido, sem sombra. Só a ação principal é sólida. */
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
  buttonPrimaryPressed: {
    backgroundColor: colors.primaryHover,
  } as ViewStyle,
  buttonPrimaryText: {
    ...typography.button,
    color: colors.white,
  } as TextStyle,

  /** Botão secundário / outline. */
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
  buttonOutlinePressed: {
    backgroundColor: colors.primarySoft,
  } as ViewStyle,
  buttonOutlineText: {
    ...typography.button,
    color: colors.text,
  } as TextStyle,

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
  /** Anel de foco navy discreto (aplique junto com `input`). */
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

  /** Tabela: cabeçalho claro (nunca escuro), divisórias finas. */
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
  tableHeaderText: {
    ...typography.label,
  } as TextStyle,
  tableHeaderSortActive: {
    color: colors.primary,
  } as TextStyle,
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg, // bastante respiro vertical
    paddingHorizontal: spacing.lg,
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: colors.border,
  } as ViewStyle,
  tableRowPressed: {
    backgroundColor: colors.primarySoft,
  } as ViewStyle,
} as const;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
export type BadgeTone = keyof typeof softColors;

/** Estilos de badge/pílula por tom: `getBadgeStyle('success')`. */
export const getBadgeStyle = (tone: BadgeTone = 'neutral') => ({
  container: [components.badge, { backgroundColor: softColors[tone].bg }] as ViewStyle[],
  text: [components.badgeText, { color: softColors[tone].text }] as TextStyle[],
});

/** Cor da variação de frete: sobe = danger, desce = success. */
export const getFreightDeltaColor = (delta: number) =>
  delta > 0 ? colors.danger : delta < 0 ? colors.success : colors.muted;

/* ------------------------------------------------------------------ */
/* Tema agregado                                                       */
/* ------------------------------------------------------------------ */
export const theme = {
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
} as const;

export type Theme = typeof theme;
export default theme;
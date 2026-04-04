type ColorPalette = Record<
  | "coral" | "gold" | "dark" | "bg"
  | "bgCard" | "bgInput"
  | "textPrimary" | "textSecondary" | "textTertiary"
  | "divider" | "borderLight"
  | "success" | "successBright" | "error" | "danger" | "warning" | "info"
  | "coralLight" | "coralPressed" | "successLight" | "successBg" | "pistachio" | "grayLight",
  string
>;

export const C = {
  // Primary — Reslot brand palette
  coral: "#7EC87A",  // pistachio
  pistachio: "#7EC87A",
  grayLight: "#9CA3AF",
  gold: "#C9A96E",
  dark: "#111827",
  bg: "#FAFAF8",

  // Surfaces
  bgCard: "#FFFFFF",
  bgInput: "#F0F0EE",

  // Text
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#737B89",

  // Borders
  divider: "rgba(0,0,0,0.07)",
  borderLight: "rgba(0,0,0,0.06)",

  // Status
  success: "#8B9E7E",
  successBright: "#22C55E",
  error: "#EF4444",
  danger: "#DC2626",
  warning: "#F59E0B",
  info: "#3B82F6",

  // Pressed/interaction variants
  coralLight: "rgba(126,200,122,0.15)",
  coralPressed: "rgba(126,200,122,0.25)",
  successLight: "rgba(139,158,126,0.10)",
  successBg: "rgba(139,158,126,0.08)",
} as const;

/**
 * DARK MODE — inverted/dark variants of all color tokens.
 * Usage: import { DARK_COLORS } from '@/lib/theme' or use getTheme('dark').
 * No existing components are changed — this is infrastructure only.
 */
export const DARK_COLORS: ColorPalette = {
  coral: "#7EC87A",
  pistachio: "#7EC87A",
  grayLight: "#9CA3AF",
  gold: "#D4B87E",
  dark: "#FAFAFA",
  bg: "#1A1A1A",

  bgCard: "#2A2A2A",
  bgInput: "#333333",

  textPrimary: "#FAFAFA",
  textSecondary: "#9CA3AF",
  textTertiary: "#6B7280",

  divider: "rgba(255,255,255,0.10)",
  borderLight: "rgba(255,255,255,0.08)",

  success: "#9DAF90",
  successBright: "#22C55E",
  error: "#F87171",
  danger: "#EF4444",
  warning: "#FBBF24",
  info: "#60A5FA",

  coralLight: "rgba(126,200,122,0.15)",
  coralPressed: "rgba(126,200,122,0.20)",
  successLight: "rgba(157,175,144,0.15)",
  successBg: "rgba(157,175,144,0.10)",
};

/**
 * Returns the correct color set for the given mode.
 * Components can call `getTheme('dark')` to get DARK_COLORS,
 * or `getTheme('light')` to get the default C colors.
 */
export function getTheme(mode: "light" | "dark"): ColorPalette {
  return mode === "dark" ? DARK_COLORS : C;
}

export const FONTS = {
  // Display — Plus Jakarta Sans (all headings)
  displayBold: "PlusJakartaSans_700Bold",
  displaySemiBold: "PlusJakartaSans_600SemiBold",
  // Body/UI — Plus Jakarta Sans
  bold: "PlusJakartaSans_700Bold",
  semiBold: "PlusJakartaSans_600SemiBold",
  medium: "PlusJakartaSans_500Medium",
  regular: "PlusJakartaSans_400Regular",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 28,
} as const;

export const SHADOW = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

/** Typography presets — use these for consistent hierarchy */
export const TYPO = {
  display: {
    fontFamily: FONTS.displayBold,
    fontSize: 30,
    letterSpacing: -0.8,
    color: C.textPrimary,
  },
  h1: {
    fontFamily: FONTS.displayBold,
    fontSize: 24,
    letterSpacing: -0.5,
    color: C.textPrimary,
  },
  h2: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    letterSpacing: -0.3,
    color: C.textPrimary,
  },
  h3: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 16,
    letterSpacing: -0.2,
    color: C.textPrimary,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    lineHeight: 22,
    color: C.textSecondary,
  },
  bodyMedium: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
    color: C.textSecondary,
  },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    letterSpacing: 0.2,
    color: C.textSecondary,
  },
  caption: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
    color: C.textTertiary,
  },
  cta: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: "#111827",
  },
} as const;

export const ICON = {
  strokeWidth: 2,
  size: {
    sm: 16,
    md: 20,
    lg: 24,
  },
} as const;

type ColorPalette = Record<
  | "pistachio" | "pistachioLight" | "pistachioPressed"
  | "gold" | "dark" | "bg"
  | "bgCard" | "bgInput"
  | "textPrimary" | "textSecondary" | "textTertiary"
  | "divider" | "borderLight"
  | "success" | "successBright" | "error" | "danger" | "warning" | "info"
  | "successLight" | "successBg" | "grayLight"
  | "white" | "goldLight" | "goldBorder" | "goldPressed"
  | "errorBg" | "errorBorder" | "errorLight"
  | "infoBg" | "infoBorder" | "infoLight"
  | "overlayDark" | "overlayLight" | "overlayMedium"
  | "cream" | "creamSoft" | "creamDeep"
  | "forest" | "forestDeep" | "forestSoft" | "ringForest"
  | "ink" | "inkSoft" | "inkFaint"
  | "coral" | "coralSoft"
  | "pastelYellow" | "pastelBlue" | "pastelGreen" | "pastelPeach",
  string
>;

export const C = {
  // ─── Identity v2 — extra färg-tokens (additivt, behåller alla legacy nedan) ───
  cream: "#F7F6F2",         // BG (paper neutral 2026-05-09 v2: tidigare F8F5EE för subtil)
  creamSoft: "#FBFAF6",     // Lighter, bara minimal warmth
  creamDeep: "#EAE7DE",     // Inputs, sunken surfaces (matchar paper-neutral)
  forest: "#1F4D2A",        // Dark green — primary accent (icons, links, CTAs)
  forestDeep: "#143620",    // Pressed states
  forestSoft: "rgba(31,77,42,0.10)",
  ringForest: "rgba(31,77,42,0.18)",
  ink: "#1A1A1A",           // Warmer body text
  inkSoft: "#6B6B6B",
  inkFaint: "#9B9B9B",
  coral: "#D97757",         // Reserverad delight-token (success/welcome — ej i bruk än)
  coralSoft: "rgba(217,119,87,0.12)",
  pastelYellow: "#FBF3D5",
  pastelBlue: "#D8E5F2",
  pastelGreen: "#D8E8D5",
  pastelPeach: "#F5E0CC",

  // ─── Legacy palette (oförändrad) ───
  pistachio: "#7EC87A",
  grayLight: "#9CA3AF",
  gold: "#C9A96E",
  dark: "#111827",
  bg: "#F7F6F2",

  // Surfaces
  bgCard: "#FFFFFF",
  bgInput: "#EAE7DE",

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
  pistachioLight: "rgba(126,200,122,0.15)",
  pistachioPressed: "rgba(126,200,122,0.25)",
  successLight: "rgba(139,158,126,0.10)",
  successBg: "rgba(139,158,126,0.08)",

  // White (for text on dark backgrounds)
  white: "#FFFFFF",

  // Gold variants
  goldLight: "rgba(201,169,110,0.10)",
  goldBorder: "rgba(201,169,110,0.12)",
  goldPressed: "rgba(201,169,110,0.40)",

  // Error variants
  errorBg: "rgba(239,68,68,0.06)",
  errorBorder: "rgba(239,68,68,0.12)",
  errorLight: "rgba(239,68,68,0.08)",

  // Info variants
  infoBg: "rgba(59,130,246,0.04)",
  infoBorder: "rgba(59,130,246,0.10)",
  infoLight: "rgba(59,130,246,0.10)",

  // Overlays
  overlayDark: "rgba(0,0,0,0.55)",
  overlayLight: "rgba(0,0,0,0.04)",
  overlayMedium: "rgba(0,0,0,0.06)",
} as const;

/**
 * DARK MODE — inverted/dark variants of all color tokens.
 * Usage: import { DARK_COLORS } from '@/lib/theme' or use getTheme('dark').
 * No existing components are changed — this is infrastructure only.
 */
export const DARK_COLORS: ColorPalette = {
  // Identity v2 dark counterparts (infrastructure only — ej använt)
  cream: "#1A1A1A",
  creamSoft: "#222222",
  creamDeep: "#2A2A2A",
  forest: "#9CD0A2",
  forestDeep: "#7BB081",
  forestSoft: "rgba(156,208,162,0.14)",
  ringForest: "rgba(156,208,162,0.22)",
  ink: "#FAFAFA",
  inkSoft: "#C8C8C8",
  inkFaint: "#8A8A8A",
  coral: "#E89070",
  coralSoft: "rgba(232,144,112,0.18)",
  pastelYellow: "rgba(251,243,213,0.18)",
  pastelBlue: "rgba(216,229,242,0.18)",
  pastelGreen: "rgba(216,232,213,0.18)",
  pastelPeach: "rgba(245,224,204,0.18)",

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

  pistachioLight: "rgba(126,200,122,0.15)",
  pistachioPressed: "rgba(126,200,122,0.20)",
  successLight: "rgba(157,175,144,0.15)",
  successBg: "rgba(157,175,144,0.10)",

  white: "#FFFFFF",
  goldLight: "rgba(212,184,126,0.15)",
  goldBorder: "rgba(212,184,126,0.20)",
  goldPressed: "rgba(212,184,126,0.40)",
  errorBg: "rgba(248,113,113,0.10)",
  errorBorder: "rgba(248,113,113,0.15)",
  errorLight: "rgba(248,113,113,0.12)",
  infoBg: "rgba(96,165,250,0.08)",
  infoBorder: "rgba(96,165,250,0.12)",
  infoLight: "rgba(96,165,250,0.12)",
  overlayDark: "rgba(0,0,0,0.70)",
  overlayLight: "rgba(255,255,255,0.06)",
  overlayMedium: "rgba(255,255,255,0.10)",
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
  xxs: 2,
  xss: 3,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  lg2: 24,
  xl: 28,
  xl2: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 28,
  pill: 999,
} as const;

export const SHADOW = {
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  raised: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  floating: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12,
  },
  pressed: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
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
    color: C.dark,
  },
  displayXL: {
    fontFamily: FONTS.displayBold,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.2,
    color: C.textPrimary,
  },
  eyebrow: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
    color: C.textTertiary,
  },
  numeric: {
    fontFamily: FONTS.bold,
    fontVariant: ["tabular-nums"] as const,
    color: C.textPrimary,
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

/** Motion / animation tokens — Reanimated + native Animated samklang */
export const MOTION = {
  duration: {
    instant: 100,
    fast: 180,
    ease: 250,
    slow: 400,
    hero: 500,
  },
  easing: {
    standard: [0.2, 0.0, 0.0, 1.0] as const,
    decelerate: [0.0, 0.0, 0.2, 1.0] as const,
    accelerate: [0.4, 0.0, 1.0, 1.0] as const,
    spring: {
      damping: 18,
      stiffness: 220,
      mass: 1,
    },
    springSoft: {
      damping: 22,
      stiffness: 160,
      mass: 1,
    },
    springBouncy: {
      damping: 12,
      stiffness: 280,
      mass: 1,
    },
  },
} as const;

/** Image aspect ratios — använd för konsekvent bild-presentation */
export const IMG = {
  hero: 3 / 4,
  list: 4 / 5,
  thumb: 1,
  banner: 16 / 9,
  square: 1,
} as const;

/** Semantic wrappers — ger meningsbärande namn ovanpå primitiva tokens */
export const SEMANTIC = {
  brand: C.pistachio,
  surface: C.bg,
  surfaceRaised: C.bgCard,
  surfaceInput: C.bgInput,
  onBrand: C.dark,
  onSurface: C.textPrimary,
  onSurfaceMuted: C.textSecondary,
  onSurfaceFaint: C.textTertiary,
} as const;

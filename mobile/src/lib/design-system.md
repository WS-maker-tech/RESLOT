# Reslot Design System

Single source of truth: `mobile/src/lib/theme.ts`

---

## Colors

### Brand
| Token | Value | Usage |
|-------|-------|-------|
| `C.coral` / `C.pistachio` | #7EC87A | Primary brand color (pistachio green) |
| `C.gold` | #C9A96E | Accent/premium |
| `C.dark` | #111827 | Primary dark |
| `C.bg` | #FAFAF8 | App background |

### Surfaces
| Token | Value | Usage |
|-------|-------|-------|
| `C.bgCard` | #FFFFFF | Card backgrounds |
| `C.bgInput` | #F0F0EE | Input field backgrounds |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| `C.textPrimary` | #111827 | Headings, primary text |
| `C.textSecondary` | #6B7280 | Body text, descriptions |
| `C.textTertiary` | #737B89 | Captions, hints |
| `C.white` | #FFFFFF | Text on dark/colored backgrounds |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `C.divider` | rgba(0,0,0,0.07) | Section dividers |
| `C.borderLight` | rgba(0,0,0,0.06) | Subtle borders |

### Status
| Token | Value | Usage |
|-------|-------|-------|
| `C.success` | #8B9E7E | Muted success |
| `C.successBright` | #22C55E | Bright success indicators |
| `C.error` | #EF4444 | Error states |
| `C.danger` | #DC2626 | Destructive actions |
| `C.warning` | #F59E0B | Warnings |
| `C.info` | #3B82F6 | Informational |

### Interaction Variants
| Token | Value | Usage |
|-------|-------|-------|
| `C.coralLight` | rgba(126,200,122,0.15) | Coral/pistachio hover bg |
| `C.coralPressed` | rgba(126,200,122,0.25) | Coral/pistachio pressed bg |
| `C.successLight` | rgba(139,158,126,0.10) | Success tinted bg |
| `C.successBg` | rgba(139,158,126,0.08) | Subtle success bg |
| `C.goldLight` | rgba(201,169,110,0.10) | Gold tinted bg |
| `C.goldBorder` | rgba(201,169,110,0.12) | Gold border |
| `C.goldPressed` | rgba(201,169,110,0.40) | Gold pressed/active |
| `C.errorBg` | rgba(239,68,68,0.06) | Error background |
| `C.errorBorder` | rgba(239,68,68,0.12) | Error border |
| `C.errorLight` | rgba(239,68,68,0.08) | Light error bg |
| `C.infoBg` | rgba(59,130,246,0.04) | Info background |
| `C.infoBorder` | rgba(59,130,246,0.10) | Info border |
| `C.infoLight` | rgba(59,130,246,0.10) | Light info bg |

### Overlays
| Token | Value | Usage |
|-------|-------|-------|
| `C.overlayDark` | rgba(0,0,0,0.55) | Dark overlay on images |
| `C.overlayLight` | rgba(0,0,0,0.04) | Subtle bg tint |
| `C.overlayMedium` | rgba(0,0,0,0.06) | Medium bg tint |

---

## Typography

Font family: **Plus Jakarta Sans** (all weights)

### Presets (TYPO)
| Preset | Family | Size | Weight | Tracking | Usage |
|--------|--------|------|--------|----------|-------|
| `TYPO.display` | Bold | 30 | 700 | -0.8 | Hero headings |
| `TYPO.h1` | Bold | 24 | 700 | -0.5 | Section headings |
| `TYPO.h2` | Bold | 18 | 700 | -0.3 | Card titles |
| `TYPO.h3` | SemiBold | 16 | 600 | -0.2 | Subsection headings |
| `TYPO.body` | Regular | 15 | 400 | — | Body text (lineHeight: 22) |
| `TYPO.bodyMedium` | Medium | 14 | 500 | — | UI labels (lineHeight: 20) |
| `TYPO.label` | SemiBold | 13 | 600 | 0.2 | Form labels |
| `TYPO.caption` | Medium | 12 | 500 | 0.8 | Uppercase captions |
| `TYPO.cta` | Bold | 16 | 700 | — | CTA button text |

### Font Tokens (FONTS)
| Token | Value |
|-------|-------|
| `FONTS.displayBold` | PlusJakartaSans_700Bold |
| `FONTS.displaySemiBold` | PlusJakartaSans_600SemiBold |
| `FONTS.bold` | PlusJakartaSans_700Bold |
| `FONTS.semiBold` | PlusJakartaSans_600SemiBold |
| `FONTS.medium` | PlusJakartaSans_500Medium |
| `FONTS.regular` | PlusJakartaSans_400Regular |

---

## Spacing

| Token | Value |
|-------|-------|
| `SPACING.xs` | 4 |
| `SPACING.sm` | 8 |
| `SPACING.md` | 16 |
| `SPACING.lg` | 20 |
| `SPACING.xl` | 28 |
| `SPACING.xxl` | 48 |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `RADIUS.sm` | 8 | Small elements, tags |
| `RADIUS.md` | 12 | Buttons, inputs |
| `RADIUS.lg` | 16 | Cards |
| `RADIUS.xl` | 20 | Large cards, modals |
| `RADIUS.full` | 28 | Pills, avatars |

---

## Shadows

| Token | Color | Offset | Opacity | Radius | Elevation | Usage |
|-------|-------|--------|---------|--------|-----------|-------|
| `SHADOW.card` | #000 | 0,2 | 0.05 | 10 | 2 | Cards, list items |
| `SHADOW.elevated` | #000 | 0,6 | 0.12 | 16 | 6 | Floating elements, modals |

---

## Icons (ICON)

| Token | Value |
|-------|-------|
| `ICON.strokeWidth` | 2 |
| `ICON.size.sm` | 16 |
| `ICON.size.md` | 20 |
| `ICON.size.lg` | 24 |

Icon library: `lucide-react-native`

---

## Component Patterns

### Cards
- Background: `C.bgCard`
- Border radius: `RADIUS.lg` (16)
- Shadow: `SHADOW.card`
- Padding: `SPACING.md` (16)

### Buttons (Primary)
- Background: `C.coral` / `C.pistachio`
- Text: `C.dark` (dark on green)
- Border radius: `RADIUS.md` (12)
- Typography: `TYPO.cta`
- Pressed: `C.coralPressed`

### Badges / Tags
- Background: token variant (e.g. `C.coralLight`, `C.goldLight`)
- Text: matching full color
- Border radius: `RADIUS.sm` (8)
- Typography: `TYPO.label` or `TYPO.caption`

### Input Fields
- Background: `C.bgInput`
- Border radius: `RADIUS.md` (12)
- Text: `C.textPrimary`
- Placeholder: `C.textTertiary`

### Status Indicators
- Success: `C.successBg` bg + `C.success` text
- Error: `C.errorBg` bg + `C.error` text
- Info: `C.infoBg` bg + `C.info` text
- Warning: `C.warning` text

### Dark Mode
Use `getTheme('dark')` to get `DARK_COLORS` palette. All tokens have dark mode equivalents.

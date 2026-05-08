import React from "react";
import { Text, type TextProps, type TextStyle, type StyleProp } from "react-native";
import { TYPO, C } from "@/lib/theme";

/**
 * Heading — Editorial DNA-bärare för Reslot Identity v2.
 *
 * Renders Fraunces serif headings with optional italic emphasis on specific words
 * (Pi-style: italic markerar verb/action, sparingly — max 1 italic-fras per viewport).
 *
 * Inline `*word*`-syntax i `children` parsas till italic-spans, vilket gör microcopy
 * trivial att redigera utan att hantera arrays av strings.
 *
 * @example
 *   <Heading variant="h1">*Hitta* ditt nästa bord</Heading>
 *   <Heading variant="display" tone="forest">Reslot</Heading>
 *   <Heading variant="eyebrow">Tillgängligt nu</Heading>
 */

export type HeadingVariant = "display" | "h1" | "h2" | "h3" | "eyebrow";
export type HeadingTone = "forest" | "ink" | "inkSoft" | "cream" | "coral";

interface HeadingProps extends Omit<TextProps, "style" | "children"> {
  children: string;
  variant?: HeadingVariant;
  italic?: boolean;
  tone?: HeadingTone;
  align?: "left" | "center" | "right";
  style?: StyleProp<TextStyle>;
}

const PRESET_BY_VARIANT: Record<HeadingVariant, { normal: keyof typeof TYPO; italic: keyof typeof TYPO }> = {
  display: { normal: "serifDisplay", italic: "serifDisplayItalic" },
  h1: { normal: "serifH1", italic: "serifH1Italic" },
  h2: { normal: "serifH2", italic: "serifH2Italic" },
  h3: { normal: "serifH3", italic: "serifH3" },
  eyebrow: { normal: "serifEyebrow", italic: "serifEyebrow" },
};

const ITALIC_FONT_BY_VARIANT: Record<HeadingVariant, string> = {
  display: "Fraunces_700Bold_Italic",
  h1: "Fraunces_700Bold_Italic",
  h2: "Fraunces_600SemiBold_Italic",
  h3: "Fraunces_600SemiBold_Italic",
  eyebrow: "Fraunces_400Regular_Italic",
};

const TONE_COLOR: Record<HeadingTone, string> = {
  forest: C.forest,
  ink: C.ink,
  inkSoft: C.inkSoft,
  cream: C.cream,
  coral: C.coral,
};

type Segment = { text: string; italic: boolean };

function parseEmphasis(text: string): Segment[] {
  const out: Segment[] = [];
  const re = /\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), italic: false });
    out.push({ text: m[1], italic: true });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ text: text.slice(last), italic: false });
  if (out.length === 0) out.push({ text, italic: false });
  return out;
}

export function Heading({
  children,
  variant = "h1",
  italic = false,
  tone = "ink",
  align = "left",
  style,
  testID,
  ...rest
}: HeadingProps) {
  const preset = PRESET_BY_VARIANT[variant];
  const baseStyle = TYPO[italic ? preset.italic : preset.normal] as TextStyle;
  const color = TONE_COLOR[tone];
  const italicFontFamily = ITALIC_FONT_BY_VARIANT[variant];
  const composed: StyleProp<TextStyle> = [baseStyle, { color, textAlign: align }, style];

  const segments = parseEmphasis(children);
  if (segments.length === 1 && !segments[0]!.italic) {
    return <Text style={composed} testID={testID ?? `heading-${variant}`} {...rest}>{children}</Text>;
  }

  return (
    <Text style={composed} testID={testID ?? `heading-${variant}`} {...rest}>
      {segments.map((seg, i) =>
        seg.italic ? (
          <Text
            key={i}
            style={{ fontFamily: italicFontFamily, fontStyle: "italic" as const }}
          >
            {seg.text}
          </Text>
        ) : (
          seg.text
        )
      )}
    </Text>
  );
}

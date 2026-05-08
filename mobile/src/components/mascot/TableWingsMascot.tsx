import React from "react";
import Svg, { Path, Circle, G } from "react-native-svg";
import { C } from "@/lib/theme";

/**
 * TableWingsMascot — Reslots signature-illustration.
 *
 * Ett bord med utbredda vingar — "drömbordet som lyfter mot dig".
 * Cartoony-stilad enligt William's beslut: enkla former, lite playful, intentionellt
 * inte hyper-realistic.
 *
 * Sparingly: max 3 skärmar app-wide enligt identity-plan section 14.4.
 *  - Welcome / onboarding moment
 *  - Empty state på alerts ("inget vaktat än")
 *  - Booking-confirmation success-state
 *
 * Tone-default `forest` (single-color brand), `coral` reserverad för success-celebration.
 */

export type MascotTone = "forest" | "cream" | "coral" | "ink";

interface TableWingsMascotProps {
  size?: number;
  tone?: MascotTone;
  testID?: string;
}

const TONE_COLOR: Record<MascotTone, string> = {
  forest: C.forest,
  cream: C.cream,
  coral: C.coral,
  ink: C.ink,
};

export function TableWingsMascot({ size = 120, tone = "forest", testID }: TableWingsMascotProps) {
  const color = TONE_COLOR[tone];
  // Working space: 200×140, scale via size
  return (
    <Svg width={size} height={size * (140 / 200)} viewBox="0 0 200 140" testID={testID ?? "mascot-table-wings"}>
      <G fill={color}>
        {/* Left wing — three stylized feathers */}
        <Path
          d="M100 62
             C 78 50, 50 42, 22 50
             C 42 60, 64 64, 100 70 Z"
          opacity={0.92}
        />
        <Path
          d="M100 68
             C 76 60, 50 58, 28 68
             C 50 76, 76 78, 100 76 Z"
          opacity={0.78}
        />
        <Path
          d="M100 74
             C 78 72, 56 76, 38 86
             C 60 88, 80 84, 100 80 Z"
          opacity={0.62}
        />

        {/* Right wing — mirror */}
        <Path
          d="M100 62
             C 122 50, 150 42, 178 50
             C 158 60, 136 64, 100 70 Z"
          opacity={0.92}
        />
        <Path
          d="M100 68
             C 124 60, 150 58, 172 68
             C 150 76, 124 78, 100 76 Z"
          opacity={0.78}
        />
        <Path
          d="M100 74
             C 122 72, 144 76, 162 86
             C 140 88, 120 84, 100 80 Z"
          opacity={0.62}
        />

        {/* Tabletop — rounded rectangle */}
        <Path
          d="M70 66
             L130 66
             Q134 66, 134 70
             L134 74
             Q134 78, 130 78
             L70 78
             Q66 78, 66 74
             L66 70
             Q66 66, 70 66 Z"
        />

        {/* Plate (small dot on table — playful detail) */}
        <Circle cx={100} cy={72} r={2.4} fill={C.cream} />

        {/* Legs — slightly splayed for cartoony feel */}
        <Path d="M76 78 L72 108 L78 108 L82 78 Z" />
        <Path d="M124 78 L122 108 L128 108 L130 78 Z" />

        {/* Tiny stars/sparkles — magic */}
        <Path d="M28 28 l 1.6 -3 l 1.6 3 l 3 1.6 l -3 1.6 l -1.6 3 l -1.6 -3 l -3 -1.6 z" opacity={0.7} />
        <Path d="M170 24 l 1.4 -2.6 l 1.4 2.6 l 2.6 1.4 l -2.6 1.4 l -1.4 2.6 l -1.4 -2.6 l -2.6 -1.4 z" opacity={0.7} />
        <Path d="M158 110 l 1.2 -2.2 l 1.2 2.2 l 2.2 1.2 l -2.2 1.2 l -1.2 2.2 l -1.2 -2.2 l -2.2 -1.2 z" opacity={0.5} />
      </G>
    </Svg>
  );
}

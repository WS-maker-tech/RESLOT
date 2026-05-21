import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { SCRIBBLES, ScribbleName } from './scribbles';
import { COLORS } from './tokens';

type Props = {
  /** which scribble to render */
  name: ScribbleName;
  /** any palette colour — the black asset is tinted at runtime. Default: ink. */
  color?: string;
  /** rendered width in px; height is derived from the asset's aspect ratio */
  width?: number;
  style?: StyleProp<ImageStyle>;
};

/**
 * Scribble — a hand-drawn Reslot scribble.
 * Bundled transparent PNG, recoloured via tintColor.
 */
export function Scribble({ name, color = COLORS.ink, width = 120, style }: Props) {
  const { src, w, h } = SCRIBBLES[name];
  return (
    <Image
      source={src}
      resizeMode="contain"
      style={[{ width, height: width * (h / w), tintColor: color }, style]}
    />
  );
}

import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { DOODLES, DoodleName } from './doodles';
import { COLORS } from './tokens';

type Props = {
  /** which doodle to render */
  name: DoodleName;
  /** any palette colour — the black asset is tinted at runtime. Default: ink. */
  color?: string;
  /** rendered width in px; height is derived from the asset's aspect ratio */
  width?: number;
  style?: StyleProp<ImageStyle>;
};

/**
 * Doodle — a hand-drawn Reslot doodle.
 * Bundled transparent PNG, recoloured via tintColor.
 */
export function Doodle({ name, color = COLORS.ink, width = 64, style }: Props) {
  const { src, w, h } = DOODLES[name];
  return (
    <Image
      source={src}
      resizeMode="contain"
      style={[{ width, height: width * (h / w), tintColor: color }, style]}
    />
  );
}

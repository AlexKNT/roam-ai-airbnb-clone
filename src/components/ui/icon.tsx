import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { iconSize, type IconSizeToken } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * The sheet uses shapes Ionicons covers and a few it does not, so a name is
 * resolved against Ionicons first and falls back to MaterialCommunityIcons.
 */
export type AppIconName = IoniconName | MaterialIconName;

export type IconProps = {
  name: AppIconName;
  size?: number | IconSizeToken;
  color: string;
};

export function Icon({ name, size = 'md', color }: IconProps) {
  const resolvedSize = typeof size === 'number' ? size : iconSize[size];

  if (name in Ionicons.glyphMap) {
    return <Ionicons name={name as IoniconName} size={resolvedSize} color={color} />;
  }

  return (
    <MaterialCommunityIcons name={name as MaterialIconName} size={resolvedSize} color={color} />
  );
}
